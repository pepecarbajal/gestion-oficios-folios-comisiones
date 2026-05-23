import { AppError } from '../utils/errors.js'

export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message })
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'El archivo excede el tamaño máximo permitido' })
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ error: 'Se excedió el número máximo de archivos permitidos' })
  }
  if (err.message?.includes('Solo se permiten') || err.message?.includes('Tipo no permitido')) {
    return res.status(400).json({ error: err.message })
  }

  const knownPatterns = ['es obligatorio', 'ya está registrado', 'no encontrado', 'Estatus inválido', 'Oficio no encontrado']
  if (knownPatterns.some(p => err.message?.includes(p))) {
    return res.status(400).json({ error: err.message })
  }

  console.error('[ErrorHandler]', err)
  res.status(500).json({ error: 'Error interno del servidor' })
}
