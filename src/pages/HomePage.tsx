import { Link } from "react-router-dom";
import { News } from "../components/News";
import { Events } from "../components/Events";
import logoUrl from "../../assets/immba-logo-200.svg?url";

const appRoot = {
  minHeight: "100vh",
  background:
    "radial-gradient(1200px 600px at 15% 10%, rgba(26, 163, 255, 0.36), transparent 60%), radial-gradient(900px 520px at 85% 12%, rgba(40, 240, 211, 0.28), transparent 55%), linear-gradient(180deg, #070b13 0%, #0b1220 60%, #070b13 100%)",
  color: "rgba(255, 255, 255, 0.92)",
  fontFamily:
    'Inter, "Noto Sans TC", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
};

const mainStyle = {
  paddingBottom: "2rem",
  maxWidth: "min(1480px, calc(100vw - 24px))",
  margin: "0 auto",
  boxSizing: "border-box" as const,
};

const headerStyle = {
  position: "sticky" as const,
  top: 0,
  zIndex: 40,
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
  background: "rgba(7, 11, 19, 0.88)",
  backdropFilter: "blur(10px)",
};

const headerInner = {
  maxWidth: "min(1480px, calc(100vw - 24px))",
  margin: "0 auto",
  padding: "0.65rem clamp(0.75rem, 2vw, 1.25rem)",
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem 1.25rem",
};

const brandStyle = {
  display: "flex",
  alignItems: "center",
  gap: "0.65rem",
  textDecoration: "none",
  color: "inherit",
};

/**
 * 前台首頁：左上 Logo 進入後台總覽（/#/admin）
 */
export default function HomePage() {
  return (
    <div className="immba-app-root" style={appRoot}>
      <header style={headerStyle}>
        <div style={headerInner}>
          <Link
            to="/admin"
            style={brandStyle}
            aria-label="進入 imMBA 官方網站後台管理中心"
          >
            <img src={logoUrl} alt="" width={44} height={44} />
            <span
              style={{
                fontWeight: 800,
                letterSpacing: "0.04em",
                fontSize: "1.05rem",
              }}
            >
              imMBA
            </span>
          </Link>
          <nav
            className="immba-app-nav-inner"
            aria-label="頁面導覽"
            style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem 1rem" }}
          >
            <a href="#news" style={{ color: "rgba(255,255,255,0.88)", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}>
              公告
            </a>
            <span style={{ color: "rgba(255,255,255,0.25)" }} aria-hidden="true">|</span>
            <a href="#events" style={{ color: "rgba(255,255,255,0.88)", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}>
              活動集錦
            </a>
          </nav>
        </div>
      </header>
      <main style={mainStyle}>
        <News />
        <Events />
      </main>
    </div>
  );
}
