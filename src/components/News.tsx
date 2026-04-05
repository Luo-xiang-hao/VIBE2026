import { useEffect, useState } from "react";
import {
  DEFAULT_NEWS_ITEMS,
  NEWS_STORAGE_KEY,
  detailHrefFor,
  parseStoredNewsItems,
  type NewsItem,
} from "../data/news";
import "./news.css";

export type NewsProps = {
  /** 內頁連結前綴，例如部署在子路徑時傳 `https://example.com/immba` */
  basePath?: string;
  className?: string;
  /** 錨點 id，供導覽列「最新公告」連結 */
  sectionId?: string;
};

const section = {
  width: "min(1480px, calc(100vw - 24px))",
  maxWidth: "100%",
  margin: "0 auto",
  padding: "1.5rem clamp(0.75rem, 2vw, 1.25rem) 2.5rem",
  boxSizing: "border-box" as const,
  scrollMarginTop: "4rem",
};

const list = {
  listStyle: "none",
  margin: 0,
  padding: 0,
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const card = {
  display: "block",
  padding: "1.1rem 1.25rem",
  borderRadius: "14px",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  background: "rgba(255, 255, 255, 0.06)",
  textDecoration: "none",
  color: "inherit",
};

const row = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "baseline",
  gap: "0.5rem 1rem",
  marginBottom: "0.35rem",
};

const dateStyle = {
  fontSize: "0.8125rem",
  fontWeight: 600,
  fontVariantNumeric: "tabular-nums",
  color: "rgba(255, 255, 255, 0.55)",
  flexShrink: 0,
};

const topBadge = {
  fontSize: "0.7rem",
  fontWeight: 700,
  padding: "2px 8px",
  borderRadius: "999px",
  background: "rgba(255, 204, 51, 0.2)",
  border: "1px solid rgba(255, 204, 51, 0.35)",
  color: "rgba(255, 250, 230, 0.95)",
};

const titleStyle = {
  margin: 0,
  fontSize: "1rem",
  fontWeight: 500,
  lineHeight: 1.55,
  color: "rgba(255, 255, 255, 0.92)",
};

const cta = {
  margin: "0.5rem 0 0",
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "#28f0d3",
};

const footer = {
  marginTop: "2rem",
  paddingTop: "1.25rem",
  borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  fontSize: "0.8125rem",
  color: "rgba(255, 255, 255, 0.5)",
  lineHeight: 1.5,
};

function NewsCard({ item, basePath }: { item: NewsItem; basePath: string }) {
  const href = detailHrefFor(item.id, basePath);
  return (
    <a href={href} className="immba-news-card" style={card}>
      <div style={row}>
        <time dateTime={item.date.replace(/\//g, "-")} style={dateStyle}>
          {item.date}
        </time>
        {item.isTop ? <span style={topBadge}>TOP</span> : null}
      </div>
      <p style={titleStyle}>{item.title}</p>
      <p style={cta}>查看詳細內容 →</p>
    </a>
  );
}

/**
 * 最新公告：預設為 DEFAULT_NEWS_ITEMS；若 localStorage 有 immba-news-items 則覆蓋顯示。
 * 需安裝 React；父層請使用與 imMBA 相同的深色背景或自行覆寫樣式。
 */
const headingStyle = {
  margin: "0 0 1.25rem",
  fontSize: "clamp(1.35rem, 3vw, 1.65rem)",
  fontWeight: 700,
  color: "rgba(255, 255, 255, 0.96)",
};

export function News({
  basePath = "",
  className,
  sectionId = "news",
}: NewsProps) {
  const [items, setItems] = useState<NewsItem[]>(DEFAULT_NEWS_ITEMS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NEWS_STORAGE_KEY);
      if (!raw) return;
      const parsed = parseStoredNewsItems(raw);
      if (parsed && parsed.length > 0) setItems(parsed);
    } catch {
      /* ignore invalid storage */
    }
  }, []);

  return (
    <section
      id={sectionId}
      className={className}
      style={section}
      aria-labelledby="immba-news-heading"
    >
      <h2 id="immba-news-heading" style={headingStyle}>
        最新公告
      </h2>
      <ul style={list}>
        {items.map((item) => (
          <li key={item.id}>
            <NewsCard item={item} basePath={basePath} />
          </li>
        ))}
      </ul>
      <p style={footer}>
        資料來源：輔仁大學國際經營管理碩士班(imMBA) 官網公告
      </p>
    </section>
  );
}

export default News;
