import { Router } from 'express'
import authenticate from '../middleware/authenticate.js'
import validate from '../middleware/validate.js'
import { sendMessageSchema } from '../validators/chat.validator.js'
import * as chatController from '../controllers/chat.controller.js'

const router = Router({ mergeParams: true })

router.use(authenticate)

router.post('/send', validate(sendMessageSchema), chatController.sendMessage)
router.get('/history', chatController.getHistory)

export default router
