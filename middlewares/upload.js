import multer from 'multer'

const tiposPermitidos = [
  'application/pdf',
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp'
]

export const uploadPDF = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    file.mimetype === 'application/pdf'
      ? cb(null, true)
      : cb(new Error('Solo se permiten archivos PDF'), false)
  }
})

export const uploadEvidencias = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    tiposPermitidos.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`Tipo no permitido: ${file.mimetype}`), false)
  }
})
