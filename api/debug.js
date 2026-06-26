/**
 * /api/debug — temporary diagnostic endpoint
 * Tests Airtable connectivity and returns detailed error info
 * REMOVE THIS FILE after fixing the issue
 */
export default async function handler(req, res) {
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

  // Check env vars exist
  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    return res.status(200).json({
      status: 'ERROR',
      problem: 'Missing environment variables',
      AIRTABLE_BASE_ID: AIRTABLE_BASE_ID ? 'SET' : 'MISSING',
      AIRTABLE_API_KEY: AIRTABLE_API_KEY ? 'SET' : 'MISSING',
    });
  }

  // Test Airtable connection with just 1 record
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Locations?maxRecords=1`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    const body = await response.json();

    return res.status(200).json({
      status: response.ok ? 'OK' : 'ERROR',
      airtable_http_status: response.status,
      AIRTABLE_BASE_ID: AIRTABLE_BASE_ID ? `${AIRTABLE_BASE_ID.substring(0,6)}...` : 'MISSING',
      AIRTABLE_API_KEY: AIRTABLE_API_KEY ? `${AIRTABLE_API_KEY.substring(0,10)}...` : 'MISSING',
      airtable_response: body,
    });

  } catch (error) {
    return res.status(200).json({
      status: 'ERROR',
      problem: 'Fetch to Airtable threw an exception',
      error: error.message,
    });
  }
}
