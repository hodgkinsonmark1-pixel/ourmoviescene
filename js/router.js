/**
 * router.js
 * SPA routing for OurMovieScene
 * Handles navigation between homepage and location detail pages
 * Uses hash-based routing: #/location/RECORD_ID
 */

window.OMS = window.OMS || {};

/**
 * Navigate to location detail page
 */
window.OMS.navigateToDetail = function(locationId) {
  window.OMS.closeModal && window.OMS.closeModal();
  window.location.hash = `/location/${locationId}`;
};

/**
 * Navigate back to homepage/map
 */
window.OMS.navigateHome = function() {
  window.location.hash = '';
};

/**
 * Initialise router — listens for hash changes and renders correct view
 */
window.OMS.initRouter = function() {
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange(); // Handle initial load
};

async function handleRouteChange() {
  const hash = window.location.hash;
  const locationMatch = hash.match(/^#\/location\/(.+)$/);

  if (locationMatch) {
    const locationId = locationMatch[1];
    await renderDetailPage(locationId);
  } else {
    renderHomePage();
  }
}

/**
 * Render the detail page for a location
 */
async function renderDetailPage(locationId) {
  const app = document.getElementById('app');
  const homepage = document.getElementById('homepage-content');
  const detailPage = document.getElementById('detail-page');

  // Show loading state
  if (homepage) homepage.style.display = 'none';
  if (detailPage) {
    detailPage.style.display = 'block';
    detailPage.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading location…</p>
      </div>`;
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Fetch location data
  const location = await window.OMS.fetchLocationById(locationId);

  if (!location) {
    detailPage.innerHTML = `
      <div class="error-state container">
        <h2>Location not found</h2>
        <p>This location doesn't exist or isn't available yet.</p>
        <button class="btn btn-primary" onclick="window.OMS.navigateHome()">← Back to Map</button>
      </div>`;
    return;
  }

  // Fetch all locations for related section
  const allLocations = await window.OMS.fetchAllLocations();
  const related = window.OMS.getRelatedLocations(location, allLocations, 4);

  detailPage.innerHTML = buildDetailHTML(location, related);

  // Update page title
  document.title = `${location.name} — OurMovieScene`;
}

/**
 * Restore homepage
 */
function renderHomePage() {
  const homepage = document.getElementById('homepage-content');
  const detailPage = document.getElementById('detail-page');

  if (homepage) homepage.style.display = 'block';
  if (detailPage) detailPage.style.display = 'none';

  // Restore page title
  document.title = 'OurMovieScene — Discover Harry Potter Filming Locations';
}

/**
 * Build full detail page HTML
 */
function buildDetailHTML(location, related) {
  // Hero image
  const heroHtml = location.heroImage
    ? `<img src="${location.heroImage}" alt="${location.name}" class="detail-hero-img" />`
    : `<div class="detail-hero-placeholder">
         <span>📍</span>
         <span>${location.name}</span>
       </div>`;

  // Photo gallery
  const galleryHtml = location.sitePhotos && location.sitePhotos.length > 0
    ? `<div class="detail-gallery">
         ${location.sitePhotos.map(url =>
           `<img src="${url}" alt="${location.name} site photo" class="gallery-thumb" />`
         ).join('')}
       </div>`
    : `<div class="detail-gallery-placeholder">
         <p>📸 Site photos coming soon — want to contribute? Tag <strong>#OurMovieScene</strong></p>
       </div>`;

  // Video embed
  const videoHtml = location.videoUrl
    ? `<div class="detail-video">
         <h3>📽 Scene Footage</h3>
         <div class="video-container">
           <iframe
             src="${getYouTubeEmbedUrl(location.videoUrl)}"
             frameborder="0"
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
             allowfullscreen
             title="${location.name} scene footage"
           ></iframe>
         </div>
       </div>`
    : '';

  // Characters
  const charactersHtml = location.characters && location.characters.length > 0
    ? `<div class="detail-characters">
         <h3>Associated Characters</h3>
         <div class="character-tags">
           ${location.characters.map(c => `<span class="character-tag">${c}</span>`).join('')}
         </div>
       </div>`
    : '';

  // Quick info grid
  const quickInfoItems = [
    { icon: '📍', label: 'Address', value: location.address },
    { icon: '💷', label: 'Entry', value: location.entryCost || 'Free' },
    { icon: '🕐', label: 'Hours', value: location.hours || 'Check locally' },
    { icon: '🚗', label: 'Parking', value: location.parking || 'Check locally' },
    { icon: '♿', label: 'Accessibility', value: location.accessibility || 'Check locally' },
    { icon: '🎬', label: 'Films', value: location.film },
  ].filter(item => item.value);

  const quickInfoHtml = `
    <div class="quick-info-grid">
      ${quickInfoItems.map(item => `
        <div class="quick-info-item">
          <span class="quick-info-icon">${item.icon}</span>
          <div>
            <span class="quick-info-label">${item.label}</span>
            <span class="quick-info-value">${item.value}</span>
          </div>
        </div>
      `).join('')}
    </div>`;

  // Photography guide
  const photoGuideHtml = (location.bestAngle || location.bestTime || location.bestLighting)
    ? `<div class="detail-section detail-photography">
         <h3>📷 Photography Guide</h3>
         ${location.bestAngle ? `<p><strong>Best angle:</strong> ${location.bestAngle}</p>` : ''}
         ${location.bestTime ? `<p><strong>Best time:</strong> ${location.bestTime}</p>` : ''}
         ${location.bestLighting ? `<p><strong>Best lighting:</strong> ${location.bestLighting}</p>` : ''}
         ${location.photographyNotes ? `<p>${location.photographyNotes}</p>` : ''}
       </div>`
    : '';

  // Related locations
  const relatedHtml = related && related.length > 0
    ? `<div class="detail-section detail-related">
         <h3>Nearby Locations</h3>
         <div class="related-grid">
           ${related.map(rel => `
             <div class="related-card" onclick="window.OMS.navigateToDetail('${rel.id}')">
               <div class="related-card-img ${!rel.heroImage ? 'related-card-img-placeholder' : ''}"
                 ${rel.heroImage ? `style="background-image:url('${rel.heroImage}')"` : ''}>
                 ${!rel.heroImage ? '📍' : ''}
               </div>
               <div class="related-card-body">
                 <h4>${rel.name}</h4>
                 <span class="badge badge-region">📍 ${rel.region}</span>
               </div>
             </div>
           `).join('')}
         </div>
       </div>`
    : '';

  return `
    <div class="detail-page-inner">
      <!-- Back nav -->
      <div class="detail-back container">
        <button class="btn-back" onclick="window.OMS.navigateHome()">
          ← Back to Map
        </button>
      </div>

      <!-- Hero image -->
      <div class="detail-hero">
        ${heroHtml}
        <div class="detail-hero-overlay">
          <div class="detail-hero-badges">
            ${location.region ? `<span class="badge badge-region">📍 ${location.region}</span>` : ''}
            ${location.difficulty ? `<span class="badge badge-difficulty">${location.difficulty}</span>` : ''}
            ${location.tier === 1 ? `<span class="badge badge-tier">⭐ Iconic</span>` : ''}
          </div>
        </div>
      </div>

      <div class="container">
        <!-- Title -->
        <div class="detail-title-block">
          <h1>${location.name}</h1>
          ${location.film ? `<p class="detail-film">🎬 Featured in: ${location.film}</p>` : ''}
        </div>

        <!-- Quick info -->
        ${quickInfoHtml}

        <!-- Main content columns -->
        <div class="detail-columns">
          <!-- Scene Description -->
          ${location.description ? `
            <div class="detail-section">
              <h3>About This Location</h3>
              <p>${location.description}</p>
            </div>
          ` : ''}

          <!-- Visitor Tips -->
          ${location.visitorTips ? `
            <div class="detail-section detail-tips">
              <h3>✅ Visitor Tips</h3>
              <p>${location.visitorTips}</p>
            </div>
          ` : ''}
        </div>

        <!-- Characters -->
        ${charactersHtml}

        <!-- Photo gallery -->
        <div class="detail-section">
          <h3>📸 Site Photos</h3>
          ${galleryHtml}
        </div>

        <!-- Video -->
        ${videoHtml}

        <!-- Photography guide -->
        ${photoGuideHtml}

        <!-- Related locations -->
        ${relatedHtml}

        <!-- Share -->
        <div class="detail-section detail-share">
          <h3>Share This Location</h3>
          <div class="share-buttons">
            <a href="https://twitter.com/intent/tweet?text=Visited ${encodeURIComponent(location.name)} — a real Harry Potter filming location!&url=${encodeURIComponent(window.location.href)}&hashtags=OurMovieScene,HarryPotter"
               target="_blank" rel="noopener" class="share-btn share-twitter">
              𝕏 Share on X
            </a>
            <button class="share-btn share-copy" onclick="copyLocationLink()">
              🔗 Copy Link
            </button>
          </div>
        </div>

        <!-- Back button -->
        <div class="detail-footer">
          <button class="btn btn-secondary" onclick="window.OMS.navigateHome()">
            ← Back to All Locations
          </button>
        </div>
      </div>
    </div>
  `;
}

function getYouTubeEmbedUrl(url) {
  // Convert watch URL to embed URL
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function copyLocationLink() {
  navigator.clipboard.writeText(window.location.href).then(() => {
    const btn = document.querySelector('.share-copy');
    if (btn) {
      btn.textContent = '✓ Copied!';
      setTimeout(() => btn.textContent = '🔗 Copy Link', 2000);
    }
  });
}
