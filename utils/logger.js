// Simple logger that uses console.log but supports levels and masking
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const getLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    return levels.info; // Only show info, warn, error in production
  }
  return levels.debug; // Show everything in development
};

const currentLevel = getLevel();

const maskSensitiveData = (obj) => {
  const sensitiveKeys = ['password', 'token', 'secret', 'cookie', 'sessionId'];
  
  const mask = (item) => {
    if (!item || typeof item !== 'object') return item;
    
    const masked = Array.isArray(item) ? [...item] : { ...item };
    
    for (let key in masked) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        masked[key] = '********';
      } else if (typeof masked[key] === 'object') {
        masked[key] = mask(masked[key]);
      }
    }
    return masked;
  };

  return mask(obj);
};

const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  const maskedMessage = typeof message === 'object' ? JSON.stringify(maskSensitiveData(message)) : message;
  return `[${timestamp}] ${level.toUpperCase()}: ${maskedMessage}`;
};

const logger = {
  error: (msg, meta) => {
    if (currentLevel >= levels.error) {
      console.error(formatMessage('error', msg), meta || '');
    }
  },
  warn: (msg, meta) => {
    if (currentLevel >= levels.warn) {
      console.warn(formatMessage('warn', msg), meta || '');
    }
  },
  info: (msg, meta) => {
    if (currentLevel >= levels.info) {
      console.log(formatMessage('info', msg), meta || '');
    }
  },
  http: (msg, meta) => {
    if (currentLevel >= levels.http) {
      console.log(formatMessage('http', msg), meta || '');
    }
  },
  debug: (msg, meta) => {
    if (currentLevel >= levels.debug) {
      console.log(formatMessage('debug', msg), meta || '');
    }
  },
  level: Object.keys(levels).find(key => levels[key] === currentLevel)
};

const env = process.env.NODE_ENV || 'development';
logger.info(`Logger initialized in ${env} mode (Level: ${logger.level})`);

module.exports = logger;
