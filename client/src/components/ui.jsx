import clsx from 'clsx';

export function Container({ className, ...props }) {
  return (
    <div
      className={clsx('mx-auto w-full max-w-[1200px] px-4 sm:px-6', className)}
      {...props}
    />
  );
}

export function Card({ className, ...props }) {
  return (
    <div
      className={clsx(
        'bg-white rounded-[20px] border border-gray-200 overflow-hidden',
        'transition-all duration-[250ms]',
        'hover:shadow-xl hover:border-gray-300 hover:-translate-y-1',
        className
      )}
      {...props}
    />
  );
}

export function Button({ variant = 'primary', size = 'md', className, ...props }) {
  const base = clsx(
    'inline-flex items-center justify-center gap-[0.45rem]',
    'font-semibold leading-none whitespace-nowrap cursor-pointer',
    'border-none transition-all duration-200',
    'disabled:opacity-50 disabled:pointer-events-none focus:outline-none',
  );

  const sizes = {
    sm: 'text-[0.82rem] px-[1.1rem] py-[0.55rem] rounded-[10px]',
    md: 'text-[0.9rem] px-6 py-3 rounded-[10px]',
    lg: 'text-[1rem] px-8 py-[0.95rem] rounded-[16px]',
  };

  const variants = {
    primary: clsx(
      'bg-[#0C628D] text-white',
      'shadow-[0_1px_2px_rgba(12,98,141,.3),inset_0_1px_0_rgba(255,255,255,.08)]',
      'hover:bg-[#0A527A] hover:shadow-[0_4px_12px_rgba(12,98,141,.4)] hover:-translate-y-[1px]',
    ),
    orange: clsx(
      'bg-[#F3921B] text-white',
      'shadow-[0_1px_2px_rgba(243,146,27,.3),inset_0_1px_0_rgba(255,255,255,.1)]',
      'hover:bg-[#D97C0D] hover:shadow-[0_4px_12px_rgba(243,146,27,.4)] hover:-translate-y-[1px]',
    ),
    white: clsx(
      'bg-white text-gray-900',
      'shadow-[0_1px_3px_rgba(0,0,0,.08),0_1px_2px_rgba(0,0,0,.06)]',
      'hover:shadow-[0_4px_6px_rgba(0,0,0,.07),0_2px_4px_rgba(0,0,0,.06)] hover:-translate-y-[1px]',
    ),
    outline: clsx(
      'bg-transparent text-gray-900 border border-gray-200',
      'hover:border-gray-300 hover:shadow-sm hover:-translate-y-[1px]',
    ),
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    danger: clsx(
      'bg-rose-600 text-white',
      'hover:bg-rose-700 hover:-translate-y-[1px]',
    ),
  };

  return (
    <button
      className={clsx(base, sizes[size] ?? sizes.md, variants[variant] ?? variants.primary, className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }) {
  return (
    <input
      className={clsx(
        'w-full rounded-[10px] border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900',
        'placeholder:text-gray-400 font-[inherit]',
        'focus:outline-none focus:border-[#0C628D] focus:ring-2 focus:ring-[rgba(12,98,141,.15)]',
        'transition-colors duration-150',
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={clsx(
        'w-full rounded-[10px] border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900',
        'placeholder:text-gray-400 font-[inherit]',
        'focus:outline-none focus:border-[#0C628D] focus:ring-2 focus:ring-[rgba(12,98,141,.15)]',
        'transition-colors duration-150',
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }) {
  return (
    <label
      className={clsx(
        'text-[0.78rem] font-semibold text-gray-600 tracking-[.04em] uppercase',
        className
      )}
      {...props}
    />
  );
}
