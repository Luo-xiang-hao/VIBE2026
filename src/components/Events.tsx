import { useEffect, useState } from "react";
import {
  EVENT_ITEMS,
  EVENT_OFFICIAL_GALLERY_URL,
  EVENTS_CHANGED_EVENT,
  eventDisplayDateZh,
  eventItemKey,
  loadEventsFromStorage,
  type EventItem,
} from "../data/events";
import "./events.css";

export type EventsProps = {
  className?: string;
};

function EventCard({ item }: { item: EventItem }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = Boolean(item.imageUrl?.trim()) && !imgFailed;

  return (
    <article className="immba-event-card">
      {showImg ? (
        <div className="immba-event-card__media">
          <img
            className="immba-event-card__img"
            src={item.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
          />
        </div>
      ) : null}
      <div className="immba-event-card__body">
        <h3 className="immba-event-card__title">{item.title}</h3>
        {item.titleEn?.trim() ? (
          <p className="immba-event-card__title-en" lang="en">
            {item.titleEn.trim()}
          </p>
        ) : null}
        <div className="immba-event-card__date" aria-label="日期">
          {eventDisplayDateZh(item)}
        </div>
        <div className="immba-event-card__content">{item.content}</div>
        {item.contentEn?.trim() ? (
          <div className="immba-event-card__content-en" lang="en">
            {item.contentEn.trim()}
          </div>
        ) : null}
        {item.hashtags && item.hashtags.length > 0 ? (
          <p className="immba-event-card__hashtags">
            {item.hashtags.join(" ")}
          </p>
        ) : null}
      </div>
    </article>
  );
}

/**
 * 活動集錦：預設 EVENT_ITEMS；若 localStorage 有 immba-event-items 則解析、補欄位後依 createdAt 新→舊顯示。
 */
export function Events({ className }: EventsProps) {
  const [items, setItems] = useState<EventItem[]>(EVENT_ITEMS);

  useEffect(() => {
    function syncFromStorage() {
      const stored = loadEventsFromStorage();
      if (stored && stored.length > 0) {
        setItems(stored);
      } else {
        setItems(EVENT_ITEMS);
      }
    }
    syncFromStorage();
    window.addEventListener(EVENTS_CHANGED_EVENT, syncFromStorage);
    return () => window.removeEventListener(EVENTS_CHANGED_EVENT, syncFromStorage);
  }, []);

  return (
    <section
      id="events"
      className={["immba-events-block", className].filter(Boolean).join(" ")}
      style={{
        width: "min(1480px, calc(100vw - 24px))",
        maxWidth: "100%",
        margin: "0 auto",
        padding: "1.5rem clamp(0.75rem, 2vw, 1.25rem) 3rem",
        boxSizing: "border-box",
        scrollMarginTop: "4rem",
      }}
      aria-labelledby="immba-events-heading"
    >
      <h2
        id="immba-events-heading"
        style={{
          margin: "0 0 1.5rem",
          fontSize: "clamp(1.35rem, 3vw, 1.65rem)",
          fontWeight: 700,
          color: "rgba(255, 255, 255, 0.96)",
        }}
      >
        活動集錦
      </h2>
      <div className="immba-events-list">
        {items.map((item, index) => (
          <EventCard key={eventItemKey(item, index)} item={item} />
        ))}
      </div>
      <p className="immba-events-footer">
        資料來源：
        <a
          href={EVENT_OFFICIAL_GALLERY_URL}
          target="_blank"
          rel="noreferrer noopener"
        >
          輔仁大學國際經營管理碩士班(imMBA) 官網｜活動集錦
        </a>
      </p>
    </section>
  );
}

export default Events;
