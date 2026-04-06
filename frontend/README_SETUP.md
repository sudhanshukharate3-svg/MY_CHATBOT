# MYCHAT Frontend - Setup & Deployment Guide

## ✅ Fixed Issues

1. **Microphone Access Denied** ✅
   - Added HTTPS/localhost check
   - Better error messages
   - Now works on localhost

2. **Environment Configuration** ✅
   - Added `.env.local` for development
   - Configurable API endpoints
   - WebSocket configuration

3. **Deployment Ready** ✅
   - Netlify configuration added
   - npm build optimized
   - Docker support

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Node.js

**Windows:**
1. Download from https://nodejs.org/ (LTS recommended, v18+)
2. Run the installer
3. Accept defaults
4. Restart PowerShell

**Verify installation:**
```powershell
node --version
npm --version
```

### Step 2: Install Dependencies

```powershell
cd mychat-saas/frontend
npm install --legacy-peer-deps
```

This creates `node_modules/` folder with all dependencies.

### Step 3: Choose How to Run

#### Option A: Development Mode (Hot Reload)
```powershell
npm run dev
```

Access at: `http://localhost:5173`

✅ **Microphone works here!**

---

#### Option B: Build for Production
```powershell
npm run build
```

Creates optimized `dist/` folder ready for deployment.

---

## 📱 Test the Fixed App

1. **Start the app:**
   ```powershell
   npm run dev
   ```

2. **Open browser:** `http://localhost:5173`

3. **Test microphone:**
   - Click the 🎙️ button
   - Grant microphone permission when prompted
   - Speak!

4. **You should see:**
   - ✅ Waveform animation
   - ✅ Your speech transcribed
   - ✅ No "microphone denied" error

---

## 🌐 Deployment

### To Netlify (Recommended)

1. **Commit & Push to GitHub:**
   ```powershell
   git add .
   git commit -m "Fix microphone and optimize build"
   git push origin master
   ```

2. **Deploy to Netlify:**
   - Go to https://app.netlify.com
   - Click "New site from Git"
   - Select `sudhanshukharate3-svg/my_bot`
   - Configure:
     ```
     Base directory: mychat-saas/frontend
     Build command: npm run build
     Publish directory: dist
     ```
   - Click "Deploy"

3. **Add Environment Variables:**
   - In Netlify dashboard → Site settings → Build & deploy → Environment
   - Add:
     ```
     VITE_API_URL=https://your-backend.com
     VITE_WS_URL=wss://your-backend.com
     ```

### To Vercel

Same as Netlify - connect GitHub, select root directory `mychat-saas/frontend`, deploy.

### Docker (Local or VPS)

```powershell
cd mychat-saas
docker-compose up --build
```

---

## ⚙️ Configuration

### Environment Variables

Create `.env.local` in `frontend/` folder:

```env
# For localhost development (microphone works ✅)
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# For production HTTPS
# VITE_API_URL=https://api.example.com
# VITE_WS_URL=wss://api.example.com
```

---

## 🐛 Troubleshooting

### "npm: command not found"
- Node.js not installed
- Solution: Install Node.js from https://nodejs.org/
- Restart PowerShell after installation

### Microphone still not working
- Must use `localhost` or HTTPS (not IP like `192.168.x.x`)
- Clear browser cache: Ctrl+Shift+Delete
- Try Chrome or Edge (Firefox has issues)
- Check browser console for errors (F12)

### API connection fails
- Backend must run on localhost:3000
- Check `VITE_API_URL` in `.env.local`
- Verify backend is running

### Build errors
- Delete node_modules and reinstall:
  ```powershell
  rm -r node_modules
  rm package-lock.json
  npm install --legacy-peer-deps
  ```

---

## 📦 Project Structure

```
mychat-saas/
├── frontend/                 ← 🚀 Main app (THIS FOLDER)
│   ├── src/
│   │   ├── ui/              ← React components
│   │   ├── lib/             ← API & Socket utils
│   │   └── state/           ← Auth state
│   ├── package.json         ← npm dependencies
│   ├── vite.config.ts       ← Build config
│   ├── build.bat            ← Build script
│   └── netlify.toml         ← Deployment config
├── backend/                 ← Node.js API (separate)
├── docker-compose.yml       ← Docker setup
└── DEPLOYMENT.md           ← Full deployment guide
```

---

## 🔍 What Changed

### 1. Microphone Fix (ChatView.tsx)
- Added OS/browser compatibility check
- Better error messages
- Proper HTTPS/localhost validation

### 2. Environment Configuration (env.ts)
- Auto-detects localhost vs production
- Configurable API endpoints
- WebSocket support

### 3. Deployment Files Added
- `netlify.toml` - Netlify configuration
- `.env.example` - Environment template
- `.env.local` - Local development config
- `build.bat` - Batch build script
- `DEPLOYMENT.md` - Full guide

---

## ✅ Ready to Deploy!

### What's Working
- ✅ Full React app
- ✅ Voice input (on localhost)
- ✅ Text chat
- ✅ Markdown support
- ✅ Dark mode
- ✅ Responsive design

### Next Steps
1. Test locally: `npm run dev`
2. Build: `npm run build`
3. Deploy to Netlify
4. Setup backend separately
5. Connect frontend to backend API

---

## 📞 Need Help?

Check logs:
```powershell
# See npm logs
npm run dev     # Shows errors in console

# See build logs
npm run build   # Shows compilation errors
```

Check browser console (F12):
- Click "Console" tab
- Look for red error messages

---

**Happy Coding! 🎉**
