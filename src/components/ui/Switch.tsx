import { clsx } from 'clsx'

export default function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={clsx(
        'w-12 h-7 rounded-full transition relative',
        checked ? 'bg-primary-700' : 'bg-[#1f2a44]'
      )}
    >
      <span
        className={clsx(
          'absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition',
          checked && 'translate-x-5'
        )}
      ></span>
    </button>
  )
}