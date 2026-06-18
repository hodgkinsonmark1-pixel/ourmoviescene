/**
 * modal.js
 * Location summary modal popup for OurMovieScene
 * Triggered by clicking location card or map pin
 * Shows summary + "View Full Details" button → SPA detail page
 */

window.OMS = window.OMS || {};

/**
 * Open modal with location data
 */
window.OMS.openModal = function(location) {
  // Remove any existing modal
  closeExistingModal();

  const modal = buildModal(location);
  document.body.appendChild(modal);

  // Animate in
  requestAnimationFrame(() => {
    modal.classList.add('modal-visible');
  });

  // Close on overlay click
  modal.querySelector('.modal-overlay').addEventListener('click', window.OMS.closeModal);

  // Close on ESC key
  document.addEventListener('keydown', handleEscKey);

  // Pan map to location
  if (window.OMS.panToLocation) {
    window.OMS.panToLocation(location);
  }
};

/**
 * Close the modal
 */
window.OMS.closeModal = function() {
  const modal = document.getElementById('location-modal');
  if (!modal) return;

  modal.classList.remove('modal-visible');
  modal.addEventListener('transitionend', () => modal.remove(), { once: true });
  document.removeEventListener('keydown', handleEscKey);
};

/**
 * Build the modal DOM
 */
function buildModal(location) {
  const modal = document.createElement('div');
  modal.id = 'location-modal';
  modal.className = 'modal-wrapper';

  // Hero image — placeholder if none yet
  const heroHtml = location.heroImage
    ? `<img src="${location.heroImage}" alt="${location.name}" class="modal-hero-img" />`
    : `<div class="modal-hero-placeholder">
         <span class="modal-hero-icon">📍</span>
         <span class="modal-hero-label">${location.name}</span>
       </div>`;

  // Difficulty badge
  const difficultyHtml = location.difficulty
    ? `<span class="badge badge-difficulty">${location.difficulty}</span>`
    : '';

  // Region badge
  const regionHtml = location.region
    ? `<span class="badge badge-region">📍 ${location.region}</span>`
    : '';

  // Short description — truncate to 150 chars for modal summary
  const shortDesc = location.description
    ? (location.description.length > 180
        ? location.description.substring(0, 180).trim() + '…'
        : location.description)
    : 'A verified Harry Potter UK filming location.';

  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-card" role="dialog" aria-modal="true" aria-label="${location.name}">
      <button class="modal-close" aria-label="Close" onclick="window.OMS.closeModal()">✕</button>

      <div class="modal-hero">
        ${heroHtml}
      </div>

      <div class="modal-body">
        <div class="modal-badges">
          ${regionHtml}
          ${difficultyHtml}
        </div>

        <h2 class="modal-title">${location.name}</h2>

        ${location.film ? `<p class="modal-film">🎬 ${location.film}</p>` : ''}

        <p class="modal-desc">${shortDesc}</p>

        <div class="modal-actions">
          <button
            class="btn btn-primary"
            onclick="window.OMS.navigateToDetail('${location.id}')"
          >
            View Full Details →
          </button>
          <button class="btn btn-secondary" onclick="window.OMS.closeModal()">
            Back to Map
          </button>
        </div>
      </div>
    </div>
  `;

  return modal;
}

function closeExistingModal() {
  const existing = document.getElementById('location-modal');
  if (existing) existing.remove();
}

function handleEscKey(e) {
  if (e.key === 'Escape') window.OMS.closeModal();
}
