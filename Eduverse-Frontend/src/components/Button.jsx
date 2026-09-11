import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  loading = false,
  loadingText,
  disabled = false,
  className = '',
  icon: Icon,
  type = 'button',
  onClick,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      className={`${className} ${
        isDisabled ? 'opacity-70 cursor-not-allowed pointer-events-none' : ''
      }`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{loadingText || children}</span>
        </span>
      ) : (
        <span className="inline-flex items-center justify-center gap-2">
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          {children}
        </span>
      )}
    </button>
  );
}
