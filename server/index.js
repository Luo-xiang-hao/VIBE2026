const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const session = require("express-session");

const ROOT = path.join(__dirname, "..");
const DATA_PATH = path.join(ROOT, "data", "announcements.json");
const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "dev-session-secret-change-in-production";

function readDb() {
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  return JSON.parse(raw);
}

function writeDb(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/** 與後台／React 共用雙語欄位；API 仍回傳 title／url（由中文欄位對應） */
function rowTitle(a) {
  return String(a.titleZh ?? a.title ?? "").trim();
}

function rowUrl(a) {
  return String(a.urlZh ?? a.url ?? "").trim();
}

function toApiAnnouncement(a) {
  return {
    id: String(a.id),
    date: String(a.date || "").trim(),
    isTop: !!a.isTop,
    title: rowTitle(a),
    url: rowUrl(a),
  };
}

function parseAnnounceDate(s) {
  if (!s || typeof s !== "string") return 0;
  const m = s.trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) return 0;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Date(y, mo, d).getTime();
}

function sortAnnouncements(list) {
  return [...list].sort((a, b) => {
    const topDiff = Number(!!b.isTop) - Number(!!a.isTop);
    if (topDiff !== 0) return topDiff;
    return parseAnnounceDate(b.date) - parseAnnounceDate(a.date);
  });
}

const app = express();
app.use(express.json({ limit: "512kb" }));

app.use(
  session({
    name: "immba.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.admin) {
    return res.status(401).json({ error: "需要登入後台" });
  }
  next();
}

app.get("/api/announcements", (req, res) => {
  try {
    const { announcements } = readDb();
    const list = announcements || [];
    const sorted = sortAnnouncements(list);
    res.json({ announcements: sorted.map(toApiAnnouncement) });
  } catch (e) {
    res.status(500).json({ error: "讀取公告失敗" });
  }
});

app.post("/api/admin/login", (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) {
    req.session.admin = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "密碼錯誤" });
});

app.post("/api/admin/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get("/api/admin/session", (req, res) => {
  res.json({ ok: !!req.session?.admin });
});

app.post("/api/announcements", requireAdmin, (req, res) => {
  const { title, date, url, isTop } = req.body || {};
  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "請填寫標題" });
  }
  if (!date || typeof date !== "string" || !/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(date.trim())) {
    return res.status(400).json({ error: "日期格式須為 YYYY/MM/DD" });
  }
  const u = url != null && String(url).trim() ? String(url).trim() : "";
  const db = readDb();
  db.announcements = db.announcements || [];
  const item = {
    id: crypto.randomUUID(),
    date: date.trim(),
    isTop: Boolean(isTop),
    titleZh: title.trim(),
    titleEn: "",
    urlZh: u,
    urlEn: "",
  };
  db.announcements.push(item);
  writeDb(db);
  res.status(201).json({ announcement: toApiAnnouncement(item) });
});

app.put("/api/announcements/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { title, date, url, isTop } = req.body || {};
  const db = readDb();
  const idx = db.announcements.findIndex((a) => a.id === id);
  if (idx === -1) return res.status(404).json({ error: "找不到公告" });
  if (title != null) {
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "標題不可為空" });
    }
    db.announcements[idx].titleZh = title.trim();
    delete db.announcements[idx].title;
  }
  if (date != null) {
    if (typeof date !== "string" || !/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(date.trim())) {
      return res.status(400).json({ error: "日期格式須為 YYYY/MM/DD" });
    }
    db.announcements[idx].date = date.trim();
  }
  if (url != null) {
    db.announcements[idx].urlZh = String(url).trim();
    delete db.announcements[idx].url;
  }
  if (isTop != null) {
    db.announcements[idx].isTop = Boolean(isTop);
  }
  writeDb(db);
  res.json({ announcement: toApiAnnouncement(db.announcements[idx]) });
});

app.delete("/api/announcements/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const next = db.announcements.filter((a) => a.id !== id);
  if (next.length === db.announcements.length) {
    return res.status(404).json({ error: "找不到公告" });
  }
  db.announcements = next;
  writeDb(db);
  res.json({ ok: true });
});

/** React 靜態產物（先執行 npm run build:react 產生 dist-react/） */
app.get(["/react", "/react/"], (_req, res) => {
  res.redirect(302, "/dist-react/index.html");
});

app.use(express.static(ROOT));

app.listen(PORT, () => {
  console.log(`imMBA site + API http://localhost:${PORT}`);
  console.log(`後台總覽（HTML） http://localhost:${PORT}/admin/dashboard.html`);
  console.log(`公告後台 http://localhost:${PORT}/admin/index.html`);
  console.log(
    `React 後台總覽（需先 npm run build:react） http://localhost:${PORT}/dist-react/index.html#/admin`
  );
  console.log(
    `React 靜態版捷徑 http://localhost:${PORT}/react → dist-react/index.html`
  );
});
