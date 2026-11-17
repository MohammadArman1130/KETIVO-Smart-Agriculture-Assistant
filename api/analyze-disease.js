export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      configured: false,
      error: 'AI service is not configured on the server (GEMINI_API_KEY missing).'
    });
  }

  try {
    const {
      imageBase64,
      mimeType,
      cropName,
      language
    } = req.body || {};

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({
        error: 'Missing imageBase64 or mimeType.'
      });
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const targetLang = language === 'kn' ? 'Kannada' : 'English';

    const prompt = `You are an agricultural plant pathology assistant. Analyze this crop leaf image${cropName ? ` (Farmer states crop: ${cropName})` : ''}.
Respond ONLY with valid JSON (no markdown fences) in ${targetLang} with these exact keys:
{
  "isPlantLeaf": boolean,
  "diseaseName": "string (or Healthy / Unclear Image)",
  "confidence": "High | Medium | Low",
  "symptoms": ["string", "string"],
  "preventiveMeasures": ["string", "string", "string"],
  "disclaimer": "string advising local agricultural extension verification"
}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
    body: JSON.stringify({
  contents: [
    {
      parts: [
        { text: prompt },
        {
          inlineData: {
            mimeType,
            data: imageBase64
          }
        }
      ]
    }
  ],
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.2,
    maxOutputTokens: 2048
  }
})
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return res.status(geminiRes.status).json({
        configured: true,
        error: data?.error?.message || 'Gemini API request failed.'
      });
    }

    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json({
      configured: true,
      mode: 'live-ai',
      model,
      result: parsed
    });

  } catch (err) {
    console.error('Gemini API Error:', err);

    return res.status(500).json({
      configured: true,
      error: err.message || 'Failed to analyze leaf image.'
    });
  }
}