/**
 * airtable.js
 * Fetches location data via /api proxy (Airtable key stays server-side).
 * Field names mapped to match the actual OurMovieScene Airtable base.
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
 * Extract a single image URL from an Airtable attachment field.
 * Airtable attachments come as: [{ url, thumbnails: { large: { url } } }]
 */
function extractImageUrl(fieldValue) {
  if (!fieldValue) return null;
  if (Array.isArray(fieldValue) && fieldValue.length > 0) {
    const first = fieldValue[0];
    return (first.thumbnails && first.thumbnails.large)
      ? first.thumbnails.large.url
      : first.url;
  }
  if (typeof fieldValue === 'string' && fieldValue.startsWith('http')) {
    return fieldValue;
  }
  return null;
}

/**
 * Extract multiple image URLs from an Airtable attachment field.
 */
function extractImageUrls(fieldValue) {
  if (!fieldValue) return [];
  if (Array.isArray(fieldValue)) {
    return fieldValue.map(item => {
      if (typeof item === 'string') return item;
      return (item.thumbnails && item.thumbnails.large)
        ? item.thumbnails.large.url
        : item.url;
    }).filter(Boolean);
  }
  if (typeof fieldValue === 'string') {
    return fieldValue.split(',').map(s => s.trim()).filter(s => s.startsWith('http'));
  }
  return [];
}

/**
 * Normalise an Airtable record using the ACTUAL field names
 * confirmed from the OurMovieScene Airtable base:
 *
 * Location Name, Location ID, Movie title, Viability Score, Priority Tier,
 * Region, Latitude, Longitude, What3Words, Scene Description, Scene Timing,
 * Video URL, Hero Image (attachment), Site Photos (attachment),
 * Location Quality, Accessibility, Associated Characters,
 * Screen Time, Best Time To Visit, Visitor Tips
 */
function normaliseRecord(record) {
  const f = record.fields || {};

  // GPS — stored as separate Latitude + Longitude number fields
  const lat = parseFloat(f['Latitude']) || null;
  const lng = parseFloat(f['Longitude']) || null;

  // Images — attachment fields
  const heroImage  = extractImageUrl(f['Hero Image']);
  const sitePhotos = extractImageUrls(f['Site Photos']);

  // Difficulty label from Priority Tier (TIER 1, TIER 2, TIER 3)
  const tierRaw = f['Priority Tier'] || '';
  const tierNum = tierRaw.includes('1') ? 1 : tierRaw.includes('2') ? 2 : tierRaw.includes('3') ? 3 : 1;
  const difficultyLabel = tierNum === 1 ? '★★★' : tierNum === 2 ? '★★★★' : '★★★★★';

  // Characters — comma-separated string
  let characters = [];
  const charsRaw = f['Associated Characters'] || '';
  if (Array.isArray(charsRaw)) {
    characters = charsRaw;
  } else if (typeof charsRaw === 'string' && charsRaw) {
    characters = charsRaw.split(',').map(c => c.trim()).filter(Boolean);
  }

  return {
    id:                 record.id,
    name:               f['Location Name'] || 'Unknown Location',
    locationId:         f['Location ID'] || '',
    film:               f['Movie title'] || '',
    region:             f['Region'] || '',
    address:            f['Address'] || '',
    description:        f['Scene Description'] || '',
    sceneTiming:        f['Scene Timing'] || '',
    visitorTips:        f['Visitor Tips'] || '',
    characters,
    bestTime:           f['Best Time To Visit'] || '',
    screenTime:         f['Screen Time'] || '',
    difficulty:         difficultyLabel,
    tier:               tierNum,
    viabilityScore:     f['Viability Score'] || 0,
    accessibility:      f['Accessibility'] || '',
    locationQuality:    f['Location Quality'] || '',
    what3words:         f['What3Words'] || '',
    entryCost:          f['Entry Cost'] || 'Free',
    hours:              f['Hours'] || '',
    parking:            f['Parking'] || '',
    heroImage,
    sitePhotos,
    videoUrl:           f['Video URL'] || '',
    instagramHashtag:   '#OurMovieScene',
    franchise:          'Harry Potter',
    lat,
    lng,
  };
}

function getFallbackLocations() {
  return [
    { id: 'fallback-1', name: "King's Cross Station", film: "Harry Potter and the Philosopher's Stone", region: 'London', address: "King's Cross, London N1C 4AP", description: "Platform 9¾ — where Harry first discovers the magical world hidden in plain sight.", visitorTips: "Visit early morning to avoid queues at the photo point.", characters: ['Harry', 'Hermione', 'Ron', 'Mrs Weasley'], bestTime: 'Early morning', difficulty: '★★★', tier: 1, heroImage: null, sitePhotos: [], videoUrl: '', franchise: 'Harry Potter', lat: 51.5324, lng: -0.1237 },
    { id: 'fallback-2', name: 'Leadenhall Market', film: "Harry Potter and the Philosopher's Stone", region: 'London', address: 'Gracechurch St, London EC3V 1LT', description: "The exterior of Diagon Alley. Victorian covered market virtually unchanged since filming.", visitorTips: "Best on weekdays. Free to enter.", characters: ['Harry', 'Hagrid'], bestTime: 'Weekday morning', difficulty: '★★★', tier: 1, heroImage: null, sitePhotos: [], videoUrl: '', franchise: 'Harry Potter', lat: 51.5127, lng: -0.0834 },
    { id: 'fallback-3', name: '4 Privet Drive', film: "Harry Potter and the Philosopher's Stone", region: 'Surrey', address: '12 Picket Post Close, Bracknell RG12 9LS', description: "The Dursley family home. Suburban house used for exterior shots throughout the early films.", visitorTips: "Viewable from the street only — private residential home.", characters: ['Harry', 'Dudley', 'Vernon', 'Petunia'], bestTime: 'Any time', difficulty: '★★★', tier: 1, heroImage: null, sitePhotos: [], videoUrl: '', franchise: 'Harry Potter', lat: 51.4039, lng: -0.7489 },
    { id: 'fallback-4', name: 'Millennium Bridge', film: "Harry Potter and the Half-Blood Prince", region: 'London', address: 'Millennium Bridge, London SE1 9JE', description: "Dramatically destroyed in the opening of The Half-Blood Prince.", visitorTips: "Best at golden hour. Free to cross.", characters: ['Death Eaters'], bestTime: 'Golden hour', difficulty: '★★★', tier: 1, heroImage: null, sitePhotos: [], videoUrl: '', franchise: 'Harry Potter', lat: 51.5097, lng: -0.0983 },
    { id: 'fallback-5', name: 'Bodleian Library, Oxford', film: "Harry Potter and the Philosopher's Stone", region: 'Oxford', address: 'Broad St, Oxford OX1 3BG', description: "Several rooms doubled as Hogwarts — the Divinity School as the hospital wing.", visitorTips: "Guided tours must be booked in advance. Allow 1.5–2 hours.", characters: ['Harry', 'Hermione', 'Ron'], bestTime: 'Spring or autumn', difficulty: '★★★★', tier: 1, heroImage: null, sitePhotos: [], videoUrl: '', franchise: 'Harry Potter', lat: 51.7546, lng: -1.2544 },
    { id: 'fallback-6', name: 'Alnwick Castle', film: "Harry Potter and the Philosopher's Stone", region: 'Northumberland', address: 'Alnwick, Northumberland NE66 1NQ', description: "The outer bailey served as the Hogwarts courtyard for broomstick flying lessons.", visitorTips: "Pay entry required. Allow a full day.", characters: ['Harry', 'Hermione', 'Ron', 'Madam Hooch', 'Draco'], bestTime: 'Summer', difficulty: '★★★★', tier: 1, heroImage: null, sitePhotos: [], videoUrl: '', franchise: 'Harry Potter', lat: 55.4154, lng: -1.7056 },
  ];
}

window.OMS = window.OMS || {};
window.OMS.fetchAllLocations = fetchAllLocations;
window.OMS.fetchLocationById = fetchLocationById;
