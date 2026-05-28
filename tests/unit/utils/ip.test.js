import { describe, it, expect } from 'vitest'
import { getIp } from '../../../utils/ip.js'

describe('getIp', () => {
  it('debe extraer IP de x-forwarded-for', () => {
    const req = {
      headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
      socket: {}
    }
    expect(getIp(req)).toBe('192.168.1.1')
  })

  it('debe extraer IP de x-forwarded-for con un solo valor', () => {
    const req = {
      headers: { 'x-forwarded-for': '10.0.0.1' },
      socket: {}
    }
    expect(getIp(req)).toBe('10.0.0.1')
  })

  it('debe usar socket.remoteAddress si no hay x-forwarded-for', () => {
    const req = {
      headers: {},
      socket: { remoteAddress: '127.0.0.1' }
    }
    expect(getIp(req)).toBe('127.0.0.1')
  })

  it('debe retornar null si no hay IP disponible', () => {
    const req = {
      headers: {},
      socket: {}
    }
    expect(getIp(req)).toBeNull()
  })
})
