/**
 * map.js
 * Leaflet.js map integration for OurMovieScene
 * Renders location pins, handles click → modal
 */

window.OMS = window.OMS || {};

let _map = null;
let _markers = [];
let _markerLayer = null;

/**
 * Initialise Leaflet map centred on King's Cross
 * Called once on page load
 */
window.OMS.initMap = function(containerId = 'map') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Centre on King's Cross, London
  _map = L.map(containerId, {
    center: [51.5324, -0.1237],
    zoom: 6,
    zoomControl: true,
    scrollWheelZoom: true,
  });

  // OpenStreetMap tiles — free, no API key needed
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(_map);

  _markerLayer = L.layerGroup().addTo(_map);

  return _map;
};

/**
 * Render all location pins on the map
 * Clicking a pin opens the location modal
 */
window.OMS.renderMapPins = function(locations) {
  if (!_map || !_markerLayer) return;

  // Clear existing markers
  _markerLayer.clearLayers();
  _markers = [];

  locations.forEach(location => {
    if (!location.lat || !location.lng) return;

    // Custom pin colour by tier
    const colour = getTierColour(location.tier);
    const icon = createCustomIcon(colour);

    const marker = L.marker([location.lat, location.lng], { icon })
      .addTo(_markerLayer);

    // Click marker → open modal
    marker.on('click', () => {
      if (window.OMS.openModal) {
        window.OMS.openModal(location);
      }
    });

    // Tooltip on hover — location name
    marker.bindTooltip(location.name, {
      permanent: false,
      direction: 'top',
      offset: [0, -10],
      className: 'map-tooltip'
    });

    _markers.push({ marker, location });
  });
};

/**
 * Filter visible map pins (called when filters change)
 */
window.OMS.updateMapPins = function(visibleLocations) {
  if (!_markerLayer) return;

  const visibleIds = new Set(visibleLocations.map(l => l.id));

  _markers.forEach(({ marker, location }) => {
    if (visibleIds.has(location.id)) {
      if (!_markerLayer.hasLayer(marker)) _markerLayer.addLayer(marker);
    } else {
      _markerLayer.removeLayer(marker);
    }
  });
};

/**
 * Pan map to a specific location
 */
window.OMS.panToLocation = function(location) {
  if (!_map || !location.lat || !location.lng) return;
  _map.setView([location.lat, location.lng], 14, { animate: true });
};

/**
 * Fit map bounds to show all visible locations
 */
window.OMS.fitMapToBounds = function(locations) {
  if (!_map) return;
  const withCoords = locations.filter(l => l.lat && l.lng);
  if (withCoords.length === 0) return;

  const bounds = L.latLngBounds(withCoords.map(l => [l.lat, l.lng]));
  _map.fitBounds(bounds, { padding: [40, 40] });
};

/**
 * Custom circular marker icon with tier colour
 */
function createCustomIcon(colour) {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="
      width: 18px;
      height: 18px;
      background: ${colour};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  });
}

/**
 * Colour pins by tier (scalable for future franchises)
 */
function getTierColour(tier) {
  const colours = {
    1: '#1a3a52', // Tier 1 Iconic — dark blue
    2: '#2c5aa0', // Tier 2 Popular — mid blue
    3: '#5b8fd4', // Tier 3 Hidden gems — light blue
  };
  return colours[tier] || colours[1];
}
