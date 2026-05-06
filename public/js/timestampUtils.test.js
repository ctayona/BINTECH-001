/**
 * Tests for timestampUtils.js
 * Tests the timestamp formatting functionality
 */

// Mock window object for Node.js environment
if (typeof window === 'undefined') {
  global.window = {};
}

// Load the timestampUtils module
require('./timestampUtils.js');
const timestampUtils = global.window.timestampUtils;

describe('timestampUtils.formatDateForDisplay', () => {
  test('should format ISO timestamp with time to MM/DD/YYYY | hh:mm AM/PM format', () => {
    // Test with ISO format timestamp
    const result = timestampUtils.formatDateForDisplay('2026-04-30T14:45:30Z');
    // Verify format matches MM/DD/YYYY | hh:mm AM/PM
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \| \d{2}:\d{2} (AM|PM)$/);
  });

  test('should format date-only string to MM/DD/YYYY | hh:mm AM/PM format', () => {
    // Test with date-only format
    const result = timestampUtils.formatDateForDisplay('2026-04-30');
    // Verify format matches MM/DD/YYYY | hh:mm AM/PM
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \| \d{2}:\d{2} (AM|PM)$/);
    // Date should be 04/30/2026
    expect(result).toContain('04/30/2026');
  });

  test('should return "—" for null or undefined', () => {
    expect(timestampUtils.formatDateForDisplay(null)).toBe('—');
    expect(timestampUtils.formatDateForDisplay(undefined)).toBe('—');
    expect(timestampUtils.formatDateForDisplay('')).toBe('—');
  });

  test('should format timestamps with correct date and time structure', () => {
    // Test that the format is always MM/DD/YYYY | hh:mm AM/PM
    const result = timestampUtils.formatDateForDisplay('2026-04-30T14:45:30Z');
    const parts = result.split(' | ');
    expect(parts).toHaveLength(2);
    
    // Check date part: MM/DD/YYYY
    const dateParts = parts[0].split('/');
    expect(dateParts).toHaveLength(3);
    expect(dateParts[0]).toMatch(/^\d{2}$/); // MM
    expect(dateParts[1]).toMatch(/^\d{2}$/); // DD
    expect(dateParts[2]).toMatch(/^\d{4}$/); // YYYY
    
    // Check time part: hh:mm AM/PM
    expect(parts[1]).toMatch(/^\d{2}:\d{2} (AM|PM)$/);
  });

  test('should handle date-only format correctly', () => {
    // Date-only format should default to 12:00 AM (midnight)
    const result = timestampUtils.formatDateForDisplay('2026-04-30');
    expect(result).toContain('04/30/2026');
    expect(result).toMatch(/\| \d{2}:\d{2} (AM|PM)$/);
  });

  test('should pad single-digit months and days with zeros', () => {
    // January 5, 2026
    const result = timestampUtils.formatDateForDisplay('2026-01-05T14:30:00Z');
    // Should have leading zeros: 01/05/2026
    expect(result).toMatch(/^01\/05\/2026/);
  });

  test('should return "—" for invalid date strings', () => {
    expect(timestampUtils.formatDateForDisplay('invalid-date')).toBe('—');
    expect(timestampUtils.formatDateForDisplay('2026-13-45')).toBe('—');
  });

  test('should handle various valid ISO timestamps', () => {
    const timestamps = [
      '2026-04-30T00:00:00Z',
      '2026-04-30T12:00:00Z',
      '2026-04-30T23:59:59Z',
      '2026-01-01T08:30:00Z',
      '2026-12-31T16:45:00Z'
    ];
    
    timestamps.forEach(ts => {
      const result = timestampUtils.formatDateForDisplay(ts);
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4} \| \d{2}:\d{2} (AM|PM)$/);
    });
  });
});

describe('timestampUtils.isValidYYYYMMDD', () => {
  test('should validate YYYY-MM-DD format', () => {
    expect(timestampUtils.isValidYYYYMMDD('2026-04-30')).toBe(true);
    expect(timestampUtils.isValidYYYYMMDD('2026-01-01')).toBe(true);
    expect(timestampUtils.isValidYYYYMMDD('2026-12-31')).toBe(true);
  });

  test('should reject invalid YYYY-MM-DD format', () => {
    expect(timestampUtils.isValidYYYYMMDD('04-30-2026')).toBe(false);
    expect(timestampUtils.isValidYYYYMMDD('2026/04/30')).toBe(false);
    expect(timestampUtils.isValidYYYYMMDD('invalid')).toBe(false);
  });
});
