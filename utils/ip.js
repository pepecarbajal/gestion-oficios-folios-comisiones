export const getIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || null
