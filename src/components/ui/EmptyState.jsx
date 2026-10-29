import React from 'react';
import { Layers } from 'lucide-react';
import { Button } from './Button.jsx';

export function EmptyState({
  illustration,
  title,
  description,
  action,
  className = '',
  ...rest
}) {
  const classes = `ui-empty-state ${className}`.trim();

  const renderIllustration = () => {
    if (illustration === false) return null;
    if (React.isValidElement(illustration)) {
      return <div className="ui-empty-state__illus">{illustration}</div>;
    }
    if (typeof illustration === 'function' || typeof illustration === 'object') {
      const IllusIcon = illustration;
      return (
        <div className="ui-empty-state__illus" aria-hidden="true">
          <IllusIcon size={28} />
        </div>
      );
    }
    return (
      <div className="ui-empty-state__illus" aria-hidden="true">
        <Layers size={28} />
      </div>
    );
  };

  return (
    <div className={classes} role="status" {...rest}>
      {renderIllustration()}
      {title && <h3 className="ui-empty-state__title">{title}</h3>}
      {description && <p className="ui-empty-state__desc">{description}</p>}
      {action && (
        <div className="ui-empty-state__action">
          {React.isValidElement(action) ? (
            action
          ) : typeof action === 'object' && action.label ? (
            <Button
              variant={action.variant || 'primary'}
              size={action.size || 'md'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
