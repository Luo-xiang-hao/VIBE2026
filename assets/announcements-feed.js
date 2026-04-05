/**
 * 首頁／公告列表：讀取 data/announcements.json；file:// 或 fetch 失敗時改用 __IMMBA_ANNOUNCEMENTS_EMBED__。
 * 列表項目連至 ./announcement-detail.html?id=…
 */
(function () {
  function parseAnnounceDate(s) {
    if (!s || typeof s !== "string") return 0;
    var m = s.trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (!m) return 0;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
  }

  function sortAnnouncements(list) {
    return list.slice().sort(function (a, b) {
      var topDiff = (b.isTop ? 1 : 0) - (a.isTop ? 1 : 0);
      if (topDiff !== 0) return topDiff;
      return parseAnnounceDate(b.date) - parseAnnounceDate(a.date);
    });
  }

  function migrateItem(raw) {
    if (!raw) return null;
    var id = String(raw.id || "").trim();
    if (!id) return null;
    return {
      id: id,
      date: String(raw.date || "").trim(),
      isTop: !!raw.isTop,
      titleZh: String(raw.titleZh != null ? raw.titleZh : raw.title || "").trim(),
      titleEn: String(raw.titleEn || "").trim(),
      urlZh: String(raw.urlZh != null ? raw.urlZh : raw.url || "").trim(),
      urlEn: String(raw.urlEn || "").trim(),
    };
  }

  function loadAnnouncements() {
    return new Promise(function (resolve) {
      var embed = window.__IMMBA_ANNOUNCEMENTS_EMBED__;
      var jsonUrl = new URL("./data/announcements.json", window.location.href).href;
      fetch(jsonUrl, { credentials: "same-origin" })
        .then(function (r) {
          if (!r.ok) throw new Error("bad status");
          return r.json();
        })
        .then(function (json) {
          var arr = (json && json.announcements) || [];
          resolve(
            arr
              .map(migrateItem)
              .filter(function (x) {
                return x && x.id;
              })
          );
        })
        .catch(function () {
          var arr = (embed && embed.announcements) || [];
          resolve(
            arr
              .map(migrateItem)
              .filter(function (x) {
                return x && x.id;
              })
          );
        });
    });
  }

  function detailHref(id, locale) {
    var q = "id=" + encodeURIComponent(id);
    if (locale === "en") q += "&lang=en";
    return "./announcement-detail.html?" + q;
  }

  function displayTitle(item, locale) {
    if (locale === "en") {
      var en = (item.titleEn || "").trim();
      return en || item.titleZh;
    }
    return item.titleZh || item.titleEn;
  }

  function renderIntoUl(ul, items, options) {
    var locale = (options && options.locale) || "zh";
    var limit = options && options.limit;
    var sorted = sortAnnouncements(items);
    if (typeof limit === "number" && limit > 0) sorted = sorted.slice(0, limit);

    ul.textContent = "";
    if (!sorted.length) {
      var empty = document.createElement("li");
      empty.className = "announce-feed-empty";
      empty.textContent =
        locale === "en" ? "No announcements to show." : "目前沒有公告資料。";
      ul.appendChild(empty);
      return;
    }

    sorted.forEach(function (item) {
      var a = document.createElement("a");
      a.href = detailHref(item.id, locale);

      var tag = document.createElement("span");
      tag.className = item.isTop ? "tag top" : "tag note";
      tag.textContent = item.isTop ? "TOP" : item.date;

      var body = document.createElement("span");
      var titleEl = document.createElement("p");
      titleEl.className = "item-title";
      titleEl.textContent = displayTitle(item, locale);
      var sub = document.createElement("p");
      sub.className = "item-sub";
      sub.textContent =
        locale === "en" ? "View details →" : "查看詳細內容 →";
      body.appendChild(titleEl);
      body.appendChild(sub);

      a.appendChild(tag);
      a.appendChild(body);

      var li = document.createElement("li");
      li.appendChild(a);
      ul.appendChild(li);
    });
  }

  window.immbaAnnouncementsFeed = {
    /** @returns {Promise<Array>} */
    getList: function () {
      return loadAnnouncements();
    },
    /**
     * @param {string|Element} selector — 須為 <ul>（建議 class="list"）
     * @param {{ limit?: number, locale?: 'zh'|'en' }} [options]
     */
    load: function (selector, options) {
      var el =
        typeof selector === "string"
          ? document.querySelector(selector)
          : selector;
      if (!el || el.tagName !== "UL") return;
      loadAnnouncements().then(function (items) {
        renderIntoUl(el, items, options || {});
      });
    },
  };
})();
