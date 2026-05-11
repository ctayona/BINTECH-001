/**
 * BinTECH Maintenance Mode - Admin Bypass Helper
 * Adds user role header to all fetch requests for admin bypass during maintenance
 */

(function() {
  'use strict';

  // Store original fetch
  const originalFetch = window.fetch;

  // Override fetch to add user role header
  window.fetch = function(...args) {
    let [url, options = {}] = args;

    // Get user from session storage
    const userStr = sessionStorage.getItem('bintech_user') || sessionStorage.getItem('user');
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        
        // Add user role header if user is admin
        if (user.role === 'admin' || user.role === 'head') {
          options.headers = options.headers || {};
          
          // Handle different header formats
          if (options.headers instanceof Headers) {
            options.headers.set('X-User-Role', user.role);
          } else {
            options.headers['X-User-Role'] = user.role;
          }
          
          console.log('🔓 Admin bypass: Adding role header to request:', url);
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    // Call original fetch with modified options
    return originalFetch.apply(this, [url, options]);
  };

  console.log('✓ Maintenance bypass helper loaded');
})();
