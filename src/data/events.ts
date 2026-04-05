/**
 * 活動集錦：前台預設資料（與 data/events.json／官網活動集錦同步）與 localStorage。
 * 官網：https://www.management.fju.edu.tw/subweb/immba/subedit.php?EID=241
 */
import eventsFile from "../../data/events.json";

export type EventItem = {
  /** 後台編輯／localStorage 用；來自 data/events.json 或新增時產生 */
  id?: string;
  /** 中文標題 */
  title: string;
  /** 英文日期（舊資料與 JSON 主要欄位；EN 前台顯示） */
  date: string;
  /** 中文日期（顯示於中文前台），可空則前台 fallback 用 `date` */
  dateZh?: string;
  /** 中文內文 */
  content: string;
  titleEn?: string;
  contentEn?: string;
  imageUrl?: string;
  /** 與官網活動集錦一致之標籤，例見 data/events.json */
  hashtags?: string[];
  /** ISO 8601，供排序（新→舊＝置頂愈新）；缺漏時由 `date` 解析補上 */
  createdAt?: string;
};

export const EVENT_STORAGE_KEY = "immba-event-items";

/** 同頁後台儲存後，通知前台 Events 重新載入 */
export const EVENTS_CHANGED_EVENT = "immba-events-changed";

export const EVENT_OFFICIAL_GALLERY_URL =
  "https://www.management.fju.edu.tw/subweb/immba/subedit.php?EID=241";

type LegacyFileRow = {
  id?: string;
  title?: string;
  date?: string;
  dateZh?: string;
  body?: string;
  content?: string;
  bodyEn?: string;
  titleEn?: string;
  contentEn?: string;
  image?: string;
  imageUrl?: string;
  hashtags?: unknown;
  createdAt?: string;
};

type EventsJsonFile = { events?: LegacyFileRow[] };

function displayDateToMs(s: string): number {
  const t = Date.parse(String(s).trim());
  return Number.isFinite(t) ? t : 0;
}

function toCreatedAtIso(dateDisplay: string, fallbackIndex: number): string {
  const ms = displayDateToMs(dateDisplay);
  const base = ms || Date.UTC(2020, 0, 1) - fallbackIndex * 86_400_000;
  return new Date(base).toISOString();
}

function parseHashtagsField(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .map((x) => String(x).trim())
    .filter(Boolean);
  return out.length ? out : undefined;
}

function fromJsonFileRow(row: LegacyFileRow, index: number): EventItem | null {
  const title = String(row.title ?? "").trim();
  const date = String(row.date ?? "").trim();
  const content = String(row.content ?? row.body ?? "");
  if (!title || !date) return null;
  const idRaw = row.id != null ? String(row.id).trim() : "";
  const id = idRaw || undefined;
  const dateZhRaw = String(row.dateZh ?? "").trim();
  const dateZh = dateZhRaw || undefined;
  const titleEnRaw = String(row.titleEn ?? "").trim();
  const titleEn = titleEnRaw || undefined;
  const contentEnRaw = String(
    row.contentEn ?? row.bodyEn ?? ""
  ).trim();
  const contentEn = contentEnRaw || undefined;
  const img = row.imageUrl ?? row.image;
  const imageUrl =
    img != null && String(img).trim() ? String(img).trim() : undefined;
  const createdAt =
    typeof row.createdAt === "string" && row.createdAt.trim()
      ? row.createdAt.trim()
      : toCreatedAtIso(date, index);
  const hashtags = parseHashtagsField(row.hashtags);
  return {
    id,
    title,
    date,
    dateZh,
    content,
    titleEn,
    contentEn,
    imageUrl,
    hashtags,
    createdAt,
  };
}

export function sortEventsByCreatedAtDesc(items: EventItem[]): EventItem[] {
  return [...items].sort((a, b) => {
    const tb = displayDateToMs(b.createdAt ?? "") || displayDateToMs(b.date);
    const ta = displayDateToMs(a.createdAt ?? "") || displayDateToMs(a.date);
    return tb - ta;
  });
}

const raw = eventsFile as EventsJsonFile;

/** 自專案 events.json 轉換之初始列表（已依 createdAt 新→舊） */
export const EVENT_ITEMS: EventItem[] = sortEventsByCreatedAtDesc(
  (raw.events || [])
    .map((e, i) => fromJsonFileRow(e, i))
    .filter((x): x is EventItem => x != null)
);

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

/** 單筆正規化：補 imageUrl、createdAt 預設，相容舊欄位 body / image */
export function normalizeStoredEventItem(
  row: Record<string, unknown>,
  index: number
): EventItem | null {
  const title = String(row.title ?? "").trim();
  const date = String(row.date ?? "").trim();
  const content = String(row.content ?? row.body ?? "");
  if (!title || !date) return null;
  const idRaw = row.id != null ? String(row.id).trim() : "";
  const id = idRaw || undefined;
  const dateZhRaw = String(row.dateZh ?? "").trim();
  const dateZh = dateZhRaw || undefined;
  const titleEnRaw = String(row.titleEn ?? "").trim();
  const titleEn = titleEnRaw || undefined;
  const contentEnRaw = String(
    row.contentEn ?? row.bodyEn ?? ""
  ).trim();
  const contentEn = contentEnRaw || undefined;
  const imgRaw = row.imageUrl ?? row.image;
  const imageUrl =
    imgRaw != null && String(imgRaw).trim()
      ? String(imgRaw).trim()
      : undefined;
  let createdAt =
    typeof row.createdAt === "string" && row.createdAt.trim()
      ? row.createdAt.trim()
      : "";
  if (!createdAt) createdAt = toCreatedAtIso(date, index);
  const hashtags = parseHashtagsField(row.hashtags);
  return {
    id,
    title,
    date,
    dateZh,
    content,
    titleEn,
    contentEn,
    imageUrl,
    hashtags,
    createdAt,
  };
}

/**
 * 解析 localStorage 內 JSON（須為 EventItem[] 或可對應之物件陣列）。
 */
export function parseStoredEventItems(json: string): EventItem[] | null {
  try {
    const data: unknown = JSON.parse(json);
    if (!Array.isArray(data)) return null;
    const out: EventItem[] = [];
    data.forEach((row, i) => {
      if (!isRecord(row)) return;
      const item = normalizeStoredEventItem(row, i);
      if (item) out.push(item);
    });
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

/**
 * localStorage 載入後再保險：空字串 imageUrl 改為 undefined；createdAt 必為可解析之 ISO（無效則由 date 推算）。
 */
export function applyEventItemDefaults(item: EventItem, index: number): EventItem {
  const imageUrl = item.imageUrl?.trim() || undefined;
  const raw = item.createdAt?.trim();
  const parsedMs = raw ? Date.parse(raw) : NaN;
  const createdAt = Number.isFinite(parsedMs)
    ? new Date(parsedMs).toISOString()
    : toCreatedAtIso(item.date, index);
  const dateZh = item.dateZh?.trim() || undefined;
  const titleEn = item.titleEn?.trim() || undefined;
  const contentEn = item.contentEn?.trim() || undefined;
  const hashtags = parseHashtagsField(item.hashtags);
  return {
    ...item,
    content: item.content ?? "",
    dateZh,
    titleEn,
    contentEn,
    imageUrl,
    hashtags,
    createdAt,
  };
}

/** 中文前台顯示用日期列 */
export function eventDisplayDateZh(item: EventItem): string {
  const z = item.dateZh?.trim();
  if (z) return z;
  return item.date;
}

/** 讀取 localStorage；無資料或解析失敗時回傳 null（由呼叫端改用 EVENT_ITEMS） */
export function loadEventsFromStorage(): EventItem[] | null {
  try {
    const raw = localStorage.getItem(EVENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = parseStoredEventItems(raw);
    if (!parsed || parsed.length === 0) return null;
    return sortEventsByCreatedAtDesc(
      parsed.map((row, i) => applyEventItemDefaults(row, i))
    );
  } catch {
    return null;
  }
}

/** 寫入 localStorage（陣列須已含 createdAt，建議先 sortEventsByCreatedAtDesc） */
export function saveEventsToStorage(items: EventItem[]): void {
  localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(items));
}

/** React key 用：穩定且避免重複 */
export function eventItemKey(item: EventItem, index: number): string {
  if (item.id) return item.id;
  const c = item.createdAt ?? "";
  const t = item.title.slice(0, 48);
  return `${c}::${t}::${index}`;
}
