var firebaseConfig = {
  apiKey: "AIzaSyAnpXwM5uP-AEofDIRpU93_qSinxTcsF0M",
  authDomain: "resumeiq-8af5f.firebaseapp.com",
  projectId: "resumeiq-8af5f",
  storageBucket: "resumeiq-8af5f.firebasestorage.app",
  messagingSenderId: "686911293132",
  appId: "1:686911293132:web:fb820445242ea384aea469"
};

firebase.initializeApp(firebaseConfig);
var auth = firebase.auth();
var db = firebase.firestore();

document.addEventListener('DOMContentLoaded', function() {
  var loginForm = document.getElementById('loginForm');
  var signupForm = document.getElementById('signupForm');
  var googleBtn = document.getElementById('googleSignIn');

  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = document.getElementById('email').value;
      var password = document.getElementById('password').value;
      var errorDiv = document.getElementById('loginError');

      auth.signInWithEmailAndPassword(email, password).then(function(cred) {
        return cred.user.getIdToken().then(function(token) {
          localStorage.setItem('token', token);
          localStorage.setItem('username', cred.user.displayName || email.split('@')[0]);
          window.location.href = '/analyze.html';
        });
      }).catch(function(err) {
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
      });
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var username = document.getElementById('username').value;
      var email = document.getElementById('email').value;
      var password = document.getElementById('password').value;
      var errorDiv = document.getElementById('signupError');

      auth.createUserWithEmailAndPassword(email, password).then(function(cred) {
        return cred.user.updateProfile({ displayName: username }).then(function() {
          return db.collection('users').doc(cred.user.uid).set({
            username: username,
            email: email,
            created_at: new Date().toISOString()
          });
        }).then(function() {
          return cred.user.getIdToken();
        }).then(function(token) {
          localStorage.setItem('token', token);
          localStorage.setItem('username', username);
          window.location.href = '/analyze.html';
        });
      }).catch(function(err) {
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
      });
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener('click', function() {
      var errorDiv = document.getElementById('loginError');
      var provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider).then(function(cred) {
        var user = cred.user;
        return db.collection('users').doc(user.uid).set({
          username: user.displayName,
          email: user.email,
          created_at: new Date().toISOString()
        }, { merge: true }).then(function() {
          return user.getIdToken();
        }).then(function(token) {
          localStorage.setItem('token', token);
          localStorage.setItem('username', user.displayName);
          window.location.href = '/analyze.html';
        });
      }).catch(function(err) {
        errorDiv.textContent = err.message;
        errorDiv.style.display = 'block';
      });
    });
  }

  updateNavForAuth();
});

function getToken() {
  return localStorage.getItem('token');
}

function logout() {
  auth.signOut().then(function() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login.html';
  }).catch(function() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login.html';
  });
}

function updateNavForAuth() {
  var navActions = document.querySelector('.header-nav-actions');
  if (!navActions) return;
  var token = getToken();
  var username = localStorage.getItem('username');
  if (token) {
    navActions.innerHTML =
      '<span style="color: #fff; margin-right: 15px;">Hi, ' + username + '</span>' +
      '<a href="analyze.html" class="btn btn-primary btn-nav" style="margin-right: 10px;"><span>Analyze</span></a>' +
      '<button onclick="logout()" class="btn btn-secondary btn-nav" style="background: transparent; border: 1px solid var(--primary); color: #fff;"><span>Logout</span></button>';
  } else {
    navActions.innerHTML =
      '<a href="login.html" class="btn btn-secondary btn-nav" style="background: transparent; border: 1px solid var(--primary); color: #fff; margin-right: 10px;"><span>Log In</span></a>' +
      '<a href="signup.html" class="btn btn-primary btn-nav"><span>Sign Up</span></a>';
  }
}
