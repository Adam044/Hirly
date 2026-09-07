const express = require('express');

module.exports = function registerStorageRoutes(
  app,
  pool,
  {
    isAuthenticated,
    isProfessional,
    isEmailVerified,
    deleteFileFromSupabase,
    fileDownloadLimiter,
    performanceMonitor,
    fileCache,
    CACHE_MAX_SIZE,
    CACHE_MAX_FILE_SIZE,
    supportsWebP,
    getCacheDuration,
    cleanupCache
  }
) {
  const router = express.Router();

  router.post('/remove-file', isAuthenticated, async (req, res) => {
    let client;
    const { filePath, fileType } = req.body;
    const userId = req.session.userId;

    if (!filePath || !fileType) {
      return res.status(400).json({ success: false, error: 'File path and type are required.' });
    }

    try {
      client = await pool.connect();
      await client.query('BEGIN');

      let fileOwner;
      const isFullUrl = filePath.startsWith('http');

      if (!isFullUrl) {
        // Legacy ID handling
        const fileId = filePath.split('/').pop();
        if (isNaN(fileId)) {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, error: 'Invalid file path or ID.' });
        }

        const fileOwnershipResult = await client.query('SELECT user_id FROM file_storage WHERE id = $1', [fileId]);
        fileOwner = fileOwnershipResult.rows[0]?.user_id;
      } else {
        // Supabase URL handling - find owner in respective tables
        // Note: This is a bit more complex as URLs aren't indexed in file_storage
        // For now, we rely on the session user ID matching the request
        fileOwner = userId; 
      }

      if (fileOwner !== userId) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, error: 'Access denied. You do not own this file.' });
      }

      const deleteSuccess = await deleteFileFromSupabase(filePath);

      if (!deleteSuccess) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, error: 'File not found in storage.' });
      }

      if (fileType === 'cv') {
        await client.query('UPDATE professionals SET cv_path = NULL WHERE user_id = $1', [userId]);
      } else if (fileType === 'id_verification') {
        await client.query('UPDATE professionals SET id_verification_path = NULL, verification_status = \'Not Submitted\' WHERE user_id = $1', [userId]);
        await client.query('UPDATE employers SET id_verification_path = NULL, verification_status = \'Not Submitted\' WHERE user_id = $1', [userId]);
      } else if (fileType === 'company_logo') {
        await client.query('UPDATE employers SET company_logo_path = NULL WHERE user_id = $1', [userId]);
      } else if (fileType === 'profile_picture') {
        await client.query('UPDATE users SET profile_picture_url = NULL WHERE id = $1', [userId]);
      } else if (fileType === 'service_image') {
        await client.query('UPDATE services SET service_image_path = NULL WHERE service_image_path = $1 AND professional_id = $2', [filePath, userId]);
      } else {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Invalid file type for this route.' });
      }

      await client.query('COMMIT');
      res.json({ success: true, message: 'File removed successfully.' });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: 'Failed to remove file.' });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/remove-cv', isAuthenticated, isProfessional, isEmailVerified, async (req, res) => {
    let client;
    try {
      client = await pool.connect();
      const result = await client.query('SELECT cv_path FROM professionals WHERE user_id = $1', [req.session.userId]);
      const row = result.rows[0];

      if (row && row.cv_path) {
        await deleteFileFromSupabase(row.cv_path);
      }

      await client.query('UPDATE professionals SET cv_path = NULL WHERE user_id = $1', [req.session.userId]);
      res.json({ success: true, message: 'CV removed successfully.' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to remove CV.' });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/remove-id', isAuthenticated, isEmailVerified, async (req, res) => {
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');

      const userId = req.session.userId;
      let row;

      const professionalIdResult = await client.query('SELECT id_verification_path FROM professionals WHERE user_id = $1', [userId]);
      row = professionalIdResult.rows[0];

      if (!row) {
        const employerIdResult = await client.query('SELECT id_verification_path FROM employers WHERE user_id = $1', [userId]);
        row = employerIdResult.rows[0];
      }

      if (row && row.id_verification_path) {
        await deleteFileFromSupabase(row.id_verification_path);
      }

      await client.query(
        'UPDATE professionals SET id_verification_path = NULL, verification_status = \'Not Submitted\' WHERE user_id = $1',
        [userId]
      );

      await client.query(
        'UPDATE employers SET id_verification_path = NULL, verification_status = \'Not Submitted\' WHERE user_id = $1',
        [userId]
      );

      await client.query('COMMIT');
      res.json({ success: true, message: 'ID document removed successfully.' });
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      res.status(500).json({ success: false, error: 'Failed to remove ID' });
    } finally {
      if (client) client.release();
    }
  });

  router.get('/files/:fileId', fileDownloadLimiter, async (req, res) => {
    let client;
    const fileId = req.params.fileId;
    const sessionUserId = req.session.userId;
    const sessionUserType = req.session.userType;

    performanceMonitor.trackFileRequest();

    try {
      client = await pool.connect();
      performanceMonitor.updateConnectionPoolStats(pool);

      // 1. Fetch file metadata for authorization check
      const metadataResult = await client.query(
        'SELECT user_id, file_type, mime_type FROM file_storage WHERE id = $1',
        [fileId]
      );

      if (metadataResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'File not found' });
      }

      const { user_id: fileOwnerId, file_type: fileType, mime_type: mimeType } = metadataResult.rows[0];

      // 2. Authorization Logic
      const publicTypes = [
        'company_logo', 'company_logo_webp',
        'profile_picture', 'profile_picture_webp',
        'job_image', 'job_image_webp',
        'service_image', 'service_image_webp'
      ];

      const isPublic = publicTypes.includes(fileType);
      
      if (!isPublic) {
        // Private file (CV, ID verification) - requires authorization
        if (!sessionUserId) {
          return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        const isAdmin = sessionUserType === 'admin';
        const isOwner = sessionUserId === fileOwnerId;

        if (!isAdmin && !isOwner) {
          // Special case: Employer viewing an applicant's CV
          if (fileType === 'cv' || fileType === 'cv_webp') {
            const employerAccessCheck = await client.query(
              `SELECT 1 FROM applications a
               JOIN jobs j ON a.job_id = j.id
               WHERE j.employer_id = $1 AND a.professional_id = $2
               LIMIT 1`,
              [sessionUserId, fileOwnerId]
            );

            if (employerAccessCheck.rows.length === 0) {
              return res.status(403).json({ success: false, error: 'Access denied' });
            }
          } else {
            // ID verification is strictly private to owner and admin
            return res.status(403).json({ success: false, error: 'Access denied' });
          }
        }
      }

      // 3. Cache Check (moved after auth for security, though slightly less performant)
      const cacheKey = `${fileId}-${req.headers.accept || ''}`;
      if (fileCache.has(cacheKey)) {
        const cachedFile = fileCache.get(cacheKey);
        res.setHeader('Content-Type', cachedFile.mimeType);
        res.setHeader('Cache-Control', `public, max-age=${cachedFile.cacheDuration}, immutable`);
        res.setHeader('ETag', cachedFile.etag);
        res.setHeader('Vary', 'Accept');

        const clientETag = req.headers['if-none-match'];
        if (clientETag === cachedFile.etag) {
          return res.status(304).end();
        }

        performanceMonitor.trackCacheHit(cachedFile.data.length);
        return res.send(cachedFile.data);
      }

      // 4. Serving Logic (Original)
      const acceptHeader = req.headers.accept || '';
      const browserSupportsWebP = supportsWebP(acceptHeader);
      let etag = `"${fileId}"`;

      if (browserSupportsWebP) {
        const webpResult = await client.query(
          'SELECT mime_type, file_data FROM file_storage WHERE parent_file_id = $1 AND mime_type = $2',
          [fileId, 'image/webp']
        );

        if (webpResult.rows.length > 0) {
          const webpFile = webpResult.rows[0];
          const cacheDuration = getCacheDuration(webpFile.mime_type);
          etag = `"${fileId}-webp"`;

          if (webpFile.file_data.length <= CACHE_MAX_FILE_SIZE) {
            fileCache.set(cacheKey, {
              data: webpFile.file_data,
              mimeType: webpFile.mime_type,
              cacheDuration,
              etag
            });
            cleanupCache();
          }

          res.setHeader('Content-Type', webpFile.mime_type);
          res.setHeader('Cache-Control', `public, max-age=${cacheDuration}, immutable`);
          res.setHeader('ETag', etag);
          res.setHeader('Vary', 'Accept');

          const clientETag = req.headers['if-none-match'];
          if (clientETag === etag) {
            return res.status(304).end();
          }

          return res.send(webpFile.file_data);
        }
      }

      const result = await client.query('SELECT file_data FROM file_storage WHERE id = $1', [fileId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'File not found' });
      }

      const file = result.rows[0];
      const cacheDuration = getCacheDuration(mimeType);

      if (file.file_data.length <= CACHE_MAX_FILE_SIZE) {
        fileCache.set(cacheKey, {
          data: file.file_data,
          mimeType: mimeType,
          cacheDuration,
          etag
        });
        cleanupCache();
      }

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', `public, max-age=${cacheDuration}, immutable`);
      res.setHeader('ETag', etag);
      res.setHeader('Vary', 'Accept');

      const clientETag = req.headers['if-none-match'];
      if (clientETag === etag) {
        return res.status(304).end();
      }

      res.send(file.file_data);
    } catch (error) {
      logger.error('File serving error:', error);
      res.status(500).json({ success: false, error: 'Failed to serve file' });
    } finally {
      if (client) client.release();
    }
  });

  app.use('/api', router);
}