/**
 * airtable.js
 * Fetches location data for OurMovieScene via our own /api proxy.
 *
 * SECURITY: The Airtable API key never reaches the browser. It lives only
 * in Vercel environment variables and is used server-side inside
 * /api/locations.js and /api/locations/[id].js. This file just calls
 * our own API routes, the same way it would call any other backend.
 */

// Cache so we don't re-fetch on every search/filter
let _locationsCache = null;

/**
 * Fetch all locations (Status = "Live" only) via /api/locations
 * Returns normalised array of location objects
 */
async function fetchAllLocations() {
  if (_locationsCache) return _locationsCache;

  try {
    const response = await fetch('/api/locations');

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Normalise records into clean objects
    _locationsCache = (data.records || []).map(normaliseRecord);
    return _locationsCache;

  } catch (error) {
    console.error('Failed to fetch locations:', error);
    // Return fallback data so site doesn't break if API/Airtable is down
    return getFallbackLocations();
  }
}

/**
 * Fetch a single location by record ID via /api/locations/:id
 */
async function fetchLocationById(id) {
  // Try cache first
  if (_locationsCache) {
    const cached = _locationsCache.find(loc => loc.id === id);
    if (cached) return cached;
  }

  // Handle fallback IDs locally (used if API/Airtable is unreachable)
  if (id && id.startsWith('fallback-')) {
    const fallback = getFallbackLocations().find(l => l.id === id);
    if (fallback) return fallback;
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
 * Normalise an Airtable record into a consistent object shape
 * Maps Airtable field names → clean JS property names
 */
function normaliseRecord(record) {
  const f = record.fields || {};

  // Parse GPS coordinates from "lat,lng" string format
  let lat = null, lng = null;
  if (f['GPS']) {
    const parts = f['GPS'].toString().split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      lat = parts[0];
      lng = parts[1];
    }
  }

  // Extract hero image URL from Airtable attachment array
  let heroImage = null;
  if (f['Hero Image'] && Array.isArray(f['Hero Image']) && f['Hero Image'].length > 0) {
    heroImage = f['Hero Image'][0].url;
  } else if (f['Hero Image URL']) {
    heroImage = f['Hero Image URL'];
  }

  // Extract site photos
  let sitePhotos = [];
  if (f['Site Photos'] && Array.isArray(f['Site Photos'])) {
    sitePhotos = f['Site Photos'].map(p => p.url);
  }

  // Parse associated characters (may be comma-separated string or array)
  let characters = [];
  if (Array.isArray(f['Associated Characters'])) {
    characters = f['Associated Characters'];
  } else if (typeof f['Associated Characters'] === 'string') {
    characters = f['Associated Characters'].split(',').map(c => c.trim()).filter(Boolean);
  }

  return {
    id: record.id,
    name: f['Location Name'] || f['Name'] || 'Unknown Location',
    film: f['Film/Episode'] || f['Film'] || '',
    region: f['Region'] || '',
    address: f['Address'] || '',
    description: f['Scene Description'] || f['Description'] || '',
    visitorTips: f['Visitor Tips'] || '',
    characters: characters,
    bestTime: f['Best Time to Visit'] || '',
    difficulty: f['Difficulty'] || f['Tier'] || '',
    tier: f['Tier'] || 1,
    accessibility: f['Accessibility'] || '',
    entryFost: f['Entry Cost'] || 'Free',
    hours: f['Hours'] || '',
    parking: f['Parking'] || '',
    publicAccess: f['Public Access'] || '',
    stillLooksLikeFilm: f['Still Looks Like Film'] || '',
    changesSinceFilming: f['Changes Since Filming'] || '',
    lastVerified: f['Last Verified'] || '',
    bestAngle: f['Best Angle'] || '',
    bestLighting: f['Best Lighting'] || '',
    photographyNotes: f['Photography Notes'] || '',
    heroImage: heroImage,
    sitePhotos: sitePhotos,
    videoUrl: f['YouTube Embed URL'] || f['Video URL'] || '',
    instagramHashtag: f['Instagram Hashtag'] || '#OurMovieScene',
    rating: f['Rating'] || 0,
    visitedCount: f['Visited Count'] || 0,
    status: f['Status'] || 'Draft',
    franchise: f['Franchise'] || 'Harry Potter', // Future multi-franchise support
    lat: lat,
    lng: lng,
  };
}

/**
 * Fallback data — shown if Airtable is unreachable
 * Ensures site doesn't break during development or API downtime
 */
function getFallbackLocations() {
  return [
    {
      id: 'fallback-1',
      name: "King's Cross Station",
      film: 'HP1, HP2, HP3, HP4, HP5, HP6, HP7',
      region: 'London',
      address: "King's Cross, London N1C 4AP",
      description: "Platform 9¾ — the iconic departure point where Harry first discovers the magical world hidden in plain sight. The trolley-through-the-wall scene was filmed here, and the station now features a permanent Platform 9¾ installation with photo opportunities year-round.",
      visitorTips: "Visit early morning (before 9am) to avoid queues at the photo point. The trolley installation is inside the main station, free to visit. Best photography in natural light from the concourse.",
      characters: ['Harry', 'Hermione', 'Ron', 'Mrs Weasley', 'Ginny'],
      bestTime: 'Early morning, any season',
      difficulty: '★★★',
      tier: 1,
      heroImage: null,
      sitePhotos: [],
      videoUrl: '',
      franchise: 'Harry Potter',
      lat: 51.5324,
      lng: -0.1237,
      region: 'London'
    },
    {
      id: 'fallback-2',
      name: 'Leadenhall Market',
      film: 'HP1',
      region: 'London',
      address: 'Gracechurch St, London EC3V 1LT',
      description: "The exterior of Diagon Alley in The Philosopher's Stone. This stunning Victorian covered market with its ornate glass roof is virtually unchanged since filming. The optician's shop on the corner was used as the entrance to The Leaky Cauldron.",
      visitorTips: "Best visited on weekdays when market stalls are open. Weekends are quieter for photography. The market is free to enter and open to the public. The entrance arch on Whittington Avenue is the most recognisable spot.",
      characters: ['Harry', 'Hagrid'],
      bestTime: 'Weekday morning',
      difficulty: '★★★',
      tier: 1,
      heroImage: null,
      sitePhotos: [],
      videoUrl: '',
      franchise: 'Harry Potter',
      lat: 51.5127,
      lng: -0.0834,
      region: 'London'
    },
    {
      id: 'fallback-3',
      name: '4 Privet Drive',
      film: 'HP1, HP2, HP3',
      region: 'Surrey',
      address: '12 Picket Post Close, Bracknell, Berkshire RG12 9LS',
      description: "The Dursley family home — where it all begins. This suburban Bracknell house was used for exterior shots throughout the early films. Fans recognise the distinctive porch and front garden where Harry received his Hogwarts letters.",
      visitorTips: "Viewable from the street only — this is a private residential home. Please be respectful of residents. No parking restrictions on nearby streets. Best visited briefly for a photo.",
      characters: ['Harry', 'Dudley', 'Uncle Vernon', 'Aunt Petunia'],
      bestTime: 'Any time, brief visit',
      difficulty: '★★★',
      tier: 1,
      heroImage: null,
      sitePhotos: [],
      videoUrl: '',
      franchise: 'Harry Potter',
      lat: 51.4039,
      lng: -0.7489,
      region: 'Surrey'
    },
    {
      id: 'fallback-4',
      name: 'Millennium Bridge',
      film: 'HP6',
      region: 'London',
      address: 'Millennium Bridge, London SE1 9JE',
      description: "Dramatically destroyed in the opening sequence of The Half-Blood Prince, London's iconic pedestrian suspension bridge over the Thames provided the backdrop for one of the most striking scenes in the series. The bridge connects Bankside to the City of London.",
      visitorTips: "Free to cross at any time. Best photography from the Tate Modern side looking toward St Paul's Cathedral. Golden hour (sunset) gives spectacular light. Very busy at weekends — visit weekday mornings for photos.",
      characters: ['Death Eaters'],
      bestTime: 'Golden hour, weekday morning',
      difficulty: '★★★',
      tier: 1,
      heroImage: null,
      sitePhotos: [],
      videoUrl: '',
      franchise: 'Harry Potter',
      lat: 51.5097,
      lng: -0.0983,
      region: 'London'
    },
    {
      id: 'fallback-5',
      name: 'Bodleian Library, Oxford',
      film: 'HP1, HP2',
      region: 'Oxford',
      address: 'Broad St, Oxford OX1 3BG',
      description: "Several of the Bodleian's historic rooms doubled as Hogwarts School — including the Divinity School as the hospital wing and Duke Humfrey's Library as the restricted section. One of England's oldest libraries, dating to the 14th century.",
      visitorTips: "Guided tours must be booked in advance — check the Bodleian website. The exterior courtyard (Radcliffe Camera nearby) is free to photograph. Allow 1.5-2 hours for a full tour. Bookshop on site.",
      characters: ['Harry', 'Hermione', 'Ron', 'Madam Pince'],
      bestTime: 'Spring or autumn, book tour in advance',
      difficulty: '★★★★',
      tier: 1,
      heroImage: null,
      sitePhotos: [],
      videoUrl: '',
      franchise: 'Harry Potter',
      lat: 51.7546,
      lng: -1.2544,
      region: 'Oxford'
    },
    {
      id: 'fallback-6',
      name: 'Alnwick Castle',
      film: 'HP1, HP2',
      region: 'Northumberland',
      address: 'Alnwick, Northumberland NE66 1NQ',
      description: "The outer bailey of Alnwick Castle served as the Hogwarts courtyard where first-year students took their first broomstick flying lessons. This magnificent medieval castle, still home to the Duke of Northumberland, is one of England's most impressive fortresses.",
      visitorTips: "Pay entry required — check opening hours and book online in peak season. Broomstick training sessions available (seasonal). Allow a full day. Café and gift shop on site. Large car park adjacent.",
      characters: ['Harry', 'Hermione', 'Ron', 'Madam Hooch', 'Draco'],
      bestTime: 'Summer (broomstick sessions), spring for fewer crowds',
      difficulty: '★★★★',
      tier: 1,
      heroImage: null,
      sitePhotos: [],
      videoUrl: '',
      franchise: 'Harry Potter',
      lat: 55.4154,
      lng: -1.7056,
      region: 'Northumberland'
    },
  ];
}

// Export for use in other modules
window.OMS = window.OMS || {};
window.OMS.fetchAllLocations = fetchAllLocations;
window.OMS.fetchLocationById = fetchLocationById;
