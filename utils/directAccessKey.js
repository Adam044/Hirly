const crypto = require('crypto');

function encryptionKey() {
  const secret = process.env.DIRECT_ACCESS_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    const error = new Error('DIRECT_ACCESS_SECRET must be a persistent secret of at least 32 bytes.');
    error.code = 'DIRECT_ACCESS_SECRET_MISSING';
    throw error;
  }
  return crypto.createHash('sha256').update('hirly-direct-access:' + secret).digest();
}

function encryptAccessKey(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), encrypted.toString('base64')].join(':');
}

function decryptAccessKey(value) {
  if (typeof value !== 'string' || !value.startsWith('v1:')) return null;
  try {
    const [, iv, tag, encrypted] = value.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    // Retrieval failures must never invalidate or overwrite the verification hash.
    return null;
  }
}

module.exports = { encryptAccessKey, decryptAccessKey };
