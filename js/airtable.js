/**
 * airtable.js
 * Fetches location data for OurMovieScene via our own /api proxy.
 *
 * SECURITY: The Airtable API key never reaches the browser. It lives only
 * in Vercel environment variables and is used server-side inside
 * /api/locations.js and /api/locations/[id].js
 */

let _locationsCache = null;

async function fetchAllLocations() {
  if (_locationsCache) return _locationsCache;

  try {
    const response = await fetch('/api/locations');
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    _locationsCache = (data.records || []).map(normaliseRecord);
    return _locationsCache;
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    return getFallbackLocations();
  }
}

async function fetchLocationById(id) {
  if (_locationsCache) {
    const cached = _locationsCache.find(loc => loc.id === id);
    if (cached) return cached;
  }

  if (id && id.startsWith('fallback-')) {
    return getFallbackLocations().find(l => l.id === id) || null;
  }

  try {
    const response = await fetch(`/api/locations/${id}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return normaliseRecord(data);
  } catch (error) {
    console.error('Failed to fetch location:', error);
    return null;
  }
}

/**
 * Extract an image URL from an Airtable field value.
 * Handles all formats Airtable can return:
 *   - Attachment array: [{ url, thumbnails, ... }]
 *   - Plain string URL
 *   - null / undefined
 */
function extractImageUrl(fieldValue) {
  if (!fieldValue) return null;

  // Airtable attachment array
  if (Array.isArray(fieldValue) && fieldValue.length > 0) {
    // Prefer large thumbnail if available (faster loading), fall back to full URL
    const first = fieldValue[0];
    return (first.thumbnails && first.thumbnails.large)
      ? first.thumbnails.large.url
      : first.url;
  }

  // Plain URL string
  if (typeof fieldValue === 'string' && fieldValue.startsWith('http')) {
    return fieldValue;
  }

  return null;
}

/**
 * Extract multiple image URLs (for site photos / gallery).
 */
function extractImageUrls(fieldValue) {
  if (!fieldValue) return [];

  // Airtable attachment array
  if (Array.isArray(fieldValue)) {
    return fieldValue.map(item => {
      if (typeof item === 'string') return item;
      return (item.thumbnails && item.thumbnails.large)
        ? item.thumbnails.large.url
        : item.url;
    }).filter(Boolean);
  }

  // Comma-separated URL string
  if (typeof fieldValue === 'string') {
    return fieldValue.split(',').map(s => s.trim()).filter(s => s.startsWith('http'));
  }

  return [];
}

/**
 * Normalise an Airtable record into a consistent object shape.
 * Tries multiple possible field name variants so minor naming
 * differences in Airtable don't break the site.
 */
function normaliseRecord(record) {
  const f = record.fields || {};

  // ---- GPS ----
  let lat = null, lng = null;
  const gpsRaw = f['GPS'] || f['Coordinates'] || f['LatLng'] || '';
  if (gpsRaw) {
    const parts = gpsRaw.toString().split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      lat = parts[0];
      lng = parts[1];
    }
  }

  // ---- Hero image — try every plausible field name ----
  const heroImage = extractImageUrl(
    f['Hero Image'] ||
    f['Hero Image URL'] ||
    f['hero_image'] ||
    f['HeroImage'] ||
    f['Image'] ||
    f['Photo'] ||
    f['Images'] ||
    null
  );

  // ---- Site photos — try every plausible field name ----
  const sitePhotos = extractImageUrls(
    f['Site Photos'] ||
    f['Site Photo URLs'] ||
    f['site_photos'] ||
    f['Photos'] ||
    f['Gallery'] ||
    null
  );

  // ---- Characters ----
  let characters = [];
  const charsRaw = f['Associated Characters'] || f['Characters'] || f['characters'] || '';
  if (Array.isArray(charsRaw)) {
    characters = charsRaw;
  } else if (typeof charsRaw === 'string' && charsRaw) {
    characters = charsRaw.split(',').map(c => c.trim()).filter(Boolean);
  }

  return {
    id:                record.id,
    name:              f['Location Name'] || f['Name'] || f['name'] || 'Unknown Location',
    film:              f['Film/Episode'] || f['Film'] || f['Films'] || '',
    region:            f['Region'] || f['region'] || '',
    address:           f['Address'] || f['address'] || '',
    description:       f['Scene Description'] || f['Description'] || f['description'] || '',
    visitorTips:       f['Visitor Tips'] || f['Tips'] || '',
    characters,
    bestTime:          f['Best Time to Visit'] || f['Best Time'] || '',
    difficulty:        f['Difficulty'] || f['Tier'] || '',
    tier:              parseInt(f['Tier']) || 1,
    accessibility:     f['Accessibility'] || '',
    entryCost:         f['Entry Cost'] || f['Cost'] || 'Free',
    hours:             f['Hours'] || f['Opening Hours'] || '',
    parking:           f['Parking'] || '',
    publicAccess:      f['Public Access'] || '',
    stillLooksLikeFilm: f['Still Looks Like Film'] || '',
    changesSinceFilming: f['Changes Since Filming'] || '',
    lastVerified:      f['Last Verified'] || '',
    bestAngle:         f['Best Angle'] || '',
    bestLighting:      f['Best Lighting'] || '',
    photographyNotes:  f['Photography Notes'] || '',
    heroImage,
    sitePhotos,
    videoUrl:          f['YouTube Embed URL'] || f['Video URL'] || f['YouTube URL'] || '',
    instagramHashtag:  f['Instagram Hashtag'] || '#OurMovieScene',
    rating:            f['Rating'] || 0,
    visitedCount:      f['Visited Count'] || 0,
    status:            f['Status'] || 'Draft',
    franchise:         f['Franchise'] || 'Harry Potter',
    lat,
    lng,
  };
}

/**
 * Fallback data — shown if Airtable is completely unreachable.
 * Uses placeholder images (no external dependency).
 */
function getFallbackLocations() {
  const placeholder = null; // No heroImage in fallback — shows gradient placeholder
  return [
    { id: 'fallback-1', name: "King's Cross Station", film: 'HP1–HP7', region: 'London', address: "King's Cross, London N1C 4AP", description: "Platform 9¾ — the iconic departure point where Harry first discovers the magical world hidden in plain sight.", visitorTips: "Visit early morning (before 9am) to avoid queues at the photo point.", characters: ['Harry', 'Hermione', 'Ron', 'Mrs Weasley'], bestTime: 'Early morning', difficulty: '★★★', tier: 1, heroImage: placeholder, sitePhotos: [], videoUrl: '', franchise: 'Harry Potter', lat: 51.5324, lng: -0.1237 },
    { id: 'fallback-2', name: 'Leadenhall Market', film: 'HP1', region: 'London', address: 'Gracechurch St, London EC3V 1LT', description: "The exterior of Diagon Alley in The Philosopher's Stone. Victorian covered market virtually unchanged since filming.", visitorTips: "Best on weekdays. Free to enter, open to the public.", characters: ['Harry', 'Hagrid'], bestTime: 'Weekday morning', difficulty: '★★★', tier: 1, heroImage: placeholder, sitePhotos: [], videoUrl: '', franchise: 'Harry Potter', lat: 51.5127, lng: -0.0834 },
    { id: 'fallback-3', name: '4 Privet Drive', film: 'HP1–HP3', region: 'Surrey', address: '12 Picket Post Close, Bracknell RG12 9LS', description: "The Dursley family home. Suburban Bracknell house used for exterior shots throughout the early films.", visitorTips: "Viewable from the street only — private residential home. Be respectful.", characters: ['Harry', 'Dudley', 'Vernon', 'Petunia'], bestTime: 'Any time, brief visit', difficulty: '★★★', tier: 1, heroImage: placeholder, sitePhotos: [], videoUrl: '', franchise: 'Harry Potter', lat: 51.4039, lng: -0.7489 },
    { id: 'fallback-4', name: 'Millennium Bridge', film: 'HP6', region: 'London', address: 'Millennium Bridge, London SE1 9JE', description: "Dramatically destroyed in the opening of The Half-Blood Prince. Free to cross, stunning Thames views.", visitorTips: "Best at golden hour. Busy at weekends — visit weekday mornings for photos.", characters: ['Death Eaters'], bestTime: 'Golden hour', difficulty: '★★★', tier: 1, heroImage: placeholder, sitePhotos: [], videoUrl: '', franchise: 'Harry Potter', lat: 51.5097, lng: -0.0983 },
    { id: 'fallback-5', name: 'Bodleian Library, Oxford', film: 'HP1, HP2', region: 'Oxford', address: 'Broad St, Oxford OX1 3BG', description: "Several rooms doubled as Hogwarts — the Divinity School as the hospital wing, Duke Humfrey's Library as the restricted section.", visitorTips: "Guided tours must be booked in advance. Allow 1.5–2 hours.", characters: ['Harry', 'Hermione', 'Ron'], bestTime: 'Spring or autumn', difficulty: '★★★★', tier: 1, heroImage: placeholder, sitePhotos: [], videoUrl: '', franchise: 'Harry Potter', lat: 51.7546, lng: -1.2544 },
    { id: 'fallback-6', name: 'Alnwick Castle', film: 'HP1, HP2', region: 'Northumberland', address: 'Alnwick, Northumberland NE66 1NQ', description: "The outer bailey served as the Hogwarts courtyard for first-year broomstick flying lessons. A magnificent medieval castle.", visitorTips: "Pay entry required. Broomstick training sessions available seasonally. Allow a full day.", characters: ['Harry', 'Hermione', 'Ron', 'Madam Hooch', 'Draco'], bestTime: 'Summer', difficulty: '★★★★', tier: 1, heroImage: placeholder, sitePhotos: [], videoUrl: '', franchise: 'Harry Potter', lat: 55.4154, lng: -1.7056 },
  ];
}

window.OMS = window.OMS || {};
window.OMS.fetchAllLocations = fetchAllLocations;
window.OMS.fetchLocationById = fetchLocationById;
