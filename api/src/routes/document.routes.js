import { Router } from 'express'
import authenticate from '../middleware/authenticate.js'
import upload from '../middleware/upload.js'
import * as documentController from '../controllers/document.controller.js'

const router = Router({ mergeParams: true })

router.use(authenticate)

router.post('/', upload.single('file'), documentController.upload)
router.get('/', documentController.list)
router.get('/:documentId', documentController.getById)
router.delete('/:documentId', documentController.remove)

export default router
