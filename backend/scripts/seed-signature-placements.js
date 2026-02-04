/**
 * Seed signature placement settings for W-4, I-9, and Form 8850.
 * Used by E2E tests so the form wizard is available without admin setup.
 * Run from backend: node scripts/seed-signature-placements.js
 */
import path from 'path'
import { fileURLToPath } from 'url'
import { initializeDatabase, getDatabase } from '../src/database/init.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

initializeDatabase()
const db = getDatabase()

// Legacy single-placement format supported by getSignaturePlacements()
const placement = JSON.stringify({
  mode: 'free_place',
  pageIndex: 0,
  x: 72,
  y: 120,
  width: 180,
  height: 40
})

const run = (key) =>
  db.prepare(
    `INSERT INTO settings (key, value, is_encrypted, updated_at)
     VALUES (?, ?, 0, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`
  ).run(key, placement, placement)

run('signature_placement_W4')
run('signature_placement_I9')
run('signature_placement_8850')

db.close()
console.log('Seeded signature placements for W4, I9, 8850')
