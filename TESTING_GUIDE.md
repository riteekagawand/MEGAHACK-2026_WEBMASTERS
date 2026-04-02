# 🧪 Complete Testing Guide - Doctor Verification System

## ⚡ Quick Test (10 Minutes)

### **Prerequisites**
```bash
# 1. Make sure .env has GEMINI_API_KEY
GEMINI_API_KEY=AIzaSyCDGOLhQynaqr3WeYuiJ_G7Cr6w_K2lNS0

# 2. Install dependencies (if not done)
npm install

# 3. Start dev server
npm run dev
```

---

## 📋 **Test Scenario 1: Complete Flow (Legitimate Doctor)**

### **Step 1: Login**
```
URL: http://localhost:3000/login
Action: Click "Continue with Google"
Use: Any Google account (personal or test)
```

### **Step 2: Select Role**
```
Page: /select-role
Action: Click "Clinician" → "Continue as Clinician"
Result: Redirects to /medical/verification ✅
```

### **Step 3: Fill Verification Form**

#### **Professional Details:**
```
Medical License Number: MED-12345-2020
Issuing Authority: Medical Council of India
License Expiry Date: 2028-12-31
Specialization: General Medicine
Years of Experience: 5
Institution Graduated: All India Institute of Medical Sciences (AIIMS)
Graduation Year: 2018
```

#### **NMC Details (Important!):**
```
NMC Registration Number: 12345
State Medical Council: Delhi Medical Council
Primary Qualification: MBBS from AIIMS, New Delhi
```

#### **Upload Documents:**
Create 4 dummy PDF files (or use any sample documents):

**File 1: Medical License** (`medical_license.pdf`)
- Can be any PDF with text "Medical License Certificate"
- Include license number: MED-12345-2020

**File 2: Medical Degree** (`mbbs_degree.pdf`)
- Any PDF with "MBBS Degree" text
- Include institution name: AIIMS

**File 3: Government ID** (`aadhar_card.pdf`)
- Any PDF/JPG (can be blank document)
- Label it "Aadhar Card" for testing

**File 4: Registration Certificate** (`registration_cert.pdf`)
- Any PDF with "Registration Certificate"
- Include registration number: 12345

> 💡 **Pro Tip:** For real testing, scan actual medical documents. For quick testing, create simple PDFs with relevant text using Word/Google Docs → Export as PDF.

### **Step 4: Submit**
```
Action: Click "Submit Documents for Verification"
Watch: Upload progress bar (0-100%)
Expected: Success message in ~3-5 seconds
Redirect: To status page showing "Under Review"
```

### **Step 5: Trigger AI Verification**

Open a **new terminal** and run:

```bash
# Get your session cookie first:
# In browser DevTools → Application → Cookies → next-auth.session-token
# Copy the token value

curl -X POST http://localhost:3000/api/doctor/run-ai-verification \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN_HERE"
```

**Alternative (Easier):**
Just refresh the verification status page after 2-3 minutes - it auto-triggers!

### **Step 6: Check Results**

#### **In Browser:**
```
Visit: http://localhost:3000/api/doctor/verify-documents
Expected Response:
{
  "status": "verified",
  "confidenceScore": 85-95,
  "message": "Congratulations! Your credentials have been verified."
}
```

#### **In MongoDB:**
```javascript
// Open MongoDB Compass or Atlas
db.doctorverifications.findOne({ 
  email: "your-test-email@gmail.com" 
})

// Should show:
{
  verificationStatus: "verified",
  nmcStatus: "active",
  aiVerification: {
    status: "verified",
    confidenceScore: 92,
    documentAnalysis: { ... }
  }
}
```

#### **Access Dashboard:**
```
Try visiting: http://localhost:3000/medical/dashboard
Expected: Full access granted! ✅
```

---

## 📋 **Test Scenario 2: Fake Doctor (Should Be Rejected)**

### **Use Bad Data:**
```
Medical License Number: FAKE123
Issuing Authority: Fake Council
NMC Registration: 99999 (invalid format)
Council: Fake Medical Council
```

### **Upload Blurry/Fake Documents:**
- Upload random PDFs or images
- Use clearly fake documents

### **Expected Result:**
```
AI Confidence Score: < 60%
Status: "rejected"
Reason: Multiple document issues detected
Access: Still blocked from dashboard ❌
```

---

## 📋 **Test Scenario 3: NMC Mismatch**

### **Test Case:**
```
Provided NMC: 12345
But Document Shows: 67890 (different number)
```

### **Expected:**
```
Cross-check fails
Confidence reduced by 25%
Manual review required
Status: "pending"
```

---

## 🔍 **Manual Verification Checks**

### **Check Database Directly:**

```javascript
// 1. Find your verification record
db.doctorverifications.find({
  email: /your-email/
}).pretty()

// 2. Check all fields are saved
{
  _id: ObjectId("..."),
  userId: "your-email@gmail.com",
  medicalLicenseNumber: "MED-12345-2020",
  nmcRegistrationNumber: "12345",
  nmcCouncilName: "Delhi Medical Council",
  nmcQualification: "MBBS from AIIMS, New Delhi",
  nmcStatus: "active",
  documents: {
    medicalLicense: "data:application/pdf;base64,...",
    medicalDegree: "data:application/pdf;base64,...",
    governmentId: "data:application/pdf;base64,...",
    registrationCertificate: "data:application/pdf;base64,..."
  },
  aiVerification: {
    status: "verified",
    confidenceScore: 92,
    documentAnalysis: {
      medicalLicense: { verified: true, confidence: 95 },
      medicalDegree: { verified: true, confidence: 90 },
      governmentId: { verified: true, confidence: 88 },
      registrationCertificate: { verified: true, confidence: 94 }
    },
    riskFactors: []
  },
  verificationStatus: "verified"
}
```

### **Check Patient Collection:**
```javascript
db.patients.findOne({
  userId: "your-email@gmail.com"
})

// Should show:
{
  role: "clinician",
  verificationStatus: "verified",
  hasCompletedInfo: true
}
```

---

## 🎯 **API Endpoint Testing**

### **Test 1: Upload Documents**
```bash
curl -X POST http://localhost:3000/api/doctor/verify-documents \
  -F "medicalLicenseNumber=MED-12345-2020" \
  -F "licenseIssuingAuthority=Medical Council of India" \
  -F "licenseExpiryDate=2028-12-31" \
  -F "specialization=General Medicine" \
  -F "yearsOfExperience=5" \
  -F "institutionGraduated=AIIMS" \
  -F "graduationYear=2018" \
  -F "nmcRegistrationNumber=12345" \
  -F "nmcCouncilName=Delhi Medical Council" \
  -F "nmcQualification=MBBS from AIIMS" \
  -F "medicalLicense=@medical_license.pdf" \
  -F "medicalDegree=@mbbs_degree.pdf" \
  -F "governmentId=@aadhar_card.pdf" \
  -F "registrationCertificate=@registration_cert.pdf" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "message": "Documents submitted successfully for verification",
  "verificationId": "...",
  "status": "pending"
}
```

### **Test 2: Check Status**
```bash
curl http://localhost:3000/api/doctor/verify-documents \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

**Expected:**
```json
{
  "status": "pending" or "verified",
  "message": "..."
}
```

### **Test 3: Trigger AI**
```bash
curl -X POST http://localhost:3000/api/doctor/run-ai-verification \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

**Expected:**
```json
{
  "status": "verified",
  "confidenceScore": 92,
  "overallAssessment": "All documents verified successfully..."
}
```

---

## 🐛 **Common Issues & Fixes**

### **Issue 1: "Cannot access verification page"**
**Solution:**
```bash
# Clear browser cache
Ctrl + Shift + Delete → Clear cache
# Or open incognito window
Ctrl + Shift + N
```

### **Issue 2: "File upload fails"**
**Solution:**
```bash
# Check file size (must be < 5MB)
# Check file type (PDF/JPG/PNG only)
# Try smaller files
```

### **Issue 3: "GEMINI_API_KEY error"**
**Solution:**
```bash
# Verify .env file has:
GEMINI_API_KEY=AIzaSyCDGOLhQynaqr3WeYuiJ_G7Cr6w_K2lNS0

# Restart dev server
Ctrl+C
npm run dev
```

### **Issue 4: "Session token not found"**
**Solution:**
```
1. Open browser DevTools (F12)
2. Go to Application tab
3. Cookies → next-auth.session-token
4. Copy the value
5. Use in curl command
```

### **Issue 5: "MongoDB connection error"**
**Solution:**
```bash
# Check MongoDB URI in .env
MONGODB_URI=mongodb+srv://megahack123:megahack123@cluster0.pxpsxut.mongodb.net/?appName=Cluster0/Orka

# Test connection
mongosh "mongodb+srv://megahack123:megahack123@cluster0.pxpsxut.mongodb.net/"
```

---

## 📊 **What to Look For**

### **✅ Success Indicators:**
- [ ] Upload completes without errors
- [ ] Progress bar reaches 100%
- [ ] Success message appears
- [ ] Database record created
- [ ] AI verification runs (check console logs)
- [ ] Confidence score > 85%
- [ ] Status changes to "verified"
- [ ] Can access /medical/dashboard
- [ ] No redirect back to verification

### **❌ Problem Indicators:**
- [ ] Upload fails immediately
- [ ] Error messages appear
- [ ] No database record
- [ ] AI doesn't run
- [ ] Confidence < 60%
- [ ] Status stays "pending"
- [ ] Still can't access dashboard

---

## 🔍 **Debugging Tips**

### **Watch Console Logs:**
```bash
# In VS Code terminal, look for:
✅ Connected to MongoDB
Starting AI verification for: user@gmail.com
AI Verification complete: { status: 'verified', confidence: 92 }
```

### **Check Network Tab:**
```
F12 → Network tab → Look for:
POST /api/doctor/verify-documents (200 OK)
POST /api/doctor/run-ai-verification (200 OK)
GET /api/doctor/verify-documents (200 OK)
```

### **Inspect Database:**
```javascript
// Real-time monitoring
db.doctorverifications.watch()
```

---

## 🎉 **Test Checklist**

Complete this checklist to confirm everything works:

- [ ] Logged in with Google account
- [ ] Selected "Clinician" role
- [ ] Filled all professional details
- [ ] Added NMC information
- [ ] Uploaded all 4 documents
- [ ] Submit successful
- [ ] Upload progress showed 100%
- [ ] Received success confirmation
- [ ] AI verification triggered
- [ ] Confidence score > 85%
- [ ] Status = "verified"
- [ ] Can access medical dashboard
- [ ] MongoDB record exists with all fields
- [ ] NMC status = "active"

**If all checked → SYSTEM WORKING PERFECTLY!** ✅

---

## 🚀 **Next Steps After Testing**

### **Production Readiness:**
1. ✅ Replace test API keys with production keys
2. ✅ Set up email notifications (SendGrid/Resend)
3. ✅ Enable HTTPS (required for file uploads)
4. ✅ Add rate limiting (prevent abuse)
5. ✅ Set up monitoring/alerts
6. ✅ Create backup storage for documents

### **Optional Enhancements:**
- Admin dashboard for manual reviews
- Bulk verification for existing doctors
- Periodic re-verification automation
- Integration with other countries' medical councils

---

## 📞 **Need Help?**

### **Quick Debug Command:**
```bash
# Run this to check everything:
echo "=== Checking .env ===" && grep GEMINI_API_KEY .env && \
echo "=== Checking Server ===" && curl http://localhost:3000 && \
echo "=== Checking MongoDB ===" && mongosh --eval "db.doctorverifications.count()"
```

### **Logs Location:**
- VS Code Terminal (server logs)
- Browser Console (client logs)
- MongoDB Atlas (database logs)

---

## 🎯 **Summary**

**Testing takes ~10 minutes:**
1. Login (1 min)
2. Fill form (2 min)
3. Upload docs (1 min)
4. AI verification (3-5 min)
5. Check results (1 min)

**Expected outcome:**
- ✅ Verified status
- ✅ High confidence score (85%+)
- ✅ Dashboard access granted
- ✅ NMC status = active

**Ready to test!** 🚀
