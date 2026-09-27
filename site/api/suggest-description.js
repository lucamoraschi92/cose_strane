// Funzione serverless (Vercel) — gira lato server, NON nel browser.
// Qui la chiave API resta segreta: la legge da una variabile d'ambiente
// che imposterai nel pannello di Vercel (mai nel codice).

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Metodo non consentito" });
    return;
  }

  const { name, category } = req.body || {};
  if (!name || !String(name).trim()) {
    res.status(400).json({ error: "Manca il nome del prodotto" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY non configurata su Vercel" });
    return;
  }

  const prompt = `Scrivi in italiano, con tono ironico, leggero e da social, per un sito che pubblica ` +
    `"i prodotti più strani e assurdi trovati su Amazon".\n\n` +
    `Prodotto: "${name}"\nCategoria: ${category || "non specificata"}\n\n` +
    `Genera:\n` +
    `1) "caption": una didascalia brevissima e simpatica (massimo 12 parole)\n` +
    `2) "description": una descrizione più estesa (3-4 frasi), divertente, che invogli a scoprire il prodotto\n\n` +
    `Rispondi SOLO con un oggetto JSON valido, senza testo prima o dopo, in questo formato esatto:\n` +
    `{"caption": "...", "description": "..."}`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      res.status(500).json({ error: "Errore dall'API AI", detail: data });
      return;
    }

    const text = (data.content || []).map((b) => b.text || "").join("");
    const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      res.status(500).json({ error: "Risposta AI non interpretabile", raw: text });
      return;
    }

    res.status(200).json({
      caption: parsed.caption || "",
      description: parsed.description || "",
    });
  } catch (err) {
    res.status(500).json({ error: "Errore di rete verso l'API AI", detail: String(err) });
  }
};
