import { Router } from 'express'
import authenticate from '../middleware/authenticate.js'
import validate from '../middleware/validate.js'
import * as chunkController from '../controllers/chunk.controller.js'
import { searchChunksSchema } from '../validators/chunk.validator.js'

const router = Router({ mergeParams: true })

router.use(authenticate)

// Extend timeout for generate routes (embedding can take a while)
function extendTimeout(req, res, next) {
  req.setTimeout(300000)
  res.setTimeout(300000)
  next()
}

router.post('/generate', extendTimeout, chunkController.generateForProject)
router.post('/generate/:documentId', extendTimeout, chunkController.generateForDocument)
router.post('/search', validate(searchChunksSchema), chunkController.search)
router.get('/stats', chunkController.stats)

export default router
