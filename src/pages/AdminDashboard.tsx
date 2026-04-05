import { Link } from "react-router-dom";
import { AdminChrome } from "../components/AdminChrome";
import { staticAsset } from "../lib/sitePaths";
import logoUrl from "../../assets/immba-logo-200.svg?url";
import "./admin-dashboard.css";

/**
 * 後台總覽（版型：深藍頂欄 + 紅色分頁 + 白底卡片）
 */
export default function AdminDashboard() {
  return (
    <AdminChrome
      active="overview"
      section={
        <>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "1rem 1.5rem",
              marginBottom: "0.35rem",
            }}
          >
            <img
              src={logoUrl}
              alt=""
              width={56}
              height={56}
              style={{ flexShrink: 0 }}
            />
            <div>
              <h2 className="imo-section-bar__title" style={{ marginBottom: "0.2rem" }}>
                官方網站後台管理中心
              </h2>
              <p className="imo-section-bar__text" style={{ margin: 0 }}>
                請由下方卡片進入各模組。活動集錦亦可開啟{" "}
                <code>immba-pure.html</code> 對照預覽。
              </p>
            </div>
          </div>
        </>
      }
    >
      <main className="imo-main">
        <div className="admin-dashboard__cards">
          <Link to="/admin/news" className="imo-paper admin-dashboard__card">
            <h3 className="admin-dashboard__card-title">公告管理</h3>
            <p className="admin-dashboard__card-desc">
              編輯中英公告列表、連結與發布日期（嵌入既有公告後台）。
            </p>
            <span className="admin-dashboard__card-cta">進入 →</span>
          </Link>

          <Link to="/admin/events" className="imo-paper admin-dashboard__card">
            <h3 className="admin-dashboard__card-title">活動集錦管理</h3>
            <p className="admin-dashboard__card-desc">
              React 後台編輯活動列表（與 <code>immba-pure.html</code>、前台共用{" "}
              <code className="admin-dashboard__code">localStorage</code> 鍵{" "}
              <code className="admin-dashboard__code">immba-event-items</code>）。
            </p>
            <span className="admin-dashboard__card-cta">進入 →</span>
          </Link>

          <div className="imo-paper admin-dashboard__card admin-dashboard__card--placeholder">
            <h3 className="admin-dashboard__card-title">其他前台子項目管理</h3>
            <p className="admin-dashboard__card-desc">
              預留：未來可加入師資、課程、下載區等模組。
            </p>
            <span className="admin-dashboard__card-cta admin-dashboard__card-cta--muted">
              尚未開放
            </span>
          </div>
        </div>

        <p className="admin-dashboard__footer">
          <Link to="/" className="admin-dashboard__home-link">
            ← 返回前台首頁
          </Link>
        </p>
      </main>
    </AdminChrome>
  );
}
