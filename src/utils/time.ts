export const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}