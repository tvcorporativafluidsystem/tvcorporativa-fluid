import { clsx } from 'clsx'
import { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  loading?: boolean
}

export default function Button({ className, variant = 'primary', loading, children, ...rest }: Props) {
  const base = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition'
  const variants = {
    primary: 'bg-primary-700 hover:bg-primary-600 text-black',
    secondary: 'bg-card hover:bg-[#1a2234] text-white border border-[#1f2a44]',
    danger: 'bg-danger hover:bg-red-500 text-white',
    ghost: 'bg-transparent hover:bg-[#1a2234] text-white'
  } as const

  return (
    <button
      className={clsx(base, variants[variant], className, loading && 'opacity-70 cursor-not-allowed')}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {children}
    </button>
  )
}