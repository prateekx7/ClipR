const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const TEMP = path.join(__dirname, "../temp");
if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP);

function randomSuffix() {
  return Math.floor(10000 + Math.random() * 90000);
}

function getFinalFile() {
  const files = fs.readdirSync(TEMP);

  const validFiles = files.filter(
    (f) =>
      !f.endsWith(".part") &&
      !f.endsWith(".ytdl") &&
      !f.startsWith("out-") &&
      (f.startsWith("youtube_") || f.startsWith("twitter_"))
  );

  if (validFiles.length === 0) return null;

  return validFiles
    .map((f) => ({
      name: f,
      time: fs.statSync(path.join(TEMP, f)).mtimeMs,
    }))
    .sort((a, b) => b.time - a.time)[0].name;
}


function isValidTimestamp(ts) {
  if (!ts) return false;
  if (!/^\d{2}:\d{2}:\d{2}$/.test(ts)) return false;

  const [h, m, s] = ts.split(":").map(Number);
  return m < 60 && s < 60;
}

function toSeconds(ts) {
  const [h, m, s] = ts.split(":").map(Number);
  return h * 3600 + m * 60 + s;
}

function download({ url, type, quality, start, end }) {
  return new Promise((resolve, reject) => {
    if (!url) return reject(new Error("URL is required"));

    const rand = randomSuffix();

    const outputTemplate = path.join(
      TEMP,
      "%(extractor)s_%(title).60s_" + rand + ".%(ext)s"
    );

    let format = "";
    let post = "";


    if (type === "audio") {
      format = "bestaudio[ext=m4a]/bestaudio";
      post = "--extract-audio --audio-format mp3";
    }


    else if (type === "video") {
      if (quality === "1080")
        format =
          "bestvideo[ext=mp4][height<=1080]/bestvideo[height<=1080]/bestvideo";
      else if (quality === "720")
        format =
          "bestvideo[ext=mp4][height<=720]/bestvideo[height<=720]/bestvideo";
      else if (quality === "480")
        format =
          "bestvideo[ext=mp4][height<=480]/bestvideo[height<=480]/bestvideo";
      else
        format = "bestvideo[ext=mp4]/bestvideo";

      post = "--remux-video mp4";
    }


    else {
      if (quality === "1080")
        format =
          "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best";
      else if (quality === "720")
        format =
          "bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/bestvideo[height<=720]+bestaudio/best";
      else if (quality === "480")
        format =
          "bestvideo[ext=mp4][height<=480]+bestaudio[ext=m4a]/bestvideo[height<=480]+bestaudio/best";
      else
        format =
          "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best";

      post = "--merge-output-format mp4";
    }


    let trim = "";

    if (isValidTimestamp(start) && isValidTimestamp(end)) {
      const startSec = toSeconds(start);
      const endSec = toSeconds(end);

      if (endSec > startSec) {
        trim = `--download-sections "*${start}-${end}"`;
      }

    }

    const cmd = `yt-dlp --restrict-filenames -f "${format}" ${post} ${trim} -o "${outputTemplate}" "${url}"`;

    console.log("Running:", cmd);

    exec(cmd, async (err) => {
      if (err) return reject(err);


      await new Promise((r) => setTimeout(r, 1200));

      const file = getFinalFile();
      if (!file) return reject(new Error("Final file not found"));

      resolve(path.join(TEMP, file));
    });
  });
}

module.exports = { download };
