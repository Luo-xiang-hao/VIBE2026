/**
 * immba-pure.html：若 localStorage 與 React 互動版相同鍵有資料，覆寫本頁公告／活動列表。
 * 鍵名與 src/data/news.ts、src/data/events.ts 一致；須與後台「同源」才讀得到（勿混用 file:// 與 http://）。
 */
(function () {
  var NEWS_KEY = "immba-news-items";
  var EVENT_KEY = "immba-event-items";
  var EVENT_CHANGED = "immba-events-changed";

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escAttr(s) {
    return esc(s).replace(/'/g, "&#39;");
  }

  function parseAnnounceDate(s) {
    if (!s || typeof s !== "string") return 0;
    var m = s.trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (!m) return 0;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
  }

  function sortNewsItems(list) {
    return list.slice().sort(function (a, b) {
      var topDiff = (b.isTop ? 1 : 0) - (a.isTop ? 1 : 0);
      if (topDiff !== 0) return topDiff;
      return parseAnnounceDate(b.date) - parseAnnounceDate(a.date);
    });
  }

  function parseStoredNews(json) {
    try {
      var data = JSON.parse(json);
      if (!Array.isArray(data)) return null;
      var out = [];
      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        if (!row || typeof row !== "object") continue;
        var id = String(row.id != null ? row.id : "").trim();
        var date = String(row.date != null ? row.date : "").trim();
        var title = String(row.title != null ? row.title : "").trim();
        if (!id || !date || !title) continue;
        var isTop = !!row.isTop;
        out.push({ id: id, date: date, title: title, isTop: isTop });
      }
      return out.length > 0 ? out : null;
    } catch (e) {
      return null;
    }
  }

  function displayDateToMs(s) {
    var t = Date.parse(String(s).trim());
    return Number.isFinite(t) ? t : 0;
  }

  function toCreatedAtIso(dateDisplay, fallbackIndex) {
    var ms = displayDateToMs(dateDisplay);
    var base = ms || Date.UTC(2020, 0, 1) - fallbackIndex * 86400000;
    return new Date(base).toISOString();
  }

  function parseHashtagsArray(h) {
    if (!h || !Array.isArray(h)) return undefined;
    var out = [];
    for (var i = 0; i < h.length; i++) {
      var t = String(h[i]).trim();
      if (t) out.push(t);
    }
    return out.length ? out : undefined;
  }

  function normalizeEventRow(row, index) {
    if (!row || typeof row !== "object") return null;
    var title = String(row.title != null ? row.title : "").trim();
    var date = String(row.date != null ? row.date : "").trim();
    var content = String(row.content != null ? row.content : row.body != null ? row.body : "");
    if (!title || !date) return null;
    var id = row.id != null ? String(row.id).trim() : "";
    var dateZh = row.dateZh != null ? String(row.dateZh).trim() : "";
    var titleEn = row.titleEn != null ? String(row.titleEn).trim() : "";
    var contentEn =
      row.contentEn != null
        ? String(row.contentEn).trim()
        : row.bodyEn != null
          ? String(row.bodyEn).trim()
          : "";
    var imgRaw = row.imageUrl != null ? row.imageUrl : row.image;
    var imageUrl =
      imgRaw != null && String(imgRaw).trim() ? String(imgRaw).trim() : "";
    var hashtags = parseHashtagsArray(row.hashtags);
    var createdAt =
      typeof row.createdAt === "string" && row.createdAt.trim()
        ? row.createdAt.trim()
        : "";
    if (!createdAt) createdAt = toCreatedAtIso(date, index);
    return {
      id: id,
      title: title,
      date: date,
      dateZh: dateZh,
      content: content,
      titleEn: titleEn,
      contentEn: contentEn,
      imageUrl: imageUrl,
      hashtags: hashtags,
      createdAt: createdAt,
    };
  }

  function applyEventDefaults(item, index) {
    var imageUrl = item.imageUrl && String(item.imageUrl).trim();
    var raw = item.createdAt && String(item.createdAt).trim();
    var parsedMs = raw ? Date.parse(raw) : NaN;
    var createdAt = Number.isFinite(parsedMs)
      ? new Date(parsedMs).toISOString()
      : toCreatedAtIso(item.date, index);
    var dateZh = item.dateZh && String(item.dateZh).trim();
    var titleEn = item.titleEn && String(item.titleEn).trim();
    var contentEn = item.contentEn && String(item.contentEn).trim();
    var hashtags = parseHashtagsArray(item.hashtags);
    return {
      id: item.id,
      title: item.title,
      date: item.date,
      dateZh: dateZh || undefined,
      content: item.content || "",
      titleEn: titleEn || undefined,
      contentEn: contentEn || undefined,
      imageUrl: imageUrl || undefined,
      hashtags: hashtags,
      createdAt: createdAt,
    };
  }

  function parseStoredEvents(json) {
    try {
      var data = JSON.parse(json);
      if (!Array.isArray(data)) return null;
      var out = [];
      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        if (!row || typeof row !== "object") continue;
        var item = normalizeEventRow(row, i);
        if (item) out.push(applyEventDefaults(item, out.length));
      }
      return out.length > 0 ? out : null;
    } catch (e) {
      return null;
    }
  }

  function sortEventsByCreatedAtDesc(items) {
    return items.slice().sort(function (a, b) {
      var tb =
        displayDateToMs(b.createdAt || "") || displayDateToMs(b.date);
      var ta =
        displayDateToMs(a.createdAt || "") || displayDateToMs(a.date);
      return tb - ta;
    });
  }

  /** 專案 data/events.json → 與 localStorage 相同形狀之陣列（供純 HTML 後台還原／預設） */
  function eventsFromProjectJson(obj) {
    try {
      var o = typeof obj === "string" ? JSON.parse(obj) : obj;
      var rows = o && o.events;
      if (!Array.isArray(rows)) return null;
      var out = [];
      for (var i = 0; i < rows.length; i++) {
        var item = normalizeEventRow(rows[i], i);
        if (item) out.push(applyEventDefaults(item, out.length));
      }
      return out.length ? sortEventsByCreatedAtDesc(out) : null;
    } catch (e) {
      return null;
    }
  }

  function renderNewsList(items) {
    var sorted = sortNewsItems(items);
    var html = "";
    for (var i = 0; i < sorted.length; i++) {
      var item = sorted[i];
      var href = "./announcement-detail.html?id=" + encodeURIComponent(item.id);
      var tagClass = item.isTop ? "tag top" : "tag note";
      var tagText = item.isTop ? "TOP" : esc(item.date);
      html +=
        "          <li>\n" +
        '            <a href="' +
        esc(href) +
        '">\n' +
        '              <span class="' +
        tagClass +
        '">' +
        tagText +
        "</span>\n" +
        "              <span>\n" +
        '                <p class="item-title">' +
        esc(item.title) +
        "</p>\n" +
        '                <p class="item-sub">查看詳細內容 →</p>\n' +
        "              </span>\n" +
        "            </a>\n" +
        "          </li>";
    }
    return html;
  }

  var PURE_EVENT_CLIP = 150;

  function clipTextParts(s) {
    var arr = Array.from(String(s || ""));
    if (arr.length <= PURE_EVENT_CLIP) {
      return { head: arr.join(""), tail: "", long: false };
    }
    return {
      head: arr.slice(0, PURE_EVENT_CLIP).join(""),
      tail: arr.slice(PURE_EVENT_CLIP).join(""),
      long: true,
    };
  }

  function renderCollapsibleBlock(text, blockClass, langAttr) {
    var p = clipTextParts(text);
    var lang = langAttr ? ' lang="' + langAttr + '"' : "";
    if (!p.long) {
      return (
        '<div class="' +
        blockClass +
        '"' +
        lang +
        ">" +
        esc(p.head) +
        "</div>"
      );
    }
    return (
      '<div class="' +
      blockClass +
      " pure-event-card__content--collapsible\"" +
      lang +
      ">\n" +
      '          <span class="pure-event-card__excerpt">' +
      esc(p.head) +
      "</span>" +
      '<span class="pure-event-card__ellipsis" aria-hidden="true">…</span>' +
      '<span class="pure-event-card__rest" hidden>' +
      esc(p.tail) +
      "</span>\n" +
      "        </div>"
    );
  }

  function renderToggleButton() {
    return (
      '\n        <div class="pure-event-card__toggle-wrap">\n' +
      '          <button type="button" class="pure-event-card__toggle" aria-expanded="false">\n' +
      '            <span class="pure-event-card__toggle-more">Read more</span>\n' +
      '            <span class="pure-event-card__toggle-less" hidden>Read less</span>\n' +
      "          </button>\n" +
      "        </div>"
    );
  }

  function renderEventCards(items) {
    var sorted = sortEventsByCreatedAtDesc(items);
    var html = "";
    for (var i = 0; i < sorted.length; i++) {
      var ev = sorted[i];
      var imgBlock = "";
      if (ev.imageUrl) {
        imgBlock =
          '      <div class="pure-event-card__media">\n' +
          '        <img class="pure-event-card__img" src="' +
          escAttr(ev.imageUrl) +
          '" alt="" width="1200" height="750" loading="lazy" decoding="async" />\n' +
          "      </div>\n";
      } else {
        imgBlock =
          '      <div class="pure-event-card__media pure-event-card__media--empty" aria-hidden="true"></div>\n';
      }
      var tagBlock = "";
      if (ev.hashtags && ev.hashtags.length) {
        var tagLine = ev.hashtags
          .map(function (t) {
            return esc(String(t).trim());
          })
          .filter(Boolean)
          .join(" ");
        if (tagLine) {
          tagBlock =
            '\n        <p class="pure-event-card__hashtags">' + tagLine + "</p>";
        }
      }
      var titleEnInside = "";
      if (ev.titleEn && String(ev.titleEn).trim()) {
        titleEnInside =
          '\n            <p class="pure-event-card__title-en" lang="en">' +
          esc(String(ev.titleEn).trim()) +
          "</p>";
      }
      var contentEn = ev.contentEn && String(ev.contentEn).trim();
      var zhP = clipTextParts(ev.content);
      var enP = clipTextParts(contentEn || "");
      var needsToggle = zhP.long || enP.long;

      var zhBlock = renderCollapsibleBlock(ev.content, "pure-event-card__content", "");
      var bodyEnBlock = "";
      if (contentEn) {
        bodyEnBlock =
          "\n" + renderCollapsibleBlock(contentEn, "pure-event-card__content-en", "en");
      }
      var toggleBlock = needsToggle ? renderToggleButton() : "";

      html +=
        "      <article class=\"pure-event-card\">\n" +
        imgBlock +
        "      <div class=\"pure-event-card__body\">\n" +
        '        <header class="pure-event-card__head">\n' +
        '          <div class="pure-event-card__head-main">\n' +
        '            <h3 class="pure-event-card__title">' +
        esc(ev.title) +
        "</h3>" +
        titleEnInside +
        "\n          </div>\n" +
        '          <div class="pure-event-card__date">' +
        esc(ev.dateZh && String(ev.dateZh).trim() ? ev.dateZh : ev.date) +
        "</div>\n" +
        "        </header>\n" +
        '        <div class="pure-event-card__text-stack">\n' +
        zhBlock +
        bodyEnBlock +
        toggleBlock +
        "\n        </div>" +
        tagBlock +
        "\n      </div>\n" +
        "    </article>\n";
    }
    return html;
  }

  function ensurePureEventCardHead(card) {
    var body = card.querySelector(".pure-event-card__body");
    if (!body || body.querySelector(".pure-event-card__head")) return;
    var h3 = body.querySelector(".pure-event-card__title");
    var date = body.querySelector(".pure-event-card__date");
    if (!h3 || !date) return;
    var titleEn = body.querySelector(".pure-event-card__title-en");
    var head = document.createElement("header");
    head.className = "pure-event-card__head";
    var main = document.createElement("div");
    main.className = "pure-event-card__head-main";
    body.insertBefore(head, h3);
    head.appendChild(main);
    main.appendChild(h3);
    if (titleEn) main.appendChild(titleEn);
    head.appendChild(date);
  }

  function wrapPureEventTextStack(body) {
    if (!body || body.querySelector(".pure-event-card__text-stack")) return;
    var toMove = Array.prototype.filter.call(body.children, function (el) {
      return (
        el.classList.contains("pure-event-card__content") ||
        el.classList.contains("pure-event-card__content-en") ||
        el.classList.contains("pure-event-card__toggle-wrap")
      );
    });
    if (!toMove.length) return;
    var stack = document.createElement("div");
    stack.className = "pure-event-card__text-stack";
    body.insertBefore(stack, toMove[0]);
    toMove.forEach(function (n) {
      stack.appendChild(n);
    });
  }

  function upgradeStaticPureEventCard(card) {
    var body = card.querySelector(".pure-event-card__body");
    if (!body) return;
    if (card.querySelector(".pure-event-card__toggle")) return;
    var zhDiv = body.querySelector(
      ".pure-event-card__content:not(.pure-event-card__content-en)"
    );
    if (!zhDiv || zhDiv.classList.contains("pure-event-card__content--collapsible")) {
      wrapPureEventTextStack(body);
      return;
    }
    var enDiv = body.querySelector(".pure-event-card__content-en");
    var zhP = clipTextParts(zhDiv.textContent);
    var enP = clipTextParts(enDiv ? enDiv.textContent : "");
    if (!zhP.long && !enP.long) {
      wrapPureEventTextStack(body);
      return;
    }
    zhDiv.classList.add("pure-event-card__content--collapsible");
    zhDiv.innerHTML =
      '<span class="pure-event-card__excerpt">' +
      esc(zhP.head) +
      '</span><span class="pure-event-card__ellipsis" aria-hidden="true">…</span><span class="pure-event-card__rest" hidden>' +
      esc(zhP.tail) +
      "</span>";
    if (enDiv) {
      if (enP.long) {
        enDiv.classList.add("pure-event-card__content--collapsible");
        enDiv.innerHTML =
          '<span class="pure-event-card__excerpt">' +
          esc(enP.head) +
          '</span><span class="pure-event-card__ellipsis" aria-hidden="true">…</span><span class="pure-event-card__rest" hidden>' +
          esc(enP.tail) +
          "</span>";
      }
    }
    var temp = document.createElement("div");
    temp.innerHTML = renderToggleButton();
    var toggleWrap = temp.firstElementChild;
    var hash = body.querySelector(".pure-event-card__hashtags");
    if (hash) body.insertBefore(toggleWrap, hash);
    else body.appendChild(toggleWrap);
    wrapPureEventTextStack(body);
  }

  function wirePureEventCardToggle(card) {
    var btn = card.querySelector(".pure-event-card__toggle");
    if (!btn || btn.getAttribute("data-pure-toggle-wired") === "1") return;
    btn.setAttribute("data-pure-toggle-wired", "1");
    var more = btn.querySelector(".pure-event-card__toggle-more");
    var less = btn.querySelector(".pure-event-card__toggle-less");
    btn.addEventListener("click", function () {
      var exp = btn.getAttribute("aria-expanded") === "true";
      var next = !exp;
      btn.setAttribute("aria-expanded", next ? "true" : "false");
      card.querySelectorAll(".pure-event-card__rest").forEach(function (r) {
        r.hidden = !next;
      });
      card.querySelectorAll(".pure-event-card__ellipsis").forEach(function (e) {
        e.hidden = next;
      });
      if (more) more.hidden = next;
      if (less) less.hidden = !next;
    });
  }

  function initPureEventCardsIn(container) {
    if (!container) return;
    container.querySelectorAll(".pure-event-card").forEach(function (card) {
      ensurePureEventCardHead(card);
      upgradeStaticPureEventCard(card);
      wirePureEventCardToggle(card);
    });
  }

  function setNotice(visible, text) {
    var el = document.getElementById("pure-ls-notice");
    if (!el) return;
    if (visible) {
      el.removeAttribute("hidden");
      el.textContent = text;
    } else {
      el.setAttribute("hidden", "");
      el.textContent = "";
    }
  }

  function applyFromLocalStorage() {
    var newsEl = document.getElementById("pure-announce-list");
    var eventsEl = document.querySelector(".pure-events-list");
    if (!eventsEl) return;

    var appliedNews = false;
    var appliedEvents = false;

    if (newsEl) {
      try {
        var rawNews = localStorage.getItem(NEWS_KEY);
        if (rawNews) {
          var newsItems = parseStoredNews(rawNews);
          if (newsItems) {
            newsEl.innerHTML = renderNewsList(newsItems);
            appliedNews = true;
          }
        }
      } catch (err) {
        /* ignore */
      }
    }

    try {
      var rawEv = localStorage.getItem(EVENT_KEY);
      if (rawEv) {
        var evItems = parseStoredEvents(rawEv);
        if (evItems) {
          eventsEl.innerHTML = renderEventCards(evItems);
          appliedEvents = true;
        }
      }
    } catch (err2) {
      /* ignore */
    }

    if (appliedNews || appliedEvents) {
      var keys = [];
      if (appliedNews) keys.push(NEWS_KEY);
      if (appliedEvents) keys.push(EVENT_KEY);
      setNotice(
        true,
        "已套用瀏覽器內與互動版後台相同的資料（localStorage：" +
          keys.join("、") +
          "）。若內容未變，請確認本頁與後台為「同一網址來源」（建議執行 npm start，皆以 http://127.0.0.1:3000/… 開啟，勿混用 file://）。"
      );
    } else {
      setNotice(false, "");
    }

    initPureEventCardsIn(eventsEl);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyFromLocalStorage);
  } else {
    applyFromLocalStorage();
  }

  window.addEventListener("storage", function (e) {
    if (
      e.key === NEWS_KEY ||
      e.key === EVENT_KEY ||
      e.key === null
    ) {
      applyFromLocalStorage();
    }
  });

  window.addEventListener(EVENT_CHANGED, applyFromLocalStorage);

  window.__immbaPure = {
    newsKey: NEWS_KEY,
    eventKey: EVENT_KEY,
    eventsChanged: EVENT_CHANGED,
    refresh: applyFromLocalStorage,
    parseStoredEvents: parseStoredEvents,
    eventsFromProjectJson: eventsFromProjectJson,
    sortEvents: sortEventsByCreatedAtDesc,
    initEventCards: initPureEventCardsIn,
  };
})();
