import ApiError from '../utils/ApiError.js'

export default function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const message = result.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ')
      return next(ApiError.badRequest(message))
    }
    req.validated = result.data
    next()
  }
}
