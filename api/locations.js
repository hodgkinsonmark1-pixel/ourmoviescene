/**
 * /api/locations
 * Vercel serverless function — proxies all location requests to Airtable.
 * STATUS FILTER REMOVED — all records returned (no Status field in this base).
 */

export default async function handler(req, res) {
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_TABLE = 'Locations';

  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    return res.status(500).json({ error: 'Server misconfiguration: Airtable credentials not set.' });
  }

  try {
    let allRecords = [];
    let offset = null;

    do {
      // No Status filter — return all records
      let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`;
      if (offset) url += `?offset=${offset}`;

      const airtableResponse = await fetch(url, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });

      if (!airtableResponse.ok) {
        throw new Error(`Airtable responded with ${airtableResponse.status}`);
      }

      const data = await airtableResponse.json();
      allRecords = allRecords.concat(data.records);
      offset = data.offset || null;

    } while (offset);

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    return res.status(200).json({ records: allRecords });

  } catch (error) {
    console.error('Failed to fetch locations from Airtable:', error.message);
    return res.status(502).json({ error: 'Failed to fetch locations.' });
  }
}
