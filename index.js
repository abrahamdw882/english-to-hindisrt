const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 8080;
const API_URL = "https://abrahamdw882-ai-to-hindi.hf.space/translate";

async function translateLines(lines) {
  const batchSize = 50;
  const batches = [];
  for (let i = 0; i < lines.length; i += batchSize) {
    batches.push(lines.slice(i, i + batchSize));
  }

  const results = await Promise.all(
    batches.map(async (batch) => {
      try {
        const resp = await axios.post(API_URL, { text: batch.join("\n") });
        const translatedText = resp.data?.translation || "";
        return translatedText.split("\n");
      } catch (err) {
        console.error("Translation error:", err.message);
        return batch;
      }
    })
  );

  return results.flat();
}

async function translateSRT(content) {
  const lines = content.split("\n");
  const textLines = [];
  const textIndices = [];

  lines.forEach((line, idx) => {
    if (!/^\d+$/.test(line) && !/^\d{2}:\d{2}:\d{2},\d{3}/.test(line) && line.trim() !== "") {
      textLines.push(line.trim());
      textIndices.push(idx);
    }
  });

  const translations = await translateLines(textLines);

  textIndices.forEach((idx, i) => {
    lines[idx] = translations[i] || lines[idx];
  });

  return lines.join("\n");
}

app.get("/translate", async (req, res) => {
  const srtUrl = req.query.url;
  if (!srtUrl) return res.status(400).send("Query parameter 'url' is required");

  try {
    const response = await axios.get(srtUrl);
    const translated = await translateSRT(response.data);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(translated);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Failed to fetch or translate SRT");
  }
});

app.get("/", (req, res) => {
  res.send("SRT Translator API is live. Use GET /translate?url=<SRT-URL>");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
