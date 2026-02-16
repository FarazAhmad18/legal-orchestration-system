import multer from 'multer'
import path from 'path'
import fs from 'fs'
import config from '../config/index.js'
import ApiError from '../utils/ApiError.js'

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(config.upload.dir, req.params.projectId)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename(req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const ext = path.extname(file.originalname)
    cb(null, `${unique}${ext}`)
  },
})

function fileFilter(req, file, cb) {
  if (config.upload.allowedMimes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new ApiError(400, 'Unsupported file type. Only PDF, DOCX, and TXT files are allowed.'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.upload.maxFileSize },
})

export default upload
