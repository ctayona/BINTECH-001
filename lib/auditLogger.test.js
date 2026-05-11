/**
 * Unit Tests for Audit Logger
 * Tests audit log recording, filtering, and statistics
 */

const auditLogger = require('./auditLogger');
const fs = require('fs');
const path = require('path');

describe('Audit Logger', () => {
  
  // Clean up logs before and after tests
  beforeEach(() => {
    auditLogger.clearLogs();
  });
  
  afterAll(() => {
    auditLogger.clearLogs();
  });
  
  describe('Basic Logging', () => {
    test('record should log entry successfully', () => {
      const result = auditLogger.record({
        email: 'test@example.com',
        action: 'INITIATED',
        status: 'SUCCESS',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });
      
      expect(result).toBe(true);
    });
    
    test('record should reject invalid action', () => {
      const result = auditLogger.record({
        email: 'test@example.com',
        action: 'INVALID_ACTION',
        status: 'SUCCESS',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });
      
      expect(result).toBe(false);
    });
    
    test('record should reject invalid status', () => {
      const result = auditLogger.record({
        email: 'test@example.com',
        action: 'INITIATED',
        status: 'INVALID_STATUS',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });
      
      expect(result).toBe(false);
    });
    
    test('record should reject missing required fields', () => {
      const result = auditLogger.record({
        email: 'test@example.com',
        action: 'INITIATED'
        // Missing status
      });
      
      expect(result).toBe(false);
    });
  });
  
  describe('Convenience Methods', () => {
    test('recordOTPInitiation should log OTP initiation', () => {
      const result = auditLogger.recordOTPInitiation(
        'test@example.com',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      
      expect(result).toBe(true);
    });
    
    test('recordOTPSent should log OTP sent', () => {
      const result = auditLogger.recordOTPSent(
        'test@example.com',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      
      expect(result).toBe(true);
    });
    
    test('recordOTPVerification should log OTP verification', () => {
      const result = auditLogger.recordOTPVerification(
        'test@example.com',
        true,
        null,
        '192.168.1.1',
        'Mozilla/5.0'
      );
      
      expect(result).toBe(true);
    });
    
    test('recordOTPVerification should log failed verification', () => {
      const result = auditLogger.recordOTPVerification(
        'test@example.com',
        false,
        'Invalid OTP',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      
      expect(result).toBe(true);
    });
    
    test('recordPasswordReset should log password reset', () => {
      const result = auditLogger.recordPasswordReset(
        'test@example.com',
        true,
        null,
        '192.168.1.1',
        'Mozilla/5.0'
      );
      
      expect(result).toBe(true);
    });
    
    test('recordFailedAttempt should log failed attempt', () => {
      const result = auditLogger.recordFailedAttempt(
        'test@example.com',
        'Max attempts exceeded',
        '192.168.1.1',
        'Mozilla/5.0'
      );
      
      expect(result).toBe(true);
    });
  });
  
  describe('Log Reading', () => {
    test('readLogs should return empty array when no logs', () => {
      const logs = auditLogger.readLogs();
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBe(0);
    });
    
    test('readLogs should return logged entries', () => {
      auditLogger.recordOTPInitiation('test@example.com', '192.168.1.1', 'Mozilla/5.0');
      auditLogger.recordOTPSent('test@example.com', '192.168.1.1', 'Mozilla/5.0');
      
      const logs = auditLogger.readLogs();
      expect(logs.length).toBeGreaterThan(0);
    });
    
    test('readLogs should return entries in reverse chronological order', () => {
      auditLogger.recordOTPInitiation('test1@example.com', '192.168.1.1', 'Mozilla/5.0');
      auditLogger.recordOTPSent('test2@example.com', '192.168.1.1', 'Mozilla/5.0');
      
      const logs = auditLogger.readLogs();
      expect(logs[0].action).toBe('OTP_SENT');
      expect(logs[1].action).toBe('INITIATED');
    });
    
    test('readLogs should respect limit parameter', () => {
      for (let i = 0; i < 10; i++) {
        auditLogger.recordOTPInitiation(`test${i}@example.com`, '192.168.1.1', 'Mozilla/5.0');
      }
      
      const logs = auditLogger.readLogs(5);
      expect(logs.length).toBeLessThanOrEqual(5);
    });
  });
  
  describe('Log Filtering', () => {
    beforeEach(() => {
      auditLogger.recordOTPInitiation('user1@example.com', '192.168.1.1', 'Mozilla/5.0');
      auditLogger.recordOTPSent('user1@example.com', '192.168.1.1', 'Mozilla/5.0');
      auditLogger.recordOTPInitiation('user2@example.com', '192.168.1.2', 'Mozilla/5.0');
      auditLogger.recordOTPVerification('user1@example.com', false, 'Invalid OTP', '192.168.1.1', 'Mozilla/5.0');
    });
    
    test('filterByEmail should return entries for specific email', () => {
      const logs = auditLogger.filterByEmail('user1@example.com');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.every(log => log.email === 'user1@example.com')).toBe(true);
    });
    
    test('filterByEmail should normalize email to lowercase', () => {
      const logs = auditLogger.filterByEmail('USER1@EXAMPLE.COM');
      expect(logs.length).toBeGreaterThan(0);
    });
    
    test('filterByAction should return entries for specific action', () => {
      const logs = auditLogger.filterByAction('INITIATED');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.every(log => log.action === 'INITIATED')).toBe(true);
    });
    
    test('filterByStatus should return entries for specific status', () => {
      const logs = auditLogger.filterByStatus('SUCCESS');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.every(log => log.status === 'SUCCESS')).toBe(true);
    });
    
    test('filterByStatus should return failure entries', () => {
      const logs = auditLogger.filterByStatus('FAILURE');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.every(log => log.status === 'FAILURE')).toBe(true);
    });
  });
  
  describe('Statistics', () => {
    beforeEach(() => {
      auditLogger.recordOTPInitiation('user1@example.com', '192.168.1.1', 'Mozilla/5.0');
      auditLogger.recordOTPSent('user1@example.com', '192.168.1.1', 'Mozilla/5.0');
      auditLogger.recordOTPVerification('user1@example.com', true, null, '192.168.1.1', 'Mozilla/5.0');
      auditLogger.recordOTPInitiation('user2@example.com', '192.168.1.2', 'Mozilla/5.0');
      auditLogger.recordOTPVerification('user2@example.com', false, 'Invalid OTP', '192.168.1.2', 'Mozilla/5.0');
    });
    
    test('getStatistics should return statistics object', () => {
      const stats = auditLogger.getStatistics();
      expect(stats).toBeDefined();
      expect(stats.totalEntries).toBeGreaterThan(0);
    });
    
    test('getStatistics should count successes and failures', () => {
      const stats = auditLogger.getStatistics();
      expect(stats.successCount).toBeGreaterThan(0);
      expect(stats.failureCount).toBeGreaterThan(0);
    });
    
    test('getStatistics should count actions', () => {
      const stats = auditLogger.getStatistics();
      expect(stats.actionCounts).toBeDefined();
      expect(stats.actionCounts.INITIATED).toBeGreaterThan(0);
    });
    
    test('getStatistics should track unique emails', () => {
      const stats = auditLogger.getStatistics();
      expect(stats.uniqueEmailCount).toBeGreaterThan(0);
      expect(Array.isArray(stats.uniqueEmails)).toBe(true);
    });
    
    test('getStatistics should include recent failures', () => {
      const stats = auditLogger.getStatistics();
      expect(Array.isArray(stats.recentFailures)).toBe(true);
    });
  });
  
  describe('Log File Management', () => {
    test('getLogFilePath should return valid path', () => {
      const logPath = auditLogger.getLogFilePath();
      expect(typeof logPath).toBe('string');
      expect(logPath.length).toBeGreaterThan(0);
    });
    
    test('clearLogs should remove log file', () => {
      auditLogger.recordOTPInitiation('test@example.com', '192.168.1.1', 'Mozilla/5.0');
      
      let logs = auditLogger.readLogs();
      expect(logs.length).toBeGreaterThan(0);
      
      const result = auditLogger.clearLogs();
      expect(result).toBe(true);
      
      logs = auditLogger.readLogs();
      expect(logs.length).toBe(0);
    });
  });
  
  describe('Log Entry Format', () => {
    test('logged entry should contain all required fields', () => {
      auditLogger.record({
        email: 'test@example.com',
        action: 'INITIATED',
        status: 'SUCCESS',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });
      
      const logs = auditLogger.readLogs();
      expect(logs.length).toBeGreaterThan(0);
      
      const entry = logs[0];
      expect(entry.timestamp).toBeDefined();
      expect(entry.email).toBe('test@example.com');
      expect(entry.action).toBe('INITIATED');
      expect(entry.status).toBe('SUCCESS');
      expect(entry.ipAddress).toBe('192.168.1.1');
      expect(entry.userAgent).toBe('Mozilla/5.0');
    });
    
    test('logged entry should normalize email to lowercase', () => {
      auditLogger.record({
        email: 'TEST@EXAMPLE.COM',
        action: 'INITIATED',
        status: 'SUCCESS',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });
      
      const logs = auditLogger.readLogs();
      expect(logs[0].email).toBe('test@example.com');
    });
    
    test('logged entry should include failure reason when provided', () => {
      auditLogger.record({
        email: 'test@example.com',
        action: 'OTP_VERIFIED',
        status: 'FAILURE',
        failureReason: 'Invalid OTP code',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      });
      
      const logs = auditLogger.readLogs();
      expect(logs[0].failureReason).toBe('Invalid OTP code');
    });
  });
});
