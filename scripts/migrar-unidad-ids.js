import { db, initFirebase } from '../db.js'

initFirebase()

async function migrate () {
  const firestore = db()

  const unidadesSnap = await firestore.collection('unidadesAdministrativas').get()
  const todasUnidades = unidadesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  const todasUnidadIds = todasUnidades.map(u => u.id)

  const snapshot = await firestore.collection('oficios').get()
  let actualizados = 0

  for (const doc of snapshot.docs) {
    const data = doc.data()
    const ref = firestore.collection('oficios').doc(doc.id)

    if (data.unidadIds && Array.isArray(data.unidadIds)) {
      continue
    }

    if (data.unidadId === 'TODAS') {
      await ref.update({ unidadIds: [...todasUnidadIds] })
      console.log(`  [TODAS → array] ${data.noOficio} (${doc.id}) → ${todasUnidadIds.length} unidades`)
      actualizados++
    } else if (data.unidadId && typeof data.unidadId === 'string') {
      await ref.update({ unidadIds: [data.unidadId] })
      console.log(`  [string → array] ${data.noOficio} (${doc.id}) → [${data.unidadId}]`)
      actualizados++
    }
  }

  console.log(`\n✅ Migración completada. ${actualizados} oficios actualizados.`)
  process.exit(0)
}

migrate().catch(err => {
  console.error('Error en migración:', err)
  process.exit(1)
})
