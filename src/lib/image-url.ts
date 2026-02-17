function extractGoogleDriveFileId(url: URL): string | null {
  const idFromQuery = url.searchParams.get('id');
  if (idFromQuery) return idFromQuery;

  const match = url.pathname.match(/\/(?:file\/d|d)\/([a-zA-Z0-9_-]{10,})/);
  return match?.[1] ?? null;
}

/**
 * Creates a fallback image URL from a product name by looking for a local image file
 * Note: No local images available, returns null to show "Sin imagen" placeholder
 */
export function getProductImageFallback(productName: string): string | null {
  // No local images available - will show "Sin imagen" placeholder
  return null;
}

/**
 * Normalizes user-provided / DB-provided image URLs so they are more likely to render in <img>.
 * - Keeps relative URLs (e.g. /products/x.jpg)
 * - Converts common Google Drive share links to a thumbnail endpoint
 * - Converts Dropbox share links to raw image links
 * - Rejects non-http(s) protocols for safety
 * - Returns null for known problematic domains to trigger fallback
 */
export function normalizeImageUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return trimmed;
  }

  let candidate = trimmed;
  if (candidate.startsWith('//')) candidate = `https:${candidate}`;
  if (candidate.startsWith('www.')) candidate = `https://${candidate}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    // If it's not a valid absolute URL, return as-is (best effort)
    return trimmed;
  }

  const protocol = url.protocol.toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') return null;

  const host = url.hostname.toLowerCase();

  // Google Drive / Docs: transform to thumbnail endpoint that is embeddable.
  if (host.endsWith('drive.google.com') || host.endsWith('docs.google.com')) {
    const fileId = extractGoogleDriveFileId(url);
    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
    }
  }

  // Googleusercontent direct links are usually already embeddable.
  if (host.endsWith('googleusercontent.com')) {
    return url.toString();
  }

  // Amazon images often fail due to referrer policies - return null to trigger fallback
  if (host.includes('amazon.com') || host.includes('amazonaws.com') || host.includes('media-amazon.com')) {
    return null;
  }

  // Walmart images also often fail
  if (host.includes('walmart')) {
    return null;
  }

  // Dropbox shared links need raw=1 to render as an image.
  if (host.endsWith('dropbox.com')) {
    url.searchParams.delete('dl');
    url.searchParams.set('raw', '1');
    return url.toString();
  }

  return url.toString();
}
