// auth.js
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('loginError');
      
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('username', data.username);
          window.location.href = '/analyze.html';
        } else {
          errorDiv.textContent = data.error || 'Login failed';
          errorDiv.style.display = 'block';
        }
      } catch (err) {
        errorDiv.textContent = 'Network error. Please try again later.';
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
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          // Auto login or redirect to login
          window.location.href = '/login.html';
        } else {
          errorDiv.textContent = data.error || 'Signup failed';
          errorDiv.style.display = 'block';
        }
      } catch (err) {
        errorDiv.textContent = 'Network error. Please try again later.';
        errorDiv.style.display = 'block';
      }
    });
  }
});

function getToken() {
  return localStorage.getItem('token');
}

function logout() {
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
      <a href="analyze.html" class="btn btn-primary btn-nav" style="margin-right: 10px;">
        <span>Analyze</span>
      </a>
      <button onclick="logout()" class="btn btn-secondary btn-nav" style="background: transparent; border: 1px solid var(--primary); color: #fff;">
        <span>Logout</span>
      </button>
    `;
  } else {
    navActions.innerHTML = `
      <a href="login.html" class="btn btn-secondary btn-nav" style="background: transparent; border: 1px solid var(--primary); color: #fff; margin-right: 10px;">
        <span>Log In</span>
      </a>
      <a href="signup.html" class="btn btn-primary btn-nav">
        <span>Sign Up</span>
      </a>
    `;
  }
}

// Call on load for any page that includes this script
if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('signup.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        updateNavForAuth();
        
        // Protect analyze page
        if (window.location.pathname.includes('analyze.html') && !getToken()) {
            window.location.href = '/login.html';
        }
    });
}
