import { UADRepository } from '../repositories/uad.repository.js'
import { Validation } from '../validations/uad.validation.js'

export const registerUad = async ({ uadname, alias, titularId }) => {
  Validation.uadname(uadname)
  Validation.alias(alias)
  return await UADRepository.create({ uadname, alias, titularId: titularId || null })
}

export const getUads = async () => {
  return await UADRepository.getAll()
}

export const updateUad = async (id, { uadname, alias, titularId }) => {
  Validation.uadname(uadname)
  Validation.alias(alias)
  return await UADRepository.update(id, { uadname, alias, titularId: titularId || null })
}
