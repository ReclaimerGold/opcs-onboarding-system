// @ts-check
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default async () => {
  const backendDir = path.join(__dirname, '..', 'backend')
  execSync('node scripts/seed-signature-placements.js', {
    cwd: backendDir,
    stdio: 'inherit'
  })
  execSync('node scripts/seed-e2e-data.js', {
    cwd: backendDir,
    stdio: 'inherit'
  })
}
