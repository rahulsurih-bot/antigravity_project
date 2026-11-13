export function errorHandler(err, req, res, next) {
  console.error('[SERVER ERROR]', {
    method: req.method,
    path: req.path,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Image size exceeds maximum limit of 8MB.',
      data: null,
      error: {
        code: 'FILE_TOO_LARGE',
        details: ['Uploaded photograph must not exceed 8MB.']
      }
    });
  }

  if (err.code === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      success: false,
      message: err.message,
      data: null,
      error: {
        code: 'INVALID_FILE_TYPE',
        details: [err.message]
      }
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An internal server error occurred while processing the agricultural request.';

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      details: err.details || [message]
    }
  });
}
