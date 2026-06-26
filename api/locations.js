/**
 * /api/locations
 * Returns only Published locations from Airtable.
 * Featured locations are included in the response with a featured flag.
 */

export default async function handler(req, res) {
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_TABLE = 'Locations';

  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    return res.status(500).json({ error: 'Server misconfiguration.' });
  }

  try {
    let allRecords = [];
    let offset = null;

    do {
      // Only return Published locations
      const filter = encodeURIComponent('{Published}=1');
      let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}?filterByFormula=${filter}`;
      if (offset) url += `&offset=${offset}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });

      if (!response.ok) throw new Error(`Airtable responded with ${response.status}`);

      const data = await response.json();
      allRecords = allRecords.concat(data.records);
      offset = data.offset || null;

    } while (offset);

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    return res.status(200).json({ records: allRecords });

  } catch (error) {
    console.error('Failed to fetch locations:', error.message);
    return res.status(502).json({ error: 'Failed to fetch locations.' });
  }
}
