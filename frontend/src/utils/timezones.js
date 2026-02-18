/**
 * IANA timezone options for display/timezone selector.
 * Empty string = use browser's local timezone.
 */
export const TIMEZONE_OPTIONS = [
  { value: '', label: 'Browser default (local time)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern (America/New_York)' },
  { value: 'America/Chicago', label: 'Central (America/Chicago)' },
  { value: 'America/Denver', label: 'Mountain (America/Denver)' },
  { value: 'America/Phoenix', label: 'Arizona (America/Phoenix)' },
  { value: 'America/Los_Angeles', label: 'Pacific (America/Los_Angeles)' },
  { value: 'America/Anchorage', label: 'Alaska (America/Anchorage)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (Pacific/Honolulu)' },
  { value: 'America/Boise', label: 'Mountain - Idaho (America/Boise)' },
  { value: 'America/Detroit', label: 'Eastern - Michigan (America/Detroit)' },
  { value: 'America/Indiana/Indianapolis', label: 'Eastern - Indiana (America/Indiana/Indianapolis)' },
  { value: 'America/North_Dakota/Center', label: 'Central - North Dakota (America/North_Dakota/Center)' },
  { value: 'America/Shiprock', label: 'Mountain - Navajo (America/Shiprock)' }
]
