/**
 * Google Translate Banner Cleanup Utility
 * 
 * This utility hides the Google Translate banner while keeping translation functionality working.
 * It uses MutationObserver to continuously monitor and remove Google's injected elements.
 * 
 * Features:
 * - Hides .goog-te-banner-frame and .goog-te-balloon-frame
 * - Prevents body margin-top injection
 * - Removes inline styles Google adds to body/html
 * - Works in SPA (React/Next.js) environments
 * - Does NOT disable translation functionality
 */

/**
 * Resets body and html inline styles that Google Translate injects
 */
const resetBodyStyles = () => {
  // Reset html element
  if (document.documentElement) {
    document.documentElement.style.marginTop = '0px';
    document.documentElement.style.top = '0px';
  }
  
  // Reset body element
  if (document.body) {
    document.body.style.marginTop = '0px';
    document.body.style.top = '0px';
    document.body.style.position = '';
  }
};

/**
 * Hides all Google Translate banner and balloon frames
 */
const hideBannerFrames = () => {
  const selectors = [
    '.goog-te-banner-frame',
    '.goog-te-balloon-frame',
    'iframe.goog-te-banner-frame',
    '.goog-tooltip',
    'iframe.goog-te-banner-frame.skiptranslate'
  ];
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      // Use setProperty with important flag to override inline styles
      element.style.setProperty('display', 'none', 'important');
      element.style.setProperty('visibility', 'hidden', 'important');
      element.style.setProperty('height', '0px', 'important');
      element.style.setProperty('min-height', '0px', 'important');
      element.style.setProperty('border', '0px', 'important');
      element.style.setProperty('margin', '0px', 'important');
      element.style.setProperty('padding', '0px', 'important');
      
      // Optional: Remove from DOM entirely (aggressive approach)
      // element.remove();
    });
  });
};

/**
 * Injects CSS styles to hide Google Translate banner elements
 * This provides a first line of defense before MutationObserver kicks in
 */
const injectStyles = () => {
  const styleId = 'google-translate-cleanup-styles';
  
  // Check if styles already exist
  if (document.getElementById(styleId)) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    /* Reset body and html positioning */
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      top: 0 !important;
    }
    
    /* Hide Google Translate banner, balloon, and tooltip frames */
    .goog-te-banner-frame,
    .goog-te-balloon-frame,
    iframe.goog-te-banner-frame,
    .goog-tooltip,
    .goog-tooltip:hover {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      min-height: 0 !important;
      border: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* Ensure body isn't pushed down */
    body {
      position: relative !important;
      margin-top: 0 !important;
      top: 0 !important;
    }
    
    /* Hide the "Show original" link that sometimes appears */
    .goog-te-menu-value span:first-child {
      display: none !important;
    }
    
    /* Optional: Hide the Google branding */
    .goog-logo-link {
      display: none !important;
    }
    
    /* Hide text highlight boxes */
    .goog-text-highlight {
      background-color: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }
  `;
  
  document.head.appendChild(style);
};

/**
 * Main cleanup function that sets up MutationObserver and initial cleanup
 * @returns {Function} Cleanup function to disconnect observer
 */
export function cleanupGoogleTranslate() {
  // Inject styles first
  injectStyles();
  
  // Initial cleanup
  resetBodyStyles();
  hideBannerFrames();
  
  // Set up MutationObserver to watch for changes
  const observer = new MutationObserver((mutations) => {
    let shouldCleanup = false;
    
    mutations.forEach((mutation) => {
      // Check for style attribute changes on body or html
      if (
        mutation.type === 'attributes' && 
        mutation.attributeName === 'style' &&
        (mutation.target === document.body || mutation.target === document.documentElement)
      ) {
        shouldCleanup = true;
      }
      
      // Check for new nodes added (like banner iframes)
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Check if it's a Google Translate banner/balloon frame
            if (
              node.classList?.contains('goog-te-banner-frame') ||
              node.classList?.contains('goog-te-balloon-frame') ||
              (node.tagName === 'IFRAME' && node.className?.includes('goog-te'))
            ) {
              shouldCleanup = true;
            }
          }
        });
      }
    });
    
    // Perform cleanup if needed
    if (shouldCleanup) {
      resetBodyStyles();
      hideBannerFrames();
    }
  });
  
  // Observe both body and documentElement for changes
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }
  
  if (document.documentElement) {
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }
  
  // Set up periodic cleanup (fallback mechanism)
  const intervalId = setInterval(() => {
    resetBodyStyles();
    hideBannerFrames();
  }, 500); // Check every 500ms
  
  // Return cleanup function
  return () => {
    observer.disconnect();
    clearInterval(intervalId);
  };
}

/**
 * Alternative: More aggressive cleanup that removes banner elements from DOM
 * Use this if the standard cleanup doesn't work
 */
export function aggressiveCleanupGoogleTranslate() {
  injectStyles();
  
  const performCleanup = () => {
    resetBodyStyles();
    
    // Remove banner elements completely
    const selectors = [
      '.goog-te-banner-frame',
      '.goog-te-balloon-frame',
      'iframe.goog-te-banner-frame'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.remove();
      });
    });
  };
  
  performCleanup();
  
  const observer = new MutationObserver(() => {
    performCleanup();
  });
  
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });
  }
  
  const intervalId = setInterval(performCleanup, 300);
  
  return () => {
    observer.disconnect();
    clearInterval(intervalId);
  };
}

export default cleanupGoogleTranslate;
