import { db, initFirebase } from '../db.js'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BACKUPS_DIR = join(__dirname, '..', 'backups')

const COLECCIONES = ['oficios', 'unidadesAdministrativas', 'users']

initFirebase()

async function backup () {
  const firestore = db()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `backup-${timestamp}.json`
  const filepath = join(BACKUPS_DIR, filename)

  if (!existsSync(BACKUPS_DIR)) {
    await mkdir(BACKUPS_DIR, { recursive: true })
  }

  const data = {}

  for (const coleccion of COLECCIONES) {
    console.log(`Exportando colección: ${coleccion}`)
    const snapshot = await firestore.collection(coleccion).get()
    data[coleccion] = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }))
    console.log(`  → ${data[coleccion].length} documentos`)
  }

  await writeFile(filepath, JSON.stringify(data, null, 2))
  console.log(`\n✅ Backup guardado en: ${filepath}`)
}

async function restore (filepath) {
  const firestore = db()
  const content = await readFile(filepath, 'utf-8')
  const data = JSON.parse(content)

  for (const coleccion of COLECCIONES) {
    const docs = data[coleccion]
    if (!docs || !Array.isArray(docs)) {
      console.log(`⚠️  Colección "${coleccion}" no encontrada en el backup, saltando`)
      continue
    }
    console.log(`Restaurando colección: ${coleccion} (${docs.length} documentos)`)
    for (const doc of docs) {
      await firestore.collection(coleccion).doc(doc.id).set(doc.data)
    }
    console.log(`  ✓ ${docs.length} documentos restaurados`)
  }
  console.log('\n✅ Restauración completada')
}

async function main () {
  const args = process.argv.slice(2)
  if (args[0] === 'restore') {
    const filepath = args[1]
    if (!filepath) {
      console.error('❌ Uso: node scripts/backup.js restore <archivo.json>')
      process.exit(1)
    }
    await restore(filepath)
  } else {
    await backup()
  }
  process.exit(0)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
