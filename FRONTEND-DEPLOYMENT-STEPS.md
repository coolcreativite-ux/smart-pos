# Frontend Deployment Steps for Coolify

## ✅ Pre-Deployment Checklist (COMPLETED)
- [x] All frontend files added to git (App.tsx, manifest.json, sw.js, types.ts, constants.ts)
- [x] .gitignore updated to not ignore frontend files
- [x] Changes committed and pushed to GitHub
- [x] Frontend Dockerfile configured correctly
- [x] nginx.conf configured
- [x] vite.config.ts configured with correct paths
- [x] .env.production has correct API URL

## 🚀 Deploy Frontend in Coolify

### 1. Create New Resource
- Go to your Coolify dashboard
- Click **New Resource** → **Dockerfile**
- Select **Public Repository**

### 2. Repository Configuration
- **Repository URL**: `https://github.com/coolcreativite-ux/smart-pos.git`
- **Branch**: `main`
- **Dockerfile Location**: `frontend/Dockerfile`
- **Build Context**: `frontend`

### 3. Domain Configuration
- **Domain**: `smartpos.cooldigital.africa`
- Make sure DNS is configured (A record pointing to your server IP)

### 4. Environment Variables
Add these environment variables in Coolify:

```
VITE_API_URL=https://api.smartpos.cooldigital.africa
VITE_SUPABASE_URL=https://lsujhpaxdsirlnllangt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdWpocGF4ZHNpcmxubGxhbmd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzODQyNjgsImV4cCI6MjA4NTk2MDI2OH0.PT_-sZIjMODHmcndBjH16UWbco6L0ca6BsVmbaNvQ30
VITE_GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY
```

### 5. Port Configuration
- **Port**: `80` (nginx default port)

### 6. Deploy
- Click **Deploy**
- Wait for the build to complete
- Check the logs for any errors

## 🔍 Verify Deployment

After deployment, verify:
1. Frontend is accessible at `https://smartpos.cooldigital.africa`
2. Frontend can connect to backend API at `https://api.smartpos.cooldigital.africa`
3. Login page loads correctly
4. Can create/login with superadmin account

## 🐛 Troubleshooting

### Build Fails
- Check Coolify logs for specific error
- Verify all files are in GitHub repository
- Verify Dockerfile path is correct

### Frontend Loads but Can't Connect to Backend
- Check VITE_API_URL environment variable
- Verify backend is running and healthy
- Check CORS settings in backend

### 404 Errors on Page Refresh
- Verify nginx.conf has `try_files $uri $uri/ /index.html;`
- This is already configured in `frontend/nginx.conf`

## 📝 Current Status

**Backend**: ✅ Deployed and running at `api.smartpos.cooldigital.africa`
**Frontend**: ⏳ Ready to deploy - all files committed and pushed

**Latest Commit**: `0998a8b` - "Fix: Add missing frontend files for deployment"
