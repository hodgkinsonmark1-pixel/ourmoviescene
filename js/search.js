/**
 * search.js
 * Real-time search and filter logic for OurMovieScene
 * Filters by: text search, region, difficulty
 */

window.OMS = window.OMS || {};

/**
 * Filter locations array by search text, region, and difficulty
 * All filters are case-insensitive and work in combination
 */
window.OMS.filterLocations = function(locations, { searchText = '', region = '', difficulty = '' }) {
  return locations.filter(loc => {
    // Text search across name + description + characters
    const textMatch = !searchText ||
      loc.name.toLowerCase().includes(searchText.toLowerCase()) ||
      loc.description.toLowerCase().includes(searchText.toLowerCase()) ||
      loc.film.toLowerCase().includes(searchText.toLowerCase()) ||
      loc.characters.some(c => c.toLowerCase().includes(searchText.toLowerCase())) ||
      loc.address.toLowerCase().includes(searchText.toLowerCase());

    // Region filter
    const regionMatch = !region || loc.region.toLowerCase() === region.toLowerCase();

    // Difficulty filter — match star rating or tier
    const difficultyMatch = !difficulty ||
      loc.difficulty === difficulty ||
      loc.tier.toString() === difficulty;

    return textMatch && regionMatch && difficultyMatch;
  });
};

/**
 * Extract unique regions from location list for populating filter dropdown
 */
window.OMS.getRegions = function(locations) {
  const regions = [...new Set(locations.map(l => l.region).filter(Boolean))];
  return regions.sort();
};

/**
 * Extract unique difficulty values for populating filter dropdown
 */
window.OMS.getDifficulties = function(locations) {
  const difficulties = [...new Set(locations.map(l => l.difficulty).filter(Boolean))];
  return difficulties.sort();
};

/**
 * Get featured locations — for MVP returns first 6 Live locations
 * In future: could be most viewed, newest, manually curated, etc.
 */
window.OMS.getFeaturedLocations = function(locations, count = 6) {
  // Tier 1 first, then by name
  const sorted = [...locations].sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.name.localeCompare(b.name);
  });
  return sorted.slice(0, count);
};

/**
 * Get related locations — returns closest locations by geography
 * Uses simple distance calculation (good enough for UK scale)
 */
window.OMS.getRelatedLocations = function(currentLocation, allLocations, count = 4) {
  if (!currentLocation.lat || !currentLocation.lng) {
    // No GPS — return same region or first N
    return allLocations
      .filter(l => l.id !== currentLocation.id && l.region === currentLocation.region)
      .slice(0, count);
  }

  return allLocations
    .filter(l => l.id !== currentLocation.id && l.lat && l.lng)
    .map(l => ({
      ...l,
      distance: getDistanceKm(currentLocation.lat, currentLocation.lng, l.lat, l.lng)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
};

/**
 * Haversine formula — straight-line distance between two GPS points in km
 */
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}
