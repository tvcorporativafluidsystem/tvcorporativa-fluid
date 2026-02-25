export default function Progress({ value }: { value: number }) {
  return (
    <div className="w-full bg-[#0f1523] border border-[#1f2a44] rounded h-2 overflow-hidden">
      <div className="h-full bg-primary-700" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}