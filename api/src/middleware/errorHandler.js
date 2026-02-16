import multer from 'multer'
import ApiError from '../utils/ApiError.js'

export default function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: { message: err.message },
    })
  }

  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'File too large. Maximum size is 25MB.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field.',
    }
    return res.status(400).json({
      error: { message: messages[err.code] || err.message },
    })
  }

  console.error('Unhandled error:', err)
  res.status(500).json({
    error: { message: 'Internal server error' },
  })
}
