import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { AdminChrome } from "../components/AdminChrome";
import { staticAsset } from "../lib/sitePaths";
import {
  EVENT_ITEMS,
  EVENT_OFFICIAL_GALLERY_URL,
  EVENT_STORAGE_KEY,
  EVENTS_CHANGED_EVENT,
  applyEventItemDefaults,
  loadEventsFromStorage,
  saveEventsToStorage,
  sortEventsByCreatedAtDesc,
  type EventItem,
} from "../data/events";
import "./admin-events.css";

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function todayZhDate() {
  const d = new Date();
  return `${d.getFullYear()}/${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}`;
}

function cloneDefaultEvents(): EventItem[] {
  return EVENT_ITEMS.map((e, i) =>
    applyEventItemDefaults(
      {
        ...e,
        id: e.id?.trim() || `evt-seed-${i}`,
      },
      i
    )
  );
}

function ensureIds(items: EventItem[]): EventItem[] {
  return items.map((e, i) => ({
    ...e,
    id:
      e.id?.trim() ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `evt-${Date.now()}-${i}`),
  }));
}

/**
 * 活動集錦後台：版型比照公告後台（雙欄表單＋右側列表）。
 * loadEvents / saveEvents 與 EVENT_STORAGE_KEY；createdAt 控制新→舊排序（最新置頂）。
 * 必填：標題、日期；內文可留空。編輯時保留既有 imageUrl 等欄位（表單不顯示圖片欄）。
 */
export default function AdminEvents() {
  const [items, setItems] = useState<EventItem[]>(() =>
    sortEventsByCreatedAtDesc(ensureIds(cloneDefaultEvents()))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayZhDate);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadEvents = useCallback(() => {
    const stored = loadEventsFromStorage();
    if (stored && stored.length > 0) {
      setItems(sortEventsByCreatedAtDesc(ensureIds(stored)));
    } else {
      setItems(sortEventsByCreatedAtDesc(ensureIds(cloneDefaultEvents())));
    }
  }, []);

  const saveEvents = useCallback((next: EventItem[]) => {
    const sorted = sortEventsByCreatedAtDesc(next);
    saveEventsToStorage(sorted);
    setItems(sorted);
    window.dispatchEvent(new Event(EVENTS_CHANGED_EVENT));
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const showSuccess = useCallback((msg: string) => {
    setSuccess(msg);
    window.setTimeout(() => setSuccess(""), 3500);
  }, []);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setTitle("");
    setDate(todayZhDate());
    setContent("");
    setError("");
    setSuccess("");
  }, []);

  const sortedForList = useMemo(
    () => sortEventsByCreatedAtDesc(items),
    [items]
  );

  function validate(): boolean {
    if (!title.trim() || !date.trim()) {
      setError("請填寫標題與日期（必填）；內文可留空。");
      return false;
    }
    setError("");
    return true;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const nowIso = new Date().toISOString();

    if (editingId) {
      const next = items.map((it) =>
        it.id === editingId
          ? {
              ...it,
              title: title.trim(),
              date: date.trim(),
              content,
              createdAt: nowIso,
            }
          : it
      );
      saveEvents(next);
      resetForm();
      showSuccess("已儲存修改。");
      return;
    }

    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `evt-${Date.now()}`;
    const row: EventItem = {
      id,
      title: title.trim(),
      date: date.trim(),
      content,
      createdAt: nowIso,
    };
    saveEvents([...items, row]);
    resetForm();
    showSuccess("已新增活動。");
  }

  function handleEdit(it: EventItem) {
    setEditingId(it.id ?? null);
    setTitle(it.title);
    setDate(it.date);
    setContent(it.content ?? "");
    setError("");
    setSuccess("");
  }

  function handleDelete(id: string | undefined) {
    if (!id || !confirm("確定刪除此活動？")) return;
    saveEvents(items.filter((x) => x.id !== id));
    if (editingId === id) resetForm();
    showSuccess("已刪除。");
  }

  function handleRestoreDefaults() {
    if (
      !confirm(
        "將以專案內建「原始活動集錦」覆寫瀏覽器中的活動資料，確定？"
      )
    ) {
      return;
    }
    const fresh = sortEventsByCreatedAtDesc(ensureIds(cloneDefaultEvents()));
    saveEvents(fresh);
    resetForm();
    showSuccess("已還原為原始活動集錦內容。");
  }

  return (
    <AdminChrome
      active="events"
      workspaceBody="embedLight"
      section={
        <>
          <h2 className="imo-section-bar__title">
            imMBA 活動集錦管理後台
          </h2>
          <p className="imo-section-bar__text">
            與前台「活動集錦」及 <code>immba-pure.html</code> 共用{" "}
            <code>localStorage</code>，鍵名 <code>{EVENT_STORAGE_KEY}</code>
            。列表依 <code>createdAt</code> 排序（愈新愈上）。必填僅
            <strong>標題</strong>與<strong>日期</strong>，內文可留空。
          </p>
          <nav className="imo-section-bar__nav" aria-label="捷徑">
            <a href={staticAsset("./index.html")}>開啟前台 index.html</a>
            <a href={staticAsset("./announcements.html")}>中文公告索引</a>
            <a href={staticAsset("./immba-pure.html")}>純 HTML 活動頁</a>
            <a
              href={EVENT_OFFICIAL_GALLERY_URL}
              target="_blank"
              rel="noreferrer noopener"
            >
              官網｜活動集錦
            </a>
          </nav>
        </>
      }
    >
      <main className="imo-main admin-events-main" id="admin-events">
        <div className="admin-events-columns">
          <section className="admin-events-panel admin-events-panel--form">
            <h2 className="admin-events-form-heading">
              {editingId ? "編輯活動" : "新增活動"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="admin-events-form-grid">
                <div className="admin-events-field admin-events-field--tight">
                  <label htmlFor="ae-title">標題（必填）</label>
                  <input
                    id="ae-title"
                    className="admin-events-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="輸入活動標題…"
                    autoComplete="off"
                  />
                </div>
                <div className="admin-events-field admin-events-field--tight">
                  <label htmlFor="ae-date">日期（必填）</label>
                  <input
                    id="ae-date"
                    className="admin-events-input admin-events-date-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="YYYY/MM/DD"
                    autoComplete="off"
                  />
                  <p className="admin-events-hint">
                    新增預設今天（可修改）；編輯時可改日期。今日：{todayZhDate()}
                  </p>
                </div>
              </div>

              <div className="admin-events-field admin-events-field--content">
                <label htmlFor="ae-content">內文（選填）</label>
                <textarea
                  id="ae-content"
                  className="admin-events-textarea"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="活動說明，可換行…"
                  rows={6}
                />
              </div>

              <div className="admin-events-form-footer">
                <div className="admin-events-form-footer__left">
                  <button
                    type="button"
                    className="admin-events-btn-restore"
                    onClick={handleRestoreDefaults}
                  >
                    一鍵還原成原始活動集錦內容
                  </button>
                </div>
                <div className="admin-events-form-footer__right">
                  {editingId ? (
                    <button
                      type="button"
                      className="admin-events-btn-ghost"
                      onClick={resetForm}
                    >
                      取消編輯
                    </button>
                  ) : null}
                  <button type="submit" className="admin-events-btn-primary">
                    {editingId ? "儲存修改" : "新增活動"}
                  </button>
                  <p className="admin-events-footer-hint">
                    必填：標題與日期；內文可留空。儲存後與純 HTML 活動頁共用資料。
                  </p>
                </div>
              </div>

              {error ? (
                <p className="admin-events-error" role="alert">
                  {error}
                </p>
              ) : null}
              {success ? (
                <p className="admin-events-success" role="status">
                  {success}
                </p>
              ) : null}
            </form>
          </section>

          <section className="admin-events-panel admin-events-panel--list">
            <div className="admin-events-panel__head">
              <h2>已儲存活動</h2>
              <p>
                點「編輯」帶回左側表單；「刪除」需確認。排序：最新儲存者在上。
              </p>
            </div>
            {sortedForList.length === 0 ? (
              <p className="admin-events-empty">尚無資料</p>
            ) : (
              <ul className="admin-events-list">
                {sortedForList.map((it) => (
                  <li
                    key={it.id ?? it.createdAt + it.title}
                    className="admin-events-row"
                  >
                    <div className="admin-events-row-main">
                      <p className="admin-events-row-title">{it.title}</p>
                      <p className="admin-events-row-meta">
                        {it.date}
                        {it.createdAt
                          ? ` ・ ${new Date(it.createdAt).toLocaleString("zh-TW")}`
                          : null}
                      </p>
                    </div>
                    <div className="admin-events-row-actions">
                      <button
                        type="button"
                        className="admin-events-link admin-events-link--edit"
                        onClick={() => handleEdit(it)}
                      >
                        編輯
                      </button>
                      <button
                        type="button"
                        className="admin-events-link admin-events-link--del"
                        onClick={() => handleDelete(it.id)}
                      >
                        刪除
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </AdminChrome>
  );
}
