import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { createTestApp, wireFolioRoutes } from '../helpers/app-builder.js'
import { seedCollection, getCollectionData } from '../helpers/firebase-mock.js'
import { mockFirestore } from '../setup.js'
import { UADRepository } from '../../repositories/uad.repository.js'

const CSRF_TOKEN = 'a'.repeat(64)
function withCsrf(req) {
  return req
    .set('Cookie', `csrf_token=${CSRF_TOKEN}`)
    .set('X-CSRF-Token', CSRF_TOKEN)
}

function seedFolio(id, overrides = {}) {
  const folioId = id || 'folio-test-1'
  seedCollection(mockFirestore, 'folios', {
    [folioId]: {
      noFolio: '0001',
      destinatario: 'María López',
      dependencia: 'Secretaría de Salud',
      cargo: 'Directora',
      asunto: 'Folio de prueba',
      unidadIds: ['test-unidad'],
      unidadId: 'test-unidad',
      unidadAlias: 'Test Unidad',
      creadoPor: 'UAD',
      estatus: 'Pendiente',
      fechaSolicitud: new Date().toISOString(),
      ...overrides
    }
  })
  return folioId
}

describe('POST /folios/uad', () => {
  beforeEach(() => {
    mockFirestore._data.clear()
  })

  it('debe solicitar un folio exitosamente', async () => {
    const app = createTestApp({ user: { id: 'user-1', role: 'UAD', unidadId: 'test-unidad', unidadAlias: 'Test Unidad' } })
    wireFolioRoutes(app)

    const res = await withCsrf(request(app)
      .post('/folios/uad')
      .send({
        destinatario: 'María López',
        dependencia: 'Secretaría de Salud',
        cargo: 'Directora',
        asunto: 'Solicitud de folio'
      })
    )

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body).toHaveProperty('noFolio')
    expect(res.body.noFolio).toBe('0001')
  })

  it('debe auto-incrementar noFolio', async () => {
    seedFolio('existing', { noFolio: '0005' })
    const app = createTestApp({ user: { id: 'user-1', role: 'UAD', unidadId: 'test-unidad', unidadAlias: 'Test Unidad' } })
    wireFolioRoutes(app)

    const res = await withCsrf(request(app)
      .post('/folios/uad')
      .send({
        destinatario: 'Juan',
        dependencia: 'Dep',
        cargo: 'Cargo',
        asunto: 'Test'
      })
    )

    expect(res.status).toBe(201)
    expect(res.body.noFolio).toBe('0006')
  })

  it('debe rechazar si falta destinatario', async () => {
    const app = createTestApp()
    wireFolioRoutes(app)

    const res = await withCsrf(request(app)
      .post('/folios/uad')
      .send({ dependencia: 'x', cargo: 'x', asunto: 'x' })
    )

    // ValidationError returns 400
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/destinatario/)
  })
})

describe('POST /folios/aof', () => {
  beforeEach(() => {
    mockFirestore._data.clear()
    vi.mocked(UADRepository.getAll).mockResolvedValue([
      { id: 'unidad-1', alias: 'Unidad Uno' },
      { id: 'unidad-2', alias: 'Unidad Dos' }
    ])
  })

  it('debe registrar un folio exitosamente', async () => {
    const app = createTestApp({ user: { id: 'user-1', role: 'AOF', unidadId: 'aof-unidad' } })
    wireFolioRoutes(app)

    const res = await withCsrf(request(app)
      .post('/folios/aof')
      .send({
        noFolio: '0123',
        destinatario: 'María López',
        dependencia: 'Secretaría de Salud',
        cargo: 'Directora',
        asunto: 'Folio AOF',
        unidadIds: ['unidad-1', 'unidad-2']
      })
    )

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.noFolio).toBe('0123')
  })

  it('debe rechazar noFolio que no sea 4 dígitos', async () => {
    const app = createTestApp()
    wireFolioRoutes(app)

    const res = await withCsrf(request(app)
      .post('/folios/aof')
      .send({
        noFolio: '123',
        destinatario: 'x', dependencia: 'x', cargo: 'x', asunto: 'x',
        unidadIds: ['unidad-1']
      })
    )

    // ValidationError extends AppError → 400
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/4 dígitos/)
  })

  it('debe rechazar si unidad no existe', async () => {
    const app = createTestApp()
    wireFolioRoutes(app)

    const res = await withCsrf(request(app)
      .post('/folios/aof')
      .send({
        noFolio: '0999',
        destinatario: 'x', dependencia: 'x', cargo: 'x', asunto: 'x',
        unidadIds: ['unidad-inexistente']
      })
    )

    // ValidationError returns 400
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/no existen/)
  })
})

describe('PUT /folios/:id/entrega', () => {
  beforeEach(() => {
    mockFirestore._data.clear()
  })

  it('debe registrar entrega exitosamente', async () => {
    const folioId = seedFolio()
    const app = createTestApp({ user: { id: 'user-1', role: 'UAD', unidadId: 'test-unidad', unidadAlias: 'Test Unidad' } })
    wireFolioRoutes(app)

    const res = await withCsrf(request(app)
      .put(`/folios/${folioId}/entrega`)
      .field('fechaEntrega', '2024-03-15')
      .field('comentario', 'Entregado en ventanilla')
      .attach('archivo', Buffer.from('%PDF-1.4 mock'), 'acuse.pdf', { contentType: 'application/pdf' })
    )

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Entrega registrada correctamente')

    const folios = getCollectionData(mockFirestore, 'folios')
    expect(folios[folioId].estatus).toBe('Atendido')
    expect(folios[folioId].fechaEntrega).toBe('2024-03-15')
  })

  it('debe rechazar si falta fecha', async () => {
    const folioId = seedFolio()
    const app = createTestApp()
    wireFolioRoutes(app)

    const res = await withCsrf(request(app)
      .put(`/folios/${folioId}/entrega`)
      .field('comentario', 'sin fecha')
    )

    // ValidationError extends AppError → 400
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/fecha de entrega/)
  })

  it('debe rechazar si folio ya fue atendido', async () => {
    const folioId = seedFolio('atendido', { estatus: 'Atendido' })
    const app = createTestApp()
    wireFolioRoutes(app)

    const res = await withCsrf(request(app)
      .put(`/folios/${folioId}/entrega`)
      .field('fechaEntrega', '2024-03-15')
      .attach('archivo', Buffer.from('%PDF-1.4 mock'), 'acuse.pdf', { contentType: 'application/pdf' })
    )

    // ValidationError returns 400
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/ya fue atendido/)
  })
})

describe('PUT /folios/:id/cancelar', () => {
  beforeEach(() => {
    mockFirestore._data.clear()
  })

  it('debe cancelar folio pendiente', async () => {
    const folioId = seedFolio()
    const app = createTestApp({ user: { id: 'user-1', role: 'UAD', unidadId: 'test-unidad' } })
    wireFolioRoutes(app)

    const res = await withCsrf(request(app)
      .put(`/folios/${folioId}/cancelar`)
    )

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Folio cancelado correctamente')

    const folios = getCollectionData(mockFirestore, 'folios')
    expect(folios[folioId].estatus).toBe('Cancelado')
  })

  it('debe rechazar cancelar folio ya atendido', async () => {
    const folioId = seedFolio('atendido', { estatus: 'Atendido' })
    const app = createTestApp()
    wireFolioRoutes(app)

    const res = await withCsrf(request(app)
      .put(`/folios/${folioId}/cancelar`)
    )

    // ValidationError returns 400
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/pendientes/)
  })
})
