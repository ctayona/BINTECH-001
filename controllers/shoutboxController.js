// Shoutbox Controller
// Handles community forum / live chat functionality

const supabase = require('../config/supabase');

// ============================================
// PROFANITY FILTER
// ============================================
const PROFANITY_LIST = [
  'badword1', 'badword2', 'badword3', // Add actual profanity words here
  // This is a basic example - use a comprehensive profanity library in production
];

function containsProfanity(text) {
  const lowerText = text.toLowerCase();
  return PROFANITY_LIST.some(word => lowerText.includes(word));
}

function sanitizeMessage(text) {
  // Remove HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');
  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Trim whitespace
  sanitized = sanitized.trim();
  return sanitized;
}

// ============================================
// GET MESSAGES
// Fetch latest shoutbox messages with user info
// ============================================
exports.getMessages = async (req, res) => {
  try {
    console.log('[Shoutbox] GET /messages - Query params:', req.query);
    
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // Fetch messages with user account information
    const { data: messages, error } = await supabase
      .from('shoutbox_messages')
      .select(`
        message_id,
        message_text,
        is_edited,
        created_at,
        sender_id,
        user_accounts (
          system_id,
          email,
          role,
          status,
          campus_id
        )
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Shoutbox] Error fetching messages:', error);
      return res.status(200).json({
        success: true,
        messages: [],
        count: 0
      });
    }

    console.log(`[Shoutbox] Found ${messages?.length || 0} messages`);

    // Format messages with user information
    const formattedMessages = (messages || []).map(msg => {
      const userAccount = msg.user_accounts;
      const email = userAccount?.email || 'Unknown User';
      const username = email.split('@')[0]; // Extract username from email
      const role = userAccount?.role || 'user';
      const status = userAccount?.status || 'active';

      return {
        message_id: msg.message_id,
        message_text: msg.message_text,
        is_edited: msg.is_edited,
        created_at: msg.created_at,
        sender: {
          system_id: msg.sender_id,
          username: username,
          email: email,
          role: role,
          status: status,
          badge: role === 'admin' ? '👑 Admin' : role === 'faculty' ? '🎓 Faculty' : role === 'student' ? '📚 Student' : '👤 User'
        }
      };
    });

    res.json({
      success: true,
      messages: formattedMessages,
      count: formattedMessages.length
    });
  } catch (error) {
    console.error('[Shoutbox] Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// POST MESSAGE
// Send a new message to the shoutbox
// ============================================
exports.postMessage = async (req, res) => {
  try {
    console.log('[Shoutbox] POST /messages - Body:', req.body);
    
    const { sender_id, message_text } = req.body;

    // Validation
    if (!sender_id || !message_text) {
      console.warn('[Shoutbox] Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sender_id, message_text'
      });
    }

    // Sanitize message
    const sanitized = sanitizeMessage(message_text);

    // Validate message length
    if (sanitized.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    if (sanitized.length > 250) {
      return res.status(400).json({
        success: false,
        message: 'Message exceeds 250 character limit'
      });
    }

    // Check for profanity
    if (containsProfanity(sanitized)) {
      return res.status(400).json({
        success: false,
        message: 'Message contains inappropriate content'
      });
    }

    // Verify user exists and is not suspended
    const { data: userAccount, error: userError } = await supabase
      .from('user_accounts')
      .select('system_id, email, role, status')
      .eq('system_id', sender_id)
      .single();

    if (userError || !userAccount) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    // Check if user is suspended
    if (userAccount.status === 'suspended' || userAccount.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to post messages'
      });
    }

    // Check rate limiting (5 second cooldown)
    const { data: recentMessages, error: recentError } = await supabase
      .from('shoutbox_messages')
      .select('created_at')
      .eq('sender_id', sender_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!recentError && recentMessages && recentMessages.length > 0) {
      const lastMessageTime = new Date(recentMessages[0].created_at);
      const now = new Date();
      const timeDiff = (now - lastMessageTime) / 1000; // seconds

      if (timeDiff < 5) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(5 - timeDiff)} seconds before posting again`,
          cooldown: Math.ceil(5 - timeDiff)
        });
      }
    }

    // Insert message
    const { data: newMessage, error: insertError } = await supabase
      .from('shoutbox_messages')
      .insert([
        {
          sender_id: sender_id,
          message_text: sanitized,
          is_deleted: false,
          is_edited: false
        }
      ])
      .select(`
        message_id,
        message_text,
        is_edited,
        created_at,
        sender_id
      `)
      .single();

    if (insertError) {
      console.error('Error inserting message:', insertError);
      return res.status(400).json({
        success: false,
        message: 'Error posting message',
        error: insertError.message
      });
    }

    // Format response with user info
    const username = userAccount.email.split('@')[0];
    const badge = userAccount.role === 'admin' ? '👑 Admin' : 
                  userAccount.role === 'faculty' ? '🎓 Faculty' : 
                  userAccount.role === 'student' ? '📚 Student' : '👤 User';

    res.status(201).json({
      success: true,
      message: 'Message posted successfully',
      data: {
        message_id: newMessage.message_id,
        message_text: newMessage.message_text,
        is_edited: newMessage.is_edited,
        created_at: newMessage.created_at,
        sender: {
          system_id: sender_id,
          username: username,
          email: userAccount.email,
          role: userAccount.role,
          status: userAccount.status,
          badge: badge
        }
      }
    });
  } catch (error) {
    console.error('Post message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// DELETE MESSAGE
// Admin moderation - soft delete a message
// ============================================
exports.deleteMessage = async (req, res) => {
  try {
    const { message_id } = req.params;
    const { admin_id } = req.body;

    if (!message_id) {
      return res.status(400).json({
        success: false,
        message: 'Message ID is required'
      });
    }

    // Verify admin permissions
    if (admin_id) {
      const { data: adminAccount, error: adminError } = await supabase
        .from('user_accounts')
        .select('role')
        .eq('system_id', admin_id)
        .single();

      if (adminError || !adminAccount || adminAccount.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Admin access required'
        });
      }
    }

    // Soft delete the message
    const { data, error } = await supabase
      .from('shoutbox_messages')
      .update({ is_deleted: true })
      .eq('message_id', message_id)
      .select();

    if (error) {
      console.error('Error deleting message:', error);
      return res.status(400).json({
        success: false,
        message: 'Error deleting message',
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============================================
// EDIT MESSAGE
// Allow users to edit their own messages
// ============================================
exports.editMessage = async (req, res) => {
  try {
    const { message_id } = req.params;
    const { sender_id, message_text } = req.body;

    if (!message_id || !sender_id || !message_text) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Sanitize new message
    const sanitized = sanitizeMessage(message_text);

    if (sanitized.length === 0 || sanitized.length > 250) {
      return res.status(400).json({
        success: false,
        message: 'Invalid message length'
      });
    }

    if (containsProfanity(sanitized)) {
      return res.status(400).json({
        success: false,
        message: 'Message contains inappropriate content'
      });
    }

    // Verify message belongs to sender
    const { data: existingMessage, error: fetchError } = await supabase
      .from('shoutbox_messages')
      .select('sender_id, created_at')
      .eq('message_id', message_id)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !existingMessage) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (existingMessage.sender_id !== sender_id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    // Check if message is too old to edit (e.g., 5 minutes)
    const messageAge = (new Date() - new Date(existingMessage.created_at)) / 1000 / 60;
    if (messageAge > 5) {
      return res.status(400).json({
        success: false,
        message: 'Message is too old to edit (5 minute limit)'
      });
    }

    // Update message
    const { data, error } = await supabase
      .from('shoutbox_messages')
      .update({
        message_text: sanitized,
        is_edited: true
      })
      .eq('message_id', message_id)
      .select();

    if (error) {
      console.error('Error editing message:', error);
      return res.status(400).json({
        success: false,
        message: 'Error editing message',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Message edited successfully',
      data: data[0]
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = exports;
