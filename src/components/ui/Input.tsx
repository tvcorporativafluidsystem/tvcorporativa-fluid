import { InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

export default function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const base = 'bg-[#0f1523] border border-[#1f2a44] rounded-md px-3 py-2 outline-none focus:ring-2 ring-primary-700 text-sm'
  return <input {...props} className={clsx(base, props.className)} />
}