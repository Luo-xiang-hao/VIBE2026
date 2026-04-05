/**
 * 前台公告：預設資料（官網「最新公告」副本）與 localStorage 鍵名。
 * 列表排序：TOP 置頂，其餘依日期新→舊（與 assets/announcements-feed.js 一致）。
 */

export type NewsItem = {
  id: string;
  date: string;
  title: string;
  isTop?: boolean;
  /** 官網中文公告詳情 */
  officialUrl: string;
};

export const NEWS_STORAGE_KEY = "immba-news-items";

/** 自 data/announcements.json／官網公告複製之初始列表（未連線時之前台預設） */
export const DEFAULT_NEWS_ITEMS: NewsItem[] = [
  {
    id: "immba-3261",
    date: "2026/02/09",
    isTop: true,
    title:
      "(外國學生申請入學) Fall 2026, apply NOW!! (May 1 - May 31) - the second round",
    officialUrl:
      "https://www.management.fju.edu.tw/subweb/immba/news-detail.php?NID=3261",
  },
  {
    id: "immba-3278",
    date: "2026/03/18",
    title: "【 用同樣的學費，走一段法國的學習歷程 】",
    officialUrl:
      "https://www.management.fju.edu.tw/subweb/immba/news-detail.php?NID=3278",
  },
  {
    id: "immba-3267",
    date: "2026/03/11",
    title: "【 上週末的輔大開箱日，你也來逛校園了嗎？ 】",
    officialUrl:
      "https://www.management.fju.edu.tw/subweb/immba/news-detail.php?NID=3267",
  },
  {
    id: "immba-3262",
    date: "2026/03/09",
    title: "(國際經管-全英MBA) 115碩士招生口試通知",
    officialUrl:
      "https://www.management.fju.edu.tw/subweb/immba/news-detail.php?NID=3262",
  },
  {
    id: "immba-3256",
    date: "2026/03/04",
    title: "【 為什麼我們能與海外名校展開合作對話？ 】",
    officialUrl:
      "https://www.management.fju.edu.tw/subweb/immba/news-detail.php?NID=3256",
  },
  {
    id: "immba-3249",
    date: "2026/02/25",
    title: "【 國際合作版圖再拓展｜即將迎來第一所來自英國的大學 】",
    officialUrl:
      "https://www.management.fju.edu.tw/subweb/immba/news-detail.php?NID=3249",
  },
  {
    id: "immba-3241",
    date: "2026/02/11",
    title: "【 走出去之後，開始用不一樣的角度看世界 】",
    officialUrl:
      "https://www.management.fju.edu.tw/subweb/immba/news-detail.php?NID=3241",
  },
  {
    id: "immba-3237",
    date: "2026/02/04",
    title: "【 在國際經管上課，是什麼感覺？ 】",
    officialUrl:
      "https://www.management.fju.edu.tw/subweb/immba/news-detail.php?NID=3237",
  },
  {
    id: "immba-3236",
    date: "2026/01/28",
    title: "【 一個下午在超市：學生的海外學習初體驗 】",
    officialUrl:
      "https://www.management.fju.edu.tw/subweb/immba/news-detail.php?NID=3236",
  },
  {
    id: "immba-2636",
    date: "2025/11/18",
    title: "(國際經管-全英MBA) 115碩士招生報名：2026/1/6-1/15",
    officialUrl:
      "https://www.management.fju.edu.tw/subweb/immba/news-detail.php?NID=2636",
  },
  {
    id: "immba-2735",
    date: "2025/10/29",
    title: "(國際經管-全英MBA) 115甄試招生口試通知",
    officialUrl:
      "https://www.management.fju.edu.tw/subweb/immba/news-detail.php?NID=2735",
  },
];

/**
 * 內頁：本站 announcement-detail.html（雙語摘要＋官網全文連結）
 */
export function detailHrefFor(id: string, basePath = ""): string {
  const q = encodeURIComponent(id);
  return `${basePath}/announcement-detail.html?id=${q}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

/** 解析 localStorage 內 JSON；格式不符或無有效項目時回傳 null */
export function parseStoredNewsItems(json: string): NewsItem[] | null {
  try {
    const data: unknown = JSON.parse(json);
    if (!Array.isArray(data)) return null;
    const out: NewsItem[] = [];
    for (const row of data) {
      if (!isRecord(row)) continue;
      const id = String(row.id ?? "").trim();
      const date = String(row.date ?? "").trim();
      const title = String(row.title ?? "").trim();
      const officialUrl = String(row.officialUrl ?? "").trim();
      if (!id || !date || !title) continue;
      const isTop = Boolean(row.isTop);
      out.push({ id, date, title, officialUrl, ...(isTop ? { isTop: true } : {}) });
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}
