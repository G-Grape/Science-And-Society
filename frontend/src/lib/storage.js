/**
 * Storage utility — handles signed URL generation for the private 'journals' bucket.
 *
 * WHY THIS EXISTS:
 *   The journals storage bucket is PRIVATE (public = false). Files are never
 *   accessible via the unauthenticated public CDN path. All access goes through
 *   Supabase Storage RLS using signed URLs that expire after 1 hour.
 *
 * HOW TO USE:
 *   import { getSignedUrl } from '@/lib/storage'
 *   const url = await getSignedUrl(supabase, journal.file_url)
 *   // Then use url in an <a href={url}> or <img src={url}>
 *
 * HANDLES BOTH OLD AND NEW URL FORMATS:
 *   • Old records: stored as full public URL
 *     "https://xxx.supabase.co/storage/v1/object/public/journals/uuid/file.pdf"
 *   • New records: stored as a bare storage path
 *     "uuid/file.pdf" or "reviewer/uuid/report.pdf"
 *
 * Both formats are handled transparently.
 */

/**
 * Extract the bare storage object path from any stored value.
 * Works for full public URLs and bare paths alike.
 * @param {string} stored - The value from file_url, revision_report_url, etc.
 * @returns {string|null} - The bare path, e.g. "uuid/timestamp.pdf"
 */
export function extractStoragePath(stored) {
  if (!stored) return null
  // Full URL format: extract everything after "/journals/"
  const marker = '/journals/'
  const idx = stored.indexOf(marker)
  if (idx !== -1) {
    // Strip any query string (e.g. old signed URLs have ?token=...)
    return stored.slice(idx + marker.length).split('?')[0]
  }
  // Already a bare path — strip any leading slash
  return stored.replace(/^\//, '')
}

/**
 * Generate a signed URL for a stored file reference.
 * Returns null if the stored value is empty or signing fails.
 *
 * @param {object} supabase - Supabase client instance
 * @param {string} stored   - Value from file_url / revision_report_url / approval_proof_url
 * @param {number} expiresIn - Seconds until the signed URL expires (default: 3600 = 1 hour)
 * @returns {Promise<string|null>}
 */
export async function getSignedUrl(supabase, stored, expiresIn = 3600) {
  const path = extractStoragePath(stored)
  if (!path) return null

  const { data, error } = await supabase.storage
    .from('journals')
    .createSignedUrl(path, expiresIn)

  if (error) {
    console.warn('[storage] Failed to create signed URL for:', path, error.message)
    return null
  }
  return data.signedUrl
}

/**
 * Upload a file to the journals bucket and return ONLY THE STORAGE PATH
 * (not the full public URL). Always store this path in the database.
 *
 * @param {object} supabase  - Supabase client instance
 * @param {string} path      - The destination path within the bucket, e.g. "uuid/file.pdf"
 * @param {File}   file      - The File object to upload
 * @returns {Promise<{path: string, error: object|null}>}
 */
export async function uploadFile(supabase, path, file) {
  const { error } = await supabase.storage
    .from('journals')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) return { path: null, error }
  return { path, error: null }
}
