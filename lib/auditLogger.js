/**
 * Audit Logger
 * Logs password recovery actions for security and compliance
 * Implements audit trail for all recovery operations
 */

const fs = require('fs');
const path = require('path');

// Audit log configuration
const AUDIT_CONFIG = {
  logDir: path.join(__dirname, '../logs'),
  logFile: 'password-recovery-audit.log',
  maxLogSize: 10 * 1024 * 1024, // 10MB
  maxBackupFiles: 5
};

// Ensure logs directory exists
function ensureLogDirectory() {
  try {
    if (!fs.existsSync(AUDIT_CONFIG.logDir)) {
      fs.mkdirSync(AUDIT_CONFIG.logDir, { recursive: true });
      console.log(`[Audit Logger] Created logs directory: ${AUDIT_CONFIG.logDir}`);
    }
  } catch (error) {
    console.error('[Audit Logger] Error creating logs directory:', error.message);
  }
}

// Initialize logs directory on module load
ensureLogDirectory();

/**
 * Get full path to audit log file
 * @returns {string} Full path to audit log file
 */
function getLogFilePath() {
  return path.join(AUDIT_CONFIG.logDir, AUDIT_CONFIG.logFile);
}

/**
 * Rotate log file if it exceeds max size
 */
function rotateLogIfNeeded() {
  try {
    const logPath = getLogFilePath();
    
    if (!fs.existsSync(logPath)) {
      return;
    }
    
    const stats = fs.statSync(logPath);
    
    if (stats.size > AUDIT_CONFIG.maxLogSize) {
      console.log('[Audit Logger] Log file size exceeded, rotating...');
      
      // Shift existing backup files
      for (let i = AUDIT_CONFIG.maxBackupFiles - 1; i > 0; i--) {
        const oldPath = `${logPath}.${i}`;
        const newPath = `${logPath}.${i + 1}`;
        
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
        }
      }
      
      // Rename current log to .1
      fs.renameSync(logPath, `${logPath}.1`);
      
      // Delete oldest backup if we have too many
      const oldestPath = `${logPath}.${AUDIT_CONFIG.maxBackupFiles + 1}`;
      if (fs.existsSync(oldestPath)) {
        fs.unlinkSync(oldestPath);
      }
      
      console.log('[Audit Logger] Log file rotated successfully');
    }
  } catch (error) {
    console.error('[Audit Logger] Error rotating log file:', error.message);
  }
}

/**
 * Format audit log entry
 * @param {object} logData - Log data object
 * @returns {string} Formatted log entry
 */
function formatLogEntry(logData) {
  const {
    timestamp,
    email,
    action,
    status,
    failureReason,
    ipAddress,
    userAgent,
    additionalInfo
  } = logData;
  
  const entry = {
    timestamp: timestamp || new Date().toISOString(),
    email: String(email).trim().toLowerCase(),
    action,
    status,
    failureReason: failureReason || null,
    ipAddress: ipAddress || 'UNKNOWN',
    userAgent: userAgent || 'UNKNOWN',
    additionalInfo: additionalInfo || null
  };
  
  return JSON.stringify(entry);
}

/**
 * Write log entry to file
 * @param {string} logEntry - Formatted log entry
 */
function writeLogEntry(logEntry) {
  try {
    rotateLogIfNeeded();
    
    const logPath = getLogFilePath();
    fs.appendFileSync(logPath, logEntry + '\n', 'utf8');
  } catch (error) {
    console.error('[Audit Logger] Error writing log entry:', error.message);
  }
}

/**
 * Record password recovery action
 * @param {object} logData - Log data object
 * @returns {boolean} True if logged successfully
 */
function record(logData) {
  try {
    const {
      email,
      action,
      status,
      failureReason,
      ipAddress,
      userAgent,
      additionalInfo
    } = logData;
    
    // Validate required fields
    if (!email || !action || !status) {
      console.warn('[Audit Logger] Missing required fields for audit log');
      return false;
    }
    
    // Validate action value
    const validActions = ['INITIATED', 'OTP_SENT', 'OTP_VERIFIED', 'PASSWORD_RESET', 'FAILED_ATTEMPT'];
    if (!validActions.includes(action)) {
      console.warn(`[Audit Logger] Invalid action: ${action}`);
      return false;
    }
    
    // Validate status value
    const validStatuses = ['SUCCESS', 'FAILURE'];
    if (!validStatuses.includes(status)) {
      console.warn(`[Audit Logger] Invalid status: ${status}`);
      return false;
    }
    
    const logEntry = formatLogEntry({
      timestamp: new Date().toISOString(),
      email,
      action,
      status,
      failureReason,
      ipAddress,
      userAgent,
      additionalInfo
    });
    
    writeLogEntry(logEntry);
    
    console.log(`[Audit Logger] Recorded: ${action} - ${status} for ${email}`);
    
    return true;
  } catch (error) {
    console.error('[Audit Logger] Error recording audit log:', error.message);
    return false;
  }
}

/**
 * Record OTP initiation
 * @param {string} email - User email
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {boolean} True if logged successfully
 */
function recordOTPInitiation(email, ipAddress, userAgent) {
  return record({
    email,
    action: 'INITIATED',
    status: 'SUCCESS',
    ipAddress,
    userAgent
  });
}

/**
 * Record OTP sent
 * @param {string} email - User email
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {boolean} True if logged successfully
 */
function recordOTPSent(email, ipAddress, userAgent) {
  return record({
    email,
    action: 'OTP_SENT',
    status: 'SUCCESS',
    ipAddress,
    userAgent
  });
}

/**
 * Record OTP verification attempt
 * @param {string} email - User email
 * @param {boolean} success - Whether verification was successful
 * @param {string} failureReason - Reason for failure (if applicable)
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {boolean} True if logged successfully
 */
function recordOTPVerification(email, success, failureReason, ipAddress, userAgent) {
  return record({
    email,
    action: 'OTP_VERIFIED',
    status: success ? 'SUCCESS' : 'FAILURE',
    failureReason: failureReason || null,
    ipAddress,
    userAgent
  });
}

/**
 * Record password reset attempt
 * @param {string} email - User email
 * @param {boolean} success - Whether reset was successful
 * @param {string} failureReason - Reason for failure (if applicable)
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {boolean} True if logged successfully
 */
function recordPasswordReset(email, success, failureReason, ipAddress, userAgent) {
  return record({
    email,
    action: 'PASSWORD_RESET',
    status: success ? 'SUCCESS' : 'FAILURE',
    failureReason: failureReason || null,
    ipAddress,
    userAgent
  });
}

/**
 * Record failed attempt
 * @param {string} email - User email
 * @param {string} failureReason - Reason for failure
 * @param {string} ipAddress - Client IP address
 * @param {string} userAgent - Client user agent
 * @returns {boolean} True if logged successfully
 */
function recordFailedAttempt(email, failureReason, ipAddress, userAgent) {
  return record({
    email,
    action: 'FAILED_ATTEMPT',
    status: 'FAILURE',
    failureReason,
    ipAddress,
    userAgent
  });
}

/**
 * Read audit logs from file
 * @param {number} limit - Maximum number of entries to return (default: 100)
 * @returns {array} Array of log entries
 */
function readLogs(limit = 100) {
  try {
    const logPath = getLogFilePath();
    
    if (!fs.existsSync(logPath)) {
      console.log('[Audit Logger] No audit log file found');
      return [];
    }
    
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.length > 0);
    
    // Return last N entries (most recent first)
    const entries = lines
      .slice(-limit)
      .reverse()
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (error) {
          console.warn('[Audit Logger] Error parsing log entry:', error.message);
          return null;
        }
      })
      .filter(entry => entry !== null);
    
    return entries;
  } catch (error) {
    console.error('[Audit Logger] Error reading audit logs:', error.message);
    return [];
  }
}

/**
 * Filter audit logs by email
 * @param {string} email - Email to filter by
 * @param {number} limit - Maximum number of entries to return
 * @returns {array} Array of filtered log entries
 */
function filterByEmail(email, limit = 100) {
  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const allLogs = readLogs(limit * 2); // Read more to ensure we get enough after filtering
    
    return allLogs
      .filter(entry => entry.email === normalizedEmail)
      .slice(0, limit);
  } catch (error) {
    console.error('[Audit Logger] Error filtering logs by email:', error.message);
    return [];
  }
}

/**
 * Filter audit logs by action
 * @param {string} action - Action to filter by
 * @param {number} limit - Maximum number of entries to return
 * @returns {array} Array of filtered log entries
 */
function filterByAction(action, limit = 100) {
  try {
    const allLogs = readLogs(limit * 2);
    
    return allLogs
      .filter(entry => entry.action === action)
      .slice(0, limit);
  } catch (error) {
    console.error('[Audit Logger] Error filtering logs by action:', error.message);
    return [];
  }
}

/**
 * Filter audit logs by status
 * @param {string} status - Status to filter by (SUCCESS or FAILURE)
 * @param {number} limit - Maximum number of entries to return
 * @returns {array} Array of filtered log entries
 */
function filterByStatus(status, limit = 100) {
  try {
    const allLogs = readLogs(limit * 2);
    
    return allLogs
      .filter(entry => entry.status === status)
      .slice(0, limit);
  } catch (error) {
    console.error('[Audit Logger] Error filtering logs by status:', error.message);
    return [];
  }
}

/**
 * Get audit log statistics
 * @returns {object} Statistics object
 */
function getStatistics() {
  try {
    const allLogs = readLogs(1000);
    
    const stats = {
      totalEntries: allLogs.length,
      successCount: 0,
      failureCount: 0,
      actionCounts: {},
      uniqueEmails: new Set(),
      recentFailures: []
    };
    
    allLogs.forEach(entry => {
      if (entry.status === 'SUCCESS') {
        stats.successCount++;
      } else {
        stats.failureCount++;
      }
      
      stats.actionCounts[entry.action] = (stats.actionCounts[entry.action] || 0) + 1;
      stats.uniqueEmails.add(entry.email);
      
      if (entry.status === 'FAILURE') {
        stats.recentFailures.push({
          email: entry.email,
          action: entry.action,
          reason: entry.failureReason,
          timestamp: entry.timestamp
        });
      }
    });
    
    stats.uniqueEmailCount = stats.uniqueEmails.size;
    stats.uniqueEmails = Array.from(stats.uniqueEmails);
    stats.recentFailures = stats.recentFailures.slice(0, 10);
    
    return stats;
  } catch (error) {
    console.error('[Audit Logger] Error getting statistics:', error.message);
    return null;
  }
}

/**
 * Clear audit logs (use with caution)
 * @returns {boolean} True if cleared successfully
 */
function clearLogs() {
  try {
    const logPath = getLogFilePath();
    
    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath);
      console.log('[Audit Logger] Audit logs cleared');
    }
    
    return true;
  } catch (error) {
    console.error('[Audit Logger] Error clearing audit logs:', error.message);
    return false;
  }
}

// Export all functions
module.exports = {
  record,
  recordOTPInitiation,
  recordOTPSent,
  recordOTPVerification,
  recordPasswordReset,
  recordFailedAttempt,
  readLogs,
  filterByEmail,
  filterByAction,
  filterByStatus,
  getStatistics,
  clearLogs,
  getLogFilePath,
  
  // Constants
  AUDIT_CONFIG
};
