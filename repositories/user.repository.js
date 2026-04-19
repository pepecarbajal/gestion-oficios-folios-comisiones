import bcrypt from 'bcrypt'
import { User } from '../models/user.model.js'
import { Validation } from '../validations/user.validation.js'
import { SALT_ROUND } from '../config.js'

export class UserRepository {
  static async create ({ username, email, password, role, administrativeUnitId = null }) {
    Validation.username(username)
    Validation.email(email)
    Validation.password(password)
    Validation.role(role)

    const existingUser = await User.findOne({ email }).lean()
    if (existingUser) throw new Error(`The email "${email}" is already registered`)

    const hashedPassword = await bcrypt.hash(password, SALT_ROUND)
    const user = new User({ username, email, password: hashedPassword, role, administrativeUnitId })
    await user.save()

    return user._id
  }

  static async login ({ email, password }) {
    Validation.email(email)
    Validation.password(password)

    const user = await User.findOne({ email }).lean()
    if (!user) throw new Error('User not found')

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) throw new Error('Invalid password')

    const { password: _, ...publicUser } = user
    return publicUser
  }
}