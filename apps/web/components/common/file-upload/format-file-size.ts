const BYTES_PER_KB = 1024
const BYTES_PER_MB = 1024 * 1024

export function formatFileSize(bytes: number): string {
  if (bytes < BYTES_PER_MB) return `${Math.max(1, Math.round(bytes / BYTES_PER_KB))} KB`
  return `${(bytes / BYTES_PER_MB).toFixed(1)} MB`
}
