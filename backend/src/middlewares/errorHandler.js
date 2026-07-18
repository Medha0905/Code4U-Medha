const { ApiError } = require('../utils/apiResponse');

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let { statusCode, message } = err;

  if (err.code === 'P2002') {
    statusCode = 409;
    message = `A record with this ${err.meta?.target?.join(', ') || 'value'} already exists`;
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
  }

  if (!statusCode) statusCode = 500;
  if (!message) message = 'Internal server error';

  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: err instanceof ApiError ? err.details : undefined,
  });
}

module.exports = { notFound, errorHandler };
