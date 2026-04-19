import mongoose from 'mongoose'
import crypto from 'node:crypto'

const userSchema = new mongoose.Schema({
  username: { type: String, required: true},
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADM', 'TIT', 'AOF', 'AFL', 'UAD', 'ACO', 'USR'], default: 'USR' },
  administrativeUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdministrativeUnit' }
})

export const User = mongoose.model('User', userSchema)