/**
 * /api/debug — diagnostic endpoint
 * Shows Airtable connectivity + Published/Featured record counts
 */
export default async function handler(req, res) {
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    return res.status(200).json({
      status: 'ERROR',
      problem: 'Missing environment variables',
      AIRTABLE_BASE_ID: AIRTABLE_BASE_ID ? 'SET' : 'MISSING',
      AIRTABLE_API_KEY: AIRTABLE_API_KEY ? 'SET' : 'MISSING',
    });
  }

  try {
    // Fetch all records (no filter) to count Published + Featured
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Locations`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    const body = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        status: 'ERROR',
        airtable_http_status: response.status,
        airtable_response: body,
      });
    }

    const records = body.records || [];
    const published = records.filter(r => r.fields['Published'] === true);
    const featured  = records.filter(r => r.fields['Featured'] === true);

    return res.status(200).json({
      status: 'OK',
      airtable_http_status: response.status,
      total_records: records.length,
      published_count: published.length,
      featured_count: featured.length,
      published_locations: published.map(r => r.fields['Location Name']),
      featured_locations: featured.map(r => r.fields['Location Name']),
    });

  } catch (error) {
    return res.status(200).json({
      status: 'ERROR',
      problem: error.message,
    });
  }
}
