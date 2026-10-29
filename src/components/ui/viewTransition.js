// Envoltorio de View Transitions API (140ms) que degrada limpiamente si el navegador no lo soporta
// o si el usuario tiene activado prefers-reduced-motion: reduce.
export function withViewTransition(fn) {
  if (typeof fn !== 'function') return undefined

  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return fn()
  }

  const reducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reducedMotion || typeof document.startViewTransition !== 'function') {
    return fn()
  }

  try {
    return document.startViewTransition(() => {
      fn()
    })
  } catch {
    return fn()
  }
}

export default withViewTransition
