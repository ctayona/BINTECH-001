/**
 * Timestamp Utilities
 * Provides consistent timestamp formatting across all modules
 * Ensures consistent date/time handling throughout the application
 */

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} Date in YYYY-MM-DD format
 */
function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current time in HH:MM:SS format
 * @returns {string} Time in HH:MM:SS format (24-hour)
 */
function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Get both date and time as object
 * @returns {Object} { date: 'YYYY-MM-DD', time: 'HH:MM:SS' }
 */
function getCurrentTimestamp() {
  return {
    date: getCurrentDate(),
    time: getCurrentTime()
  };
}

/**
 * Validate date format MM/DD/YYYY
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid MM/DD/YYYY format
 */
function isValidMMDDYYYY(dateStr) {
  if (!dateStr) return false;
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  return regex.test(String(dateStr).trim());
}

/**
 * Validate time format HH:MM:SS
 * @param {string} timeStr - Time string to validate
 * @returns {boolean} True if valid HH:MM:SS format
 */
function isValidHHMMSS(timeStr) {
  if (!timeStr) return false;
  const regex = /^\d{2}:\d{2}:\d{2}$/;
  return regex.test(String(timeStr).trim());
}

/**
 * Validate date format YYYY-MM-DD
 * @param {string} dateStr - Date string to validate
 * @returns {boolean} True if valid YYYY-MM-DD format
 */
function isValidYYYYMMDD(dateStr) {
  if (!dateStr) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(String(dateStr).trim());
}

/**
 * Convert MM/DD/YYYY to YYYY-MM-DD
 * @param {string} dateStr - Date in MM/DD/YYYY format
 * @returns {string} Date in YYYY-MM-DD format, or original if invalid
 */
function convertMMDDYYYYtoYYYYMMDD(dateStr) {
  if (!dateStr) return getCurrentDate();
  
  dateStr = String(dateStr).trim();
  
  if (isValidMMDDYYYY(dateStr)) {
    const [m, d, y] = dateStr.split('/');
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  
  if (isValidYYYYMMDD(dateStr)) {
    return dateStr;
  }
  
  // Fallback to current date
  return getCurrentDate();
}

/**
 * Convert YYYY-MM-DD to MM/DD/YYYY
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Date in MM/DD/YYYY format, or original if invalid
 */
function convertYYYYMMDDtoMMDDYYYY(dateStr) {
  if (!dateStr) return '';
  
  dateStr = String(dateStr).trim();
  
  if (isValidYYYYMMDD(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    return `${m}/${d}/${y}`;
  }
  
  if (isValidMMDDYYYY(dateStr)) {
    return dateStr;
  }
  
  return '';
}

/**
 * Ensure time is in HH:MM:SS format, extracting from malformed strings
 * @param {string} timeStr - Time string (may be malformed)
 * @returns {string} Time in HH:MM:SS format or current time
 */
function sanitizeTime(timeStr) {
  if (!timeStr) return getCurrentTime();
  
  timeStr = String(timeStr).trim();
  
  if (isValidHHMMSS(timeStr)) {
    return timeStr;
  }
  
  // Try to extract HH:MM:SS pattern
  const match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1]}:${match[2]}:${match[3]}`;
  }
  
  // Fallback to current time
  return getCurrentTime();
}

/**
 * Ensure date is in YYYY-MM-DD format
 * @param {string} dateStr - Date string (any format)
 * @returns {string} Date in YYYY-MM-DD format or current date
 */
function sanitizeDate(dateStr) {
  if (!dateStr) return getCurrentDate();
  
  dateStr = String(dateStr).trim();
  
  if (isValidYYYYMMDD(dateStr)) {
    return dateStr;
  }
  
  if (isValidMMDDYYYY(dateStr)) {
    return convertMMDDYYYYtoYYYYMMDD(dateStr);
  }
  
  // Fallback to current date
  return getCurrentDate();
}

/**
 * Format YYYY-MM-DD to display format (MMM DD, YYYY)
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Formatted date string (e.g., "Apr 20, 2026")
 */
function formatDateForDisplay(dateStr) {
  if (!dateStr) return 'N/A';
  
  dateStr = sanitizeDate(String(dateStr).trim());
  
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/**
 * Format time for display (ensure HH:MM:SS)
 * @param {string} timeStr - Time string
 * @returns {string} Formatted time in HH:MM:SS format
 */
function formatTimeForDisplay(timeStr) {
  return sanitizeTime(timeStr);
}

/**
 * Get formatted date and time combined (for display)
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {string} timeStr - Time in HH:MM:SS format
 * @returns {string} Combined formatted string (e.g., "Apr 20, 2026 14:35:28")
 */
function formatDateTimeForDisplay(dateStr, timeStr) {
  return `${formatDateForDisplay(dateStr)} ${formatTimeForDisplay(timeStr)}`;
}

// Export all functions
module.exports = {
  getCurrentDate,
  getCurrentTime,
  getCurrentTimestamp,
  isValidMMDDYYYY,
  isValidHHMMSS,
  isValidYYYYMMDD,
  convertMMDDYYYYtoYYYYMMDD,
  convertYYYYMMDDtoMMDDYYYY,
  sanitizeTime,
  sanitizeDate,
  formatDateForDisplay,
  formatTimeForDisplay,
  formatDateTimeForDisplay
};
