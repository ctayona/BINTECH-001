// ============================================
// SHOUTBOX / COMMUNITY FORUM
// Live chat system for Rewards page
// ============================================

class Shoutbox {
  constructor() {
    this.messages = [];
    this.currentUser = null;
    this.lastMessageTime = 0;
    this.cooldownSeconds = 5;
    this.refreshInterval = null;
    this.isInitialized = false;
  }

  // Initialize shoutbox
  async init() {
    if (this.isInitialized) return;
    
    try {
      // Get current user from session
      const userStr = sessionStorage.getItem('bintech_user');
      if (!userStr) {
        console.warn('No user logged in');
        return;
      }

      this.currentUser = JSON.parse(userStr);
      console.log('Shoutbox initialized for user:', this.currentUser.email);
      console.log('User object:', this.currentUser);
      
      // Handle both 'id' and 'system_id' field names
      if (!this.currentUser.system_id && this.currentUser.id) {
        this.currentUser.system_id = this.currentUser.id;
      }
      
      console.log('User system_id:', this.currentUser.system_id);

      // Load initial messages
      await this.loadMessages();

      // Setup event listeners
      this.setupEventListeners();

      // Auto-refresh messages every 5 seconds
      this.refreshInterval = setInterval(() => this.loadMessages(), 5000);

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing shoutbox:', error);
    }
  }

  // Setup event listeners
  setupEventListeners() {
    const textarea = document.getElementById('shoutbox-input');
    const sendBtn = document.getElementById('shoutbox-send-btn');
    const charCount = document.getElementById('shoutbox-char-count');

    if (textarea) {
      // Character counter
      textarea.addEventListener('input', () => {
        const length = textarea.value.length;
        if (charCount) {
          charCount.textContent = `${length}/250`;
          charCount.style.color = length > 250 ? '#EF5350' : length > 200 ? '#FF9800' : '#9CA3AF';
        }

        // Auto-expand textarea
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
      });

      // Send on Enter (Shift+Enter for new line)
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }
  }

  // Load messages from API
  async loadMessages() {
    try {
      const response = await fetch('/api/shoutbox/messages?limit=50');
      
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        this.messages = [];
        this.renderMessages();
        return;
      }
      
      const data = await response.json();

      if (data.success) {
        this.messages = data.messages || [];
        this.renderMessages();
      } else {
        console.warn('API returned success:false', data);
        this.messages = [];
        this.renderMessages();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      this.messages = [];
      this.renderMessages();
    }
  }

  // Render messages in the UI
  renderMessages() {
    const container = document.getElementById('shoutbox-messages');
    if (!container) return;

    if (this.messages.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-[#0F3B2E]/50">
          <p class="text-sm">💬 No messages yet. Be the first to say hello!</p>
        </div>
      `;
      return;
    }

    // Render messages
    container.innerHTML = this.messages.map((msg, index) => {
      const senderSystemId = msg.sender.system_id || msg.sender.id;
      const currentUserId = this.currentUser?.system_id || this.currentUser?.id;
      const isOwnMessage = senderSystemId === currentUserId;
      const bgColor = index % 2 === 0 ? 'bg-white' : 'bg-[#FFFDE7]';
      const timestamp = this.formatTimestamp(msg.created_at);

      return `
        <div class="shoutbox-message ${bgColor} p-3 rounded-lg hover:shadow-sm transition-shadow">
          <div class="flex items-start gap-3">
            <!-- Avatar -->
            <div class="flex-shrink-0">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-[#5DAE60] to-[#4CAF50] flex items-center justify-center text-white font-bold text-sm">
                ${msg.sender.username.charAt(0).toUpperCase()}
              </div>
            </div>

            <!-- Message Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold text-[#0F3B2E] text-sm">${this.escapeHtml(msg.sender.username)}</span>
                <span class="text-xs px-2 py-0.5 rounded-full bg-[#5DAE60]/10 text-[#5DAE60] font-medium">${msg.sender.badge}</span>
                ${isOwnMessage ? '<span class="text-xs text-[#5DAE60]">(You)</span>' : ''}
              </div>
              <p class="text-[#0F3B2E] text-sm break-words">${this.escapeHtml(msg.message_text)}</p>
              <div class="flex items-center gap-3 mt-1">
                <span class="text-xs text-[#0F3B2E]/50">${timestamp}</span>
                ${msg.is_edited ? '<span class="text-xs text-[#0F3B2E]/40 italic">(edited)</span>' : ''}
              </div>
            </div>

            <!-- Actions (for own messages or admin) -->
            ${isOwnMessage || this.currentUser?.role === 'admin' ? `
              <div class="flex-shrink-0">
                <button onclick="shoutbox.deleteMessage('${msg.message_id}')" class="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors" title="Delete message">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Auto-scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  // Send message
  async sendMessage() {
    const textarea = document.getElementById('shoutbox-input');
    const sendBtn = document.getElementById('shoutbox-send-btn');
    const errorDiv = document.getElementById('shoutbox-error');

    if (!textarea || !this.currentUser) return;

    const message = textarea.value.trim();

    // Validation
    if (!message) {
      this.showError('Message cannot be empty');
      return;
    }

    if (message.length > 250) {
      this.showError('Message exceeds 250 character limit');
      return;
    }

    // Check cooldown
    const now = Date.now();
    const timeSinceLastMessage = (now - this.lastMessageTime) / 1000;
    if (timeSinceLastMessage < this.cooldownSeconds) {
      const waitTime = Math.ceil(this.cooldownSeconds - timeSinceLastMessage);
      this.showError(`Please wait ${waitTime} seconds before posting again`);
      return;
    }

    // Disable input while sending
    textarea.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    console.log('Sending message with user:', this.currentUser);
    console.log('sender_id:', this.currentUser?.system_id);

    try {
      const payload = {
        sender_id: this.currentUser.system_id,
        message_text: message
      };
      
      console.log('POST payload:', payload);
      
      const response = await fetch('/api/shoutbox/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        // Clear input
        textarea.value = '';
        textarea.style.height = 'auto';
        document.getElementById('shoutbox-char-count').textContent = '0/250';
        
        // Update last message time
        this.lastMessageTime = now;

        // Reload messages
        await this.loadMessages();

        // Clear error
        if (errorDiv) errorDiv.classList.add('hidden');
      } else {
        this.showError(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      this.showError('Network error. Please try again.');
    } finally {
      textarea.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      textarea.focus();
    }
  }

  // Delete message
  async deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      const adminId = this.currentUser?.system_id || this.currentUser?.id;
      
      const response = await fetch(`/api/shoutbox/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          admin_id: adminId
        })
      });

      const data = await response.json();

      if (data.success) {
        // Reload messages
        await this.loadMessages();
      } else {
        alert(data.message || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Network error. Please try again.');
    }
  }

  // Show error message
  showError(message) {
    const errorDiv = document.getElementById('shoutbox-error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
      setTimeout(() => errorDiv.classList.add('hidden'), 5000);
    }
  }

  // Format timestamp
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Escape HTML to prevent XSS
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Cleanup
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.isInitialized = false;
  }
}

// Create global instance
const shoutbox = new Shoutbox();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => shoutbox.init());
} else {
  shoutbox.init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => shoutbox.destroy());
