/**
 * main.js
 * OurMovieScene — App initialisation
 * Boots the app: fetches data, renders cards, wires up search/filters, initialises map
 */

window.OMS = window.OMS || {};

// App state
let allLocations = [];
let filteredLocations = [];

/**
 * Boot the application
 */
async function init() {
  // Show loading state on cards
  showCardsLoading();

  // Initialise Leaflet map
  window.OMS.initMap('map');

  // Initialise SPA router
  window.OMS.initRouter();

  // Fetch all locations from Airtable
  allLocations = await window.OMS.fetchAllLocations();
  filteredLocations = [...allLocations];

  // Populate filter dropdowns from real data
  populateFilters(allLocations);

  // Render featured cards (Tier 1 first, top 6)
  renderFeaturedCards(window.OMS.getFeaturedLocations(allLocations, 6));

  // Render all pins on map
  window.OMS.renderMapPins(allLocations);

  // Wire up search/filter inputs
  wireUpFilters();
}

/**
 * Populate region + difficulty dropdowns from actual data
 */
function populateFilters(locations) {
  const regionSelect = document.getElementById('filter-region');
  const difficultySelect = document.getElementById('filter-difficulty');

  if (regionSelect) {
    const regions = window.OMS.getRegions(locations);
    regions.forEach(region => {
      const option = document.createElement('option');
      option.value = region;
      option.textContent = region;
      regionSelect.appendChild(option);
    });
  }

  if (difficultySelect) {
    const difficulties = window.OMS.getDifficulties(locations);
    difficulties.forEach(diff => {
      const option = document.createElement('option');
      option.value = diff;
      option.textContent = diff;
      difficultySelect.appendChild(option);
    });
  }
}

/**
 * Wire up real-time search + filter inputs
 */
function wireUpFilters() {
  const searchInput = document.getElementById('search-input');
  const regionSelect = document.getElementById('filter-region');
  const difficultySelect = document.getElementById('filter-difficulty');

  const handleFilterChange = () => {
    const filters = {
      searchText: searchInput ? searchInput.value : '',
      region: regionSelect ? regionSelect.value : '',
      difficulty: difficultySelect ? difficultySelect.value : '',
    };

    filteredLocations = window.OMS.filterLocations(allLocations, filters);

    // Update cards grid
    renderFeaturedCards(window.OMS.getFeaturedLocations(filteredLocations, 6));

    // Update map pins
    window.OMS.updateMapPins(filteredLocations);

    // Show count
    updateResultsCount(filteredLocations.length, allLocations.length);
  };

  if (searchInput) {
    searchInput.addEventListener('input', handleFilterChange);
  }
  if (regionSelect) {
    regionSelect.addEventListener('change', handleFilterChange);
  }
  if (difficultySelect) {
    difficultySelect.addEventListener('change', handleFilterChange);
  }
}

/**
 * Render location cards in the featured grid
 */
function renderFeaturedCards(locations) {
  const grid = document.getElementById('locations-grid');
  if (!grid) return;

  if (locations.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <p>No locations found matching your search.</p>
        <button class="btn btn-secondary" onclick="clearFilters()">Clear filters</button>
      </div>`;
    return;
  }

  grid.innerHTML = locations.map(loc => buildLocationCard(loc)).join('');
}

/**
 * Build location card HTML
 */
function buildLocationCard(location) {
  const heroStyle = location.heroImage
    ? `background-image: url('${location.heroImage}'); background-size: cover; background-position: center;`
    : `background: linear-gradient(135deg, #1a3a52 0%, #2c5aa0 100%);`;

  const shortDesc = location.description
    ? (location.description.length > 120
        ? location.description.substring(0, 120).trim() + '…'
        : location.description)
    : '';

  return `
    <div class="location-card" onclick="window.OMS.openModal(${JSON.stringify(location).replace(/"/g, '&quot;')})" role="button" tabindex="0"
      onkeydown="if(event.key==='Enter')window.OMS.openModal(${JSON.stringify(location).replace(/"/g, '&quot;')})">
      <div class="location-image" style="${heroStyle}">
        ${!location.heroImage ? `<span>${location.name}</span>` : ''}
      </div>
      <div class="location-content">
        <h3>${location.name}</h3>
        <div class="location-meta">
          ${location.region ? `<span class="location-region">📍 ${location.region}</span>` : ''}
          ${location.difficulty ? `<span class="difficulty">${location.difficulty}</span>` : ''}
        </div>
        ${shortDesc ? `<p class="location-desc">${shortDesc}</p>` : ''}
        <button class="location-link">View Details →</button>
      </div>
    </div>`;
}

/**
 * Show skeleton loading cards while data fetches
 */
function showCardsLoading() {
  const grid = document.getElementById('locations-grid');
  if (!grid) return;

  grid.innerHTML = Array(6).fill(0).map(() => `
    <div class="location-card loading-skeleton">
      <div class="location-image skeleton-img"></div>
      <div class="location-content">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-short"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-short"></div>
      </div>
    </div>`).join('');
}

/**
 * Show filter result count
 */
function updateResultsCount(filtered, total) {
  const counter = document.getElementById('results-count');
  if (!counter) return;
  if (filtered === total) {
    counter.textContent = '';
  } else {
    counter.textContent = `Showing ${filtered} of ${total} locations`;
  }
}

function clearFilters() {
  const searchInput = document.getElementById('search-input');
  const regionSelect = document.getElementById('filter-region');
  const difficultySelect = document.getElementById('filter-difficulty');
  if (searchInput) searchInput.value = '';
  if (regionSelect) regionSelect.value = '';
  if (difficultySelect) difficultySelect.value = '';

  filteredLocations = [...allLocations];
  renderFeaturedCards(window.OMS.getFeaturedLocations(filteredLocations, 6));
  window.OMS.updateMapPins(filteredLocations);
  updateResultsCount(filteredLocations.length, allLocations.length);
}

// Boot when DOM is ready
document.addEventListener('DOMContentLoaded', init);
