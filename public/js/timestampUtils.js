/**
 * Frontend Timestamp Utilities
 * Provides consistent timestamp formatting for all frontend pages
 * Works in browser environment (no Node.js)
 */

window.timestampUtils = {
  /**
   * Get current date in YYYY-MM-DD format
   * @returns {string} Date in YYYY-MM-DD format
   */
  getCurrentDate: function() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Get current time in HH:MM:SS format
   * @returns {string} Time in HH:MM:SS format (24-hour)
   */
  getCurrentTime: function() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  },

  /**
   * Get both date and time as object
   * @returns {Object} { date: 'YYYY-MM-DD', time: 'HH:MM:SS' }
   */
  getCurrentTimestamp: function() {
    return {
      date: this.getCurrentDate(),
      time: this.getCurrentTime()
    };
  },

  /**
   * Validate date format MM/DD/YYYY
   * @param {string} dateStr - Date string to validate
   * @returns {boolean} True if valid MM/DD/YYYY format
   */
  isValidMMDDYYYY: function(dateStr) {
    if (!dateStr) return false;
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    return regex.test(String(dateStr).trim());
  },

  /**
   * Validate time format HH:MM:SS
   * @param {string} timeStr - Time string to validate
   * @returns {boolean} True if valid HH:MM:SS format
   */
  isValidHHMMSS: function(timeStr) {
    if (!timeStr) return false;
    const regex = /^\d{2}:\d{2}:\d{2}$/;
    return regex.test(String(timeStr).trim());
  },

  /**
   * Validate date format YYYY-MM-DD
   * @param {string} dateStr - Date string to validate
   * @returns {boolean} True if valid YYYY-MM-DD format
   */
  isValidYYYYMMDD: function(dateStr) {
    if (!dateStr) return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(String(dateStr).trim());
  },

  /**
   * Convert MM/DD/YYYY to YYYY-MM-DD
   * @param {string} dateStr - Date in MM/DD/YYYY format
   * @returns {string} Date in YYYY-MM-DD format, or current date if invalid
   */
  convertMMDDYYYYtoYYYYMMDD: function(dateStr) {
    if (!dateStr) return this.getCurrentDate();
    
    dateStr = String(dateStr).trim();
    
    if (this.isValidMMDDYYYY(dateStr)) {
      const [m, d, y] = dateStr.split('/');
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    
    if (this.isValidYYYYMMDD(dateStr)) {
      return dateStr;
    }
    
    return this.getCurrentDate();
  },

  /**
   * Convert YYYY-MM-DD to MM/DD/YYYY
   * @param {string} dateStr - Date in YYYY-MM-DD format
   * @returns {string} Date in MM/DD/YYYY format, or empty string if invalid
   */
  convertYYYYMMDDtoMMDDYYYY: function(dateStr) {
    if (!dateStr) return '';
    
    dateStr = String(dateStr).trim();
    
    if (this.isValidYYYYMMDD(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      return `${m}/${d}/${y}`;
    }
    
    if (this.isValidMMDDYYYY(dateStr)) {
      return dateStr;
    }
    
    return '';
  },

  /**
   * Ensure time is in HH:MM:SS format, extracting from malformed strings
   * @param {string} timeStr - Time string (may be malformed)
   * @returns {string} Time in HH:MM:SS format or current time
   */
  sanitizeTime: function(timeStr) {
    if (!timeStr) return this.getCurrentTime();
    
    timeStr = String(timeStr).trim();
    
    if (this.isValidHHMMSS(timeStr)) {
      return timeStr;
    }
    
    // Try to extract HH:MM:SS pattern
    const match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      return `${match[1]}:${match[2]}:${match[3]}`;
    }
    
    return this.getCurrentTime();
  },

  /**
   * Ensure date is in YYYY-MM-DD format
   * @param {string} dateStr - Date string (any format)
   * @returns {string} Date in YYYY-MM-DD format or current date
   */
  sanitizeDate: function(dateStr) {
    if (!dateStr) return this.getCurrentDate();
    
    dateStr = String(dateStr).trim();
    
    if (this.isValidYYYYMMDD(dateStr)) {
      return dateStr;
    }
    
    if (this.isValidMMDDYYYY(dateStr)) {
      return this.convertMMDDYYYYtoYYYYMMDD(dateStr);
    }
    
    return this.getCurrentDate();
  },

  /**
   * Format ISO timestamp to display format (MM/DD/YYYY | hh:mm AM/PM)
   * @param {string} timestamp - ISO timestamp string (e.g., "2026-04-30T14:45:30Z" or "2026-04-30")
   * @returns {string} Formatted timestamp string (e.g., "04/30/2026 | 02:45 PM")
   */
  formatDateForDisplay: function(timestamp) {
    if (!timestamp) return '—';
    
    try {
      // Parse the timestamp - handle both ISO format and date-only format
      let date;
      const timestampStr = String(timestamp).trim();
      
      if (timestampStr.includes('T')) {
        // ISO format with time (e.g., "2026-04-30T14:45:30Z")
        date = new Date(timestampStr);
      } else if (this.isValidYYYYMMDD(timestampStr)) {
        // Date-only format (e.g., "2026-04-30")
        date = new Date(timestampStr + 'T00:00:00Z');
      } else {
        return '—';
      }
      
      if (Number.isNaN(date.getTime())) return '—';
      
      // Format: MM/DD/YYYY | hh:mm AM/PM
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      const hoursStr = String(hours).padStart(2, '0');
      
      return `${month}/${day}/${year} | ${hoursStr}:${minutes} ${ampm}`;
    } catch {
      return '—';
    }
  },

  /**
   * Format time for display (ensure HH:MM:SS)
   * @param {string} timeStr - Time string
   * @returns {string} Formatted time in HH:MM:SS format
   */
  formatTimeForDisplay: function(timeStr) {
    return this.sanitizeTime(timeStr);
  },

  /**
   * Get formatted date and time combined (for display)
   * @param {string} dateStr - Date in YYYY-MM-DD format
   * @param {string} timeStr - Time in HH:MM:SS format
   * @returns {string} Combined formatted string (e.g., "Apr 20, 2026 14:35:28")
   */
  formatDateTimeForDisplay: function(dateStr, timeStr) {
    return `${this.formatDateForDisplay(dateStr)} ${this.formatTimeForDisplay(timeStr)}`;
  }
};
