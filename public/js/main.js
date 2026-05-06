/* ====================================
   BinTECH - Main JavaScript
   ==================================== */

// Page Navigation
function navigateTo(page) {
  // Hide all pages
  const pages = document.querySelectorAll('.page');
  pages.forEach(p => p.classList.remove('active'));

  // Show selected page
  const selectedPage = document.getElementById(page + '-page');
  if (selectedPage) {
    selectedPage.classList.add('active');
    window.scrollTo(0, 0);
  }
}

// Login Form Handler
function handleLogin(event) {
  event.preventDefault();

  const email = event.target.querySelector('input[type="email"]').value;
  const password = event.target.querySelector('input[type="password"]').value;

  // Validate inputs
  if (!email || !password) {
    alert('Please fill in all fields');
    return;
  }

  // Log for debugging
  console.log('Login attempt:', { email });

  // Here you would normally send to your backend
  // For now, show success message
  alert('Login functionality - send to backend: ' + email);

  // Close form
  event.target.reset();
}

// Sign Up Form Handler
function handleSignup(event) {
  event.preventDefault();

  const name = event.target.querySelector('input[name="name"]')?.value || '';
  const email = event.target.querySelector('input[type="email"]').value;
  const password = event.target.querySelector('input[type="password"]').value;
  const confirmPassword = event.target.querySelector('input[name="confirmPassword"]')?.value || '';

  // Validate inputs
  if (!email || !password) {
    alert('Please fill in all required fields');
    return;
  }

  if (confirmPassword && password !== confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  // Log for debugging
  console.log('Signup attempt:', { name, email });

  // Alert for now
  alert('Signup functionality - send to backend: ' + email);

  // Reset form
  event.target.reset();
}

// Smooth scroll for anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (event) {
    event.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Add active state to navigation links
function setActiveNavLink() {
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    if (link.href === window.location.href) {
      link.classList.add('text-eco-yellow');
    } else {
      link.classList.remove('text-eco-yellow');
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
  console.log('BinTECH Application Loaded');

  // Set active nav link
  setActiveNavLink();

  // Load user data if logged in
  loadUserData();

  // Setup event listeners for forms
  setupFormListeners();
});

// Load User Data (Placeholder)
function loadUserData() {
  // Check if user is logged in (from session/localStorage)
  const userData = localStorage.getItem('bintech_user');

  if (userData) {
    console.log('User data found:', userData);
    // Update UI with user data
  }
}

// Setup Form Listeners
function setupFormListeners() {
  const loginForm = document.querySelector('#login-page form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const signupForm = document.querySelector('#signup-page form');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }
}

// Logout Function
function handleLogout() {
  localStorage.removeItem('bintech_user');
  navigateTo('landing');
  alert('Logged out successfully');
}

// Format Number with thousands separator
function formatNumber(num) {
  return Number(num).toLocaleString();
}

// Calculate Points based on waste type
function calculatePoints(wasteType) {
  const pointMap = {
    organic: 5,
    plastic: 10,
    paper: 8,
    metal: 15,
    'e-waste': 20
  };

  return pointMap[wasteType.toLowerCase()] || 0;
}

// QR Scan Handler (Placeholder)
function handleQRScan(qrData) {
  console.log('QR Code detected:', qrData);

  // Parse QR code
  // Expected format: wasteType:amount

  const [wasteType, amount] = qrData.split(':');
  const points = calculatePoints(wasteType) * (parseInt(amount) || 1);

  console.log(`Earned ${points} points for ${amount} unit(s) of ${wasteType}`);

  // Send to backend
  // updateUserPoints(points);

  return points;
}

// Update User Points (Placeholder)
function updateUserPoints(points) {
  console.log('Updating user points:', points);

  // Send to backend via fetch
  // fetch('/api/user/points', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ points })
  // })
}

// Format Currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Format Date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Load Dashboard Data (Placeholder)
function loadDashboardData() {
  // This would normally fetch from your backend
  const sampleData = {
    points: 2450,
    disposals: 156,
    rank: 12,
    level: 'Gold'
  };

  return sampleData;
}

// Load Rewards (Placeholder)
function loadRewards() {
  const sampleRewards = [
    {
      id: 1,
      name: 'Campus Discount',
      points: 100,
      description: 'Get 10% discount at campus store'
    },
    {
      id: 2,
      name: 'Study Materials',
      points: 250,
      description: 'Free study materials package'
    },
    {
      id: 3,
      name: 'BinTECH Merch',
      points: 300,
      description: 'Official BinTECH merchandise'
    },
    {
      id: 4,
      name: 'Movie Vouchers',
      points: 200,
      description: 'Movie tickets x2'
    },
    {
      id: 5,
      name: 'Premium Badge',
      points: 500,
      description: 'Exclusive premium status badge'
    },
    {
      id: 6,
      name: 'Cash Voucher',
      points: 1000,
      description: '500 pesos cash voucher'
    }
  ];

  return sampleRewards;
}

// Redeem Reward
function redeemReward(rewardId) {
  console.log('Redeeming reward:', rewardId);

  // Get user points from localStorage or backend
  const userData = JSON.parse(localStorage.getItem('bintech_user') || '{}');
  const userPoints = userData.points || 0;

  // Find reward
  const rewards = loadRewards();
  const reward = rewards.find(r => r.id === rewardId);

  if (!reward) {
    alert('Reward not found');
    return;
  }

  if (userPoints < reward.points) {
    alert(`You need ${reward.points - userPoints} more points`);
    return;
  }

  // Redeem
  console.log('Reward redeemed:', reward.name);

  // Update points
  userData.points = userPoints - reward.points;
  localStorage.setItem('bintech_user', JSON.stringify(userData));

  alert(`Successfully redeemed: ${reward.name}!`);
}

// Get Top Users (Leaderboard)
function getTopUsers() {
  return [
    { rank: 1, name: 'Maria Santos', points: 5200 },
    { rank: 2, name: 'Juan Dela Cruz', points: 4890 },
    { rank: 3, name: 'Ana Garcia', points: 4650 },
    { rank: 4, name: 'Pedro Reyes', points: 4320 },
    { rank: 5, name: 'Rosa Martinez', points: 4100 }
  ];
}

// Get Disposal History
function getDisposalHistory() {
  return [
    { date: '2024-01-15', type: 'Plastic', amount: 2.5, points: 25 },
    { date: '2024-01-14', type: 'Organic', amount: 1.8, points: 9 },
    { date: '2024-01-14', type: 'Metal', amount: 0.5, points: 8 },
    { date: '2024-01-13', type: 'Paper', amount: 3.2, points: 26 },
    { date: '2024-01-13', type: 'E-waste', amount: 0.1, points: 2 }
  ];
}

// Admin Functions

// Get Bins
function getBins() {
  return [
    {
      id: 'BIN-001',
      location: 'Building A - Ground Floor',
      type: 'Mixed Waste',
      fillLevel: 65,
      status: 'Active'
    },
    {
      id: 'BIN-002',
      location: 'Building B - 2nd Floor',
      type: 'Organic',
      fillLevel: 45,
      status: 'Active'
    },
    {
      id: 'BIN-003',
      location: 'Cafeteria',
      type: 'Plastic',
      fillLevel: 88,
      status: 'Full'
    }
  ];
}

// Get Collection Logs
function getCollectionLogs() {
  return [
    {
      date: '2024-01-15',
      binId: 'BIN-001',
      collector: 'John Doe',
      weight: 25.5,
      notes: 'Routine collection'
    },
    {
      date: '2024-01-14',
      binId: 'BIN-002',
      collector: 'Jane Smith',
      weight: 18.3,
      notes: 'Emergency collection'
    }
  ];
}

// Get Admin Stats
function getAdminStats() {
  return {
    totalBins: 47,
    activeBins: 45,
    fullBins: 2,
    todayCollection: 12,
    weeklyAverage: 85.5,
    monthlyWaste: 3250
  };
}

// Show Notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// API Call Helper
async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Call failed:', error);
    throw error;
  }
}

// Export functions for use in Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    navigateTo,
    handleLogin,
    handleSignup,
    handleLogout,
    calculatePoints,
    handleQRScan,
    updateUserPoints,
    loadDashboardData,
    loadRewards,
    redeemReward,
    getTopUsers,
    getDisposalHistory,
    getBins,
    getCollectionLogs,
    getAdminStats,
    showNotification,
    apiCall
  };
}
