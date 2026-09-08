/**
 * Storage.to Cloud Storage Client for BhoomiSetu AI
 * Anonymous, instant cloud storage with zero login / auth required.
 */

export interface StorageToResult {
  cloudUrl: string | null
  fileId: string | null
  filename?: string
  expiresAt?: string
}

/**
 * Uploads a file to storage.to and returns its public shareable URL.
 * 100% anonymous, no account or API keys required.
 */
export async function uploadToStorageTo(file: File): Promise<StorageToResult> {
  try {
    const contentType = file.type || 'application/pdf'
    
    // Step 1: Initialize upload on storage.to
    const initRes = await fetch('https://storage.to/api/upload/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        size: file.size,
        content_type: contentType,
      }),
    })

    if (!initRes.ok) {
      const err = await initRes.text()
      throw new Error(`Storage.to init failed (${initRes.status}): ${err}`)
    }

    const initData = await initRes.json()
    const uploadUrl = initData.upload_url
    const r2Key = initData.r2_key

    if (!uploadUrl || !r2Key) {
      throw new Error('Invalid init response from storage.to')
    }

    // Step 2: Upload file bytes directly to Cloudflare R2 presigned URL
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: file,
    })

    if (!uploadRes.ok) {
      throw new Error(`Storage.to R2 upload failed with status ${uploadRes.status}`)
    }

    // Step 3: Confirm upload to create file record and retrieve public URL
    const confirmRes = await fetch('https://storage.to/api/upload/confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        size: file.size,
        content_type: contentType,
        r2_key: r2Key,
      }),
    })

    if (!confirmRes.ok) {
      const err = await confirmRes.text()
      throw new Error(`Storage.to confirmation failed: ${err}`)
    }

    const confirmData = await confirmRes.json()
    const cloudUrl = confirmData?.file?.url || `https://storage.to/${confirmData?.file?.id}`
    const fileId = confirmData?.file?.id || null

    console.log('[Storage.to] Upload succeeded:', { cloudUrl, fileId })

    return {
      cloudUrl,
      fileId,
      filename: file.name,
      expiresAt: confirmData?.file?.expires_at,
    }
  } catch (err) {
    console.warn('[Storage.to] Upload notice (falling back to direct server storage):', err)
    return { cloudUrl: null, fileId: null }
  }
}
