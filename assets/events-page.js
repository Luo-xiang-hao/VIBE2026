/**
 * 活動集錦頁：載入 data/events.json（失敗時用 events-embed.js）
 * 版面：左圖右文各約 1/2；內文超過約 150 字可 Read more／less（每則獨立）
 */
(function () {
  var OFFICIAL_GALLERY =
    "https://www.management.fju.edu.tw/subweb/immba/subedit.php?EID=241";

  function dataUrl() {
    return new URL("data/events.json", window.location.href).href;
  }

  var FALLBACK_LOCAL = new URL("assets/event-cards/p1.svg", window.location.href).href;

  function normalizeEvent(raw, locale) {
    if (!raw || typeof raw !== "object") return null;
    var useEn = locale === "en";
    var titleZh =
      raw.title != null ? String(raw.title) : raw.Title != null ? String(raw.Title) : "";
    var titleEn =
      raw.titleEn != null
        ? String(raw.titleEn).trim()
        : raw.TitleEn != null
          ? String(raw.TitleEn).trim()
          : "";
    var title = useEn ? titleEn || titleZh.trim() : titleZh.trim();

    var dateEn = raw.date != null ? String(raw.date) : raw.Date != null ? String(raw.Date) : "";
    var dateZh = raw.dateZh != null ? String(raw.dateZh).trim() : "";
    var date = useEn ? dateEn.trim() : dateZh || dateEn.trim();

    var bodyZh =
      raw.body != null
        ? String(raw.body)
        : raw.Body != null
          ? String(raw.Body)
          : raw.content != null
            ? String(raw.content)
            : "";
    var bodyEn =
      raw.bodyEn != null
        ? String(raw.bodyEn)
        : raw.contentEn != null
          ? String(raw.contentEn)
          : "";
    var body = useEn && String(bodyEn).trim() ? bodyEn : bodyZh;

    var id = raw.id != null ? String(raw.id).trim() : "";
    var tags = raw.hashtags;
    if (!Array.isArray(tags)) tags = raw.Hashtags;
    var hashtags = Array.isArray(tags)
      ? tags.map(function (t) {
          return String(t).trim();
        }).filter(Boolean)
      : [];
    var img = raw.image != null ? String(raw.image).trim() : "";
    return {
      id: id,
      title: title,
      date: date.trim(),
      body: body,
      hashtags: hashtags,
      image: img || undefined,
    };
  }

  function imageFor(ev) {
    if (ev.image) {
      try {
        return new URL(ev.image, window.location.href).href;
      } catch (e) {
        return ev.image;
      }
    }
    return FALLBACK_LOCAL;
  }

  var BODY_CLIP = 150;

  function clipBodyParts(s) {
    var arr = Array.from(String(s || ""));
    if (arr.length <= BODY_CLIP) {
      return { head: arr.join(""), tail: "", long: false };
    }
    return {
      head: arr.slice(0, BODY_CLIP).join(""),
      tail: arr.slice(BODY_CLIP).join(""),
      long: true,
    };
  }

  function renderRow(ev, index, locale) {
    var useEn = locale === "en";
    var article = document.createElement("article");
    article.className =
      "events-page-row" + (index % 2 === 1 ? " events-page-row--reverse" : "");
    if (ev.id) article.setAttribute("data-event-id", ev.id);

    var media = document.createElement("div");
    media.className = "events-page-row__media";
    var img = document.createElement("img");
    img.className = "events-page-row__img";
    img.src = imageFor(ev);
    img.alt = "";
    img.width = 1200;
    img.height = 750;
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", function once() {
      img.removeEventListener("error", once);
      if (img.getAttribute("data-fb") === "1") return;
      img.setAttribute("data-fb", "1");
      img.src = FALLBACK_LOCAL;
    });
    media.appendChild(img);

    var content = document.createElement("div");
    content.className = "events-page-row__content";

    var head = document.createElement("div");
    head.className = "events-page-row__head";
    var headMain = document.createElement("div");
    headMain.className = "events-page-row__head-main";

    var h2 = document.createElement("h2");
    h2.className = "events-page-row__title";
    h2.textContent = ev.title || (useEn ? "(No title)" : "（無標題）");
    headMain.appendChild(h2);

    var dateEl = document.createElement("div");
    dateEl.className = "events-page-row__date";
    dateEl.textContent = ev.date || "—";

    head.appendChild(headMain);
    head.appendChild(dateEl);

    var stack = document.createElement("div");
    stack.className = "events-page-row__text-stack";

    var parts = clipBodyParts(ev.body);
    var bodyEl = document.createElement("div");
    bodyEl.className = "events-page-row__body-text";
    if (parts.long) {
      bodyEl.classList.add("events-page-row__body-text--collapsible");
      var exSpan = document.createElement("span");
      exSpan.className = "events-page-row__excerpt";
      exSpan.textContent = parts.head;
      var ell = document.createElement("span");
      ell.className = "events-page-row__ellipsis";
      ell.setAttribute("aria-hidden", "true");
      ell.textContent = "…";
      var rest = document.createElement("span");
      rest.className = "events-page-row__rest";
      rest.hidden = true;
      rest.textContent = parts.tail;
      bodyEl.appendChild(exSpan);
      bodyEl.appendChild(ell);
      bodyEl.appendChild(rest);
    } else {
      bodyEl.textContent = parts.head;
    }
    stack.appendChild(bodyEl);

    if (parts.long) {
      var toggleWrap = document.createElement("div");
      toggleWrap.className = "events-page-row__toggle-wrap";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "events-page-row__toggle";
      btn.setAttribute("aria-expanded", "false");
      var labMore = document.createElement("span");
      labMore.className = "events-page-row__toggle-more";
      labMore.textContent = "Read more";
      var labLess = document.createElement("span");
      labLess.className = "events-page-row__toggle-less";
      labLess.hidden = true;
      labLess.textContent = "Read less";
      btn.appendChild(labMore);
      btn.appendChild(labLess);
      btn.addEventListener("click", function () {
        var exp = btn.getAttribute("aria-expanded") === "true";
        var next = !exp;
        btn.setAttribute("aria-expanded", next ? "true" : "false");
        rest.hidden = !next;
        ell.hidden = next;
        labMore.hidden = next;
        labLess.hidden = !next;
      });
      toggleWrap.appendChild(btn);
      stack.appendChild(toggleWrap);
    }

    content.appendChild(head);
    content.appendChild(stack);

    var tags = ev.hashtags;
    if (tags && tags.length) {
      var tagWrap = document.createElement("div");
      tagWrap.className = "events-page-row__tags";
      tags.forEach(function (t) {
        var s = document.createElement("span");
        s.className = "events-page-row__tag";
        s.textContent = t;
        tagWrap.appendChild(s);
      });
      content.appendChild(tagWrap);
    }

    article.appendChild(media);
    article.appendChild(content);
    return article;
  }

  function mountList(container, list, locale) {
    container.innerHTML = "";
    (list || []).forEach(function (item, index) {
      container.appendChild(renderRow(item, index, locale));
    });
  }

  function setBusy(el, on) {
    if (el) el.setAttribute("aria-busy", on ? "true" : "false");
  }

  window.immbaEventsPage = {
    officialGalleryUrl: OFFICIAL_GALLERY,
    load: function (selector, options) {
      var opts = options && typeof options === "object" ? options : {};
      var locale = opts.locale === "en" ? "en" : "zh";
      var el =
        typeof selector === "string"
          ? document.querySelector(selector)
          : selector;
      if (!el) return;
      setBusy(el, true);

      fetch(dataUrl(), { credentials: "same-origin" })
        .then(function (r) {
          if (!r.ok) throw new Error("bad");
          return r.json();
        })
        .then(function (data) {
          var rawList = (data && data.events) || [];
          var list = rawList
            .map(function (row) {
              return normalizeEvent(row, locale);
            })
            .filter(Boolean);
          mountList(el, list, locale);
        })
        .catch(function () {
          var emb = window.__IMMBA_EVENTS_EMBED__;
          if (emb && emb.events && emb.events.length) {
            mountList(
              el,
              emb.events
                .map(function (row) {
                  return normalizeEvent(row, locale);
                })
                .filter(Boolean),
              locale
            );
            return;
          }
          el.innerHTML =
            '<p class="events-page-error muted">' +
            (locale === "en"
              ? "Unable to load events."
              : "無法載入活動集錦資料。") +
            "</p>";
        })
        .finally(function () {
          setBusy(el, false);
        });
    },
  };
})();
