import { Router } from 'express'
import authenticate from '../middleware/authenticate.js'
import * as artifactController from '../controllers/artifact.controller.js'

const router = Router({ mergeParams: true })

router.use(authenticate)

router.get('/', artifactController.list)
router.get('/summary', artifactController.summary)
router.get('/latest/:type', artifactController.getLatest)
router.get('/:artifactId', artifactController.getById)

export default router
