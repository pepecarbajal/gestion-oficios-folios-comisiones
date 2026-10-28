// Cierra el modal visible de hasta arriba con la tecla Esc,
// usando su propio botón de cierre para que se limpie igual que con un clic.
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return

  const abiertos = [...document.querySelectorAll('.modal-overlay')]
    .filter(m => getComputedStyle(m).display !== 'none')
  const actual = abiertos[abiertos.length - 1]
  if (!actual) return

  const cerrar = actual.querySelector('.modal-close')
  if (cerrar) {
    e.preventDefault()
    cerrar.click()
  }
})
