// Shared admin page utilities:
// - session guard for admin-only pages
// - lightweight profile name/initials hydration in sidebar
(function initAdminShared() {
  function getUserFromSession() {
    try {
      return JSON.parse(sessionStorage.getItem('bintech_user') || 'null');
    } catch (_) {
      return null;
    }
  }

  function buildDisplayName(user) {
    return (
      user?.full_name ||
      [user?.first_name, user?.middle_name, user?.last_name].filter(Boolean).join(' ') ||
      user?.email ||
      'Administrator'
    );
  }

  function buildEmail(user) {
    return String(user?.email || '').trim() || 'No email available';
  }

  function buildInitials(user, fallbackName) {
    const first = user?.first_name || user?.First_Name || fallbackName?.split(' ')[0] || 'A';
    const last = user?.last_name || user?.Last_Name || fallbackName?.split(' ')[1] || '';
    return `${String(first).charAt(0)}${String(last).charAt(0)}`.toUpperCase() || 'A';
  }

  function isAdminRole(role) {
    const normalizedRole = String(role || '').trim().toLowerCase();
    return normalizedRole === 'admin' || normalizedRole === 'head';
  }

  function isHeadRole(role) {
    return String(role || '').trim().toLowerCase() === 'head';
  }

  function hydrateSidebarProfile(user) {
    const displayName = buildDisplayName(user);
    const initials = buildInitials(user, displayName);
    const email = buildEmail(user);
    const isHead = isHeadRole(user?.role);

    const nameTargets = document.querySelectorAll(
      '#admin-name, [data-admin-name], aside .text-white.text-sm.font-medium'
    );
    nameTargets.forEach((el) => {
      if (el) el.textContent = displayName;
    });

    const initialsTargets = document.querySelectorAll(
      '#admin-initials, [data-admin-initials], aside .w-8.h-8 span'
    );
    initialsTargets.forEach((el) => {
      if (el) el.textContent = initials;
    });

    const emailTargets = document.querySelectorAll(
      '#admin-email, [data-admin-email], aside p.text-xs'
    );
    emailTargets.forEach((el) => {
      if (el) el.textContent = email;
    });

    const accountLinks = document.querySelectorAll(
      'a[href="/admin/accounts"], a[href="/admin/account-management"], a[href="/admin/ADMIN_ACCOUNTS.html"]'
    );
    accountLinks.forEach((el) => {
      if (el) el.style.display = isHead ? '' : 'none';
    });
  }

  function isAccountManagementPath(pathname) {
    const normalized = String(pathname || '').toLowerCase();
    return (
      normalized === '/admin/accounts' ||
      normalized === '/admin/account-management' ||
      normalized === '/admin/admin_accounts.html'
    );
  }

  function protectAdminPage() {
    const user = getUserFromSession();
    const role = String(user?.role || '').toLowerCase();

    if (!user || !isAdminRole(role)) {
      sessionStorage.removeItem('bintech_user');
      sessionStorage.clear();
      localStorage.removeItem('user');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('bintech_user');
      window.location.href = '/';
      return false;
    }

    if (isAccountManagementPath(window.location.pathname) && !isHeadRole(role)) {
      window.location.href = '/admin/dashboard';
      return false;
    }

    hydrateSidebarProfile(user);
    return true;
  }

  function run() {
    // Expose for inline scripts that still call this name.
    window.protectAdminPage = protectAdminPage;
    
    // Run the protection check
    const isProtected = protectAdminPage();
    
    // Also initialize authHelpers for logout functionality if available
    if (typeof window.authHelpers !== 'undefined') {
      console.log('✓ authHelpers available for admin page');
    } else {
      console.warn('⚠️ authHelpers not available yet (auth.js may not have loaded)');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
