/**
 * 啟動與 npm start 相同的 Express 站，並在就緒後用系統預設瀏覽器開啟首頁。
 * 使用：npm run open
 */
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const ROOT = path.join(__dirname, "..");
const url = `http://127.0.0.1:${PORT}/index.html`;

const child = spawn(process.execPath, [path.join(__dirname, "index.js")], {
  cwd: ROOT,
  stdio: "inherit",
});

function openInBrowser() {
  const { exec } = require("child_process");
  if (process.platform === "win32") {
    exec(`start "" "${url}"`);
  } else if (process.platform === "darwin") {
    exec(`open "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
}

let attempts = 0;
const maxAttempts = 80;
const t = setInterval(() => {
  attempts += 1;
  const req = http.get(url, (res) => {
    clearInterval(t);
    res.resume();
    openInBrowser();
  });
  req.on("error", () => {
    req.destroy();
    if (attempts >= maxAttempts) {
      clearInterval(t);
      console.error("無法連上伺服器，請檢查埠號是否被占用或稍後手動開啟：", url);
    }
  });
}, 200);

function shutdown() {
  clearInterval(t);
  child.kill("SIGINT");
  setTimeout(() => process.exit(0), 300);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

child.on("exit", (code) => {
  clearInterval(t);
  process.exit(code ?? 0);
});
