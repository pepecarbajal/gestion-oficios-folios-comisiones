export class MockDocumentSnapshot {
  constructor(id, data, exists = true) {
    this.id = id
    this._data = data
    this.exists = exists
  }

  data() {
    return this._data
  }
}

export class MockQuerySnapshot {
  constructor(docs) {
    this.docs = docs
    this.size = docs.length
    this.empty = docs.length === 0
  }

  forEach(cb) {
    this.docs.forEach(cb)
  }

  map(fn) {
    return this.docs.map(fn)
  }
}

export class MockDocumentRef {
  constructor(firestore, collection, id) {
    this._firestore = firestore
    this._collection = collection
    this._id = id
  }

  async get() {
    const col = this._firestore._data.get(this._collection)
    if (!col || !col.has(this._id)) {
      return new MockDocumentSnapshot(this._id, null, false)
    }
    return new MockDocumentSnapshot(this._id, { ...col.get(this._id) }, true)
  }

  async set(data) {
    if (!this._firestore._data.has(this._collection)) {
      this._firestore._data.set(this._collection, new Map())
    }
    this._firestore._data.get(this._collection).set(this._id, { ...data })
  }

  async update(data) {
    const col = this._firestore._data.get(this._collection)
    if (!col || !col.has(this._id)) return
    const existing = col.get(this._id)
    const resolved = this._firestore._resolveFieldValues(data)
    col.set(this._id, { ...existing, ...resolved })
  }

  async delete() {
    const col = this._firestore._data.get(this._collection)
    if (col) col.delete(this._id)
  }
}

export class MockCollectionRef {
  constructor(firestore, name) {
    this._firestore = firestore
    this._name = name
    this._filters = []
    this._orderByField = null
    this._orderByDir = 'asc'
    this._limitCount = null
  }

  doc(id) {
    return new MockDocumentRef(this._firestore, this._name, id)
  }

  add(data) {
    if (!this._firestore._data.has(this._name)) {
      this._firestore._data.set(this._name, new Map())
    }
    const col = this._firestore._data.get(this._name)
    const id = `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    col.set(id, { ...data })
    return { id }
  }

  where(field, op, value) {
    this._filters.push({ field, op, value })
    return this
  }

  orderBy(field, dir = 'asc') {
    this._orderByField = field
    this._orderByDir = dir
    return this
  }

  limit(n) {
    this._limitCount = n
    return this
  }

  async get() {
    let col = this._firestore._data.get(this._name)
    if (!col) return new MockQuerySnapshot([])

    let entries = Array.from(col.entries())

    for (const filter of this._filters) {
      const { field, op, value } = filter
      if (op === '==') {
        entries = entries.filter(([_, d]) => d[field] === value)
      } else if (op === 'array-contains') {
        entries = entries.filter(([_, d]) => Array.isArray(d[field]) && d[field].includes(value))
      } else if (op === '>=') {
        entries = entries.filter(([_, d]) => d[field] >= value)
      } else if (op === '<=') {
        entries = entries.filter(([_, d]) => d[field] <= value)
      }
    }

    if (this._orderByField) {
      const dir = this._orderByDir === 'desc' ? -1 : 1
      entries.sort((a, b) => {
        const va = a[1][this._orderByField]
        const vb = b[1][this._orderByField]
        if (va == null) return 1
        if (vb == null) return -1
        return va < vb ? -dir : va > vb ? dir : 0
      })
    }

    if (this._limitCount) {
      entries = entries.slice(0, this._limitCount)
    }

    const docs = entries.map(([id, data]) => new MockDocumentSnapshot(id, { ...data }, true))
    return new MockQuerySnapshot(docs)
  }
}

export class MockFirestore {
  constructor() {
    this._data = new Map()
  }

  collection(name) {
    return new MockCollectionRef(this, name)
  }

  _resolveFieldValues(data) {
    const resolved = {}
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && '__op' in value) {
        const existing = this._findExistingValue(key, value)
        resolved[key] = this._applyOp(existing, value)
      } else {
        resolved[key] = value
      }
    }
    return resolved
  }

  _findExistingValue(key, op) {
    return undefined
  }

  _applyOp(existing, opValue) {
    if (opValue.__op === 'arrayUnion') {
      const arr = Array.isArray(existing) ? [...existing] : []
      for (const item of opValue.args) {
        if (!arr.includes(item)) arr.push(item)
      }
      return arr
    }
    if (opValue.__op === 'arrayRemove') {
      const arr = Array.isArray(existing) ? [...existing] : []
      return arr.filter(item => !opValue.args.includes(item))
    }
    if (opValue.__op === 'serverTimestamp') {
      return new Date().toISOString()
    }
    return opValue
  }

  get FieldValue() {
    return this._FieldValue
  }
}

MockFirestore.prototype._FieldValue = {
  arrayUnion: (...args) => ({ __op: 'arrayUnion', args }),
  arrayRemove: (...args) => ({ __op: 'arrayRemove', args }),
  serverTimestamp: () => ({ __op: 'serverTimestamp' })
}

export class MockBucketFile {
  constructor(name) {
    this.name = name
    this._exists = true
    this._buffer = null
  }

  async save(buffer, opts) {
    this._buffer = buffer
    this._opts = opts
  }

  async delete() {
    this._exists = false
  }

  async exists() {
    return [this._exists]
  }

  async getSignedUrl(opts) {
    return [`https://storage.googleapis.com/mock-bucket/${this.name}`]
  }

  async copy(destFile) {
    destFile._buffer = this._buffer
    destFile._exists = true
  }

  get metadata() {
    return { contentType: 'application/pdf' }
  }
}

export class MockBucket {
  constructor() {
    this._files = new Map()
  }

  file(name) {
    if (!this._files.has(name)) {
      this._files.set(name, new MockBucketFile(name))
    }
    return this._files.get(name)
  }

  upload(path) {
    return [{ name: path }]
  }
}

export function createMockFirestore() {
  return new MockFirestore()
}

export function createMockBucket() {
  return new MockBucket()
}

export function seedCollection(mockFirestore, collectionName, docs) {
  for (const [id, data] of Object.entries(docs)) {
    if (!mockFirestore._data.has(collectionName)) {
      mockFirestore._data.set(collectionName, new Map())
    }
    mockFirestore._data.get(collectionName).set(id, { ...data })
  }
}

export function getCollectionData(mockFirestore, collectionName) {
  const col = mockFirestore._data.get(collectionName)
  if (!col) return {}
  const result = {}
  for (const [id, data] of col.entries()) {
    result[id] = { ...data }
  }
  return result
}
