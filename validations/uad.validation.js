export class Validation {
  static uadname (uadname) {
    if (typeof uadname !== 'string') throw new Error('El nombre de la unidad administrativa debe ser una cadena de texto')
    if (uadname.length < 3) throw new Error('El nombre de la unidad administrativa debe tener al menos 3 caracteres')
  }

  static alias (alias) {
    if (typeof alias !== 'string') throw new Error('El alias debe ser una cadena de texto')
    if (alias.length < 3) throw new Error('El alias debe tener al menos 3 caracteres')
  }

}