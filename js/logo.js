/**
 * logo.js
 * Fetches the logo from /api/logo and injects it into all page headers.
 * Also sets the favicon dynamically.
 * Falls back gracefully to the text logo if the fetch fails.
 */

(async function initLogo() {
  try {
    const response = await fetch('/api/logo');
    if (!response.ok) throw new Error(`Logo API returned ${response.status}`);

    const data = await response.json();
    if (!data.url) throw new Error('No URL in logo response');

    const logoUrl = data.url;

    // -- Inject into all .site-logo-img elements on the page --
    document.querySelectorAll('.site-logo-img').forEach(img => {
      img.src = logoUrl;
      img.style.display = 'block';
    });

    // -- Hide text fallbacks now logo image is loaded --
    document.querySelectorAll('.site-logo-text').forEach(el => {
      el.style.display = 'none';
    });

    // -- Set favicon dynamically --
    setFavicon(logoUrl);

    // -- Cache logo URL in sessionStorage so subsequent page loads
    //    don't need to re-fetch from the API --
    try { sessionStorage.setItem('oms_logo_url', logoUrl); } catch(e) {}

  } catch (error) {
    console.warn('Logo fetch failed, using text fallback:', error.message);
    // Text fallback already visible by default — nothing to do
  }
})();

function setFavicon(url) {
  // Remove any existing favicons
  document.querySelectorAll('link[rel~="icon"]').forEach(el => el.remove());

  // Set the logo as favicon (browser will resize)
  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.type = 'image/png';
  favicon.href = url;
  document.head.appendChild(favicon);
}
