import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const baseStyles =
    'px-4 py-2 rounded-lg font-semibold transition-all duration-300 backdrop-blur-md';

  const variants = {
    primary:
      'bg-white/10 border border-white/20 text-white shadow-md hover:bg-white/20 hover:border-white/30 hover:shadow-lg',

    secondary:
      'bg-transparent border border-white/20 text-white hover:bg-white/10 hover:border-white/40',

    danger:
      'bg-red-500/80 text-white shadow-md hover:bg-red-600/80 hover:shadow-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
