const logger = require('../utils/logger');

/**
 * Service to handle user and professional profile updates
 */
const userService = {
    /**
     * Update basic personal information in users table
     */
    async updatePersonalInfo(client, userId, data) {
        logger.info('Updating personal info', { userId, data });
        const { firstName, lastName, phone, city, country, gender, birthdate, website_link } = data;
        
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (firstName !== undefined) { updateFields.push(`first_name = $${paramIndex++}`); updateValues.push(firstName || null); }
        if (lastName !== undefined) { updateFields.push(`last_name = $${paramIndex++}`); updateValues.push(lastName || null); }
        if (phone !== undefined) { updateFields.push(`phone = $${paramIndex++}`); updateValues.push(phone || null); }
        if (city !== undefined) { updateFields.push(`city = $${paramIndex++}`); updateValues.push(city || null); }
        if (country !== undefined) { updateFields.push(`country = $${paramIndex++}`); updateValues.push(country || null); }
        if (gender !== undefined) { updateFields.push(`gender = $${paramIndex++}`); updateValues.push(gender === '' || !gender ? null : gender.toLowerCase()); }
        if (birthdate !== undefined) { updateFields.push(`birthdate = $${paramIndex++}`); updateValues.push(birthdate === '' || !birthdate ? null : birthdate); }
        if (website_link !== undefined) { updateFields.push(`website_link = $${paramIndex++}`); updateValues.push(website_link === '' || !website_link ? null : website_link); }

        if (updateFields.length === 0) {
            logger.warn('No fields to update in personal info', { userId });
            return null;
        }

        updateValues.push(userId);
        const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        
        logger.debug('Executing update query on users', { query, updateValues });
        const result = await client.query(query, updateValues);
        
        if (result.rowCount === 0) {
            logger.error('No user found to update', { userId });
        } else {
            logger.info('User personal info updated successfully', { userId });
        }
        
        return result.rows[0];
    },

    /**
     * Update professional data in professionals table
     * Uses UPSERT logic to ensure record exists
     */
    async updateProfessionalData(client, userId, data) {
        logger.info('Updating professional data', { userId, data });
        const { 
            skills, bio, profession, current_status, 
            interested_professions
        } = data;

        const updateFields = [];
        const updateValues = [];
        const insertFields = ['user_id'];
        const insertValues = [userId];
        let paramIndex = 1;

        if (skills !== undefined) { 
            const val = skills || '';
            updateFields.push(`skills = $${paramIndex++}`); 
            updateValues.push(val);
            insertFields.push('skills');
            insertValues.push(val);
        }
        if (bio !== undefined) { 
            const val = bio || '';
            updateFields.push(`bio = $${paramIndex++}`); 
            updateValues.push(val);
            insertFields.push('bio');
            insertValues.push(val);
        }
        if (profession !== undefined) { 
            const val = profession || null;
            updateFields.push(`profession = $${paramIndex++}`); 
            updateValues.push(val);
            insertFields.push('profession');
            insertValues.push(val);
        }
        if (current_status !== undefined) { 
            const val = current_status || 'Don\'t Work';
            updateFields.push(`current_status = $${paramIndex++}`); 
            updateValues.push(val);
            insertFields.push('current_status');
            insertValues.push(val);
        }
        
        if (interested_professions !== undefined) {
            let finalProfessions = '[]';
            try {
                const parsed = typeof interested_professions === 'string' ? JSON.parse(interested_professions) : interested_professions;
                if (Array.isArray(parsed)) {
                    finalProfessions = JSON.stringify(parsed.map(p => String(p).trim()).filter(p => p.length > 0).slice(0, 5));
                }
            } catch (e) {
                logger.error('Error parsing interested_professions:', e);
            }
            updateFields.push(`interested_professions = $${paramIndex++}::jsonb`);
            updateValues.push(finalProfessions);
            insertFields.push('interested_professions');
            insertValues.push(finalProfessions);
        }

        if (updateFields.length === 0) return null;

        // Add userId to values for the WHERE clause (if needed for non-upsert)
        // However, for UPSERT, we need a different approach.
        
        // Build UPSERT query
        const placeholders = [];
        insertFields.forEach((field, i) => {
            const val = insertValues[i];
            if (field === 'interested_professions' || field === 'education_history') {
                placeholders.push(`$${i + 1}::jsonb`);
            } else {
                placeholders.push(`$${i + 1}`);
            }
        });

        const doUpdateSet = updateFields.map(field => {
            const colName = field.split(' = ')[0];
            return `${colName} = EXCLUDED.${colName}`;
        }).join(', ');

        const query = `
            INSERT INTO professionals (${insertFields.join(', ')})
            VALUES (${placeholders.join(', ')})
            ON CONFLICT (user_id) DO UPDATE SET 
                ${doUpdateSet}
            RETURNING *`;
        
        logger.debug('Executing UPSERT query on professionals', { query, insertValues });
        const result = await client.query(query, insertValues);
        
        logger.info('Professional data saved successfully (UPSERT)', { userId });
        return result.rows[0];
    },

    /**
     * Update privacy settings in professionals table
     * Uses UPSERT to ensure record exists
     */
    async updatePrivacySettings(client, userId, data) {
        logger.info('Updating privacy settings', { userId, data });
        const { 
            privacy_visible_to_all, 
            privacy_visible_companies_only, 
            privacy_hide_account, 
            privacy_hide_contact_info 
        } = data;

        const updateFields = [];
        const updateValues = [];
        const insertFields = ['user_id'];
        const insertValues = [userId];
        let paramIndex = 1;

        if (privacy_visible_to_all !== undefined) { 
            const val = !!privacy_visible_to_all;
            updateFields.push(`privacy_visible_to_all = $${paramIndex++}`); 
            updateValues.push(val); 
            insertFields.push('privacy_visible_to_all');
            insertValues.push(val);
        }
        if (privacy_visible_companies_only !== undefined) { 
            const val = !!privacy_visible_companies_only;
            updateFields.push(`privacy_visible_companies_only = $${paramIndex++}`); 
            updateValues.push(val); 
            insertFields.push('privacy_visible_companies_only');
            insertValues.push(val);
        }
        if (privacy_hide_account !== undefined) { 
            const val = !!privacy_hide_account;
            updateFields.push(`privacy_hide_account = $${paramIndex++}`); 
            updateValues.push(val); 
            insertFields.push('privacy_hide_account');
            insertValues.push(val);
        }
        if (privacy_hide_contact_info !== undefined) { 
            const val = !!privacy_hide_contact_info;
            updateFields.push(`privacy_hide_contact_info = $${paramIndex++}`); 
            updateValues.push(val); 
            insertFields.push('privacy_hide_contact_info');
            insertValues.push(val);
        }

        if (updateFields.length === 0) {
            logger.warn('No privacy settings to update', { userId });
            return null;
        }

        const placeholders = insertValues.map((_, i) => `$${i + 1}`).join(', ');
        const doUpdateSet = updateFields.map(field => {
            const colName = field.split(' = ')[0];
            return `${colName} = EXCLUDED.${colName}`;
        }).join(', ');

        const query = `
            INSERT INTO professionals (${insertFields.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT (user_id) DO UPDATE SET 
                ${doUpdateSet}
            RETURNING *`;
        
        logger.debug('Executing UPSERT query on privacy settings', { query, insertValues });
        const result = await client.query(query, insertValues);
        
        logger.info('Privacy settings saved successfully (UPSERT)', { userId });
        return result.rows[0];
    }
};

module.exports = userService;
