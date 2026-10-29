// Tecla de atajo en línea con tipografía monoespaciada (--fs-1), fondo --sunken y borde 1px --line.
// Elemento semántico <kbd> accesible para lectores de pantalla.
import React from 'react'

export function Kbd({ children, className = '', ...rest }) {
  const classes = ['ui-kbd', className].filter(Boolean).join(' ')
  return (
    <kbd className={classes} {...rest}>
      {children}
    </kbd>
  )
}

export default Kbd
