const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const TEMP = path.join(__dirname, "../temp");
if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP);

function downloadWithProgress(params, onProgress) {
  return new Promise((resolve, reject) => {
    const { url, type, quality, start, end } = params;

    const fileBase = `out-${Date.now()}`;
    const output = path.join(TEMP, fileBase);

    let format = "";
    let postArgs = [];

    if (type === "audio") {
      format = "bestaudio";
      postArgs = ["--extract-audio", "--audio-format", "mp3"];
    } else {
      if (quality === "1080") format = "bv*[height<=1080]+ba/bv*+ba/b";
      else if (quality === "720") format = "bv*[height<=720]+ba/bv*+ba/b";
      else format = "bv*+ba/b";

      postArgs = ["--merge-output-format", "mp4"];
    }

    const args = [
      "-f", format,
      ...postArgs,
      "-o", `${output}.%(ext)s`,
    ];

    if (start && end) {
      args.push("--download-sections", `*${start}-${end}`);
    }

    args.push(url);

    const proc = spawn("yt-dlp", args);

    proc.stdout.on("data", (data) => {
      const text = data.toString();
      const match = text.match(/(\d+(?:\.\d+)?)%/);
      if (match) {
        onProgress(Number(match[1]));
      }
    });

    proc.stderr.on("data", () => {});

    proc.on("close", () => {
      const file = fs.readdirSync(TEMP).find(f => f.startsWith(fileBase));
      resolve(path.join(TEMP, file));
    });

    proc.on("error", reject);
  });
}

module.exports = { downloadWithProgress };
