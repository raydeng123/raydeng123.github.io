document.addEventListener('DOMContentLoaded', () => {
  // --- DOM ELEMENTS ---
  const htmlElement = document.documentElement;
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('svg') : null;
  const header = document.querySelector('.site-nav');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const navTabs = document.getElementById('nav-tabs');

  // --- 1. DYNAMIC THEME SYSTEM (SYNCED WITH LOCAL STORAGE) ---
  const initTheme = () => {
    const savedTheme = localStorage.getItem('blog-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Victor Chen style defaults to dark theme (#0c0c0f)
    const initialTheme = savedTheme ? savedTheme : (systemPrefersDark ? 'dark' : 'dark');
    
    htmlElement.setAttribute('data-theme', initialTheme);
    updateThemeIcon(initialTheme);
  };

  const toggleTheme = () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    htmlElement.setAttribute('data-theme', targetTheme);
    localStorage.setItem('blog-theme', targetTheme);
    
    updateThemeIcon(targetTheme);
  };

  const updateThemeIcon = (theme) => {
    if (!themeIcon) return;
    if (theme === 'light') {
      // Sun icon
      themeIcon.innerHTML = `
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
      `;
    } else {
      // Moon icon
      themeIcon.innerHTML = `
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
      `;
    }
  };

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
  initTheme();

  // --- 2. RESPONSIVE MOBILE DRAWER ---
  if (mobileMenuToggle && navTabs) {
    mobileMenuToggle.addEventListener('click', () => {
      navTabs.classList.toggle('active');
      const isExpanded = navTabs.classList.contains('active');
      mobileMenuToggle.setAttribute('aria-expanded', isExpanded);
      mobileMenuToggle.innerHTML = isExpanded ? '✕' : '☰';
    });
  }

  // --- 3. PREMIUM TABS NAVIGATION & SCROLLSPY ---
  if (navTabs) {
    const tabs = navTabs.querySelectorAll('.nav-tab');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.target;
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          // Close mobile menu if expanded
          if (navTabs.classList.contains('active')) {
            navTabs.classList.remove('active');
            mobileMenuToggle.innerHTML = '☰';
          }
          
          const headerHeight = header.offsetHeight || 50;
          const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY;
          const offsetPosition = targetPosition - headerHeight;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });

    // IntersectionObserver scrollspy to set active tab as user scrolls
    const sections = document.querySelectorAll('.page-section');
    if ('IntersectionObserver' in window && sections.length > 0) {
      const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const currentSectionId = entry.target.id;
            tabs.forEach(t => {
              if (t.dataset.target === currentSectionId) {
                t.classList.add('active');
              } else {
                t.classList.remove('active');
              }
            });
          }
        });
      }, { threshold: 0.35, rootMargin: '-50px 0px 0px 0px' });

      sections.forEach(sec => scrollObserver.observe(sec));
    }
  }
});
