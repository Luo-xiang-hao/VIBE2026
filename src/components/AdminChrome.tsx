import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { staticAsset } from "../lib/sitePaths";
import "../pages/admin-shell.css";

type AdminActive = "overview" | "news" | "events";

function ActiveTabLabel({ children }: { children: ReactNode }) {
  return (
    <span className="imo-tab imo-tab--active" role="tab" aria-current="page">
      {children}
    </span>
  );
}

export function AdminChrome({
  active,
  section,
  children,
  /** 與公告後台 embed=1 相同：淺灰工作區＋較寬欄（活動表單＋列表） */
  workspaceBody = "default",
}: {
  active: AdminActive;
  section?: ReactNode;
  children: ReactNode;
  workspaceBody?: "default" | "embedLight";
}) {
  return (
    <div className="imo-shell">
      <header className="imo-topbar">
        <div className="imo-topbar__inner">
          <h1 className="imo-topbar__title">imMBA 總後台管理</h1>
          <p className="imo-topbar__lead">
            整合公告、活動集錦等模組；各模組資料存於瀏覽器{" "}
            <code>localStorage</code>（鍵名依功能而異）。亦可開啟純 HTML{" "}
            <a href={staticAsset("./immba-pure.html")} style={{ color: "inherit" }}>
              immba-pure.html
            </a>
            對照預覽。
          </p>
          <div className="imo-topbar__links">
            <a href={staticAsset("./index.html")}>開啟前台 index.html</a>
            <a href={staticAsset("./immba-pure.html")}>純 HTML 活動頁</a>
            <a href={staticAsset("./announcements.html")}>中文公告索引</a>
            <a href={staticAsset("./admin/dashboard.html")}>HTML 後台總覽</a>
            <Link to="/">返回前台首頁（React）</Link>
          </div>
        </div>
      </header>

      <div className="imo-tabs-wrap">
        <div className="imo-tabs" role="tablist" aria-label="後台模組">
          {active === "overview" ? (
            <ActiveTabLabel>總覽</ActiveTabLabel>
          ) : (
            <Link to="/admin" className="imo-tab">
              總覽
            </Link>
          )}
          {active === "news" ? (
            <ActiveTabLabel>公告管理</ActiveTabLabel>
          ) : (
            <Link to="/admin/news" className="imo-tab">
              公告管理
            </Link>
          )}
          {active === "events" ? (
            <ActiveTabLabel>活動集錦管理</ActiveTabLabel>
          ) : (
            <Link to="/admin/events" className="imo-tab">
              活動集錦管理
            </Link>
          )}
        </div>
      </div>

      <div className="imo-workspace">
        <div
          className={
            workspaceBody === "embedLight"
              ? "imo-workspace__inner imo-workspace__inner--wide"
              : "imo-workspace__inner"
          }
        >
          {section != null ? (
            <div className="imo-section-card">
              <div className="imo-section-card__inner">{section}</div>
            </div>
          ) : null}

          <div
            className={
              workspaceBody === "embedLight"
                ? "imo-workspace__body imo-workspace__body--embed-light"
                : "imo-workspace__body"
            }
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
