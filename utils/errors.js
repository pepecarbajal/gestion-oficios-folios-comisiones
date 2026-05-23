export class AppError extends Error {
  constructor (message, status = 400) {
    super(message)
    this.status = status
  }
}

export class NotFoundError extends AppError {
  constructor (message = 'Recurso no encontrado') {
    super(message, 404)
  }
}

export class ValidationError extends AppError {
  constructor (message) {
    super(message, 400)
  }
}

export class AuthError extends AppError {
  constructor (message = 'No autorizado') {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor (message = 'Acción no permitida') {
    super(message, 403)
  }
}
