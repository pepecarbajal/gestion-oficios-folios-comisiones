import crypto from 'crypto'

const loginAttempts = new Map()
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 10

function pruneOldEntries () {
  const now = Date.now()
  for (const [ip, data] of loginAttempts.entries()) {
    if (now - data.firstRequest > WINDOW_MS) loginAttempts.delete(ip)
  }
}

export const loginLimiter = (req, res, next) => {
  pruneOldEntries()
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const entry = loginAttempts.get(ip)

  if (!entry) {
    loginAttempts.set(ip, { count: 1, firstRequest: now })
    return next()
  }

  if (now - entry.firstRequest > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstRequest: now })
    return next()
  }

  entry.count++

  if (entry.count > MAX_ATTEMPTS) {
    const retryAfterSeg = Math.ceil((WINDOW_MS - (now - entry.firstRequest)) / 1000)
    res.set('Retry-After', retryAfterSeg)
    return res.status(429).render('login', {
      error: `Demasiados intentos. Intenta de nuevo en ${Math.ceil(retryAfterSeg / 60)} minuto(s).`
    })
  }

  next()
}

setInterval(pruneOldEntries, 30 * 60 * 1000)

export const securityHeaders = (req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('X-Frame-Options', 'DENY')
  res.set('X-XSS-Protection', '1; mode=block')
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  res.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' storage.googleapis.com data:",
      "frame-src 'none'",
      "object-src 'none'",
      "connect-src 'self'"
    ].join('; ')
  )

  next()
}

const CSRF_COOKIE = 'csrf_token'
const TOKEN_BYTES = 32

function generarToken () {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex')
}

export const csrfInit = (req, res, next) => {
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = generarToken()
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 8
    })
    res.locals.csrfToken = token
  } else {
    res.locals.csrfToken = req.cookies[CSRF_COOKIE]
  }
  next()
}

export const csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()

  const cookieToken = req.cookies?.[CSRF_COOKIE]
  const requestToken = req.headers['x-csrf-token'] || req.body?._csrf

  if (!cookieToken || !requestToken) {
    return res.status(403).json({ error: 'Token CSRF ausente.' })
  }

  const cookieBuf = Buffer.from(cookieToken)
  const requestBuf = Buffer.from(requestToken)

  if (
    cookieBuf.length !== requestBuf.length ||
    !crypto.timingSafeEqual(cookieBuf, requestBuf)
  ) {
    return res.status(403).json({ error: 'Token CSRF inválido.' })
  }

  next()
}