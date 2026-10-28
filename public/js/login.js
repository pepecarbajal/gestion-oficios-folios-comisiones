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

  // Volver a ocultar la contraseña antes de enviar el formulario
  input.form?.addEventListener('submit', () => {
    input.type = 'password'
  })
})
