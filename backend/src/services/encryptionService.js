import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDatabase } from '../database/init.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16

let cachedEncryptionKey = null

/**
 * Get or create encryption key (stored in database for persistence)
 * Lazy-loaded to avoid database access before initialization
 */
function getEncryptionKey() {
  // Return cached key if available
  if (cachedEncryptionKey) {
    return cachedEncryptionKey
  }
  
  // First check environment variable
  if (process.env.ENCRYPTION_KEY) {
    cachedEncryptionKey = process.env.ENCRYPTION_KEY
    return cachedEncryptionKey
  }
  
  // Otherwise, get or create from database
  try {
    const db = getDatabase()
    let keyRecord = db.prepare('SELECT value FROM settings WHERE key = ?').get('encryption_key')
    
    if (!keyRecord) {
      // Generate new key and store it
      const newKey = crypto.randomBytes(32).toString('hex')
      db.prepare(`
        INSERT INTO settings (key, value, is_encrypted)
        VALUES (?, ?, 0)
      `).run('encryption_key', newKey)
      cachedEncryptionKey = newKey
      return newKey
    }
    
    cachedEncryptionKey = keyRecord.value
    return keyRecord.value
  } catch (error) {
    // Database not initialized yet, generate temporary key
    // This will be replaced with a persistent key once DB is initialized
    console.warn('Database not initialized, using temporary encryption key. This will cause decryption issues if server restarts.')
    cachedEncryptionKey = crypto.randomBytes(32).toString('hex')
    return cachedEncryptionKey
  }
}

/**
 * Derive encryption key from master key
 */
function deriveKey(masterKey, salt) {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha512')
}

/**
 * Encrypt text data
 */
export function encryptText(text) {
  if (!text) return null
  
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = deriveKey(getEncryptionKey(), salt)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const tag = cipher.getAuthTag()
  
  // Return: salt:iv:tag:encrypted
  return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt text data
 */
export function decryptText(encryptedData) {
  if (!encryptedData) return null
  
  const parts = encryptedData.split(':')
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format')
  }
  
  const [saltHex, ivHex, tagHex, encrypted] = parts
  const salt = Buffer.from(saltHex, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const key = deriveKey(getEncryptionKey(), salt)
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Encrypt buffer in memory (returns encrypted buffer)
 * @param {Buffer} buffer - Buffer to encrypt
 * @returns {Buffer} Encrypted buffer (salt + iv + tag + encrypted data)
 */
export function encryptBuffer(buffer) {
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = deriveKey(getEncryptionKey(), salt)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final()
  ])
  
  const tag = cipher.getAuthTag()
  
  // Return: salt + iv + tag + encrypted data
  return Buffer.concat([
    salt,
    iv,
    tag,
    encrypted
  ])
}

/**
 * Encrypt file buffer (saves to disk - legacy function)
 */
export async function encryptFile(buffer, outputPath) {
  const encrypted = encryptBuffer(buffer)
  
  // Ensure directory exists
  const dir = path.dirname(outputPath)
  await fs.mkdir(dir, { recursive: true })
  
  await fs.writeFile(outputPath, encrypted)
  return outputPath
}

/**
 * Decrypt buffer in memory
 * @param {Buffer} encryptedBuffer - Encrypted buffer (salt + iv + tag + encrypted data)
 * @returns {Buffer} Decrypted buffer
 */
export function decryptBuffer(encryptedBuffer) {
  const salt = encryptedBuffer.slice(0, SALT_LENGTH)
  const iv = encryptedBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const tag = encryptedBuffer.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
  const encryptedData = encryptedBuffer.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
  
  const key = deriveKey(getEncryptionKey(), salt)
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  
  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final()
  ])
  
  return decrypted
}

/**
 * Decrypt file (legacy function)
 */
export async function decryptFile(encryptedPath) {
  const encrypted = await fs.readFile(encryptedPath)
  return decryptBuffer(encrypted)
}

/**
 * Securely delete file (overwrite before deletion)
 */
export async function secureDelete(filePath) {
  try {
    // Overwrite with random data multiple times
    const stats = await fs.stat(filePath)
    const randomData = crypto.randomBytes(stats.size)
    
    for (let i = 0; i < 3; i++) {
      await fs.writeFile(filePath, randomData)
    }
    
    // Delete the file
    await fs.unlink(filePath)
    return true
  } catch (error) {
    console.error('Secure delete failed:', error)
    // Fallback to regular delete
    try {
      await fs.unlink(filePath)
    } catch (e) {
      // File may not exist
    }
    return false
  }
}

