import app from './app.js'
import config from './config/index.js'
import { startWorker } from './workers/worker.js'

app.listen(config.port, () => {
  console.log(`API server running on port ${config.port}`)
  startWorker()
})
