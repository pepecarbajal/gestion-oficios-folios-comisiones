const VALID_ROLES = ['ADM', 'AOF', 'UAD', 'USR']

export class Validation {
  static username (username) {
    if (typeof username !== 'string') throw new Error('El nombre de usuario debe ser una cadena de texto')
    if (username.length < 3) throw new Error('El nombre de usuario debe tener al menos 3 caracteres')
  }

  static password (password) {
    if (typeof password !== 'string') throw new Error('La contraseña debe ser una cadena de texto')
    if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres')
  }

  static email (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) throw new Error('El formato del correo electrónico no es válido')
  }

  static role (role) {
    if (!VALID_ROLES.includes(role)) throw new Error(`Rol inválido. Los roles válidos son: ${VALID_ROLES.join(', ')}`)
  }
}