import { auditLog } from '../services/auditService.js'
import { getClientIp } from './clientIp.js'

/**
 * Middleware to automatically audit API requests
 */
export function auditMiddleware(req, res, next) {
  // Store original end function
  const originalEnd = res.end

  // Override end to log after response
  res.end = function (...args) {
    // Only audit successful requests (2xx status codes)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const action = `${req.method} ${req.path}`
      const resourceType = getResourceType(req.path)
      const resourceId = extractResourceId(req)

      auditLog({
        userId: req.session?.applicantId || null,
        action,
        resourceType,
        resourceId,
        ipAddress: getClientIp(req),
        userAgent: req.get('user-agent'),
        details: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode
        }
      }).catch(err => {
        console.error('Audit middleware error:', err)
      })
    }

    // Call original end
    originalEnd.apply(res, args)
  }

  next()
}

function getResourceType(path) {
  if (path.includes('/applicants')) return 'APPLICANT'
  if (path.includes('/forms')) return 'FORM'
  if (path.includes('/settings')) return 'SETTINGS'
  if (path.includes('/documents')) return 'DOCUMENT'
  return 'API'
}

function extractResourceId(req) {
  // Try to extract ID from URL params or body
  const urlMatch = req.path.match(/\/(\d+)/)
  if (urlMatch) return parseInt(urlMatch[1])

  if (req.body && req.body.id) return req.body.id
  if (req.body && req.body.applicantId) return req.body.applicantId

  return null
}

