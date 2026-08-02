document.addEventListener('DOMContentLoaded', () => {

  // Material Symbols icons load automatically via CSS — no JS initialization needed.

  // Handle smooth scrolling for local anchors
  document.querySelectorAll('.scroll-to-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = btn.getAttribute('href');
      if (targetId.startsWith('#')) {
        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Handle Role Card selections - redirect to analyze.html with keywords
  document.querySelectorAll('.role-card').forEach(card => {
    card.addEventListener('click', () => {
      const keywords = card.getAttribute('data-keywords');
      if (keywords) {
        window.location.href = `analyze.html?keywords=${encodeURIComponent(keywords)}`;
      }
    });
  });

  // Intersection Observer for scroll-triggered animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('opacity-100', 'translate-y-0');
        entry.target.classList.remove('opacity-0', 'translate-y-10');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('section').forEach(section => {
    section.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-10');
    observer.observe(section);
  });

  // Header scroll effect
  window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 20) {
      header.classList.add('shadow-md');
    } else {
      header.classList.remove('shadow-md');
    }
  });

});
