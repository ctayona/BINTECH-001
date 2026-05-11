/**
 * Password Recovery Frontend Components
 * Handles UI for forgot password, OTP verification, and password reset flows
 */

// ============================================================================
// PASSWORD RECOVERY STATE MANAGEMENT
// ============================================================================

const passwordRecoveryState = {
  currentStep: 'forgot-password', // forgot-password, otp-verification, password-reset
  email: '',
  recoveryToken: '',
  attemptsRemaining: 5,
  isLoading: false,
  errorMessage: '',
  successMessage: ''
};

// ============================================================================
// FORM VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate OTP format (6 digits)
 */
function validateOTP(otp) {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp.replace(/\s/g, ''));
}

/**
 * Validate password strength
 */
function validatePasswordStrength(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Calculate password strength indicator
 */
function calculatePasswordStrength(password) {
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;
  
  return {
    score: strength,
    label: strength <= 1 ? 'Weak' : strength <= 2 ? 'Fair' : strength <= 3 ? 'Good' : strength <= 4 ? 'Strong' : 'Very Strong',
    color: strength <= 1 ? '#ef4444' : strength <= 2 ? '#f97316' : strength <= 3 ? '#eab308' : strength <= 4 ? '#84cc16' : '#22c55e'
  };
}

// ============================================================================
// UI UPDATE FUNCTIONS
// ============================================================================

/**
 * Show error message
 */
function showErrorMessage(message) {
  const errorElement = document.getElementById('recovery-error-message');
  if (errorElement) {
    const span = errorElement.querySelector('span') || errorElement;
    span.textContent = message;
    errorElement.style.display = 'flex';
    errorElement.classList.add('animate-fade-in-up');
  }
  passwordRecoveryState.errorMessage = message;
}

/**
 * Clear error message
 */
function clearErrorMessage() {
  const errorElement = document.getElementById('recovery-error-message');
  if (errorElement) {
    errorElement.style.display = 'none';
    const span = errorElement.querySelector('span');
    if (span) span.textContent = '';
  }
  passwordRecoveryState.errorMessage = '';
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
  const successElement = document.getElementById('recovery-success-message');
  if (successElement) {
    const span = successElement.querySelector('span') || successElement;
    span.textContent = message;
    successElement.style.display = 'flex';
    successElement.classList.add('animate-fade-in-up');
  }
  passwordRecoveryState.successMessage = message;
}

/**
 * Clear success message
 */
function clearSuccessMessage() {
  const successElement = document.getElementById('recovery-success-message');
  if (successElement) {
    successElement.style.display = 'none';
    const span = successElement.querySelector('span');
    if (span) span.textContent = '';
  }
  passwordRecoveryState.successMessage = '';
}

/**
 * Set loading state
 */
function setLoadingState(isLoading, buttonId) {
  passwordRecoveryState.isLoading = isLoading;
  const button = document.getElementById(buttonId);
  
  if (button) {
    if (isLoading) {
      button.disabled = true;
      button.innerHTML = '<span class="inline-block animate-spin mr-2">⏳</span>Processing...';
      button.classList.add('opacity-75');
    } else {
      button.disabled = false;
      button.classList.remove('opacity-75');
      // Reset button text based on context
      if (buttonId === 'forgot-password-submit') {
        button.innerHTML = 'Send OTP';
      } else if (buttonId === 'otp-verify-submit') {
        button.innerHTML = 'Verify OTP';
      } else if (buttonId === 'reset-password-submit') {
        button.innerHTML = 'Reset Password';
      }
    }
  }
}

/**
 * Update password strength indicator
 */
function updatePasswordStrengthIndicator(password) {
  const indicator = document.getElementById('password-strength-indicator');
  const label = document.getElementById('password-strength-label');
  
  if (!indicator || !label) return;
  
  if (!password) {
    indicator.style.display = 'none';
    return;
  }
  
  const strength = calculatePasswordStrength(password);
  indicator.style.display = 'block';
  indicator.style.backgroundColor = strength.color;
  indicator.style.width = (strength.score * 20) + '%';
  label.textContent = strength.label;
  label.style.color = strength.color;
}

/**
 * Update OTP attempt counter display
 */
function updateAttemptCounter(remaining) {
  const counter = document.getElementById('otp-attempts-remaining');
  if (counter) {
    counter.textContent = remaining;
    if (remaining <= 2) {
      counter.classList.add('text-red-400');
      counter.classList.remove('text-white/70');
    } else {
      counter.classList.remove('text-red-400');
      counter.classList.add('text-white/70');
    }
  }
}

// ============================================================================
// STEP 1: FORGOT PASSWORD FORM
// ============================================================================

/**
 * Handle forgot password form submission
 */
async function handleForgotPasswordSubmit(event) {
  event.preventDefault();
  clearErrorMessage();
  clearSuccessMessage();
  
  const emailInput = document.getElementById('forgot-password-email');
  const email = emailInput.value.trim();
  
  // Validate email
  if (!email) {
    showErrorMessage('Please enter your email address');
    return;
  }
  
  if (!validateEmail(email)) {
    showErrorMessage('Please enter a valid email address');
    return;
  }
  
  setLoadingState(true, 'forgot-password-submit');
  
  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showErrorMessage(data.message || 'Failed to send OTP. Please try again.');
      setLoadingState(false, 'forgot-password-submit');
      return;
    }
    
    // Success - move to OTP verification step
    passwordRecoveryState.email = email;
    passwordRecoveryState.recoveryToken = data.recoveryToken;
    passwordRecoveryState.currentStep = 'otp-verification';
    
    showSuccessMessage('OTP sent to your email. Please check your inbox.');
    
    // Transition to OTP verification form
    setTimeout(() => {
      transitionToOTPVerification(email);
    }, 1500);
    
  } catch (error) {
    console.error('[Password Recovery] Error:', error);
    showErrorMessage('An error occurred. Please try again.');
    setLoadingState(false, 'forgot-password-submit');
  }
}

// ============================================================================
// STEP 2: OTP VERIFICATION FORM
// ============================================================================

/**
 * Handle OTP input - auto-format and validate
 */
function handleOTPInput(event) {
  let value = event.target.value.replace(/\D/g, '');
  
  if (value.length > 6) {
    value = value.slice(0, 6);
  }
  
  // Format as: XXX XXX
  if (value.length > 3) {
    event.target.value = value.slice(0, 3) + ' ' + value.slice(3);
  } else {
    event.target.value = value;
  }
}

/**
 * Handle OTP verification form submission
 */
async function handleOTPVerificationSubmit(event) {
  event.preventDefault();
  clearErrorMessage();
  clearSuccessMessage();
  
  const otpInput = document.getElementById('otp-code');
  const otp = otpInput.value.replace(/\s/g, '');
  
  // Validate OTP
  if (!otp) {
    showErrorMessage('Please enter the OTP code');
    return;
  }
  
  if (!validateOTP(otp)) {
    showErrorMessage('OTP must be 6 digits');
    return;
  }
  
  setLoadingState(true, 'otp-verify-submit');
  
  try {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: passwordRecoveryState.email,
        otp: otp,
        recoveryToken: passwordRecoveryState.recoveryToken
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Update attempts remaining if provided
      if (data.attemptsRemaining !== undefined) {
        passwordRecoveryState.attemptsRemaining = data.attemptsRemaining;
        updateAttemptCounter(data.attemptsRemaining);
      }
      
      showErrorMessage(data.message || 'Invalid OTP. Please try again.');
      setLoadingState(false, 'otp-verify-submit');
      return;
    }
    
    // Success - move to password reset step
    passwordRecoveryState.recoveryToken = data.recoveryToken;
    passwordRecoveryState.currentStep = 'password-reset';
    
    showSuccessMessage('OTP verified successfully. Please set your new password.');
    
    // Transition to password reset form
    setTimeout(() => {
      transitionToPasswordReset();
    }, 1500);
    
  } catch (error) {
    console.error('[Password Recovery] Error:', error);
    showErrorMessage('An error occurred. Please try again.');
    setLoadingState(false, 'otp-verify-submit');
  }
}

/**
 * Handle resend OTP
 */
async function handleResendOTP() {
  clearErrorMessage();
  clearSuccessMessage();
  
  const resendButton = document.getElementById('resend-otp-button');
  if (resendButton) {
    resendButton.disabled = true;
    resendButton.textContent = 'Resending...';
  }
  
  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: passwordRecoveryState.email })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showErrorMessage(data.message || 'Failed to resend OTP. Please try again.');
      if (resendButton) {
        resendButton.disabled = false;
        resendButton.textContent = 'Resend OTP';
      }
      return;
    }
    
    showSuccessMessage('OTP resent to your email.');
    
    // Reset OTP input
    const otpInput = document.getElementById('otp-code');
    if (otpInput) {
      otpInput.value = '';
      otpInput.focus();
    }
    
    // Disable resend button for 60 seconds
    let countdown = 60;
    const interval = setInterval(() => {
      countdown--;
      if (resendButton) {
        resendButton.textContent = `Resend OTP (${countdown}s)`;
      }
      
      if (countdown <= 0) {
        clearInterval(interval);
        if (resendButton) {
          resendButton.disabled = false;
          resendButton.textContent = 'Resend OTP';
        }
      }
    }, 1000);
    
  } catch (error) {
    console.error('[Password Recovery] Error:', error);
    showErrorMessage('An error occurred. Please try again.');
    if (resendButton) {
      resendButton.disabled = false;
      resendButton.textContent = 'Resend OTP';
    }
  }
}

// ============================================================================
// STEP 3: PASSWORD RESET FORM
// ============================================================================

/**
 * Handle password input change - update strength indicator
 */
function handlePasswordInput(event) {
  const password = event.target.value;
  updatePasswordStrengthIndicator(password);
}

/**
 * Handle password reset form submission
 */
async function handlePasswordResetSubmit(event) {
  event.preventDefault();
  clearErrorMessage();
  clearSuccessMessage();
  
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  
  // Validate passwords match
  if (newPassword !== confirmPassword) {
    showErrorMessage('Passwords do not match');
    return;
  }
  
  // Validate password strength
  const validation = validatePasswordStrength(newPassword);
  if (!validation.isValid) {
    showErrorMessage('Password requirements not met:\n' + validation.errors.join('\n'));
    return;
  }
  
  setLoadingState(true, 'reset-password-submit');
  
  try {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: passwordRecoveryState.email,
        newPassword: newPassword,
        confirmPassword: confirmPassword,
        recoveryToken: passwordRecoveryState.recoveryToken
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showErrorMessage(data.message || 'Failed to reset password. Please try again.');
      setLoadingState(false, 'reset-password-submit');
      return;
    }
    
    // Success - show success message and redirect to login
    showSuccessMessage('Password reset successfully! Redirecting to login...');
    
    setTimeout(() => {
      // Reset state
      passwordRecoveryState.currentStep = 'forgot-password';
      passwordRecoveryState.email = '';
      passwordRecoveryState.recoveryToken = '';
      
      // Navigate to login
      navigateTo('login');
    }, 2000);
    
  } catch (error) {
    console.error('[Password Recovery] Error:', error);
    showErrorMessage('An error occurred. Please try again.');
    setLoadingState(false, 'reset-password-submit');
  }
}

// ============================================================================
// PAGE TRANSITION FUNCTIONS
// ============================================================================

/**
 * Transition to OTP verification form
 */
function transitionToOTPVerification(email) {
  const forgotPasswordContainer = document.getElementById('forgot-password-form-container');
  const otpVerificationContainer = document.getElementById('otp-verification-form-container');
  
  if (forgotPasswordContainer) {
    forgotPasswordContainer.style.display = 'none';
  }
  
  if (otpVerificationContainer) {
    otpVerificationContainer.style.display = 'block';
    const otpInput = otpVerificationContainer.querySelector('#otp-code');
    if (otpInput) {
      otpInput.focus();
    }
  }
  
  // Update email display
  const emailDisplay = document.getElementById('otp-email-display');
  if (emailDisplay) {
    emailDisplay.textContent = email;
  }
  
  // Update progress indicator
  updateProgressIndicator(2);
}

/**
 * Transition to password reset form
 */
function transitionToPasswordReset() {
  const otpVerificationContainer = document.getElementById('otp-verification-form-container');
  const passwordResetContainer = document.getElementById('password-reset-form-container');
  
  if (otpVerificationContainer) {
    otpVerificationContainer.style.display = 'none';
  }
  
  if (passwordResetContainer) {
    passwordResetContainer.style.display = 'block';
    const newPasswordInput = passwordResetContainer.querySelector('#new-password');
    if (newPasswordInput) {
      newPasswordInput.focus();
    }
  }
  
  // Update progress indicator
  updateProgressIndicator(3);
}

/**
 * Go back to forgot password form
 */
function goBackToForgotPassword() {
  clearErrorMessage();
  clearSuccessMessage();
  
  const forgotPasswordContainer = document.getElementById('forgot-password-form-container');
  const otpVerificationContainer = document.getElementById('otp-verification-form-container');
  const passwordResetContainer = document.getElementById('password-reset-form-container');
  
  if (forgotPasswordContainer) {
    forgotPasswordContainer.style.display = 'block';
    const emailInput = forgotPasswordContainer.querySelector('#forgot-password-email');
    if (emailInput) {
      emailInput.focus();
    }
  }
  
  if (otpVerificationContainer) {
    otpVerificationContainer.style.display = 'none';
  }
  
  if (passwordResetContainer) {
    passwordResetContainer.style.display = 'none';
  }
  
  // Reset state
  passwordRecoveryState.currentStep = 'forgot-password';
  passwordRecoveryState.email = '';
  passwordRecoveryState.recoveryToken = '';
  passwordRecoveryState.attemptsRemaining = 5;
  
  // Update progress indicator
  updateProgressIndicator(1);
}

/**
 * Update progress indicator
 */
function updateProgressIndicator(step) {
  const step1 = document.getElementById('progress-step-1');
  const step2 = document.getElementById('progress-step-2');
  const step3 = document.getElementById('progress-step-3');
  
  if (step1) step1.classList.toggle('bg-eco-yellow', step >= 1);
  if (step2) step2.classList.toggle('bg-eco-yellow', step >= 2);
  if (step3) step3.classList.toggle('bg-eco-yellow', step >= 3);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize password recovery components
 */
function initializePasswordRecovery() {
  console.log('[Password Recovery] Initializing components');
  
  // Attach event listeners to forms
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', handleForgotPasswordSubmit);
  }
  
  const otpVerificationForm = document.getElementById('otp-verification-form');
  if (otpVerificationForm) {
    otpVerificationForm.addEventListener('submit', handleOTPVerificationSubmit);
    
    const otpInput = otpVerificationForm.querySelector('#otp-code');
    if (otpInput) {
      otpInput.addEventListener('input', handleOTPInput);
    }
  }
  
  const passwordResetForm = document.getElementById('password-reset-form');
  if (passwordResetForm) {
    passwordResetForm.addEventListener('submit', handlePasswordResetSubmit);
    
    const newPasswordInput = passwordResetForm.querySelector('#new-password');
    if (newPasswordInput) {
      newPasswordInput.addEventListener('input', handlePasswordInput);
    }
  }
  
  // Attach resend OTP button
  const resendButton = document.getElementById('resend-otp-button');
  if (resendButton) {
    resendButton.addEventListener('click', handleResendOTP);
  }
  
  // Initialize progress indicator
  updateProgressIndicator(1);
  
  console.log('[Password Recovery] Components initialized');
}

// Initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePasswordRecovery);
  } else {
    initializePasswordRecovery();
  }
}

// Export for use in HTML
if (typeof window !== 'undefined') {
  window.passwordRecovery = {
    passwordRecoveryState,
    handleForgotPasswordSubmit,
    handleOTPVerificationSubmit,
    handlePasswordResetSubmit,
    handleResendOTP,
    goBackToForgotPassword,
    transitionToOTPVerification,
    transitionToPasswordReset,
    validateEmail,
    validateOTP,
    validatePasswordStrength,
    calculatePasswordStrength,
    handleOTPInput,
    updateAttemptCounter,
    showErrorMessage,
    clearErrorMessage,
    showSuccessMessage,
    clearSuccessMessage,
    setLoadingState,
    updatePasswordStrengthIndicator,
    updateProgressIndicator
  };
}
