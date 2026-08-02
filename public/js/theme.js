// ==========================================================================
// ResumeIQ Theme Toggle — Light/Dark Mode
// ==========================================================================

// Apply saved theme immediately to prevent flash of wrong theme
(function() {
  var savedTheme = localStorage.getItem('resumeiq-theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    // Default to light mode
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();

// Global toggle handler (referenced by auth.js after nav rebuild)
function themeToggleHandler() {
  var current = document.documentElement.getAttribute('data-theme');
  var next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('resumeiq-theme', next);
  updateToggleIcon();
}

function updateToggleIcon() {
  var toggleBtn = document.getElementById('themeToggle');
  if (!toggleBtn) return;
  var current = document.documentElement.getAttribute('data-theme');
  var iconMoon = toggleBtn.querySelector('.icon-moon');
  var iconSun = toggleBtn.querySelector('.icon-sun');
  if (current === 'dark') {
    iconMoon.style.display = 'none';
    iconSun.style.display = 'block';
  } else {
    iconMoon.style.display = 'block';
    iconSun.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  var toggleBtn = document.getElementById('themeToggle');
  if (!toggleBtn) return;
  updateToggleIcon();
  toggleBtn.addEventListener('click', themeToggleHandler);
});
