/**
 * Utility functions for exporting data to various formats
 */

import { formatDateWithAppTimezone, getTodayInAppTimezone } from '../composables/useDateFormat.js'

/**
 * Convert data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {Array} columns - Column definitions with key and label
 * @returns {string} CSV formatted string
 */
export function toCSV(data, columns) {
  if (!data || data.length === 0) {
    return ''
  }

  // Build header row
  const headers = columns.map(col => escapeCSVValue(col.label))

  // Build data rows
  const rows = data.map(row => {
    return columns.map(col => {
      let value = getCellValue(row, col)

      // Format value if formatter provided
      if (col.format) {
        value = col.format(value, row)
      }

      // Handle dates (use app timezone so exported times match UI)
      if (col.type === 'date' && value) {
        value = formatDateWithAppTimezone(value)
      }

      return escapeCSVValue(value)
    })
  })

  // Combine header and rows
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

/**
 * Escape a value for CSV format
 * @param {*} value - Value to escape
 * @returns {string} Escaped value
 */
function escapeCSVValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Get cell value from row based on column config
 * @param {Object} row - Data row
 * @param {Object} column - Column definition
 * @returns {*} Cell value
 */
function getCellValue(row, column) {
  if (column.getValue) {
    return column.getValue(row)
  }

  // Support nested keys like 'user.name'
  const keys = column.key.split('.')
  let value = row
  for (const key of keys) {
    value = value?.[key]
  }
  return value
}

/**
 * Download data as a file
 * @param {string} content - File content
 * @param {string} filename - Name of the file to download
 * @param {string} mimeType - MIME type of the file
 */
export function downloadFile(content, filename, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the URL object
  URL.revokeObjectURL(url)
}

/**
 * Export data to CSV and trigger download
 * @param {Array} data - Data to export
 * @param {Array} columns - Column definitions
 * @param {string} filename - Name for the downloaded file (without extension)
 */
export function exportToCSV(data, columns, filename = 'export') {
  const csv = toCSV(data, columns)
  const timestamp = getTodayInAppTimezone()
  downloadFile(csv, `${filename}_${timestamp}.csv`, 'text/csv')
}

/**
 * Export data to JSON and trigger download
 * @param {Array} data - Data to export
 * @param {string} filename - Name for the downloaded file (without extension)
 */
export function exportToJSON(data, filename = 'export') {
  const json = JSON.stringify(data, null, 2)
  const timestamp = getTodayInAppTimezone()
  downloadFile(json, `${filename}_${timestamp}.json`, 'application/json')
}

/**
 * Format data for export based on column definitions
 * @param {Array} data - Raw data
 * @param {Array} columns - Column definitions
 * @returns {Array} Formatted data
 */
export function formatDataForExport(data, columns) {
  return data.map(row => {
    const formatted = {}
    columns.forEach(col => {
      let value = getCellValue(row, col)

      if (col.format) {
        value = col.format(value, row)
      }

      if (col.type === 'date' && value) {
        value = formatDateWithAppTimezone(value)
      }

      formatted[col.label] = value ?? ''
    })
    return formatted
  })
}

/**
 * Copy data to clipboard as tab-separated values (for pasting into spreadsheets)
 * @param {Array} data - Data to copy
 * @param {Array} columns - Column definitions
 * @returns {Promise<boolean>} Whether the copy was successful
 */
export async function copyToClipboard(data, columns) {
  if (!data || data.length === 0) {
    return false
  }

  try {
    // Build header row
    const headers = columns.map(col => col.label)

    // Build data rows
    const rows = data.map(row => {
      return columns.map(col => {
        let value = getCellValue(row, col)
        if (col.format) {
          value = col.format(value, row)
        }
        if (col.type === 'date' && value) {
          value = formatDateWithAppTimezone(value)
        }
        return value ?? ''
      })
    })

    // Combine with tab separators
    const content = [headers, ...rows].map(row => row.join('\t')).join('\n')

    await navigator.clipboard.writeText(content)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

