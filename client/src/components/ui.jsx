import clsx from 'clsx';

export function Container({ className, ...props }) {
  return (
    <div
      className={clsx(
        'mx-auto w-full max-w-8xl px-[clamp(1rem,2vw,2.5rem)]',
        className
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }) {
  return (
    <div
      className={clsx(
        'border border-slate-200 bg-white shadow-sm',
        'dark:border-slate-800 dark:bg-slate-950',
        className
      )}
      {...props}
    />
  );
}

export function Button({ variant = 'primary', className, ...props }) {
  const base =
    'inline-flex items-center justify-center px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary: 'bg-[#d76810] text-white hover:bg-[#c55a0a]',
    ghost: 'bg-transparent text-slate-900 hover:bg-slate-100',
    outline: 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-500',
  };

  return <button className={clsx(base, variants[variant], className)} {...props} />;
}

export function Input({ className, ...props }) {
  return (
    <input
      className={clsx(
        'w-full border border-slate-200 bg-white px-3 py-2 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-orange-400',
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
        'w-full border border-slate-200 bg-white px-3 py-2 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-orange-400',
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }) {
  return <label className={clsx('text-sm font-medium text-slate-700', className)} {...props} />;
}
