# GitHub Collaboration - Quick Steps

## **LAPTOP 1 - PUSH YOUR CHANGES**

```powershell
cd "d:\DOWNLOADS\BINTECH - Copy"

# Check what changed
git status

# Save your changes
git add .
git commit -m "Your message here"

# Send to GitHub
git push origin main
```

---

## **LAPTOP 2 - GET THE LATEST CODE**

```powershell
cd path\to\BINTECH

# Download latest changes
git pull origin main

# Reinstall if package.json changed
npm install

# Start the app
npm start
```

---

## **BEFORE YOU START WORKING**

Always pull first:
```powershell
git pull origin main
```

---

## **AFTER YOU FINISH**

Always push before closing:
```powershell
git add .
git commit -m "What you did"
git push origin main
```

---

## **WORKING ON DIFFERENT FEATURES**

Create separate branches:

**Laptop 1:**
```powershell
git checkout -b feature/google-auth
# Make changes
git push -u origin feature/google-auth
```

**Laptop 2:**
```powershell
git checkout -b feature/user-profile
# Make changes
git push -u origin feature/user-profile
```

Then merge on GitHub via Pull Request.

---

## **QUICK COMMANDS**

- `git status` - See what changed
- `git pull origin main` - Get latest code
- `git push origin main` - Upload your code
- `git add .` - Stage all changes
- `git commit -m "message"` - Save locally
- `git checkout -b feature/name` - Create new branch
