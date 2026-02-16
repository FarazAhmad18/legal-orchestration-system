import { Router } from 'express'
import authenticate from '../middleware/authenticate.js'
import * as projectController from '../controllers/project.controller.js'
import validate from '../middleware/validate.js'
import { createProjectSchema } from '../validators/project.validator.js'
import documentRoutes from './document.routes.js'
import chunkRoutes from './chunk.routes.js'
import jobRoutes from './job.routes.js'
import artifactRoutes from './artifact.routes.js'

const router = Router()

router.use(authenticate)

router.post('/', validate(createProjectSchema), projectController.create)
router.get('/', projectController.list)
router.get('/:id', projectController.getById)

// Nested document routes: /api/projects/:projectId/documents
router.use('/:projectId/documents', documentRoutes)

// Nested chunk routes: /api/projects/:projectId/chunks
router.use('/:projectId/chunks', chunkRoutes)

// Nested job routes: /api/projects/:projectId/jobs
router.use('/:projectId/jobs', jobRoutes)

// Nested artifact routes: /api/projects/:projectId/artifacts
router.use('/:projectId/artifacts', artifactRoutes)

export default router
