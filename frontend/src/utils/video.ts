export const DEFAULT_VIDEO_URL = '/videos/raw/14620690_960_540_30fps.mp4'

export function resolveVideoUrl(url: string): string {
  if (!url || url.trim().toLowerCase() === 'default') return DEFAULT_VIDEO_URL
  return url
}
