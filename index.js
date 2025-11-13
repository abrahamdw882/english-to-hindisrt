const express = require("express");
const fs = require("fs");
const axios = require("axios");
const multer = require("multer");

const app = express();
const upload = multer({ dest: "/tmp/" });
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
  const translatedLines = [];

  for (const line of lines) {
    if (/^\d+$/.test(line) || /^\d{2}:\d{2}:\d{2},\d{3}/.test(line) || line.trim() === "") {
      translatedLines.push(line);
    } else {
      const translation = await translateLine(line.trim());
      translatedLines.push(translation);
    }
  }

  return translatedLines.join("\n");
}
app.post("/translate", upload.single("srt"), async (req, res) => {
  if (!req.file) return res.status(400).send("No SRT file uploaded");

  try {
    const content = fs.readFileSync(req.file.path, "utf-8");
    const translated = await translateSRT(content);
    fs.unlinkSync(req.file.path);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(translated);
  } catch (err) {
    console.error(err);
    res.status(500).send("Translation failed");
  }
});
app.get("/translate", async (req, res) => {
  const srtUrl = req.query.url;
  if (!srtUrl) return res.status(400).send("Query parameter 'url' is required");

  try {
    const response = await axios.get(srtUrl);
    const srtContent = response.data;
    const translated = await translateSRT(srtContent);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(translated);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch or translate SRT");
  }
});
app.get("/", (req, res) => {
  res.send(
    "SRT Translator API is live. POST /translate with file, or GET /translate?url=<SRT-URL>"
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
