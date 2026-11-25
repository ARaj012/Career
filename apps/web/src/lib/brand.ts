/** The site's name, tagline and address, shared by the navbar, footer, login and site-wide metadata. */
export const BRAND_NAME = 'Snova'
export const BRAND_TAGLINE = 'Know your path, own your future.'

/**
 * The public address of the site. Set NEXT_PUBLIC_APP_URL in .env.local (and on Vercel)
 * to the real domain once there is one; links in previews, the sitemap and robots.txt follow it.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '')
