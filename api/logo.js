/**
 * /api/logo
 * Fetches the logo URL from the Airtable Assets table.
 * Keeps the API key server-side only.
 * Cached aggressively (1 hour) since the logo rarely changes.
 */
export default async function handler(req, res) {
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    return res.status(500).json({ error: 'Server misconfiguration.' });
  }

  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Assets`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    if (!response.ok) throw new Error(`Airtable responded with ${response.status}`);

    const data = await response.json();
    const logoRecord = data.records.find(r =>
      r.fields.Name === 'Logo' || r.fields.name === 'Logo'
    );

    if (!logoRecord) {
      return res.status(404).json({ error: 'Logo record not found in Assets table.' });
    }

    // Handle attachment field (array of objects with .url)
    const attachment = logoRecord.fields.Attachment || logoRecord.fields.attachment;
    if (!attachment || !Array.isArray(attachment) || attachment.length === 0) {
      return res.status(404).json({ error: 'No attachment found on Logo record.' });
    }

    const logoUrl = attachment[0].url;

    // Cache for 1 hour — logo rarely changes
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).json({ url: logoUrl });

  } catch (error) {
    console.error('Failed to fetch logo:', error.message);
    return res.status(502).json({ error: 'Failed to fetch logo.' });
  }
}
