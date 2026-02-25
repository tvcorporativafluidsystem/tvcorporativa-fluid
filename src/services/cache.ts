// src/services/cache.ts

/**
 * Adiciona ?v=<versão> na URL para cache busting controlado.
 * Use o updated_at da tabela 'transmissao' (exposto como lastUpdated no usePlaylist).
 */
 export function versioned(url: string, version: string | number) {
  try {
    const u = new URL(url)
    u.searchParams.set('v', String(version))
    return u.toString()
  } catch {
    // data: URLs ou strings inválidas
    return url
  }
}

/**
 * Pré-carrega URLs no HTTP cache do navegador/CDN.
 * Estratégia: HEAD (opcional) para aquecer a CDN + GET para manter no cache local.
 * Não falha o conjunto por erros individuais: apenas loga e segue.
 */
export async function warmUpUrls(
  urls: string[],
  onProgress?: (done: number, total: number) => void
) {
  let done = 0
  const total = urls.length
  for (const url of urls) {
    try {
      await fetch(url, { method: 'HEAD', mode: 'no-cors' }).catch(() => {})
      await fetch(url, { mode: 'cors' })
    } catch (e) {
      console.warn('[warmUpUrls] falhou:', url, e)
    } finally {
      done++
      onProgress?.(done, total)
    }
  }
}

// ==== Blob cache (PDF instantâneo) ====
const blobCache = new Map<string, { objectUrl: string; version: string }>()

/**
 * Converte uma URL (já versionada) em blob:URL e guarda na RAM por versão.
 */
export async function getBlobObjectUrl(versionedUrl: string, version: string): Promise<string> {
  const key = `${version}::${versionedUrl}`
  const cached = blobCache.get(key)
  if (cached && cached.version === version) return cached.objectUrl

  const res = await fetch(versionedUrl, {
    mode: 'cors',
    cache: 'force-cache',
  }).catch(() => null)

  if (!res || !res.ok) {
    // fallback: devolve a própria URL se não conseguiu baixar como blob
    return versionedUrl
  }

  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  blobCache.set(key, { objectUrl, version })
  return objectUrl
}

/**
 * Libera todos os blob:URLs que não pertencem à versão atual.
 */
export function clearBlobCacheExceptVersion(currentVersion: string) {
  for (const [key, entry] of blobCache.entries()) {
    if (entry.version !== currentVersion) {
      try {
        URL.revokeObjectURL(entry.objectUrl)
      } catch {}
      blobCache.delete(key)
    }
  }
}

/**
 * Pré-gerar blob:URL para uma lista de PDFs (versão atual).
 * Faz tudo em paralelo e ignora falhas individuais.
 */
export async function warmUpPdfBlobs(version: string, urls: string[]) {
  await Promise.allSettled(urls.map((u) => getBlobObjectUrl(u, version)))
}