import 'dotenv/config'

export const {
  PORT = 3000,
  SECRET_JWT_KEY,
  STORAGE_BUCKET
} = process.env

export const SALT_ROUND = 10