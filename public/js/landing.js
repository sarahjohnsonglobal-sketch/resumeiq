document.addEventListener('DOMContentLoaded', () => {

  // Initialize Lucide Icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Initialize Lenis Smooth Scroll
  let lenisInstance;
  if (typeof Lenis !== 'undefined') {
    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });

    function raf(time) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // Handle smooth scrolling for local anchors (like #howItWorks)
  document.querySelectorAll('.scroll-to-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetId = btn.getAttribute('href');
      if (targetId.startsWith('#')) {
        e.preventDefault();
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          if (lenisInstance) {
            lenisInstance.scrollTo(targetElement, { offset: -20 });
          } else {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
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

});
