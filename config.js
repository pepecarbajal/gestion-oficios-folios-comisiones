import 'dotenv/config'

export const {
  PORT = 3000,
  MONGODB_URI,
  SECRET_JWT_KEY
} = process.env

export const SALT_ROUND = 10