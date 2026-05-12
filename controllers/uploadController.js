// Upload Controller
// Handles file uploads to Supabase Storage using backend authentication

const supabase = require('../config/supabase');

// ============================================
// UPLOAD FILE TO SUPABASE STORAGE
// ============================================
exports.uploadFile = async (req, res) => {
  try {
    console.log('\n📥 ===== UPLOAD REQUEST RECEIVED =====');
    console.log(`Content-Type: ${req.get('content-type')}`);
    console.log(`Request headers:`, Object.keys(req.headers));
    console.log(`Request body keys:`, Object.keys(req.body));
    console.log(`Request file:`, req.file ? 'YES' : 'NO');
    
    if (req.file) {
      console.log(`File details:`, {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer ? `Buffer(${req.file.buffer.length} bytes)` : 'null'
      });
    }
    
    // multer stores file in req.file
    if (!req.file) {
      console.error('❌ No file in req.file');
      console.log('Available properties:', Object.keys(req));
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { bucketName, userId } = req.body;
    console.log(`Extracted from body - bucketName: ${bucketName}, userId: ${userId}`);

    if (!bucketName || !userId) {
      return res.status(400).json({
        success: false,
        message: 'bucketName and userId are required'
      });
    }

    console.log(`\n📤 Backend Upload Request:`);
    console.log(`  User: ${userId}`);
    console.log(`  File: ${req.file.originalname}`);
    console.log(`  File size: ${(req.file.size / 1024).toFixed(2)} KB`);
    console.log(`  MIME type: ${req.file.mimetype}`);
    console.log(`  Bucket: ${bucketName}`);

    // Validate bucket name
    const validBuckets = ['profile-pictures', 'cor-uploads'];
    if (!validBuckets.includes(bucketName)) {
      return res.status(400).json({
        success: false,
        message: `Invalid bucket: ${bucketName}. Allowed: ${validBuckets.join(', ')}`
      });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(413).json({
        success: false,
        message: `File too large. Maximum size is 5MB, but file is ${(req.file.size / 1024 / 1024).toFixed(2)}MB`
      });
    }

    // Validate MIME type
    const validMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validMimes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type: ${req.file.mimetype}. Allowed: ${validMimes.join(', ')}`
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = req.file.originalname.split('.').pop();
    const uniqueFileName = `${userId}_${timestamp}_${randomString}.${fileExtension}`;
    
    console.log(`Generated unique filename: ${uniqueFileName}`);
    console.log(`File buffer info: size=${req.file.buffer.length}, type=${typeof req.file.buffer}`);

    // Upload to Supabase Storage using the file buffer from multer
    console.log(`📤 Uploading to Supabase bucket: ${bucketName}/${uniqueFileName}`);
    console.log(`   Buffer size: ${(req.file.buffer.length / 1024).toFixed(2)} KB`);
    console.log(`   Content-Type: ${req.file.mimetype}`);

    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(uniqueFileName, req.file.buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: req.file.mimetype
      });

    if (uploadError) {
      console.error('❌ Supabase upload error details:');
      console.error(`   Bucket: ${bucketName}`);
      console.error(`   File: ${req.file.originalname}`);
      console.error(`   Error message: ${uploadError.message}`);
      console.error(`   Error status: ${uploadError.status}`);
      console.error(`   Error statusCode: ${uploadError.statusCode}`);
      console.error(`   Full error:`, uploadError);
      
      // Check if it's a permission error
      if (uploadError.message && uploadError.message.includes('permission')) {
        console.error('   → This is a PERMISSION error. Check bucket policies.');
      }
      if (uploadError.message && uploadError.message.includes('not found')) {
        console.error('   → This is a NOT FOUND error. Check bucket name.');
      }
      
      return res.status(400).json({
        success: false,
        message: 'Upload to Supabase failed',
        error: uploadError.message,
        status: uploadError.status,
        statusCode: uploadError.statusCode,
        bucket: bucketName,
        details: uploadError
      });
    }

    console.log(`✓ File uploaded to Supabase successfully:`, data);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(uniqueFileName);

    const publicUrl = publicUrlData.publicUrl;
    console.log(`✓ Public URL: ${publicUrl}`);

    // Generate signed URL (5 year expiry)
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(uniqueFileName, 60 * 60 * 24 * 365 * 5); // 5 years

    let signedUrl = publicUrl; // fallback to public URL
    if (!signedError && signedUrlData) {
      signedUrl = signedUrlData.signedUrl;
      console.log(`✓ Signed URL generated (5 year expiry)`);
    } else {
      console.warn(`⚠️ Could not generate signed URL, using public URL`);
    }

    console.log(`\n✓ Upload successful!\n`);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        name: uniqueFileName,
        size: req.file.size,
        url: signedUrl,
        publicUrl: publicUrl,
        bucket: bucketName
      }
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during upload',
      error: error.message
    });
  }
};
