;(function () {
  function getCookie (name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : null
  }
  const originalFetch = window.fetch
  window.fetch = function (input, init = {}) {
    const csrfToken = getCookie('csrf_token')
    if (csrfToken) {
      init.headers = init.headers || {}
      if (init.headers instanceof Headers) {
        if (!init.headers.has('X-CSRF-Token')) init.headers.set('X-CSRF-Token', csrfToken)
      } else {
        init.headers['X-CSRF-Token'] = init.headers['X-CSRF-Token'] || csrfToken
      }
    }
    return originalFetch.call(this, input, init)
  }
})()