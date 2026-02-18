/**
 * Update notification manifest for production.
 * Shown once per version to admins and managers only (see UpdateNotificationModal).
 * When shipping a new production version, add an entry here and document in .cursorrules.
 *
 * Keys are version strings (e.g. "1.6.0"). Summary is shown in the "What's new" popup.
 */
export const UPDATE_MANIFEST = {
  '1.7.0': {
    date: '2025-02',
    title: "What's new in v1.7.0",
    summary: [
      '**Step 6 onboarding** — Email & Forms can be completed entirely in the setup wizard. Required employer info (I-9 rep name, Form 8850 EIN/address/city/state/zip/phone) and optional W-4 educational link (URL and label) are collected inline; Save enables Continue to dashboard without opening Settings.',
      '**Version history on first run** — When the app is used for the first time, admins and managers see a full version history in the update popup instead of only the latest release.'
    ]
  },
  '1.6.0': {
    date: '2025-02',
    title: "What's new in v1.6.0",
    summary: [
      '**Timezone setting** — Admins can set a display timezone in Settings → System. All dates and times across the app (and in exports) now follow that timezone; existing records are shown correctly in UTC and then converted for display.',
      '**Email & Forms in onboarding** — Admin setup now includes Step 6: Email & Forms. Required employer information (I-9 authorized rep name and Form 8850 employer section) must be completed before the dashboard is available, so applicant forms are never blocked by missing business info.',
      '**Update notification** — Admins and managers see a one-time summary when a new version is deployed to production (this message).'
    ]
  }
}

/**
 * Simple semver-like sort: split by ., compare numbers, then strings.
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function compareVersions(a, b) {
  const pa = String(a).trim().split('.').map(n => (/^\d+$/.test(n) ? parseInt(n, 10) : n))
  const pb = String(b).trim().split('.').map(n => (/^\d+$/.test(n) ? parseInt(n, 10) : n))
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const va = pa[i] ?? 0
    const vb = pb[i] ?? 0
    if (va !== vb) return (va < vb) ? 1 : -1
  }
  return 0
}

/**
 * Get the manifest entry for a given app version (e.g. from VITE_APP_VERSION).
 * @param {string} version - Version string, e.g. "1.6.0"
 * @returns {{ version: string, date: string, title: string, summary: string[] } | null}
 */
export function getUpdateEntry(version) {
  if (!version || typeof version !== 'string') return null
  const key = version.trim()
  const entry = UPDATE_MANIFEST[key]
  if (!entry || (!entry.title && !entry.summary)) return null
  return { version: key, ...entry }
}

/**
 * Get all manifest entries as a version history (newest first).
 * Used when the app is opened for the first time so admins see full history.
 * @returns {{ version: string, date: string, title: string, summary: string[] }[]}
 */
export function getVersionHistory() {
  const keys = Object.keys(UPDATE_MANIFEST).filter(k => {
    const e = UPDATE_MANIFEST[k]
    return e && (e.title || e.summary)
  })
  keys.sort((a, b) => compareVersions(a, b))
  return keys.reverse().map(version => ({ version, ...UPDATE_MANIFEST[version] }))
}

/**
 * Get the latest version string in the manifest.
 * @returns {string | null}
 */
export function getLatestVersion() {
  const history = getVersionHistory()
  return history.length > 0 ? history[0].version : null
}
