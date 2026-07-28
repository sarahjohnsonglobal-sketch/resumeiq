const firebaseConfig = {
  apiKey: "AIzaSyAnpXwM5uP-AEofDIRpU93_qSinxTcsF0M",
  authDomain: "resumeiq-8af5f.firebaseapp.com",
  projectId: "resumeiq-8af5f",
  storageBucket: "resumeiq-8af5f.firebasestorage.app",
  messagingSenderId: "686911293132",
  appId: "1:686911293132:web:fb820445242ea384aea469"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const googleBtn = document.getElementById('googleSignIn');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('loginError');

      try {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        const token = await cred.user.getIdToken();
        localStorage.setItem('token', token);
        localStorage.setItem('username', cred.user.displayName || email.split('@')[0]);
        window.location.href = '/analyze.html';
      } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('signupError');

      try {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: username });
        await db.collection('users').doc(cred.user.uid).set({
          username,
          email,
          created_at: new Date().toISOString()
        });
        const token = await cred.user.getIdToken();
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        window.location.href = '/analyze.html';
      } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
      }
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      const errorDiv = document.getElementById('loginError');
      const provider = new firebase.auth.GoogleAuthProvider();
      try {
        const cred = await auth.signInWithPopup(provider);
        const user = cred.user;
        await db.collection('users').doc(user.uid).set({
          username: user.displayName,
          email: user.email,
          created_at: new Date().toISOString()
        }, { merge: true });
        const token = await user.getIdToken();
        localStorage.setItem('token', token);
        localStorage.setItem('username', user.displayName);
        window.location.href = '/analyze.html';
      } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
      }
    });
  }

  if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('signup.html')) {
    document.addEventListener('DOMContentLoaded', () => {
      updateNavForAuth();
      if (window.location.pathname.includes('analyze.html') && !getToken()) {
        window.location.href = '/login.html';
      }
    });
  }
});

function getToken() {
  return localStorage.getItem('token');
}

function logout() {
  auth.signOut();
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  window.location.href = '/login.html';
}

function updateNavForAuth() {
  const navActions = document.querySelector('.header-nav-actions');
  if (!navActions) return;
  const token = getToken();
  const username = localStorage.getItem('username');
  if (token) {
    navActions.innerHTML = `
      <span style="color: #fff; margin-right: 15px;">Hi, ${username}</span>
      <a href="analyze.html" class="btn btn-primary btn-nav" style="margin-right: 10px;"><span>Analyze</span></a>
      <button onclick="logout()" class="btn btn-secondary btn-nav" style="background: transparent; border: 1px solid var(--primary); color: #fff;"><span>Logout</span></button>
    `;
  } else {
    navActions.innerHTML = `
      <a href="login.html" class="btn btn-secondary btn-nav" style="background: transparent; border: 1px solid var(--primary); color: #fff; margin-right: 10px;"><span>Log In</span></a>
      <a href="signup.html" class="btn btn-primary btn-nav"><span>Sign Up</span></a>
    `;
  }
}
