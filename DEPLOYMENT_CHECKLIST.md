# ✅ DEPLOYMENT CHECKLIST - LMS INSPIRA v2.0

## 🎯 Pre-Deployment

### Code Review
- [ ] All new features tested locally
- [ ] No console errors
- [ ] No console warnings (critical ones)
- [ ] Code formatted and linted
- [ ] Comments added where needed
- [ ] No hardcoded credentials
- [ ] No debug code left

### Testing
- [ ] **Student Role**: All features work
- [ ] **Teacher Role**: All features work
- [ ] **Admin Role**: All features work
- [ ] **Mobile**: Responsive on all screens
- [ ] **Tablet**: Responsive on tablet
- [ ] **Desktop**: Works on all browsers
- [ ] **Cross-browser**: Chrome, Firefox, Safari, Edge

### Database
- [ ] Backup current database
- [ ] Test migrations (if any)
- [ ] Indexes created
- [ ] No orphaned data
- [ ] Connection string secure

### Environment Variables
- [ ] `.env` files configured
- [ ] Production secrets set
- [ ] API keys valid
- [ ] CORS origins correct
- [ ] MongoDB URI production-ready
- [ ] JWT secret strong (min 32 chars)

---

## 🚀 Deployment Steps

### Backend Deployment

#### 1. Prepare Backend
```bash
cd server
npm install --production
npm run build # if applicable
```

#### 2. Environment Check
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=<strong-secret>
CLIENT_ORIGIN=https://your-frontend.com
PORT=4000
MIDTRANS_SERVER_KEY=<key>
MIDTRANS_CLIENT_KEY=<key>
MIDTRANS_IS_PRODUCTION=true
```

#### 3. Deploy Backend
- [ ] Upload to server/platform
- [ ] Set environment variables
- [ ] Start application
- [ ] Check health endpoint: `/api/health`
- [ ] Verify logs

#### 4. Backend Verification
- [ ] API responds
- [ ] Database connected
- [ ] Auth works
- [ ] File uploads work
- [ ] No errors in logs

---

### Frontend Deployment

#### 1. Build Frontend
```bash
cd client
npm install
npm run build
```

#### 2. Environment Check
```env
VITE_API_BASE_URL=https://your-backend.com/api
```

#### 3. Deploy Frontend
- [ ] Upload dist folder
- [ ] Configure SPA routing
- [ ] Set environment variables
- [ ] Enable HTTPS
- [ ] Configure CDN (optional)

#### 4. Frontend Verification
- [ ] Site loads
- [ ] API calls work
- [ ] Images load
- [ ] No CORS errors
- [ ] Mobile responsive
- [ ] PWA works (if enabled)

---

## 🔍 Post-Deployment Verification

### Critical Features
- [ ] **Login/Register**: Works for all roles
- [ ] **Course List**: Displays correctly
- [ ] **Course Detail**: Opens and shows content
- [ ] **Quiz Play**: Can take quiz
- [ ] **Quiz Submit**: Submits and shows results
- [ ] **Certificate**: Generates and displays
- [ ] **Course Stats**: Shows enrollment data
- [ ] **Image Upload**: Works for questions
- [ ] **Payment**: Midtrans integration works
- [ ] **Profile**: Can view and edit

### New Features Specific
- [ ] **Certificate Generation**: Auto-generates on completion
- [ ] **Certificate View**: Displays professionally
- [ ] **Certificate Print**: Print/download works
- [ ] **Question Images**: Display in quiz
- [ ] **Question Image Upload**: Works in CourseManager
- [ ] **Course Stats Page**: Opens and shows data
- [ ] **Responsive Sidebar**: Works on mobile
- [ ] **Sidebar Toggle**: Button works

### Performance
- [ ] Page load < 3 seconds
- [ ] API response < 500ms
- [ ] Images optimized
- [ ] No memory leaks
- [ ] Database queries optimized

### Security
- [ ] HTTPS enabled
- [ ] JWT tokens secure
- [ ] API endpoints protected
- [ ] File uploads validated
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting (if applicable)

---

## 📊 Monitoring Setup

### Logs
- [ ] Backend logs configured
- [ ] Frontend error tracking
- [ ] Database logs enabled
- [ ] Log rotation setup

### Alerts
- [ ] Error alerts configured
- [ ] Performance alerts
- [ ] Uptime monitoring
- [ ] Database alerts

### Analytics
- [ ] User analytics (optional)
- [ ] Feature usage tracking
- [ ] Performance metrics
- [ ] Error tracking

---

## 🐛 Common Issues & Solutions

### Issue: CORS Error
**Solution:**
```javascript
// Backend: server/src/index.js
CLIENT_ORIGIN=https://your-frontend.com
```

### Issue: Images Not Loading
**Solution:**
- Check UPLOAD_DIR permissions
- Verify /uploads route accessible
- Check image URLs absolute

### Issue: Certificate Not Generating
**Solution:**
- Verify course completed
- Check Certificate model
- Check /api/certificates routes

### Issue: Stats Not Showing
**Solution:**
- Verify user enrolled
- Check course ID
- Verify permissions

### Issue: Mobile Sidebar Not Working
**Solution:**
- Clear browser cache
- Check viewport meta tag
- Verify Tailwind breakpoints

---

## 📱 Mobile Testing

### Devices to Test
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] iPad (Safari)
- [ ] Android Tablet (Chrome)

### Features to Test
- [ ] Navigation
- [ ] Sidebar toggle
- [ ] Forms
- [ ] Image upload
- [ ] Quiz taking
- [ ] Certificate view
- [ ] Course stats table

---

## 🔐 Security Checklist

### Authentication
- [ ] JWT tokens expire
- [ ] Refresh token implemented (if applicable)
- [ ] Password hashing (bcrypt)
- [ ] OTP secure

### Authorization
- [ ] Role-based access control
- [ ] API endpoints protected
- [ ] File access restricted
- [ ] Admin routes secured

### Data Protection
- [ ] Sensitive data encrypted
- [ ] No credentials in logs
- [ ] Database connection secure
- [ ] API keys in environment

### Input Validation
- [ ] All inputs validated
- [ ] File uploads validated
- [ ] SQL injection prevented
- [ ] XSS prevented

---

## 📈 Performance Optimization

### Frontend
- [ ] Images compressed
- [ ] Code minified
- [ ] Lazy loading implemented
- [ ] Caching configured

### Backend
- [ ] Database indexes
- [ ] Query optimization
- [ ] Response caching
- [ ] Connection pooling

### Database
- [ ] Indexes on frequent queries
- [ ] Compound indexes where needed
- [ ] No N+1 queries
- [ ] Aggregation optimized

---

## 🎓 User Communication

### Before Deployment
- [ ] Notify users of maintenance
- [ ] Announce new features
- [ ] Provide documentation
- [ ] Set expectations

### After Deployment
- [ ] Announce completion
- [ ] Share feature guide
- [ ] Collect feedback
- [ ] Monitor support requests

---

## 📞 Support Preparation

### Documentation
- [ ] User guide updated
- [ ] API documentation
- [ ] Admin guide
- [ ] Troubleshooting guide

### Support Team
- [ ] Team trained on new features
- [ ] FAQ prepared
- [ ] Known issues documented
- [ ] Escalation process ready

---

## 🔄 Rollback Plan

### If Critical Issues Found

#### 1. Immediate Actions
- [ ] Stop deployment
- [ ] Assess impact
- [ ] Notify stakeholders

#### 2. Rollback Steps
```bash
# Code rollback
git checkout v1.0-backup
npm install
npm run build

# Database rollback (if needed)
mongorestore --db lms-inspira ./backup-YYYYMMDD
```

#### 3. Verification
- [ ] Old version working
- [ ] Users can access
- [ ] Data intact
- [ ] No errors

#### 4. Post-Rollback
- [ ] Document issues
- [ ] Plan fixes
- [ ] Schedule re-deployment

---

## ✅ Final Checklist

### Before Going Live
- [ ] All tests passed
- [ ] Backup completed
- [ ] Team notified
- [ ] Documentation ready
- [ ] Monitoring setup
- [ ] Rollback plan ready

### Go Live
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Verify health checks
- [ ] Test critical paths
- [ ] Monitor logs

### Post-Launch (First 24 Hours)
- [ ] Monitor errors
- [ ] Check performance
- [ ] Review user feedback
- [ ] Fix critical issues
- [ ] Document learnings

### Post-Launch (First Week)
- [ ] Analyze usage
- [ ] Collect feedback
- [ ] Plan improvements
- [ ] Update documentation

---

## 📊 Success Metrics

### Technical
- Uptime: > 99.9%
- Response time: < 500ms
- Error rate: < 0.1%
- Page load: < 3s

### Business
- User adoption: Track new feature usage
- Completion rate: Monitor course completions
- Certificate generation: Track certificates issued
- User satisfaction: Collect feedback

---

## 🎉 Deployment Complete!

When all checkboxes are ✅:
- [ ] Celebrate! 🎊
- [ ] Thank the team
- [ ] Document lessons learned
- [ ] Plan next iteration

---

**Deployment Version:** 2.0  
**Date:** _____________  
**Deployed By:** _____________  
**Status:** ⬜ Pending | ⬜ In Progress | ⬜ Complete | ⬜ Rolled Back
