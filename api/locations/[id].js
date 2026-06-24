/**
 * /api/locations/[id]
 * Vercel serverless function — proxies single-location requests to Airtable.
 *
 * SECURITY: AIRTABLE_API_KEY is read from Vercel environment variables
 * (server-side only). Never sent to, or visible in, the browser.
 */

export default async function handler(req, res) {
  const { id } = req.query;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_TABLE = 'Locations';

  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    return res.status(500).json({
      error: 'Server misconfiguration: Airtable credentials not set in environment variables.'
    });
  }

  if (!id) {
    return res.status(400).json({ error: 'Missing location id.' });
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}/${id}`;

    const airtableResponse = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    if (!airtableResponse.ok) {
      if (airtableResponse.status === 404) {
        return res.status(404).json({ error: 'Location not found.' });
      }
      throw new Error(`Airtable responded with ${airtableResponse.status}`);
    }

    const data = await airtableResponse.json();

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');

    return res.status(200).json(data);

  } catch (error) {
    console.error('Failed to fetch location from Airtable:', error.message);
    return res.status(502).json({ error: 'Failed to fetch location from Airtable.' });
  }
}
