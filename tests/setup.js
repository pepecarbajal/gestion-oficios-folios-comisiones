import { vi } from 'vitest'
import { createMockFirestore, createMockBucket } from './helpers/firebase-mock.js'

const mockFirestore = createMockFirestore()
const mockBucket = createMockBucket()

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    arrayUnion: (...args) => ({ __op: 'arrayUnion', args }),
    arrayRemove: (...args) => ({ __op: 'arrayRemove', args }),
    serverTimestamp: () => ({ __op: 'serverTimestamp' })
  }
}))

vi.mock('../db.js', () => ({
  initFirebase: vi.fn(),
  db: () => mockFirestore,
  bucket: () => mockBucket
}))

vi.mock('../repositories/user.repository.js', () => ({
  UserRepository: {
    getById: vi.fn()
  }
}))

vi.mock('../repositories/uad.repository.js', () => ({
  UADRepository: {
    getAll: vi.fn(),
    getById: vi.fn()
  }
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(() => ({ id: 'test-user', role: 'UAD', unidadId: 'test-unidad', unidadAlias: 'Test Unidad' })),
    sign: vi.fn(() => 'test-jwt-token')
  },
  verify: vi.fn(() => ({ id: 'test-user', role: 'UAD', unidadId: 'test-unidad', unidadAlias: 'Test Unidad' })),
  sign: vi.fn(() => 'test-jwt-token')
}))

export { mockFirestore, mockBucket }
