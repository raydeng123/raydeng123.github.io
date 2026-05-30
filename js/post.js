document.addEventListener('DOMContentLoaded', () => {
  // --- DOM ELEMENTS ---
  const htmlElement = document.documentElement;
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIcon = themeToggleBtn ? themeToggleBtn.querySelector('svg') : null;
  const header = document.querySelector('.site-nav');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const navLinks = document.getElementById('nav-tabs');
  const progressBar = document.getElementById('reading-progress');
  
  // Post Template targets
  const backBtn = document.getElementById('post-back-btn');
  const postCategory = document.getElementById('post-category');
  const postTitle = document.getElementById('post-title');
  const postDate = document.getElementById('post-date');
  const postReadTime = document.getElementById('post-read-time');
  const postCover = document.getElementById('post-cover');
  const postBody = document.getElementById('post-body');
  const shareBtn = document.getElementById('share-btn');

  // --- 1. THEME SWITCHER (SYNCED WITH LOCALSTORAGE) ---
  const initTheme = () => {
    const savedTheme = localStorage.getItem('blog-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
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
      themeIcon.innerHTML = `
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path>
      `;
    } else {
      themeIcon.innerHTML = `
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
      `;
    }
  };

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
  initTheme();

  // --- 2. HEADER SCROLL ACTION ---
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // --- 3. MOBILE MENU ---
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const isExpanded = navLinks.classList.contains('active');
      mobileMenuToggle.innerHTML = isExpanded ? '✕' : '☰';
    });
  }

  // --- 4. PARSE SEARCH QUERY & LOAD POST ---
  const getPostIdFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('post');
  };

  const loadPost = async () => {
    const postId = getPostIdFromURL();
    if (!postId) {
      // Redirect home if no post ID is specified
      window.location.href = 'index.html';
      return;
    }

    try {
      // Step A: Load and match registry metadata
      const registryResponse = await fetch('posts.json');
      if (!registryResponse.ok) throw new Error('Could not fetch posts metadata registry.');
      
      const postsRegistry = await registryResponse.json();
      const postMeta = postsRegistry.find(p => p.id === postId);

      if (!postMeta) {
        renderErrorState('Post not found in index.');
        return;
      }

      // Step B: Inject metadata into DOM elements
      document.title = `${postMeta.title} | Personal Blog`;
      if (postCategory) postCategory.textContent = postMeta.category;
      if (postTitle) postTitle.textContent = postMeta.title;
      if (postDate) postDate.textContent = `📅 ${formatDate(postMeta.date)}`;
      if (postReadTime) postReadTime.textContent = `⏱️ ${postMeta.readTime || '3 min read'}`;
      
      if (postCover) {
        postCover.src = postMeta.coverImage;
        postCover.alt = postMeta.title;
      }

      // Step C: Fetch raw Markdown article
      const contentResponse = await fetch(`posts/${postId}.md`);
      if (!contentResponse.ok) throw new Error('Markdown content file not found.');
      
      const rawMarkdown = await contentResponse.text();

      // Step D: Parse Markdown using CDN marked.js library
      if (typeof marked === 'undefined') {
        throw new Error('Markdown parser (marked.js) was not loaded correctly.');
      }

      // Render parsed Markdown to body
      // We skip the first H1 header line in the Markdown file, as it is already displayed in our custom title layout.
      let refinedMarkdown = rawMarkdown;
      refinedMarkdown = refinedMarkdown.replace(/^\s*#\s+.+?\r?\n/, '');

      postBody.innerHTML = marked.parse(refinedMarkdown);

      // Trigger scroll progress calculations
      setupReadingProgress();

    } catch (error) {
      console.error('Error loading article:', error);
      renderErrorState(error.message);
    }
  };


  const renderErrorState = (msg) => {
    if (postBody) {
      postBody.innerHTML = `
        <div class="no-results" style="margin-top: 2rem;">
          <h3>Failed to load article</h3>
          <p>${msg}</p>
          <a href="index.html" class="btn btn-secondary" style="margin-top: 1.5rem;">Return Home</a>
        </div>
      `;
    }
    if (postCover) postCover.style.display = 'none';
  };

  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  // --- 5. READING PROGRESS BAR ENGINE ---
  const setupReadingProgress = () => {
    const updateProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const scrolled = (window.scrollY / scrollHeight) * 100;
        if (progressBar) progressBar.style.width = `${scrolled}%`;
      }
    };

    window.addEventListener('scroll', updateProgress);
    window.addEventListener('resize', updateProgress);
    updateProgress(); // Initial run
  };

  // --- 6. MODERN SOCIAL SHARING ACTION ---
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const shareData = {
        title: document.title,
        url: window.location.href
      };

      try {
        if (navigator.share) {
          // Native mobile sharing
          await navigator.share(shareData);
        } else {
          // Clipboard copy fallback
          await navigator.clipboard.writeText(window.location.href);
          
          const originalText = shareBtn.innerHTML;
          shareBtn.innerHTML = '✓ Link Copied!';
          shareBtn.style.borderColor = '#10b981';
          shareBtn.style.color = '#10b981';
          
          setTimeout(() => {
            shareBtn.innerHTML = originalText;
            shareBtn.style.borderColor = '';
            shareBtn.style.color = '';
          }, 2000);
        }
      } catch (err) {
        console.error('Sharing failed:', err);
      }
    });
  }

  // Load the article when page fires
  loadPost();
});
