# 🔥 Firebase Setup Guide — SA DTR System (Procurement)

## Overview
Your DTR system now runs entirely on Firebase — no Python server needed.
Real-time sync across all devices and phones.

---

## 📋 File List
| File | Purpose |
|------|---------|
| `sa-dtr-login.html` | Login page (SA + Staff) |
| `sa-dtr-checkin.html` | Check-in / Check-out terminal |
| `sa-dtr-admin.html` | Admin monitoring panel (Staff only) |
| `sa-dtr-styles.css` | Keep for legacy / reference |

---

## 🚀 Step 1 — Create Firebase Project

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"**
3. Name it `sa-dtr-procurement` (or any name)
4. Disable Google Analytics (optional) → **Create project**

---

## 🔐 Step 2 — Enable Authentication

1. In Firebase Console → **Authentication** → **Get started**
2. Go to **Sign-in method** tab
3. Enable **Email/Password** provider → Save

---

## 🗄️ Step 3 — Create Firestore Database

1. Firebase Console → **Firestore Database** → **Create database**
2. Choose **Start in production mode** → Next
3. Select your location (e.g., `asia-southeast1` for Philippines) → **Enable**

---

## 🔑 Step 4 — Get Firebase Config

1. Firebase Console → **Project Settings** (gear icon)
2. Under **"Your apps"** → click **"</>"** (Web)
3. Register app as `sa-dtr-web`
4. Copy the `firebaseConfig` object:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123:web:abc123"
   };
   ```

5. **Replace `YOUR-API-KEY` and all placeholder values** in all 3 HTML files.
   There are 3 files, each has a `firebaseConfig` block — update all 3.

---

## 📐 Step 5 — Set Firestore Rules

Go to Firestore → **Rules** tab, paste this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: check if user is logged in
    function isLoggedIn() {
      return request.auth != null;
    }

    // Helper: check if user is staff/admin
    function isStaff() {
      return isLoggedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['staff', 'admin'];
    }

    // Users collection: each user can read own doc; staff can read all
    match /users/{uid} {
      allow read: if isLoggedIn() && (request.auth.uid == uid || isStaff());
      allow write: if isStaff();
    }

    // Student Assistants: readable by all logged-in; writable by staff
    match /studentAssistants/{id} {
      allow read: if isLoggedIn();
      allow write: if isStaff();
    }

    // Procurement Staff: readable/writable by staff
    match /staff/{id} {
      allow read: if isLoggedIn();
      allow write: if isStaff();
    }

    // Shifts: readable by all logged-in
    match /shifts/{id} {
      allow read: if isLoggedIn();
      allow write: if isStaff();
    }

    // SA DTR Records
    match /dtrRecords/{id} {
      allow read: if isLoggedIn();
      allow create: if isLoggedIn();
      allow update: if isLoggedIn();
      allow delete: if isStaff();
    }

    // Staff DTR Records
    match /staffDtrRecords/{id} {
      allow read: if isLoggedIn();
      allow create: if isLoggedIn();
      allow update: if isLoggedIn();
      allow delete: if isStaff();
    }
  }
}
```

Click **Publish**.

---

## 🌱 Step 6 — Seed Initial Data

### A) Seed Shifts
In Firestore → **Add collection** → `shifts`
Add 4 documents (Document ID = the shift key):

| Document ID    | Fields |
|----------------|--------|
| `First Shift`  | label: "Morning Shift (7:00 AM - 12:00 NN)", expected_start: "07:00", expected_end: "12:00", duration_hours: 5, allows_custom: false |
| `Second Shift` | label: "Afternoon Shift (12:00 NN - 5:00 PM)", expected_start: "12:00", expected_end: "17:00", duration_hours: 5, allows_custom: false |
| `Third Shift`  | label: "Broken Schedule (Custom Time)", expected_start: "08:00", expected_end: "17:00", duration_hours: 7, allows_custom: true |
| `Whole Day`    | label: "Whole Day (7:00 AM - 5:00 PM)", expected_start: "07:00", expected_end: "17:00", duration_hours: 9, allows_custom: false |

### B) Create First Admin Account (You!)
1. Firebase Console → **Authentication** → **Add user**
2. Enter your email and a strong password
3. Copy the **UID** shown after creation

Then in Firestore → `staff` collection → Add document with ID `STF001`:
```
id: STF001
first_name: [Your first name]
last_name: [Your last name]
position: Department Head / Admin
email: [your email]
phone: [your phone]
status: Active
department: Procurement
created_at: [today's date ISO]
```

Then in Firestore → `users` collection → Add document with ID = your UID:
```
role: admin
personId: STF001
name: [Your Full Name]
email: [your email]
```

---

## 👤 Step 7 — Create SA & Staff Accounts

After logging in as admin, use the **Admin Panel**:
- **"Student Assistants"** → **"+ Add SA"** button
- **"Procurement Staff"** → **"+ Add Staff"** button

⚠️ **Note:** When you add new accounts through the admin panel, Firebase Auth will switch to the new user's session. You'll need to log back in after each creation. This is a Firebase limitation — for production, use Firebase Admin SDK or Firebase Console to create users.

**Alternative:** Create accounts directly in Firebase Console → Authentication, then add their documents manually in Firestore.

---

## 📱 Step 8 — Accessing from Any Device

### Option A: Host on Firebase Hosting (Recommended, FREE)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Run: `firebase login`
3. In your project folder: `firebase init hosting`
4. Deploy: `firebase deploy`
5. Share the URL (e.g., `https://your-project.web.app`) with everyone!

### Option B: Host on any web server
Upload all HTML files + CSS files + `ush_logo.png` to any web server or hosting.

### Option C: Local Network Only
Run a simple Python server on one PC:
```
python -m http.server 8080
```
Access via `http://[your-PC-IP]:8080/sa-dtr-login.html` on all devices on the same WiFi.

---

## 🗂️ Firestore Collections Reference

| Collection | Description |
|------------|-------------|
| `users` | Firebase Auth UID → role mapping |
| `studentAssistants` | SA profiles (SA001, SA002...) |
| `staff` | Staff profiles (STF001, STF002...) |
| `shifts` | Shift definitions |
| `dtrRecords` | SA check-in/out records |
| `staffDtrRecords` | Staff check-in/out records |

---

## 🔄 How Roles Work

| Role | Can Access | Can Do |
|------|-----------|--------|
| `sa` | Check-in/out page | Record own attendance |
| `staff` | Check-in/out + Admin panel | Record own attendance + Monitor all |
| `admin` | Check-in/out + Admin panel | Full access including account management |

---

## ❓ Troubleshooting

**"Permission denied" errors** → Check Firestore Rules (Step 5)  
**Can't log in** → Verify email/password in Firebase Auth console  
**Data not showing** → Check `firebaseConfig` is correctly pasted in all 3 HTML files  
**Real-time not working** → Check browser console for Firebase errors  
