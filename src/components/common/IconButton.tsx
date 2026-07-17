import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface IconButtonProps {
  icon: IconDefinition;
  title?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function IconButton({
  icon,
  title,
  onClick,
  disabled,
  className,
  children
}: IconButtonProps) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={className || 'icon-button'}
    >
      <FontAwesomeIcon icon={icon} />
      {children && <span className="icon-button-label">{children}</span>}
    </button>
  );
}
