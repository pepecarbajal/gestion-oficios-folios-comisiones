import { describe, it, expect, beforeEach, vi } from 'vitest'
import request from 'supertest'
import { createTestApp, wireOficioRoutes } from '../helpers/app-builder.js'
import { seedCollection, getCollectionData } from '../helpers/firebase-mock.js'
import { mockFirestore } from '../setup.js'
import { OficioRepository } from '../../repositories/oficio.repository.js'
import { UADRepository } from '../../repositories/uad.repository.js'

const CSRF_TOKEN = 'a'.repeat(64)
function withCsrf(req) {
  return req
    .set('Cookie', `csrf_token=${CSRF_TOKEN}`)
    .set('X-CSRF-Token', CSRF_TOKEN)
}

function seedOficio(id, overrides = {}) {
  const oficioId = id || 'oficio-test-1'
  seedCollection(mockFirestore, 'oficios', {
    [oficioId]: {
      noOficio: 'TEST-001',
      asunto: 'Oficio de prueba',
      remitente: 'Juan Pérez',
      unidadIds: ['test-unidad'],
      unidadId: 'test-unidad',
      unidadAlias: 'Test Unidad',
      estatus: 'Pendiente',
      respuestas: [],
      modo: 0,
      tipoArchivo: 0,
      creadoEn: new Date().toISOString(),
      ...overrides
    }
  })
  return oficioId
}

describe('POST /oficios/:id/respuesta', () => {
  beforeEach(() => {
    mockFirestore._data.clear()
  })

  it('debe guardar respuesta sin archivos', async () => {
    const oficioId = seedOficio()
    const app = createTestApp()
    wireOficioRoutes(app)

    const res = await withCsrf(request(app)
      .post(`/oficios/${oficioId}/respuesta`)
      .field('comentario', 'Respuesta de prueba')
    )

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Respuesta guardada correctamente')

    const oficios = getCollectionData(mockFirestore, 'oficios')
    expect(oficios[oficioId].respuestas).toHaveLength(1)
    expect(oficios[oficioId].respuestas[0].comentario).toBe('Respuesta de prueba')
    expect(oficios[oficioId].respuestas[0].unidadId).toBe('test-unidad')
  })

  it('debe guardar respuesta con archivos', async () => {
    const oficioId = seedOficio()
    const app = createTestApp()
    wireOficioRoutes(app)

    const res = await withCsrf(request(app)
      .post(`/oficios/${oficioId}/respuesta`)
      .field('comentario', 'Con archivos')
      .attach('archivos', Buffer.from('test content'), 'documento.pdf')
      .attach('archivos', Buffer.from('imagen'), 'foto.jpg')
    )

    expect(res.status).toBe(200)

    const oficios = getCollectionData(mockFirestore, 'oficios')
    expect(oficios[oficioId].respuestas[0].archivos).toHaveLength(2)
  })

  it('debe rechazar archivo con tipo no permitido', async () => {
    const oficioId = seedOficio()
    const app = createTestApp()
    wireOficioRoutes(app)

    const res = await withCsrf(request(app)
      .post(`/oficios/${oficioId}/respuesta`)
      .attach('archivos', Buffer.from('zip'), 'archivo.zip')
    )

    // multer fileFilter rejects before controller, returns 400
    expect(res.status).toBe(400)
  })

  it('debe rechazar si oficio no existe', async () => {
    const app = createTestApp()
    wireOficioRoutes(app)

    const res = await withCsrf(request(app)
      .post('/oficios/inexistente/respuesta')
      .field('comentario', 'test')
    )

    expect(res.status).toBe(404)
  })

  it('debe rechazar si la unidad es co-responsable', async () => {
    const oficioId = seedOficio('test-coresp', {
      cooresponsableIds: ['test-unidad'],
      responsableIds: ['otra-unidad']
    })
    const app = createTestApp()
    wireOficioRoutes(app)

    const res = await withCsrf(request(app)
      .post(`/oficios/${oficioId}/respuesta`)
      .field('comentario', 'test')
    )

    // ValidationError returns 400
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/co-responsable/)
  })

  it('debe rechazar si modo=1 y no ha visto el oficio', async () => {
    const oficioId = seedOficio('test-visto', {
      modo: 1,
      vistoPor: [],
      responsableIds: ['test-unidad'],
      cooresponsableIds: []
    })
    const app = createTestApp()
    wireOficioRoutes(app)

    const res = await withCsrf(request(app)
      .post(`/oficios/${oficioId}/respuesta`)
      .field('comentario', 'test')
    )

    // ValidationError returns 400
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/visualizar el oficio/)
  })

  it('debe auto-atender oficio cuando todas las unidades responden', async () => {
    const oficioId = seedOficio('test-atender', {
      unidadIds: ['test-unidad'],
      responsableIds: ['test-unidad'],
      estatus: 'Pendiente'
    })
    const app = createTestApp()
    wireOficioRoutes(app)

    const res = await withCsrf(request(app)
      .post(`/oficios/${oficioId}/respuesta`)
      .field('comentario', 'Última respuesta')
    )

    expect(res.status).toBe(200)

    const oficios = getCollectionData(mockFirestore, 'oficios')
    expect(oficios[oficioId].estatus).toBe('Atendido')
  })
})

describe('POST /oficios/:id/aclaracion', () => {
  beforeEach(() => {
    mockFirestore._data.clear()
  })

  it('debe agregar aclaración', async () => {
    const oficioId = seedOficio()
    const app = createTestApp()
    wireOficioRoutes(app)

    const res = await withCsrf(request(app)
      .post(`/oficios/${oficioId}/aclaracion`)
      .field('comentario', 'Aclaración de prueba')
    )

    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Aclaración guardada correctamente')

    const oficios = getCollectionData(mockFirestore, 'oficios')
    expect(oficios[oficioId].respuestas).toHaveLength(1)
    expect(oficios[oficioId].respuestas[0].esAclaracion).toBe(true)
  })

  it('debe agregar aclaración con archivos', async () => {
    const oficioId = seedOficio()
    const app = createTestApp()
    wireOficioRoutes(app)

    const res = await withCsrf(request(app)
      .post(`/oficios/${oficioId}/aclaracion`)
      .field('comentario', 'Con evidencia')
      .attach('archivos', Buffer.from('pdf'), 'doc.pdf')
    )

    expect(res.status).toBe(200)

    const oficios = getCollectionData(mockFirestore, 'oficios')
    expect(oficios[oficioId].respuestas[0].archivos).toHaveLength(1)
  })

  it('debe rechazar aclaración si oficio no existe', async () => {
    const app = createTestApp()
    wireOficioRoutes(app)

    const res = await withCsrf(request(app)
      .post('/oficios/inexistente/aclaracion')
      .field('comentario', 'test')
    )

    expect(res.status).toBe(404)
  })
})

describe('POST /oficios/:id/visto', () => {
  beforeEach(() => {
    mockFirestore._data.clear()
  })

  it('debe marcar como visto', async () => {
    const oficioId = seedOficio()
    const app = createTestApp()
    wireOficioRoutes(app)

    const res = await withCsrf(request(app)
      .post(`/oficios/${oficioId}/visto`)
    )

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    const oficios = getCollectionData(mockFirestore, 'oficios')
    expect(oficios[oficioId].vistoPor).toContain('test-unidad')
  })
})

describe('Co-responsable flow', () => {
  beforeEach(() => {
    mockFirestore._data.clear()
    vi.mocked(UADRepository.getAll).mockResolvedValue([
      { id: 'unidad-resp', alias: 'Unidad Responsable' },
      { id: 'unidad-coresp', alias: 'Unidad Co-Responsable' }
    ])
  })

  describe('OficioRepository.create', () => {
    it('debe excluir co-responsables de responsableIds cuando no se envian responsables', async () => {
      const id = await OficioRepository.create({
        noOficio: 'CORESP-001',
        asunto: 'Test co-responsables',
        remitente: 'Juan',
        unidadIds: ['unidad-resp', 'unidad-coresp'],
        cooresponsableIds: ['unidad-coresp'],
        responsableIds: []
      })

      const oficios = getCollectionData(mockFirestore, 'oficios')
      expect(oficios[id].responsableIds).toEqual(['unidad-resp'])
      expect(oficios[id].cooresponsableIds).toEqual(['unidad-coresp'])
    })

    it('debe usar responsableIds explícitos cuando se envían', async () => {
      const id = await OficioRepository.create({
        noOficio: 'CORESP-002',
        asunto: 'Test explícito',
        remitente: 'Juan',
        unidadIds: ['unidad-resp', 'unidad-coresp', 'unidad-extra'],
        cooresponsableIds: ['unidad-coresp'],
        responsableIds: ['unidad-resp', 'unidad-extra']
      })

      const oficios = getCollectionData(mockFirestore, 'oficios')
      expect(oficios[id].responsableIds).toEqual(['unidad-resp', 'unidad-extra'])
      expect(oficios[id].cooresponsableIds).toEqual(['unidad-coresp'])
    })

    it('debe usar unidadIds completo cuando no hay co-responsables', async () => {
      const id = await OficioRepository.create({
        noOficio: 'CORESP-003',
        asunto: 'Sin co-responsables',
        remitente: 'Juan',
        unidadIds: ['unidad-a', 'unidad-b'],
        cooresponsableIds: [],
        responsableIds: []
      })

      const oficios = getCollectionData(mockFirestore, 'oficios')
      expect(oficios[id].responsableIds).toEqual(['unidad-a', 'unidad-b'])
    })
  })

  describe('Respuesta con co-responsables', () => {
    it('debe cambiar estatus a Atendido cuando responsable responde (ignorando co-responsables)', async () => {
      const oficioId = seedOficio('coresp-resp-test', {
        noOficio: 'CORESP-RESP',
        unidadIds: ['unidad-resp', 'unidad-coresp'],
        responsableIds: ['unidad-resp'],
        cooresponsableIds: ['unidad-coresp'],
        estatus: 'Pendiente',
        respuestas: []
      })
      const app = createTestApp({ user: { id: 'user-resp', role: 'UAD', unidadId: 'unidad-resp', unidadAlias: 'Unidad Responsable' } })
      wireOficioRoutes(app)

      const res = await withCsrf(request(app)
        .post(`/oficios/${oficioId}/respuesta`)
        .field('comentario', 'Respuesta del responsable')
      )

      expect(res.status).toBe(200)

      const oficios = getCollectionData(mockFirestore, 'oficios')
      expect(oficios[oficioId].estatus).toBe('Atendido')
      expect(oficios[oficioId].respuestas).toHaveLength(1)
    })

    it('debe permanecer Pendiente si no han respondido todos los responsables', async () => {
      const oficioId = seedOficio('coresp-pend-test', {
        noOficio: 'CORESP-PEND',
        unidadIds: ['unidad-resp-1', 'unidad-resp-2', 'unidad-coresp'],
        responsableIds: ['unidad-resp-1', 'unidad-resp-2'],
        cooresponsableIds: ['unidad-coresp'],
        estatus: 'Pendiente',
        respuestas: []
      })
      const app = createTestApp({ user: { id: 'user-resp1', role: 'UAD', unidadId: 'unidad-resp-1', unidadAlias: 'Resp 1' } })
      wireOficioRoutes(app)

      const res = await withCsrf(request(app)
        .post(`/oficios/${oficioId}/respuesta`)
        .field('comentario', 'Solo responde uno')
      )

      expect(res.status).toBe(200)

      const oficios = getCollectionData(mockFirestore, 'oficios')
      expect(oficios[oficioId].estatus).toBe('Pendiente')
    })

    it('debe rechazar si unidad co-responsable intenta responder', async () => {
      const oficioId = seedOficio('coresp-block', {
        noOficio: 'CORESP-BLOCK',
        unidadIds: ['unidad-resp', 'unidad-coresp'],
        responsableIds: ['unidad-resp'],
        cooresponsableIds: ['unidad-coresp']
      })
      const app = createTestApp({ user: { id: 'user-coresp', role: 'UAD', unidadId: 'unidad-coresp', unidadAlias: 'Co-Responsable' } })
      wireOficioRoutes(app)

      const res = await withCsrf(request(app)
        .post(`/oficios/${oficioId}/respuesta`)
        .field('comentario', 'Intento de co-responsable')
      )

      expect(res.status).toBe(400)
      expect(res.body.error).toMatch(/co-responsable/)
    })
  })
})
