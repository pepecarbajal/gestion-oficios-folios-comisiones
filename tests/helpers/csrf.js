const CSRF_TOKEN = 'a'.repeat(64)

export function withCsrf(request) {
  return request
    .set('Cookie', `csrf_token=${CSRF_TOKEN}`)
    .set('X-CSRF-Token', CSRF_TOKEN)
}

export function setupCsrfCookie(app) {
  app.use((req, res, next) => {
    req.headers.cookie = `csrf_token=${CSRF_TOKEN}`
    next()
  })
}
