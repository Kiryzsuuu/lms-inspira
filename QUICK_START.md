# 🚀 QUICK START - Get Backend Online in 10 Minutes

## Current Status
- ✅ Frontend: https://lms-inspira-web.azurewebsites.net/ → **LIVE**
- ⏳ Backend: Waiting for MongoDB access → **30 seconds to fix**

## What's Blocking Backend
MongoDB Atlas needs 13 Azure IP addresses whitelisted. That's it!

## Solution (2 Options)

### **Option 1: Automated (Recommended - 3 minutes)**

**Windows Users:**
```powershell
cd c:\Users\Opet\Documents\CODING\lms-inspira
.\add_mongodb_whitelist.ps1
```

**Mac/Linux Users:**
```bash
cd ~/path/to/lms-inspira
python3 add_mongodb_whitelist.py
```

Then enter when prompted:
1. MongoDB Public API Key
2. MongoDB Private API Key
3. Organization ID
4. Project ID

**Done!** ✅ Backend comes online in ~30 seconds

---

### **Option 2: Manual (5 minutes)**

1. Go to https://cloud.mongodb.com/
2. Security → Network Access
3. Click "Add IP Address"
4. Add these IPs (one by one or copy-paste):
```
20.205.241.35
20.205.241.53
20.205.241.58
20.205.241.81
20.205.241.114
20.198.191.118
20.44.210.190
20.198.128.32
20.198.184.108
20.198.186.124
20.198.189.158
20.198.190.32
20.212.64.16
```

---

## Getting MongoDB API Keys (5 minutes)

1. https://cloud.mongodb.com/ → Organization Settings
2. Access Manager → Create API Key
3. Copy **Public Key** and **Private Key**
4. Get **Organization ID** from Organization Settings
5. Get **Project ID** from Project Settings or URL

📖 **Detailed**: See `MONGODB_COMPLETE_GUIDE.md`

---

## Verify It Works

After running script or adding IPs:

```bash
# Wait 30 seconds, then test:
curl https://lms-inspira-api.azurewebsites.net/api/health

# Should respond with:
# {"ok":true}
```

Or open in browser: https://lms-inspira-api.azurewebsites.net/api/health

---

## 🎉 Success = Both Apps Online

```
✅ Frontend: https://lms-inspira-web.azurewebsites.net/
✅ Backend:  https://lms-inspira-api.azurewebsites.net/api/health
✅ Status: "langsung live" ✨
```

---

## 📞 If Something Goes Wrong

- **"Connection Refused"** → Wait 30 more seconds, MongoDB needs time
- **"Script error"** → See troubleshooting in `MONGODB_COMPLETE_GUIDE.md`
- **IPs already exist** → That's OK, script shows "Already exists" - still works!

---

## File Locations

```
c:\Users\Opet\Documents\CODING\lms-inspira\
├── add_mongodb_whitelist.ps1      (Windows script)
├── add_mongodb_whitelist.py       (Mac/Linux script)
├── MONGODB_COMPLETE_GUIDE.md      (Detailed guide)
├── DEPLOYMENT_STATUS.md           (Full status report)
└── MONGODB_WHITELIST_SETUP.md     (Reference info)
```

---

**Time estimate**: 10 minutes total
**Difficulty**: Easy (just 2 steps)
**Result**: Both apps live! 🚀
