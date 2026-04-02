# 🚀 **QUICK TEST - 5 Minutes**

## ⚡ Fastest Way to Test

### **1. Start Server**
```bash
npm run dev
```

### **2. Open Browser**
```
http://localhost:3000/login
```

### **3. Login**
- Click "Continue with Google"
- Sign in with ANY Google account

### **4. Select Role**
- Click "Clinician"
- You'll go to verification page

### **5. Fill This Data** (Copy-Paste)

#### Professional Info:
```
Medical License Number: MED-12345-2020
Issuing Authority: Medical Council of India  
License Expiry: December 31, 2028
Specialization: General Medicine
Years of Experience: 5
Institution: All India Institute of Medical Sciences
Graduation Year: 2018
```

#### NMC Details:
```
NMC Registration: 12345
State Council: Delhi Medical Council
Qualification: MBBS from AIIMS
```

#### Documents:
Create 4 simple PDFs:
1. Open Word/Google Docs
2. Type "Medical License Certificate - MED-12345-2020"
3. Save as PDF → `license.pdf`
4. Repeat for other 3 files with different text

Upload all 4 files.

### **6. Submit**
- Click "Submit Documents for Verification"
- Wait for success message (~3 seconds)
- Upload progress should hit 100%

### **7. Wait 2-3 Minutes**
- AI automatically runs verification
- Or refresh the status page

### **8. Check Result**
Visit: `http://localhost:3000/api/doctor/verify-documents`

**Expected:**
```json
{
  "status": "verified",
  "confidenceScore": 85-95
}
```

### **9. Test Access**
Try: `http://localhost:3000/medical/dashboard`

**Should work!** ✅

---

## 🎯 **That's It!**

If you see:
- ✅ Success message after upload
- ✅ Status = "verified" 
- ✅ Can access dashboard

**System is working perfectly!** 🎉

---

## 🐛 **Problems?**

### Upload fails?
→ Check files are < 5MB and PDF/JPG format

### Can't access dashboard?
→ Wait longer for AI verification (takes 2-5 min)

### API key error?
→ Make sure `GEMINI_API_KEY` is in `.env`

---

## 📊 **Visual Test Flow**

```
Login → Select Clinician → Fill Form → Upload Docs → Submit
                                                    ↓
Access Dashboard ← Verified ← AI Checks ← Wait 2-3 min
```

**Total Time: ~5-7 minutes** ⏱️

---

## 💡 **Pro Tips**

1. **Use real documents** if you have them for best testing
2. **Check MongoDB** to see all saved data
3. **Watch console logs** to see AI verification steps
4. **Test with bad data** too to see rejection logic

---

## 🎉 **Success!**

When verified, try accessing:
- `/medical/dashboard` ✅
- `/medical/diagnosis` ✅  
- `/medical/analytics` ✅

All should work now! Doctor verification complete! 🏆
