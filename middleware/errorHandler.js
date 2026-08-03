const logger = require('../utils/logger');

/**
 * Global Error Handling Middleware
 * Catch all errors passed to next(err) and format a consistent JSON response
 */
function errorHandler(err, req, res, next) {
    // 1. Log the error (with full stack trace inside the server logs)
    logger.error(`[Global Error] ${err.name || 'Error'}: ${err.message}`, {
        path: req.path,
        method: req.method,
        ip: req.ip,
        stack: err.stack,
    });

    // 2. Determine the status code
    let statusCode = err.statusCode || err.status || 500;

    // Handle specific common error types
    if (err.name === 'ValidationError') statusCode = 400;
    if (err.name === 'UnauthorizedError') statusCode = 401;

    // 3. Construct the response payload
    const response = {
        success: false,
        message: err.message || 'Internal Server Error'
    };

    // Include the stack trace only in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = err.stack;
    } else if (statusCode === 500) {
        // Sanitize 500 messages in production to prevent leaking sensitive details
        response.message = 'An unexpected error occurred. Please try again later.';
    }

    // Include any additional validation errors if present
    if (err.errors) {
        response.errors = err.errors;
    }

    // 4. Send the formatted response
    res.status(statusCode).json(response);
}

module.exports = errorHandler;
