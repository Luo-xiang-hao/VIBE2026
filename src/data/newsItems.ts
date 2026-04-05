/**
 * 與官網「最新公告」同步（中文標題、日期、官網詳情連結）
 * 列表資料來自 data/announcements.json（與後台／內嵌 announcements-embed.js 同一來源）。
 * 官網索引：https://www.management.fju.edu.tw/subweb/immba/news.php
 *
 * 型別與內頁連結與 src/data/news.ts 共用；React 前台預設／覆寫請見 DEFAULT_NEWS_ITEMS、NEWS_STORAGE_KEY。
 */
import announcementsFile from "../../data/announcements.json";
import type { NewsItem } from "./news";

export type { NewsItem } from "./news";
export { detailHrefFor } from "./news";

type AnnouncementRow = {
  id: string;
  date: string;
  isTop?: boolean;
  titleZh?: string;
  title?: string;
  urlZh?: string;
  url?: string;
};

type AnnouncementsFile = {
  announcements: AnnouncementRow[];
};

function parseAnnounceDate(s: string): number {
  const m = s.trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!m) return 0;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Date(y, mo, d).getTime();
}

function sortNewsLikeFeed(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => {
    const topDiff = Number(!!b.isTop) - Number(!!a.isTop);
    if (topDiff !== 0) return topDiff;
    return parseAnnounceDate(b.date) - parseAnnounceDate(a.date);
  });
}

function rowToNewsItem(row: AnnouncementRow): NewsItem | null {
  const id = String(row.id || "").trim();
  if (!id) return null;
  const title = String(row.titleZh ?? row.title ?? "").trim();
  const officialUrl = String(row.urlZh ?? row.url ?? "").trim();
  const date = String(row.date || "").trim();
  if (!title || !date) return null;
  return {
    id,
    date,
    title,
    isTop: row.isTop,
    officialUrl,
  };
}

const raw = announcementsFile as AnnouncementsFile;

/**
 * 公告列表（TOP 置頂，其餘依日期新→舊；對齊 assets/announcements-feed.js 排序邏輯）
 */
export const NEWS_ITEMS: NewsItem[] = sortNewsLikeFeed(
  (raw.announcements || []).map(rowToNewsItem).filter((x): x is NewsItem => x != null)
);
