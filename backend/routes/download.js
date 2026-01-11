const express = require("express");
const fs = require("fs");
const { download } = require("../util/downloader");
const { downloadWithProgress } = require("../util/downloaderProgress");

const router = express.Router();


router.post("/", async (req, res) => {
  try {
    const filePath = await download(req.body);
    res.download(filePath, () => fs.unlinkSync(filePath));
  } catch (err) {
    res.status(500).json({ error: "Download failed" });
  }
});


router.get("/progress", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  downloadWithProgress(req.query, (progress) => {
    res.write(`data: ${progress}\n\n`);
  }).then(() => {
    res.write(`data: 100\n\n`);
    res.end();
  }).catch(() => res.end());
});

module.exports = router;
