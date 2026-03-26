// ═══════════════════════════════════════════════════════════════
//  index.script.js
//  Login Page — SA DTR System
//  Procurement Department | University of Baguio
// ═══════════════════════════════════════════════════════════════

// ─── State ───────────────────────────────────────────────────
let selectedRole = 'sa';

// ─── Auth: Redirect if already logged in ─────────────────────
auth.onAuthStateChanged(async (user) => {
  if (user) {
    await redirectByRole(user.uid);
  }
});

// ─── Role Toggle ──────────────────────────────────────────────
function setRole(role) {
  selectedRole = role;
  document.getElementById('role-sa').classList.toggle('active',    role === 'sa');
  document.getElementById('role-staff').classList.toggle('active', role === 'staff');
  document.getElementById('email').placeholder =
    role === 'sa' ? 'your.email@s.ubaguio.edu' : 'staff.email@ubaguio.edu';
  hideAlerts();
}

// ─── Login Handler ────────────────────────────────────────────
async function handleLogin() {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  hideAlerts();

  if (!email || !password) {
    showError('Please enter your email and password.');
    return;
  }

  setLoading(true);
  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    await redirectByRole(cred.user.uid);
  } catch (err) {
    let msg = 'Login failed. Please check your credentials.';
    if (
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/wrong-password' ||
      err.code === 'auth/invalid-credential'
    ) {
      msg = 'Invalid email or password. Please try again.';
    } else if (err.code === 'auth/too-many-requests') {
      msg = 'Too many failed attempts. Please try again later.';
    } else if (err.code === 'auth/user-disabled') {
      msg = 'Your account has been disabled. Contact admin.';
    }
    showError(msg);
  } finally {
    setLoading(false);
  }
}

// ─── Role-based Redirect ──────────────────────────────────────
async function redirectByRole(uid) {
  try {
    showInfo('Verifying account...');
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      await auth.signOut();
      showError('Account not set up in the system. Contact your admin.');
      return;
    }
    const role = userDoc.data().role;
    if (role === 'staff' || role === 'admin') {
      showInfo('Welcome! Redirecting to Admin Panel...');
      setTimeout(() => (window.location.href = 'sa-dtr-admin.html'), 800);
    } else if (role === 'sa') {
      showInfo('Welcome! Redirecting to DTR Check-In...');
      setTimeout(() => (window.location.href = 'sa-dtr-checkin.html'), 800);
    } else {
      showError('Unrecognized account role. Contact admin.');
      await auth.signOut();
    }
  } catch (err) {
    showError('Error loading account. Please try again.');
    console.error(err);
  }
}

// ─── Password Toggle ──────────────────────────────────────────
function togglePassword() {
  const input = document.getElementById('password');
  input.type  = input.type === 'password' ? 'text' : 'password';
}

// ─── Enter Key Listener ───────────────────────────────────────
document.getElementById('password').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleLogin();
});

// ─── Loading State ────────────────────────────────────────────
function setLoading(on) {
  const btn  = document.getElementById('login-btn');
  btn.disabled = on;
  btn.classList.toggle('loading', on);
}

// ─── Alert Helpers ────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById('error-alert');
  el.textContent = '⚠️ ' + msg;
  el.classList.add('show');
  document.getElementById('info-alert').classList.remove('show');
}

function showInfo(msg) {
  const el = document.getElementById('info-alert');
  el.textContent = '⏳ ' + msg;
  el.classList.add('show');
  document.getElementById('error-alert').classList.remove('show');
}

function hideAlerts() {
  document.getElementById('error-alert').classList.remove('show');
  document.getElementById('info-alert').classList.remove('show');
}
