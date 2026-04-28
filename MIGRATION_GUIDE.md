# 🔄 MIGRATION GUIDE - Update ke Versi 2.0

## Overview

Guide ini untuk update dari versi lama ke versi 2.0 dengan fitur-fitur baru.

---

## ⚠️ BACKUP DULU!

**PENTING:** Sebelum melakukan update, backup database dan code:

```bash
# Backup MongoDB
mongodump --db lms-inspira --out ./backup-$(date +%Y%m%d)

# Backup code
git commit -am "Backup before v2.0 update"
git tag v1.0-backup
```

---

## 📦 Update Steps

### 1. Pull Latest Code

```bash
git pull origin main
# atau
git checkout main
git pull
```

### 2. Install Dependencies

```bash
# Backend
cd server
npm install

# Frontend  
cd client
npm install
```

### 3. Database Migration

#### A. Certificate Collection
Tidak perlu migration manual. Collection akan dibuat otomatis saat pertama kali generate certificate.

#### B. Question Schema Update
Existing questions akan tetap work. Field `imageUrl` optional dengan default empty string.

**Tidak perlu migration script!** Existing data aman.

### 4. Environment Variables

Check `.env` files, tidak ada variable baru yang required.

Existing variables:
```env
# Backend (.env)
MONGO_URI=mongodb://localhost:27017/lms-inspira
JWT_SECRET=your-secret-key
CLIENT_ORIGIN=http://localhost:5173
PORT=4000

# Frontend (.env)
VITE_API_BASE_URL=http://localhost:4000/api
```

### 5. Test Run

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 6. Verify Features

- [ ] Login works
- [ ] Existing courses visible
- [ ] Existing quizzes work
- [ ] New features accessible

---

## 🔍 Compatibility Check

### Backward Compatibility

✅ **100% Backward Compatible**

- Existing users: No changes needed
- Existing courses: Work as before
- Existing quizzes: Work as before
- Existing questions: Work without images
- Existing enrollments: Preserved

### New Features (Opt-in)

- ✅ Certificates: Auto-generated on course completion
- ✅ Question images: Optional, add when needed
- ✅ Course stats: Available for all courses
- ✅ Responsive sidebar: Automatic

---

## 📊 Data Migration (Optional)

### Generate Certificates for Completed Courses

Jika ada students yang sudah complete courses sebelum update, generate certificates:

```javascript
// Run this script in MongoDB shell or create a Node script

// Example: Generate certificates for all completed courses
db.users.find({ completedCourseIds: { $exists: true, $ne: [] } }).forEach(user => {
  user.completedCourseIds.forEach(courseId => {
    const course = db.courses.findOne({ _id: courseId });
    if (course) {
      db.certificates.insertOne({
        userId: user._id,
        courseId: courseId,
        certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        issuedAt: new Date(),
        completionDate: new Date(),
        score: 0,
        metadata: {
          userName: user.fullName || user.name,
          courseName: course.title,
          instructorName: 'LMS Inspira'
        }
      });
    }
  });
});
```

**Note:** Script ini optional. Certificates akan auto-generate saat student complete course.

---

## 🔧 Troubleshooting

### Issue: Module not found

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Database connection error

**Solution:**
```bash
# Check MongoDB running
mongod --version
# or
docker ps | grep mongo

# Restart MongoDB
# Linux/Mac:
sudo systemctl restart mongod
# Docker:
docker restart lms2-mongo
```

### Issue: Port already in use

**Solution:**
```bash
# Find process using port
# Linux/Mac:
lsof -i :4000
lsof -i :5173

# Windows:
netstat -ano | findstr :4000
netstat -ano | findstr :5173

# Kill process or change port in .env
```

### Issue: CORS error

**Solution:**
Check `CLIENT_ORIGIN` in backend `.env` matches frontend URL:
```env
CLIENT_ORIGIN=http://localhost:5173
```

---

## 🚀 Deployment Update

### Development → Production

#### 1. Build Frontend
```bash
cd client
npm run build
```

#### 2. Update Backend
```bash
cd server
# No changes needed, just restart
pm2 restart lms-api
# or
npm start
```

#### 3. Update Environment Variables

Production `.env`:
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/lms-inspira
JWT_SECRET=production-secret-key
CLIENT_ORIGIN=https://your-domain.com
```

#### 4. Deploy

**Azure App Service:**
```bash
# Backend
az webapp deployment source config-zip \
  --resource-group your-rg \
  --name your-backend-app \
  --src backend.zip

# Frontend
az webapp deployment source config-zip \
  --resource-group your-rg \
  --name your-frontend-app \
  --src frontend.zip
```

**Other Platforms:**
- Vercel: `vercel --prod`
- Netlify: `netlify deploy --prod`
- Heroku: `git push heroku main`

---

## 📝 Post-Migration Checklist

### Immediate (Day 1):
- [ ] All users can login
- [ ] Courses load correctly
- [ ] Quizzes work
- [ ] New features accessible
- [ ] Mobile responsive
- [ ] No console errors

### Short-term (Week 1):
- [ ] Monitor error logs
- [ ] Check certificate generation
- [ ] Verify course stats accuracy
- [ ] Test image uploads
- [ ] Collect user feedback

### Long-term (Month 1):
- [ ] Performance monitoring
- [ ] Database optimization
- [ ] User adoption of new features
- [ ] Plan next enhancements

---

## 🔄 Rollback Plan

Jika ada masalah serius:

### 1. Rollback Code
```bash
git checkout v1.0-backup
npm install
npm run dev
```

### 2. Restore Database
```bash
mongorestore --db lms-inspira ./backup-YYYYMMDD/lms-inspira
```

### 3. Verify
- Test critical features
- Check user access
- Verify data integrity

---

## 📞 Support

### Before Migration:
- Review this guide completely
- Test in development first
- Prepare rollback plan

### During Migration:
- Monitor logs closely
- Have backup ready
- Test each step

### After Migration:
- Monitor for 24-48 hours
- Collect user feedback
- Document any issues

---

## 🎯 Success Criteria

Migration successful when:
- ✅ All existing features work
- ✅ New features accessible
- ✅ No data loss
- ✅ No performance degradation
- ✅ Users can access system
- ✅ Mobile responsive works
- ✅ No critical errors

---

## 📚 Additional Resources

- [FITUR_BARU_SUMMARY.md](./FITUR_BARU_SUMMARY.md) - Detailed feature documentation
- [QUICK_START_FITUR_BARU.md](./QUICK_START_FITUR_BARU.md) - Quick start guide
- [README.md](./README.md) - Main documentation

---

**Migration Version:** 1.0 → 2.0  
**Date:** 2025  
**Status:** ✅ Tested & Ready
