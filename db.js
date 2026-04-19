import mongoose from 'mongoose'
import { MONGODB_URI } from './config.js'

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('MongoDB')
  } catch (error) {
    console.error('MongoDB error:', error.message)
    process.exit(1)
  }
}