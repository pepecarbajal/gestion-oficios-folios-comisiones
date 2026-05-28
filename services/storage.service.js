import { bucket } from '../db.js'

const SIGNED_URL_EXPIRY_MINUTES = 60

function sanitizeFileName (name) {
  return name.toUpperCase().replace(/[^A-Z0-9\-_]/g, '_')
}

async function getSignedUrl (filePath) {
  const storageBucket = bucket()
  const file = storageBucket.file(filePath)
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + SIGNED_URL_EXPIRY_MINUTES * 60 * 1000
  })
  return url
}

export class StorageService {
  static async uploadFile (filePath, buffer, mimeType) {
    const storageBucket = bucket()
    const file = storageBucket.file(filePath)
    await file.save(buffer, {
      metadata: { contentType: mimeType },
      resumable: false
    })
    return filePath
  }

  static async deleteFile (filePath) {
    try {
      const storageBucket = bucket()
      await storageBucket.file(filePath).delete()
    } catch {}
  }

  static async copyFile (sourcePath, destPath) {
    const storageBucket = bucket()
    await storageBucket.file(sourcePath).copy(storageBucket.file(destPath))
    return destPath
  }

  static async renameFile (oldPath, newPath) {
    try {
      const storageBucket = bucket()
      await storageBucket.file(oldPath).copy(storageBucket.file(newPath))
      await storageBucket.file(oldPath).delete()
      return newPath
    } catch {
      return oldPath
    }
  }

  static oficioFilePath (noOficio) {
    const nombre = sanitizeFileName(noOficio) + '.pdf'
    return `oficios/${nombre}`
  }

  static evidenciaFilePath (noOficio, unidadAlias, timestamp, index, ext) {
    const noOficioClean = sanitizeFileName(noOficio)
    const aliasClean = sanitizeFileName(unidadAlias)
    return `evidencias/${noOficioClean}_${aliasClean}_${timestamp}_${index}.${ext}`
  }

  static aclaracionFilePath (noOficio, unidadAlias, timestamp, index, ext) {
    const noOficioClean = sanitizeFileName(noOficio)
    const aliasClean = sanitizeFileName(unidadAlias)
    return `evidencias/${noOficioClean}_${aliasClean}_aclaracion_${timestamp}_${index}.${ext}`
  }

  static folioFilePath (noFolio) {
    return `folios/folio_${noFolio}.pdf`
  }

  static async hydrateOficioUrls (oficio) {
    if (oficio.archivoPath) {
      try {
        oficio.archivoUrl = await getSignedUrl(oficio.archivoPath)
      } catch {
        oficio.archivoUrl = null
      }
    } else {
      oficio.archivoUrl = null
    }

    if (Array.isArray(oficio.respuestas)) {
      for (const resp of oficio.respuestas) {
        if (Array.isArray(resp.archivos)) {
          for (const arch of resp.archivos) {
            if (arch.filePath) {
              try {
                arch.url = await getSignedUrl(arch.filePath)
              } catch {
                arch.url = null
              }
            }
          }
        }
      }
    }

    return oficio
  }

  static async hydrateFolioUrl (folio) {
    if (folio.archivoPath) {
      try {
        folio.archivoUrl = await getSignedUrl(folio.archivoPath)
      } catch {
        folio.archivoUrl = null
      }
    } else {
      folio.archivoUrl = null
    }
    return folio
  }
}
