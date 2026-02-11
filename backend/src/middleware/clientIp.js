import { getSetting } from '../utils/getSetting.js'

/**
 * Normalize an IP address for comparison (strip IPv6 prefix if present).
 * @param {string} ip
 * @returns {string}
 */
function normalizeIp(ip) {
  if (!ip || typeof ip !== 'string') return ''
  const trimmed = ip.trim()
  if (trimmed.startsWith('::ffff:')) return trimmed.slice(7)
  return trimmed
}

/**
 * Parse trusted proxy IPs from setting (comma-separated).
 * @param {string} value
 * @returns {string[]}
 */
function parseTrustedProxyIps(value) {
  if (!value || typeof value !== 'string') return []
  return value.split(',').map(s => normalizeIp(s)).filter(Boolean)
}

/**
 * Get client IP from X-Forwarded-For or X-Real-IP.
 * X-Forwarded-For can be "client, proxy1, proxy2" — leftmost is the client.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function getClientIpFromHeaders(req) {
  const forwarded = req.get('X-Forwarded-For')
  if (forwarded) {
    const first = forwarded.split(',')[0]
    const ip = normalizeIp(first)
    if (ip) return ip
  }
  const realIp = req.get('X-Real-IP')
  if (realIp) {
    const ip = normalizeIp(realIp)
    if (ip) return ip
  }
  return null
}

/**
 * Middleware that sets req.ip to the real client IP when the request comes from a trusted proxy.
 * When the app is behind a reverse proxy (e.g. nginx), the direct connection is from the proxy;
 * configure "Trusted proxy IP addresses" in Settings so we use X-Forwarded-For / X-Real-IP
 * for audit logs, rate limiting, and security.
 * Must run before rate limiting and audit middleware.
 */
export function clientIpMiddleware(req, res, next) {
  const remote = req.socket?.remoteAddress
  const directIp = normalizeIp(remote || '')
  const trustedSetting = getSetting('trusted_proxy_ips')
  const trustedIps = parseTrustedProxyIps(trustedSetting)

  if (trustedIps.length > 0 && directIp && trustedIps.includes(directIp)) {
    const clientIp = getClientIpFromHeaders(req)
    req.ip = clientIp || directIp
  } else {
    req.ip = directIp || remote || ''
  }

  next()
}
