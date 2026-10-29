import React from 'react';

export function Kbd({ children, className = '', ...rest }) {
  return (
    <kbd className={`ui-kbd tabular ${className}`.trim()} {...rest}>
      {children}
    </kbd>
  );
}

export default Kbd;
