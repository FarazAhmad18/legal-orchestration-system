import * as authService from '../services/auth.service.js'
import asyncHandler from '../utils/asyncHandler.js'

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.validated)
  res.status(201).json(result)
})

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.validated)
  res.json(result)
})
