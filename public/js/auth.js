/**
 * BinTECH Authentication Handler
 * Handles login, signup, and session storage
 */

// ============================================
// Toast Notification System
// ============================================
function createToastContainer() {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, type = 'info', duration = 3000) {
  const container = createToastContainer();
  const toast = document.createElement('div');
  
  const styles = {
    success: {
      bg: '#10b981',
      icon: '✓'
    },
    error: {
      bg: '#ef4444',
      icon: '✕'
    },
    info: {
      bg: '#3b82f6',
      icon: 'ℹ'
    }
  };
  
  const style = styles[type] || styles.info;
  
  toast.style.cssText = `
    padding: 14px 20px;
    background-color: ${style.bg};
    color: white;
    border-radius: 8px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    animation: slideUp 0.4s ease-out;
    pointer-events: auto;
    font-family: 'Poppins', sans-serif;
  `;
  
  toast.innerHTML = `<span style="font-size: 18px; font-weight: bold;">${style.icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.4s ease-in';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, duration);
}

function showSuccess(message) {
  showToast(message, 'success', 3000);
}

function showError(message) {
  showToast(message, 'error', 4000);
}

function showInfo(message) {
  showToast(message, 'info', 3000);
}

// ============================================
// Add CSS for animations
// ============================================
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      transform: translateY(100px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(style);

// Store user in session storage
class AuthManager {
  static setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isAdmin', String(String(user?.role || '').toLowerCase() === 'admin' || String(user?.role || '').toLowerCase() === 'head'));
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('bintech_user', JSON.stringify(user));
  }

  static getUser() {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  static logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('bintech_user');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('bintech_user');
  }
}

// ============================================
// User Account Display Functions
// ============================================

// Update account information in the page
function updateAccountDisplay() {
  const user = AuthManager.getUser();
  
  if (!user) return;

  // Get user initials for avatar
  const initials = (user.First_Name?.charAt(0) || user.full_name?.charAt(0) || 'U') +
                   (user.Last_Name?.charAt(0) || user.full_name?.split(' ')[1]?.charAt(0) || '');

  // Update all elements with id or class matching account-related patterns
  
  // Update user name display
  document.querySelectorAll('[data-user-name]').forEach(el => {
    el.textContent = user.full_name || user.email || 'User';
  });

  document.querySelectorAll('[data-user-email]').forEach(el => {
    el.textContent = user.email || '';
  });

  document.querySelectorAll('[data-user-first-name]').forEach(el => {
    el.textContent = user.First_Name || user.full_name?.split(' ')[0] || '';
  });

  document.querySelectorAll('[data-user-initials]').forEach(el => {
    el.textContent = initials.toUpperCase();
  });

  document.querySelectorAll('[data-user-role]').forEach(el => {
    el.textContent = String(user.role || '').toLowerCase() === 'admin' || String(user.role || '').toLowerCase() === 'head' ? 'Administrator' : 'User';
  });

  // Update avatar circles with initials
  document.querySelectorAll('[data-avatar-initials]').forEach(el => {
    el.textContent = initials.toUpperCase();
  });

  // Update profile picture initial
  document.querySelectorAll('.user-avatar, [class*="avatar"]').forEach(el => {
    if (!el.querySelector('img')) {
      const span = el.querySelector('span');
      if (span) span.textContent = initials.toUpperCase();
    }
  });
}

// Show/hide elements based on login status
function updateAuthUI() {
  const user = AuthManager.getUser();
  
  // Show/hide login/signup buttons
  document.querySelectorAll('[data-show-if-logged-in]').forEach(el => {
    el.style.display = user ? 'block' : 'none';
  });

  document.querySelectorAll('[data-show-if-logged-out]').forEach(el => {
    el.style.display = user ? 'none' : 'block';
  });

  // Update account section with user details
  if (user) {
    updateAccountDisplay();
  }
}

// Initialize account info on page load
function initializeUserDisplay() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      updateAuthUI();
    });
  } else {
    updateAuthUI();
  }
}

// Call on every page load
initializeUserDisplay();

// ============================================
// Shared Mobile Navigation Enhancer
// ============================================
function initializeMobileNavigation() {
  const sidebar = document.querySelector('aside');
  const main = document.querySelector('main');

  // Only apply to sidebar-based layouts.
  if (!sidebar || !main) return;

  if (!document.getElementById('bintech-mobile-nav-style')) {
    const navStyle = document.createElement('style');
    navStyle.id = 'bintech-mobile-nav-style';
    navStyle.textContent = `
      .bintech-mobile-nav-toggle {
        position: fixed;
        top: 12px;
        left: 12px;
        z-index: 91;
        width: 42px;
        height: 42px;
        border-radius: 10px;
        border: 1px solid rgba(0,0,0,0.08);
        background: #ffffff;
        box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        display: none;
        align-items: center;
        justify-content: center;
      }
      .bintech-mobile-nav-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.45);
        z-index: 89;
        display: none;
      }
      @media (max-width: 1024px) {
        body.bintech-mobile-nav-ready {
          overflow-x: hidden;
        }
        body.bintech-mobile-nav-ready aside {
          position: fixed !important;
          left: 0;
          top: 0;
          bottom: 0;
          width: 16rem;
          max-width: 85vw;
          z-index: 90;
          transform: translateX(-105%);
          transition: transform 220ms ease;
        }
        body.bintech-mobile-nav-ready.bintech-mobile-nav-open aside {
          transform: translateX(0);
        }
        body.bintech-mobile-nav-ready main {
          width: 100%;
          padding-top: 3.75rem;
        }
        body.bintech-mobile-nav-ready .bintech-mobile-nav-toggle {
          display: inline-flex;
        }
        body.bintech-mobile-nav-ready.bintech-mobile-nav-open .bintech-mobile-nav-overlay {
          display: block;
        }
      }
      @media (min-width: 1025px) {
        .bintech-mobile-nav-toggle,
        .bintech-mobile-nav-overlay {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(navStyle);
  }

  if (document.querySelector('.bintech-mobile-nav-toggle')) {
    return;
  }

  document.body.classList.add('bintech-mobile-nav-ready');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'bintech-mobile-nav-toggle';
  toggle.setAttribute('aria-label', 'Open navigation menu');
  toggle.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>';

  const overlay = document.createElement('div');
  overlay.className = 'bintech-mobile-nav-overlay';

  const closeMenu = () => {
    document.body.classList.remove('bintech-mobile-nav-open');
  };

  const openMenu = () => {
    document.body.classList.add('bintech-mobile-nav-open');
  };

  toggle.addEventListener('click', () => {
    if (document.body.classList.contains('bintech-mobile-nav-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  overlay.addEventListener('click', closeMenu);

  sidebar.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        closeMenu();
      }
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      closeMenu();
    }
  });

  document.body.appendChild(toggle);
  document.body.appendChild(overlay);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeMobileNavigation);
} else {
  initializeMobileNavigation();
}

// ============================================
// Email Classification Function
// ============================================
function classifyEmailRole(emailInput) {
  const email = emailInput.value.toLowerCase().trim();
  const form = emailInput.closest('form');
  const roleSelect = form.querySelector('.signup-role');
  const roleHint = form.querySelector('.role-hint');
  const lockedBadge = form.querySelector('#role-locked-badge');
  let classifiedRole = '';
  let hint = '';
  let isLocked = false;

  if (!email) {
    hint = 'Enter your email to auto-classify your role';
    if (roleSelect) {
      roleSelect.value = '';
      roleSelect.disabled = false;
    }
    if (roleHint) roleHint.textContent = hint;
    if (lockedBadge) lockedBadge.style.display = 'none';
    return;
  }

  // Check if email has numbers with k or a prefix (Student pattern like k12158353 or a12158353)
  if (/[.](k|a)\d+@/i.test(email)) {
    classifiedRole = 'student';
    hint = '✓ Detected as Student (ID number detected - Role is LOCKED)';
    isLocked = true;
  }
  // Check if email is from umak.edu.ph but NOT a student (no k/a pattern)
  else if (/@umak\.edu\.ph$/i.test(email) && !/[.](k|a)\d+@/i.test(email)) {
    classifiedRole = 'faculty';
    hint = '✓ Detected as Faculty (@umak.edu.ph - Role is LOCKED)';
    isLocked = true;
  }
  // Default to Staff/Others
  else {
    classifiedRole = 'staff';
    hint = '✓ Classified as Staff/Others (you can change this)';
    isLocked = false;
  }

  // Update dropdown value and lock status
  if (roleSelect) {
    roleSelect.value = classifiedRole;
    if (isLocked) {
      roleSelect.disabled = true;
      roleSelect.classList.add('opacity-50');
      if (lockedBadge) {
        lockedBadge.style.display = 'inline-block';
      }
    } else {
      roleSelect.disabled = false;
      roleSelect.classList.remove('opacity-50');
      if (lockedBadge) {
        lockedBadge.style.display = 'none';
      }
    }
  }
  if (roleHint) {
    roleHint.textContent = hint;
  }
  
  // Store the locked state so we can prevent changes
  emailInput.dataset.roleIsLocked = isLocked;
}

// ============================================
// Traditional Login Handler - Supports Email/Campus ID
// ============================================
async function handleLogin(event) {
  event.preventDefault();

  try {
    const form = event.target;
    // Use ID selectors instead of class selectors
    const emailInput = document.getElementById('login-email') || form.querySelector('#login-email') || form.querySelector('.login-input');
    const passwordInput = document.getElementById('login-password') || form.querySelector('#login-password') || form.querySelector('input[type="password"]');
    
    if (!emailInput || !passwordInput) {
      showError('Form fields not found. Please refresh and try again.');
      console.error('Login form fields not found', { emailInput, passwordInput });
      return;
    }
    
    const emailOrCampusId = emailInput.value.trim();
    const password = passwordInput.value;

    // Validate
    if (!emailOrCampusId || !password) {
      showError('Please fill in all fields');
      return;
    }

    // Determine if input is campus_id or email
    // Campus ID format: k12345678 or a12345678
    const isCampusId = /^[ka]\d+$/i.test(emailOrCampusId);
    
    // Show loading state
    const button = form.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    button.textContent = 'Logging in...';
    button.disabled = true;

    showInfo('Logging in...');

    console.log(`Login attempt - Input: ${emailOrCampusId}, Is Campus ID: ${isCampusId}`);

    // Send to backend
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: isCampusId ? undefined : emailOrCampusId,
        campusId: isCampusId ? emailOrCampusId : undefined,
        password,
        loginType: isCampusId ? 'campus_id' : 'email'
      })
    });

    const data = await res.json();

    if (data.success) {
      // Store user
      AuthManager.setUser(data.user);

      localStorage.setItem('isAdmin', String(Boolean(data.isAdmin)));

      // Show success
      button.textContent = '✓ Success!';
      button.classList.add('bg-green-500');
      
      showSuccess('Login successful! Welcome back! ✓');

      // Redirect based on role - Admin to admin dashboard
      const redirectUrl = data.isAdmin ? '/admin/dashboard' : '/dashboard';
      
      console.log(`Login successful, redirecting to: ${redirectUrl}`);
      
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);
    } else {
      throw new Error(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('Login failed: ' + error.message);
    
    const button = event.target.querySelector('button[type="submit"]');
    const originalText = button.getAttribute('data-original-text') || 'Login';
    button.textContent = originalText;
    button.classList.remove('bg-red-500');
    button.disabled = false;
  }
}

// ============================================
// Traditional Signup Handler - Updated for New Form
// ============================================
async function handleSignup(event) {
  event.preventDefault();

  try {
    const form = event.target;
    
    // Get form values - use more reliable selectors
    const firstNameInput = form.querySelector('input[placeholder="First name"]');
    const middleNameInput = form.querySelector('input[placeholder="Middle name (optional)"]');
    const lastNameInput = form.querySelector('input[placeholder="Last name"]');
    const emailInput = form.querySelector('.signup-email');
    const roleSelect = form.querySelector('.signup-role');
    const passwordInputs = form.querySelectorAll('input[type="password"]');
    const termsCheckbox = form.querySelector('input[type="checkbox"]');
    
    // Validate all fields exist
    if (!firstNameInput || !lastNameInput || !emailInput || !roleSelect || passwordInputs.length < 2 || !termsCheckbox) {
      console.error('Form fields not found:', {
        firstNameInput: !!firstNameInput,
        lastNameInput: !!lastNameInput,
        emailInput: !!emailInput,
        roleSelect: !!roleSelect,
        passwordInputs: passwordInputs.length,
        termsCheckbox: !!termsCheckbox
      });
      showError('Form Error: Please refresh the page and try again.');
      return;
    }
    
    // Get form values
    const firstName = firstNameInput.value.trim();
    const middleName = middleNameInput ? middleNameInput.value.trim() : '';
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim();
    const role = roleSelect.value;
    const password = passwordInputs[0].value;
    const confirmPassword = passwordInputs[1].value;

    // Validate required fields
    if (!firstName || !lastName || !email || !role || !password || !confirmPassword) {
      showError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    if (!termsCheckbox.checked) {
      showError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    // Validate password strength (8+ chars, uppercase, number, special char)
    const passwordValidation = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    if (!Object.values(passwordValidation).every(v => v)) {
      showError('Password must contain:\n• At least 8 characters\n• One uppercase letter (A-Z)\n• One number (0-9)\n• One special character (!@#$%^&*)');
      return;
    }

    // Show loading state
    const button = form.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    button.textContent = 'Creating Account...';
    button.disabled = true;

    showInfo('Creating your account...');

    // Log the request for debugging
    console.log('Signup Request:', {
      email,
      firstName,
      middleName,
      lastName,
      role,
      'role-value-type': typeof role,
      'role-is-empty': role === '',
      'role-is-null': role === null
    });

    const signupBody = {
      email,
      password,
      firstName,
      middleName,
      lastName,
      role
    };

    console.log('✓ Basic signup body created:', {
      email, firstName, lastName, role,
      'role-check': `role="${role}" (type: ${typeof role})`
    });

    console.log('ℹ Manual signup');
    console.log('  Final signup body:', signupBody);

    // Send to backend
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(signupBody)
    });

    console.log('Response Status:', res.status, res.statusText);

    const data = await res.json();
    console.log('Response Data:', data);

    if (data.success) {
      // Show success
      button.textContent = '✓ Account Created!';
      button.classList.add('bg-green-500');

      // Store user data
      AuthManager.setUser(data.user);
      console.log('User stored in session:', data.user);

      showSuccess('Account created successfully! ✓ Welcome to BinTECH!');

      // Redirect to dashboard after 1 second
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } else {
      // Backend returned an error response
      const errorMessage = data.message || data.error || 'Signup failed';
      console.error('Backend error response:', data);
      console.error('Full response:', JSON.stringify(data, null, 2));
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Signup error:', error);
    console.error('Error stack:', error.stack);
    showError('Signup failed: ' + (error.message || 'Unknown error'));
    
    const button = event.target.querySelector('button[type="submit"]');
    const originalText = button.getAttribute('data-original-text') || 'Create Account';
    button.textContent = originalText;
    button.classList.remove('bg-red-500');
    button.disabled = false;
  }
}

// ============================================
// Navigation Handler (Already in template)
// ============================================
function navigateTo(page) {
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.remove('active'));
  
  const targetPage = document.getElementById(`${page}-page`);
  if (targetPage) {
    targetPage.classList.add('active');
  }
}

// ============================================
// Global Logout Handler
// ============================================
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    AuthManager.logout();
    window.location.href = '/';
  }
}

// ============================================
// Google OAuth Handler
// ============================================

// Get Google Client ID from window or env
const GOOGLE_CLIENT_ID = window.GOOGLE_CLIENT_ID || '1081673977933-hbcfruoe6kqm1ejq27jvhkt25an8iaa5.apps.googleusercontent.com';

let googleInitRetries = 0;
let googleInitTimerId = null;

console.log('[Google Auth] Client ID:', GOOGLE_CLIENT_ID.substring(0, 20) + '...');

// Handle Google Sign-In response (for LOGIN page only)
async function handleGoogleSignIn(response) {
  try {
    console.log('[Google Auth] Sign-in response received');
    
    if (!response.credential) {
      console.error('❌ No credential in Google response');
      showError('Google sign-in failed: No credential received');
      return;
    }

    const token = response.credential;
    console.log('[Google Auth] Token received, length:', token.length);

    showInfo('Processing Google sign-in...');

    // Send token to backend
    console.log('[Google Auth] Sending token to /auth/google-login');
    const res = await fetch('/auth/google-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    console.log('[Google Auth] Backend response status:', res.status);
    const data = await res.json();
    console.log('[Google Auth] Backend response:', data);

    if (!data.success) {
      throw new Error(data.message || 'Google login failed');
    }

    // Store user data
    console.log('[Google Auth] Login successful, storing user:', data.user);
    AuthManager.setUser(data.user);
    localStorage.setItem('isAdmin', String(false)); // Google users are regular users
    localStorage.setItem('google_authenticated', 'true');

    showSuccess('✓ Logged in with Google! Redirecting...');

    // Redirect after 1 second
    setTimeout(() => {
      console.log('[Google Auth] Redirecting to /dashboard');
      window.location.href = '/dashboard';
    }, 1000);

  } catch (error) {
    console.error('❌ Google sign-in error:', error);
    showError('Google sign-in failed: ' + error.message);
  }
}

// Handle Google Sign-Up response (for SIGNUP modal - auto-fill form only)
async function handleGoogleSignUp(response) {
  try {
    console.log('[Google Auth] Google sign-up auto-fill triggered');
    
    if (!response.credential) {
      console.error('❌ No credential in Google response');
      showError('Google sign-up failed: No credential received');
      return;
    }

    const token = response.credential;
    console.log('[Google Auth] Token received, length:', token.length);

    // Decode token to extract user info (same as backend does)
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const googleData = JSON.parse(jsonPayload);

      const { email, name, picture } = googleData;
      console.log('[Google Auth Signup] Extracted data:', { email, name, picture: picture ? 'present' : 'none' });

      // Parse name
      const nameParts = name ? name.split(' ') : ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

      console.log('[Google Auth Signup] Parsed name:', { firstName, middleName, lastName });

      // Auto-fill the signup form
      const signupForm = document.querySelector('form[onsubmit*="handleSignup"]');
      if (!signupForm) {
        console.error('❌ Signup form not found');
        showError('Signup form not found. Please make sure you are on the signup page.');
        return;
      }

      console.log('[Google Auth Signup] Auto-filling signup form...');

      // Fill in the form fields
      const firstNameInput = signupForm.querySelector('input[placeholder*="First name"]');
      const middleNameInput = signupForm.querySelector('input[placeholder*="Middle name"]');
      const lastNameInput = signupForm.querySelector('input[placeholder*="Last name"]');
      const emailInput = signupForm.querySelector('.signup-email');

      if (firstNameInput) {
        firstNameInput.value = firstName;
        console.log(`  ✓ First Name: ${firstName}`);
      }
      if (middleNameInput) {
        middleNameInput.value = middleName;
        console.log(`  ✓ Middle Name: ${middleName}`);
      }
      if (lastNameInput) {
        lastNameInput.value = lastName;
        console.log(`  ✓ Last Name: ${lastName}`);
      }
      if (emailInput) {
        emailInput.value = email;
        emailInput.dispatchEvent(new Event('input'));  // Trigger role classification
        emailInput.dispatchEvent(new Event('change'));
        console.log(`  ✓ Email: ${email}`);
      }

      showSuccess('✓ Form auto-filled! Complete the form and click "Create Account"');
      console.log('[Google Auth Signup] Form auto-filled successfully. User should now complete password fields.');

    } catch (decodeError) {
      console.error('❌ Token decode error:', decodeError);
      throw new Error('Failed to decode Google token');
    }

  } catch (error) {
    console.error('❌ Google sign-up error:', error);
    showError('Google sign-up failed: ' + error.message);
  }
}

// Initialize Google Sign-In buttons
function initializeGoogleSignIn() {
  const loginButton = document.getElementById('google-login-button');
  const signupButton = document.getElementById('google-signup-button');

  // This page has no Google UI; skip silently (prevents admin-page console spam).
  if (!loginButton && !signupButton) {
    return;
  }

  // Check if Google Identity Services library is loaded
  if (typeof window.google === 'undefined' || !window.google.accounts) {
    googleInitRetries += 1;
    if (googleInitRetries <= 2 || googleInitRetries % 10 === 0) {
      console.warn('[Google Auth] Google Identity Services not yet loaded, retrying in 500ms...');
    }

    if (googleInitRetries > 40) {
      console.error('[Google Auth] Google SDK failed to load after multiple retries.');
      return;
    }

    if (googleInitTimerId) {
      clearTimeout(googleInitTimerId);
    }
    googleInitTimerId = setTimeout(initializeGoogleSignIn, 500);
    return;
  }

  googleInitRetries = 0;

  console.log('[Google Auth] Initializing Google Sign-In buttons');

  // Render login button
  if (loginButton) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleSignIn,
      ux_mode: 'popup'
    });

    console.log('[Google Auth] Rendering login button');
    google.accounts.id.renderButton(
      loginButton,
      {
        type: 'standard',
        size: 'large',
        theme: 'outline',
        width: '100%',
        text: 'signin_with'
      }
    );
  }

  // Render signup button
  if (signupButton) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleSignUp,
      ux_mode: 'popup'
    });

    console.log('[Google Auth] Rendering signup button');
    google.accounts.id.renderButton(
      signupButton,
      {
        type: 'standard',
        size: 'large',
        theme: 'outline',
        width: '100%',
        text: 'signup_with'
      }
    );
  }

  console.log('[Google Auth] ✓ Buttons initialized');
}

// ============================================
// Password Visibility Toggle
// ============================================
function togglePasswordVisibility(event) {
  event.preventDefault();
  const button = event.currentTarget || event.target;
  const container = button.closest('.password-container');
  
  if (!container) {
    console.error('Password container not found');
    return;
  }
  
  const input = container.querySelector('input[type="password"], input[type="text"]');
  
  if (!input) {
    console.error('Password input not found in container');
    return;
  }
  
  if (input.type === 'password') {
    input.type = 'text';
    button.innerHTML = `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>`;
  } else {
    input.type = 'password';
    button.innerHTML = `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>`;
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGoogleSignIn);
} else {
  initializeGoogleSignIn();
}

