const logger = require('../utils/logger');
const path = require('path');

/**
 * Global Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
    // 1. Log the error
    logger.error(`[Global Error] ${err.name || 'Error'}: ${err.message}`, {
        path: req.path,
        method: req.method,
        ip: req.ip,
        stack: err.stack,
    });

    // 2. Determine the status code
    let statusCode = err.statusCode || err.status || 500;
    if (err.name === 'ValidationError') statusCode = 400;
    if (err.name === 'UnauthorizedError') statusCode = 401;

    // 3. For API requests, return JSON
    if (req.path.startsWith('/api/')) {
        const response = {
            success: false,
            message: err.message || 'Internal Server Error'
        };

        if (process.env.NODE_ENV === 'development') {
            response.stack = err.stack;
        } else if (statusCode === 500) {
            response.message = 'An unexpected error occurred. Please try again later.';
        }

        if (err.errors) response.errors = err.errors;
        return res.status(statusCode).json(response);
    }

    // 4. For Page requests, return Custom Error HTML
    try {
        const errorPage = statusCode === 404 ? '404.html' : '500.html';
        const viewsDir = path.join(__dirname, '..', 'views', 'errors');
        res.status(statusCode).sendFile(path.join(viewsDir, errorPage));
    } catch (sendErr) {
        res.status(statusCode).send('An unexpected error occurred.');
    }
}

module.exports = errorHandler;
