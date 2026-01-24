import { describe, it, expect, beforeEach } from 'vitest'
import { initializeDatabase, getDatabase } from '../init.js'

describe('Database Initialization', () => {
  beforeEach(() => {
    initializeDatabase()
  })

  it('should create applicants table', () => {
    const db = getDatabase()
    const tableInfo = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='applicants'
    `).get()
    
    expect(tableInfo).toBeDefined()
    expect(tableInfo.name).toBe('applicants')
  })

  it('should create form_submissions table', () => {
    const db = getDatabase()
    const tableInfo = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='form_submissions'
    `).get()
    
    expect(tableInfo).toBeDefined()
    expect(tableInfo.name).toBe('form_submissions')
  })

  it('should create audit_log table', () => {
    const db = getDatabase()
    const tableInfo = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='audit_log'
    `).get()
    
    expect(tableInfo).toBeDefined()
    expect(tableInfo.name).toBe('audit_log')
  })

  it('should NOT have SSN fields in applicants table', () => {
    const db = getDatabase()
    const columns = db.prepare(`
      PRAGMA table_info(applicants)
    `).all()
    
    const columnNames = columns.map(col => col.name)
    expect(columnNames).not.toContain('ssn')
    expect(columnNames).not.toContain('social_security_number')
  })

  it('should have proper indexes', () => {
    const db = getDatabase()
    const indexes = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name LIKE 'idx_%'
    `).all()
    
    const indexNames = indexes.map(idx => idx.name)
    expect(indexNames.length).toBeGreaterThan(0)
    expect(indexNames).toContain('idx_applicants_email')
  })
})

