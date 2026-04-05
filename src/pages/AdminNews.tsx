import { AdminChrome } from "../components/AdminChrome";
import { staticAsset } from "../lib/sitePaths";

/**
 * 與 dist-react/index.html 同層或根目錄部署時，解析 admin/index.html 並帶 embed=1
 * （隱藏 iframe 內重複標頭，與外層 AdminChrome 銜接）
 */
function announcementAdminSrc(): string {
  if (typeof window === "undefined") {
    return "/admin/index.html?embed=1";
  }
  const pageUrl = window.location.href.replace(/#.*/, "");
  const path = window.location.pathname || "";
  const u =
    path.includes("/dist-react")
      ? new URL("../admin/index.html", pageUrl)
      : new URL("/admin/index.html", window.location.origin);
  u.searchParams.set("embed", "1");
  return u.href;
}

/**
 * React 路由 /admin/news：嵌入既有 vanilla 公告後台（admin/index.html）
 */
export default function AdminNews() {
  const src = announcementAdminSrc();

  return (
    <AdminChrome
      active="news"
      section={
        <>
          <h2 className="imo-section-bar__title">
            imMBA 公告管理後台（中英同一介面）
          </h2>
          <p className="imo-section-bar__text">
            表單嵌入於下方；資料存於瀏覽器{" "}
            <code>localStorage</code>，鍵名{" "}
            <code>vibe2026_immba_announcements</code>
            。若需單獨開啟完整 HTML 後台（含舊版頂部說明），請開新分頁至{" "}
            <code>admin/index.html</code>（勿加 <code>embed</code> 參數）。
          </p>
          <nav className="imo-section-bar__nav" aria-label="公告相關捷徑">
            <a
              href={staticAsset("./admin/index.html")}
              target="_blank"
              rel="noreferrer"
            >
              另開分頁｜純 HTML 公告後台
            </a>
            <a href={staticAsset("./announcements.html")}>中文公告索引</a>
            <a href={staticAsset("./announcements-en.html")}>英文 News 索引</a>
            <a href={staticAsset("./index.html")}>前台 index.html</a>
          </nav>
        </>
      }
    >
      <iframe
        title="imMBA 公告管理後台"
        className="imo-news-frame"
        src={src}
      />
    </AdminChrome>
  );
}
