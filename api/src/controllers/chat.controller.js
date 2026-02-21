import * as chatService from '../services/chat.service.js'
import asyncHandler from '../utils/asyncHandler.js'

export const sendMessage = asyncHandler(async (req, res) => {
  const result = await chatService.sendMessage({
    projectId: req.params.projectId,
    userId: req.user.userId,
    role: req.user.role,
    message: req.validated.message,
  })
  res.json(result)
})

export const getHistory = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50
  const before = req.query.before || undefined

  const result = await chatService.getHistory({
    projectId: req.params.projectId,
    userId: req.user.userId,
    role: req.user.role,
    limit,
    before,
  })
  res.json(result)
})
