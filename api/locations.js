/**
 * /api/locations
 * Vercel serverless function — proxies requests to Airtable.
 *
 * SECURITY: AIRTABLE_API_KEY and AIRTABLE_BASE_ID are read from Vercel
 * environment variables (server-side only). They are never sent to,
 * or visible in, the browser.
 *
 * Set these in: Vercel Dashboard → ourmoviescene2 → Settings →
 * Environment Variables → AIRTABLE_API_KEY, AIRTABLE_BASE_ID
 */

export default async function handler(req, res) {
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_TABLE = 'Locations';

  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    return res.status(500).json({
      error: 'Server misconfiguration: Airtable credentials not set in environment variables.'
    });
  }

  try {
    let allRecords = [];
    let offset = null;

    do {
      // Only return locations marked "Live" — draft locations stay hidden
      let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}` +
        `?filterByFormula=${encodeURIComponent('{Status}="Live"')}`;
      if (offset) url += `&offset=${offset}`;

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

    // Cache at the edge for 60s, serve stale up to 5 min while revalidating —
    // keeps the site fast and reduces load on Airtable's API
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    return res.status(200).json({ records: allRecords });

  } catch (error) {
    console.error('Failed to fetch locations from Airtable:', error.message);
    return res.status(502).json({ error: 'Failed to fetch locations from Airtable.' });
  }
}
