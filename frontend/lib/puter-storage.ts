/**
 * Puter.com Cloud Storage Client for BhoomiSetu AI
 * Free, unlimited, global cloud storage for land records and PDF dalils.
 */

declare global {
  interface Window {
    puter?: any
  }
}

/**
 * Uploads a file to Puter.com Cloud Storage and retrieves a publicly readable URL.
 */
export async function uploadToPuter(
  file: File
): Promise<{ cloudUrl: string | null; filePath: string | null }> {
  if (typeof window === 'undefined') {
    return { cloudUrl: null, filePath: null }
  }

  try {
    // Wait for Puter.js SDK to finish loading on window if needed
    let retries = 0
    while (!window.puter && retries < 15) {
      await new Promise((r) => setTimeout(r, 150))
      retries++
    }

    if (window.puter?.fs) {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `bhoomisetu_documents/${Date.now()}_${cleanName}`

      // 1. Write file to Puter cloud filesystem
      await window.puter.fs.write(filePath, file, {
        overwrite: true,
        createMissingParents: true,
      })

      // 2. Obtain direct readable URL
      const cloudUrl = await window.puter.fs.getReadURL(filePath)
      console.log('[Puter Cloud Storage] Uploaded successfully:', { filePath, cloudUrl })
      return { cloudUrl, filePath }
    } else {
      console.info('[Puter Cloud Storage] Puter SDK not loaded, using direct fallback.')
    }
  } catch (err) {
    console.warn('[Puter Cloud Storage] Notice (using direct storage fallback):', err)
  }

  return { cloudUrl: null, filePath: null }
}
