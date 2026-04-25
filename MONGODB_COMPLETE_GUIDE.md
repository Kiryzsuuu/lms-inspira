# Complete MongoDB Whitelist Setup Guide

## ⚡ Quick Solution: Automated Script

We provide automated scripts to whitelist Azure IPs in MongoDB Atlas. Choose your platform:

### **For Windows (PowerShell)**
```powershell
.\add_mongodb_whitelist.ps1
```

### **For Linux/Mac (Python)**
```bash
python3 add_mongodb_whitelist.py
```

The script will prompt you for your MongoDB API credentials, then automatically add all 13 Azure IPs.

---

## 📋 Getting Your MongoDB API Credentials

### Step 1: Generate API Keys in MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click your organization name (top-left) → **Organization Settings**
3. Go to **Access Manager** (left sidebar)
4. Click **Create API Key** (top-right)
5. Give it a name (e.g., "Azure App Service Whitelist")
6. **Important**: Select permissions → Check **"Organization Project Creator"** or **"Project Owner"**
7. Click **Create**
8. **Copy and save**:
   - **Public API Key** (Public Key)
   - **Private API Key** (Private Key)

⚠️ **Save these immediately** - you won't see the Private Key again!

### Step 2: Get Organization ID

1. Still in **Organization Settings**
2. Look for **Organization ID** (copy it)

### Step 3: Get Project ID

1. Go back to [MongoDB Atlas Dashboard](https://cloud.mongodb.com/)
2. In the left sidebar, you'll see your project name under "Projects"
3. Click on your project
4. In the **Project Settings**, find **Project ID** (copy it)
   - Or in the URL: `https://cloud.mongodb.com/v2/{PROJECT_ID}/...`

---

## 🚀 Running the Automated Script

### **Windows (PowerShell)**

```powershell
cd c:\Users\Opet\Documents\CODING\lms-inspira
.\add_mongodb_whitelist.ps1

# When prompted, enter:
# - Public API Key: (paste your Public Key)
# - Private API Key: (paste your Private Key)
# - Organization ID: (paste your Org ID)
# - Project ID: (paste your Project ID)
```

### **Mac/Linux (Python)**

```bash
cd ~/path/to/lms-inspira
python3 add_mongodb_whitelist.py

# When prompted, enter the same credentials
```

### **Expected Output**

```
✅ Added: 20.205.241.35
✅ Added: 20.205.241.53
✅ Added: 20.205.241.58
...
✨ Summary: 13 successful, 0 failed

✅ All Azure IPs have been whitelisted in MongoDB Atlas!
⏳ Backend will reconnect within 30 seconds...
   Test: https://lms-inspira-api.azurewebsites.net/api/health
```

---

## ✅ Verification

Once the script completes:

1. **Wait 30 seconds** for MongoDB to propagate changes
2. **Test backend health**:
   ```bash
   curl https://lms-inspira-api.azurewebsites.net/api/health
   ```
3. **Expected response**:
   ```json
   {"ok": true}
   ```

If you see `{"ok": true}` → **✅ Success! Backend is live!**

---

## 🔧 Manual Alternative (Without Script)

If the script doesn't work, you can manually add IPs:

### Using MongoDB Atlas UI

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click your organization name → **Security** → **Network Access**
3. Click **Add IP Address**
4. Add each of these IPs:
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
5. Click **Confirm** for each IP

### Using MongoDB Atlas API (curl)

```bash
PUBKEY="your-public-key"
PRIVKEY="your-private-key"
PROJECT_ID="your-project-id"

# Example: Add first IP
curl -X POST \
  -H "Content-Type: application/json" \
  -u "$PUBKEY:$PRIVKEY" \
  -d '{"ipAddress":"20.205.241.35","comment":"Azure App Service"}' \
  https://cloud.mongodb.com/api/atlas/v1.0/groups/$PROJECT_ID/accessList
```

---

## 📞 Troubleshooting

### Script shows "API Key Invalid"
- Verify your Public and Private keys are correct
- Check that your API Key has proper permissions (Organization Project Creator)

### Still shows "Connection Refused" after whitelist
- Wait another 30 seconds (MongoDB needs time to propagate)
- Check that ALL 13 IPs were added successfully
- Verify your MONGO_URI is correct in Azure App Settings

### Script crashes with "requests module not found" (Python)
```bash
pip install requests
python3 add_mongodb_whitelist.py
```

---

## 📊 Success Checklist

- [ ] Generated MongoDB API Keys
- [ ] Copied Public Key
- [ ] Copied Private Key
- [ ] Got Organization ID
- [ ] Got Project ID
- [ ] Ran script (or manually added IPs)
- [ ] Waited 30 seconds
- [ ] Tested health endpoint
- [ ] Got `{"ok": true}` response
- [ ] Both apps are live! 🎉

---

## 🎯 Expected Timeline

1. **Prepare credentials** → 5 minutes
2. **Run script** → 1 minute
3. **Wait for MongoDB** → 30 seconds
4. **Backend online** → Immediately after
5. **Total time** → ~7 minutes

---

## 📋 Files Included

- **add_mongodb_whitelist.ps1** - PowerShell script for Windows
- **add_mongodb_whitelist.py** - Python script for Mac/Linux
- **DEPLOYMENT_STATUS.md** - Overall deployment status
- **MONGODB_WHITELIST_SETUP.md** - This file

---

**Next**: Run the appropriate script for your platform!
