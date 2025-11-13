const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 8080;
const API_URL = "https://abrahamdw882-ai-to-hindi.hf.space/translate";

async function translateLine(text) {
  try {
    const resp = await axios.get(API_URL, { params: { q: text } });
    return resp.data.translation || text;
  } catch (err) {
    console.error("Translation error:", err.message);
    return text;
  }
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

  const translations = await Promise.all(textLines.map(translateLine));
  textIndices.forEach((idx, i) => {
    lines[idx] = translations[i];
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
    console.error(err);
    res.status(500).send("Failed to fetch or translate SRT");
  }
});

app.get("/", (req, res) => {
  res.send("SRT Translator API is live. Use GET /translate?url=<SRT-URL>");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
