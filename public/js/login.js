document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('password')
  const toggle = document.getElementById('togglePassword')
  if (!input || !toggle) return

  toggle.addEventListener('click', () => {
    const mostrar = input.type === 'password'
    input.type = mostrar ? 'text' : 'password'
    const texto = mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'
    toggle.setAttribute('aria-pressed', String(mostrar))
    toggle.setAttribute('aria-label', texto)
    toggle.title = texto
    input.focus()
  })

  const form = input.form
  const submitBtn = form?.querySelector('button[type="submit"]')
  let enviando = false

  form?.addEventListener('submit', e => {
    // Solo se acepta el primer envío; los clics siguientes se ignoran
    if (enviando) {
      e.preventDefault()
      return
    }
    enviando = true

    // Volver a ocultar la contraseña antes de enviar el formulario
    input.type = 'password'
    toggle.setAttribute('aria-pressed', 'false')

    if (submitBtn) {
      submitBtn.style.height = submitBtn.offsetHeight + 'px'
      submitBtn.classList.add('is-loading')
      submitBtn.setAttribute('aria-busy', 'true')
      submitBtn.setAttribute('aria-label', 'Ingresando')
      submitBtn.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span>'
    }
  })

  // Si el usuario regresa con el botón "atrás", dejar el formulario listo de nuevo
  window.addEventListener('pageshow', e => {
    if (!e.persisted || !submitBtn) return
    enviando = false
    submitBtn.classList.remove('is-loading')
    submitBtn.style.height = ''
    submitBtn.removeAttribute('aria-busy')
    submitBtn.removeAttribute('aria-label')
    submitBtn.textContent = 'Iniciar sesión'
  })
})
