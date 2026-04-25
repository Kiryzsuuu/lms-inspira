# MongoDB Atlas IP Whitelist Setup

## Problem
Backend deployment succeeded but cannot connect to MongoDB Atlas because Azure App Service IPs are not whitelisted.

**Error in logs:**
```
MongooseServerSelectionError: Could not connect to any servers in your MongoDB Atlas cluster
...
Make sure your current IP address is on your Atlas cluster's IP whitelist
```

## Solution: Whitelist Azure App Service IPs

### Option A: Add Specific IPs (Recommended for Production)

1. Go to [MongoDB Atlas Console](https://cloud.mongodb.com/)
2. Navigate to: **Security** → **Network Access**
3. Click **"Add IP Address"** button (top right)
4. Add these IPs (Azure App Service outbound IPs):

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

5. Click **"Confirm"** to add each IP
6. Wait for MongoDB to process (~30 seconds)

### Option B: Allow All IPs (For Testing Only)

If you want to quickly test:
1. Go to [MongoDB Atlas Console](https://cloud.mongodb.com/)
2. Navigate to: **Security** → **Network Access**
3. Click **"Add IP Address"**
4. Enter: `0.0.0.0/0`
5. Click **"Confirm"**

⚠️ **Warning**: This allows connections from ANY IP address. Use only for development/testing, NOT production.

## What Happens After

Once IPs are whitelisted:
1. Azure App Service will automatically attempt to reconnect
2. Within 30 seconds, backend health endpoint should return `200 OK`
3. Test with: `https://lms-inspira-api.azurewebsites.net/api/health`
4. Both frontend and backend will be live ("langsung live" ✅)

## Current Status

✅ **Frontend**: Live at https://lms-inspira-web.azurewebsites.net/  
⏳ **Backend**: Running but waiting for MongoDB access

## Related Information

- **App Service**: `lms-inspira-api` (Linux, Node 20)
- **Outbound IPs from Azure**: See list above
- **MongoDB User**: `maskiryz23_db_user`
- **MongoDB Cluster**: `ac-zqhzpin` (MongoDB Atlas)
