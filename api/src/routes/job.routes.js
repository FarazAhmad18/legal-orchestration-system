import { Router } from 'express'
import authenticate from '../middleware/authenticate.js'
import * as jobController from '../controllers/job.controller.js'

const router = Router({ mergeParams: true })

router.use(authenticate)

router.post('/run-analysis', jobController.runAnalysis)
router.get('/pipeline-status', jobController.pipelineStatus)
router.get('/', jobController.list)
router.get('/:jobId', jobController.getById)

export default router
