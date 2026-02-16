import { verifyToken } from '../utils/jwt.js'
import ApiError from '../utils/ApiError.js'

export default function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing or invalid token'))
  }

  const token = authHeader.split(' ')[1]
  try {
    const payload = verifyToken(token)
    req.user = { userId: payload.userId, role: payload.role }
    next()
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'))
  }
}
