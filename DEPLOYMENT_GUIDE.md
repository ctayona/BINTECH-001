# BinTECH Deployment Guide - Render Hosting

## 🎯 Complete Deployment Steps

### Prerequisites
1. GitHub account (free)
2. Render account (free tier available)
3. Supabase account and configured database
4. Google OAuth credentials (for authentication)

---

## Step 1️⃣: Push Code to GitHub

### 1.1 Create a GitHub Repository
1. Go to [GitHub](https://github.com/new)
2. Click "New repository"
3. Name it: `bintech`
4. Add description: "Intelligent Waste Segregation & Incentive Platform"
5. Do NOT add README, .gitignore, or license (we already have them)
6. Click "Create repository"

### 1.2 Connect Local Git to GitHub
```bash
# In your project directory (d:\tample)
cd d:\tample

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/bintech.git

# Rename branch to main
git branch -M main

# Push your code to GitHub
git push -u origin main
```

**Note**: You'll be prompted to authenticate. Use a Personal Access Token:
- Go to GitHub Settings → Developer settings → Personal access tokens → Generate new token
- Select `repo` scope
- Copy and paste the token as your password

---

## Step 2️⃣: Create Render Account & Web Service

### 2.1 Create Render Account
1. Go to [Render.com](https://render.com)
2. Sign up with GitHub account (easiest option)
3. Authorize Render to access your GitHub

### 2.2 Create New Web Service
1. Dashboard → New + → Web Service
2. Select "Build and deploy from a Git repository"
3. Connect your GitHub account if not already connected
4. Search and select `bintech` repository
5. Configure deployment settings:
   - **Name**: bintech (or your preferred name)
   - **Environment**: Node
   - **Region**: Select closest to your users (e.g., Oregon, Frankfurt)
   - **Branch**: main
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` (or `node app.js`)

---

## Step 3️⃣: Configure Environment Variables in Render

### 3.1 Add Environment Variables
In Render dashboard for your service:
1. Go to "Environment" tab
2. Click "Add Environment Variable"
3. Add each variable from below:

```
NODE_ENV              → production
SUPABASE_URL          → (from Supabase dashboard)
SUPABASE_ANON_KEY     → (from Supabase dashboard)
SUPABASE_SERVICE_ROLE_KEY → (from Supabase dashboard)
GOOGLE_CLIENT_ID      → (from Google Cloud Console)
GOOGLE_CLIENT_SECRET  → (from Google Cloud Console)
GOOGLE_CALLBACK_URL   → https://your-app.onrender.com/auth/google/callback
VITE_GOOGLE_CLIENT_ID → (same as GOOGLE_CLIENT_ID)
JWT_SECRET            → (generate random string)
SESSION_SECRET        → (generate random string)
FRONTEND_URL          → https://your-app.onrender.com
EMAIL_HOST            → smtp.gmail.com (if using Gmail)
EMAIL_PORT            → 587 (if using Gmail)
EMAIL_USER            → your-email@gmail.com (if needed)
EMAIL_PASSWORD        → your-app-password (if needed)
```

### 3.2 Generate Secure Secrets
For JWT_SECRET and SESSION_SECRET, generate random strings:
```bash
# Use Node.js to generate:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Or use any online random string generator (min 32 characters).

---

## Step 4️⃣: Update Google OAuth Callback URL

### ⚠️ IMPORTANT: Before Deployment

1. **Find Your Render URL**: 
   - Deploy first (see Step 5), then check Render dashboard
   - Format: `https://your-app-name.onrender.com`

2. **Update Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project
   - OAuth 2.0 Client IDs → Web application
   - Add authorized redirect URI: `https://your-app-name.onrender.com/auth/google/callback`
   - Save changes

3. **Add to Render Environment Variables**:
   - Set `GOOGLE_CALLBACK_URL=https://your-app-name.onrender.com/auth/google/callback`

---

## Step 5️⃣: Deploy to Render

### 5.1 Automatic Deployment
Once environment variables are set:
1. Click "Deploy" button in Render dashboard
2. Watch the build logs (should take 3-5 minutes)
3. Once "deployed" status appears, your app is live!

### 5.2 Manual Deployment (if needed)
```bash
cd d:\tample
git add .
git commit -m "Update for production deployment"
git push origin main
# Render automatically deploys on push
```

---

## Step 6️⃣: Verify Deployment

### Test These URLs:
- Landing page: `https://your-app-name.onrender.com/`
- How it works: `https://your-app-name.onrender.com/how-it-works`
- Rewards page: `https://your-app-name.onrender.com/rewards`
- Login: Check if Google OAuth works
- User dashboard: Create test account and verify

### Check Logs:
- In Render dashboard → Logs tab
- Watch for errors and debug as needed

---

## 🆘 Troubleshooting

### Build Failures
- Check build logs in Render
- Ensure all dependencies in package.json are correct
- Verify Node version compatibility

### Environment Variable Issues
- Re-check all variable names (case-sensitive)
- Ensure no extra spaces in values
- Restart service after updating variables

### Database Connection Issues
- Verify Supabase URL and keys are correct
- Check if Supabase project is active
- Ensure database tables exist

### Google OAuth Not Working
- Verify `GOOGLE_CALLBACK_URL` matches authorized redirect URI
- Check Google Cloud Console settings
- Clear browser cache and try again

### Cold Starts
- Free tier services sleep after inactivity
- First request may take 30+ seconds
- Upgrade to paid plan for no sleep

---

## 📊 Optional: Upgrade from Free to Paid

Render free tier limitations:
- Service goes to sleep after 15 minutes inactivity
- Limited memory (512MB)
- Shared database

To upgrade:
1. Go to your service in Render dashboard
2. Settings → Plan → Upgrade to Starter ($7/month)
3. This prevents sleeping and allocates dedicated resources

---

## 🔄 Continuous Deployment

After initial setup:
1. Make code changes locally
2. Commit and push to GitHub
3. Render automatically detects push and redeploys
4. Monitor deployment in Render dashboard

```bash
git add .
git commit -m "Add new feature"
git push origin main
# Automatically deploys to Render!
```

---

## 📝 Database Migrations

If you need to run database migrations after deployment:
1. Run migrations locally first
2. Test thoroughly
3. Render will use your existing Supabase database

---

## ✅ Final Checklist

- [ ] GitHub repository created and pushed
- [ ] Render account created
- [ ] Web service created in Render
- [ ] All environment variables added
- [ ] Google OAuth redirect URI updated
- [ ] Deployment successful (check Logs)
- [ ] Landing page loads
- [ ] Login/OAuth works
- [ ] Database connection works
- [ ] API endpoints respond correctly

---

## 🆘 Quick Support

For issues:
1. Check Render logs first
2. Verify environment variables match exactly
3. Ensure Supabase project is active
4. Test authentication flow
5. Check browser console for frontend errors

---

## 📞 Useful Links

- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Express.js Guide](https://expressjs.com/)
- [GitHub Push Guide](https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository)

