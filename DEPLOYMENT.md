# MYCHAT APP - Deployment & Setup Guide

## Quick Start - Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Option 1: Development Mode (Fastest)

```bash
# Install dependencies
cd mychat-saas/frontend
npm install

# Start development server (uses localhost)
npm run dev
```

Access at: `http://localhost:5173` (Vite dev server)

✅ **Microphone will work** because localhost is allowed by browsers

---

### Option 2: Production Build

```bash
cd mychat-saas/frontend
npm install
npm run build

# Output will be in 'dist' folder - ready to deploy
```

---

## Deployment Options

### 1. **Netlify** (Recommended for Frontend Only)

The frontend is fully configured for Netlify deployment.

**Steps:**
1. Push code to GitHub: Done ✅
2. Go to [netlify.com](https://app.netlify.com)
3. Click "New site from Git"
4. Select your `my_bot` repository
5. Configure:
   - **Base directory:** `mychat-saas/frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Click "Deploy"

**Environment Variables** (add in Netlify settings):
```
VITE_API_URL=https://your-backend-url.com
VITE_WS_URL=wss://your-backend-url.com
```

### 2. **Vercel** (Alternative)

Works the same way as Netlify:
1. Go to [vercel.com](https://vercel.com)
2. Connect your GitHub repo
3. Select `mychat-saas/frontend` as root directory
4. Deploy

### 3. **Docker (Local or Server)**

```bash
cd mychat-saas
docker-compose up --build
```

Runs both frontend and backend in containers.

---

## Important Notes

### ⚠️ Microphone Access

Microphone input **requires**:
- ✅ HTTPS (production)
- ✅ localhost / 127.0.0.1 (development)
- ❌ HTTP on non-localhost IP (e.g., 192.168.x.x) - **Not allowed by browsers**

**If running on local IP (192.168.0.106):**
- Type messages instead of using microphone
- Or setup HTTPS with SSL certificates
- Or use localhost only

### API Configuration

The frontend automatically connects to:
- **Localhost:** `http://localhost:3000` (backend must run on port 3000)
- **Remote:** Set `VITE_API_URL` environment variable

For the backend to work, you need to run it separately (see `mychat-saas/backend` README)

---

## Full Stack Setup

### Frontend + Backend (Local Development)

**Terminal 1 - Backend:**
```bash
cd mychat-saas/backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd mychat-saas/frontend
npm install
npm run dev
```

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

Both support microphone on localhost! ✅

---

## Troubleshooting

### Microphone still denied?
1. Clear browser cache
2. Check if running on localhost or HTTPS
3. Check browser console for specific error
4. Use Chrome or Edge (Firefox has bugs with SpeechRecognition)

### API calls failing?
1. Backend must be running on port 3000
2. Check `VITE_API_URL` environment variable
3. Check CORS headers in backend

### Build fails?
```bash
cd mychat-saas/frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## Production Checklist

- [ ] Backend deployed and running
- [ ] HTTPS enabled on backend
- [ ] `VITE_API_URL` set to production backend
- [ ] `VITE_WS_URL` set to production WebSocket URL
- [ ] Database configured and migrations run
- [ ] Environment variables set in hosting platform
- [ ] Test microphone works (Chrome/Edge on HTTPS)
- [ ] Test all API endpoints

---

## Useful Commands

```bash
# Build frontend
npm run build

# Preview built app
npm run preview

# Type check
npm run tsc -b

# Clean dependencies
rm -rf node_modules package-lock.json
npm install
```

---

**Questions?** Check the backend README in `mychat-saas/backend/`
