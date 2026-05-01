# 🚀 BinTECH Deployment Quick Reference

## TL;DR - Deploy in 10 Minutes

### Phase 1: GitHub (2 min)
```bash
cd d:\tample

# Set up git config (one time)
git config user.email "YOUR_EMAIL@gmail.com"
git config user.name "Your Name"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/bintech.git
git branch -M main
git push -u origin main
# When prompted: use GitHub Personal Access Token (not password)
```

### Phase 2: Render Setup (3 min)
1. Go to [Render.com](https://render.com)
2. Sign up → Authorize GitHub
3. Dashboard → New + → Web Service
4. Select repository: `bintech`
5. Config:
   - Name: `bintech`
   - Environment: `Node`
   - Build: `npm install`
   - Start: `npm start`

### Phase 3: Environment Variables (5 min)
Add in Render "Environment" tab:
```
NODE_ENV=production
SUPABASE_URL=[your_value]
SUPABASE_ANON_KEY=[your_value]
SUPABASE_SERVICE_ROLE_KEY=[your_value]
GOOGLE_CLIENT_ID=[your_value]
GOOGLE_CLIENT_SECRET=[your_value]
GOOGLE_CALLBACK_URL=https://YOUR_RENDER_DOMAIN/auth/google/callback
VITE_GOOGLE_CLIENT_ID=[same_as_google_client_id]
JWT_SECRET=[random_32_char_string]
SESSION_SECRET=[random_32_char_string]
FRONTEND_URL=https://YOUR_RENDER_DOMAIN
```

### Phase 4: Deploy (1 min)
- Click "Deploy" in Render dashboard
- Wait for "Live" status (3-5 min)
- Visit `https://your-app-name.onrender.com`

---

## Environment Variables Explained

| Variable | Where to Get | Notes |
|----------|-------------|-------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API | URL starting with https:// |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | Public anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | Keep secret! |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth 2.0 Client IDs | Your web app's client ID |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → OAuth 2.0 Client IDs | Keep secret! |
| `JWT_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | Any random 32+ char string |
| `SESSION_SECRET` | Generate same way | Another random 32+ char string |

---

## Testing After Deployment

✅ Test these to confirm everything works:

1. **Landing Page**
   - Visit: `https://your-app.onrender.com`
   - Should load without errors

2. **Google Sign-In**
   - Click "Sign in with Google"
   - Should redirect to Google login
   - Should return to dashboard after login

3. **Dashboard**
   - After login, verify stats load
   - Check leaderboard displays

4. **Profile**
   - Update profile information
   - Test profile picture upload

5. **Admin Panel** (if credentials available)
   - Access admin dashboard
   - Test bin management

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Build fails | Check build logs, ensure all dependencies are in package.json |
| 503 Service Unavailable | Service is starting (free tier), wait 30 seconds |
| Env vars not working | Restart service after adding vars (Settings → Restart) |
| Google OAuth fails | Update GOOGLE_CALLBACK_URL in Google Cloud Console |
| Database connection error | Check Supabase URL/keys, ensure project is active |
| Cold start (slow first request) | Normal for free tier, upgrade to Starter plan to prevent |

---

## Update Code After Deployment

```bash
# Make changes locally
# Then:
git add .
git commit -m "Your changes"
git push origin main
# Render automatically redeploys!
```

---

## Files Created for Deployment

- ✅ `Procfile` - Render deployment config
- ✅ `.env.render` - Environment variables template
- ✅ `DEPLOYMENT_GUIDE.md` - Full deployment guide
- ✅ `.gitignore` - Already configured
- ✅ `package.json` - Already configured

---

## Need Help?

1. Check **Render Logs** tab for error messages
2. Review **DEPLOYMENT_GUIDE.md** in project root
3. Verify all **Environment Variables** are correct
4. Ensure **Supabase project** is active
5. Test **Google OAuth** in Google Cloud Console

---

**Deploy Status**: 🟢 Ready to Deploy!

Your project is configured and ready. Follow Phase 1-4 above to go live.
