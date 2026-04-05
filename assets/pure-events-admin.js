/**
 * immba-pure.html 內嵌活動後台：讀寫 immba-event-items（中英欄位、圖片），與 React EventItem 一致。
 * 依賴 pure-localstorage-sync.js 提供 window.__immbaPure。
 */
(function () {
  var P = window.__immbaPure;
  if (!P) return;

  var MONTHS_EN = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  function $(id) {
    return document.getElementById(id);
  }

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

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function todayZh() {
    var d = new Date();
    return d.getFullYear() + "/" + pad2(d.getMonth() + 1) + "/" + pad2(d.getDate());
  }

  function newId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "evt-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
  }

  function ensureId(item) {
    var id = item.id != null ? String(item.id).trim() : "";
    if (id) return id;
    return newId();
  }

  function normalizeItems(arr) {
    if (!arr || !arr.length) return [];
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var it = arr[i];
      if (!it) continue;
      out.push(
        Object.assign({}, it, {
          id: ensureId(it),
        })
      );
    }
    return P.sortEvents(out);
  }

  function formatEnDateFromZh(zh) {
    var m = String(zh).trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (!m) return "";
    var mo = parseInt(m[2], 10) - 1;
    var d = parseInt(m[3], 10);
    var y = parseInt(m[1], 10);
    if (mo < 0 || mo > 11 || d < 1 || d > 31) return "";
    return MONTHS_EN[mo] + " " + d + ", " + y;
  }

  function looksLikeZhDate(s) {
    return /^\d{4}\/\d{1,2}\/\d{1,2}$/.test(String(s).trim());
  }

  function parseHashtagInput(str) {
    var s = String(str || "").trim();
    if (!s) return [];
    var parts = s.split(/[\s,，、]+/);
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].trim();
      if (!p) continue;
      if (p.charAt(0) !== "#") p = "#" + p;
      out.push(p);
    }
    return out;
  }

  function formatHashtagsForInput(arr) {
    if (!arr || !arr.length) return "";
    var o = [];
    for (var i = 0; i < arr.length; i++) {
      var t = String(arr[i]).trim();
      if (t) o.push(t);
    }
    return o.join(" ");
  }

  function translateMyMemory(text, cb) {
    var q = String(text).trim();
    if (!q) {
      cb("");
      return;
    }
    var max = 480;
    if (q.length > max) q = q.slice(0, max);
    var url =
      "https://api.mymemory.translated.net/get?q=" +
      encodeURIComponent(q) +
      "&langpair=zh-TW|en";
    fetch(url)
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        var t = j && j.responseData && j.responseData.translatedText;
        cb(typeof t === "string" ? t : "");
      })
      .catch(function () {
        cb("");
      });
  }

  var SETTINGS_KEY = "immba-pure-pea-ui";

  var state = {
    items: [],
    editingId: null,
    successTimer: null,
    /** null：沿用目前編輯項之圖；string：新 data URL；false：使用者清除圖片 */
    pendingImage: null,
    translateBusy: false,
  };

  var els = {};

  function bindEls() {
    els.form = $("pea-form");
    els.title = $("pea-title");
    els.content = $("pea-content");
    els.titleEn = $("pea-title-en");
    els.contentEn = $("pea-content-en");
    els.dateZh = $("pea-date-zh");
    els.dateEn = $("pea-date-en");
    els.imageFile = $("pea-image");
    els.imagePreview = $("pea-image-preview");
    els.imagePlaceholder = $("pea-image-placeholder");
    els.editingId = $("pea-editing-id");
    els.listBody = $("pea-list-tbody");
    els.listWrap = document.querySelector(".pea-activity-table-wrap");
    els.activityList = $("pea-activity-list");
    els.addNew = $("pea-add-new");
    els.optAutoTranslate = $("pea-opt-auto-translate");
    els.optScrollList = $("pea-opt-scroll-list");
    els.submit = $("pea-submit");
    els.cancel = $("pea-cancel");
    els.restore = $("pea-restore");
    els.error = $("pea-error");
    els.success = $("pea-success");
    els.dateHint = $("pea-date-hint");
    els.clearImage = $("pea-clear-image");
    els.translateBtn = $("pea-translate");
    els.copyZhEn = $("pea-copy-zh-en");
    els.translateStatus = $("pea-translate-status");
    els.hashtags = $("pea-hashtags");
  }

  function loadUiSettings() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      var j = raw ? JSON.parse(raw) : {};
      if (els.optAutoTranslate) els.optAutoTranslate.checked = j.autoTranslateBlur !== false;
      if (els.optScrollList) els.optScrollList.checked = j.scrollAfterSave !== false;
    } catch (e1) {
      /* ignore */
    }
  }

  function saveUiSettings() {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          autoTranslateBlur: !!(els.optAutoTranslate && els.optAutoTranslate.checked),
          scrollAfterSave: !!(els.optScrollList && els.optScrollList.checked),
        })
      );
    } catch (e2) {
      /* ignore */
    }
  }

  function maybeScrollToActivityList() {
    if (!els.optScrollList || !els.optScrollList.checked) return;
    var el = els.activityList || $("pea-activity-list");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showError(msg) {
    if (!els.error) return;
    if (msg) {
      els.error.textContent = msg;
      els.error.removeAttribute("hidden");
    } else {
      els.error.setAttribute("hidden", "");
      els.error.textContent = "";
    }
  }

  function showSuccess(msg) {
    if (!els.success) return;
    if (state.successTimer) {
      clearTimeout(state.successTimer);
      state.successTimer = null;
    }
    if (msg) {
      els.success.textContent = msg;
      els.success.removeAttribute("hidden");
      state.successTimer = setTimeout(function () {
        els.success.setAttribute("hidden", "");
        els.success.textContent = "";
        state.successTimer = null;
      }, 3500);
    } else {
      els.success.setAttribute("hidden", "");
      els.success.textContent = "";
    }
  }

  function setTranslateStatus(msg, isErr) {
    if (!els.translateStatus) return;
    if (!msg) {
      els.translateStatus.setAttribute("hidden", "");
      els.translateStatus.textContent = "";
      return;
    }
    els.translateStatus.removeAttribute("hidden");
    els.translateStatus.textContent = msg;
    els.translateStatus.style.color = isErr ? "#dc2626" : "#64748b";
  }

  function readLs() {
    try {
      var raw = localStorage.getItem(P.eventKey);
      if (!raw) return null;
      return P.parseStoredEvents(raw);
    } catch (e) {
      return null;
    }
  }

  function loadEmbeddedEventsFromPage() {
    var el = document.getElementById("pea-embedded-events");
    if (!el) return null;
    var text = el.textContent;
    if (!text || !String(text).trim()) return null;
    try {
      var j = JSON.parse(text);
      return P.eventsFromProjectJson(j);
    } catch (e) {
      return null;
    }
  }

  function fetchProjectDefaults() {
    var url = new URL("data/events.json", window.location.href).href;
    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("bad status");
        return r.json();
      })
      .then(function (j) {
        return P.eventsFromProjectJson(j);
      })
      .catch(function () {
        return loadEmbeddedEventsFromPage();
      });
  }

  function persistAndRefresh() {
    state.items = normalizeItems(state.items);
    try {
      localStorage.setItem(P.eventKey, JSON.stringify(state.items));
    } catch (e) {
      showError("無法寫入 localStorage（資料可能過大，請縮小圖片或改為網址連結）。");
      return;
    }
    window.dispatchEvent(new Event(P.eventsChanged));
    P.refresh();
    renderList();
  }

  function syncEnDateFromZh() {
    if (!els.dateZh || !els.dateEn) return;
    var en = els.dateEn.value.trim();
    if (en) return;
    var gen = formatEnDateFromZh(els.dateZh.value);
    if (gen) els.dateEn.value = gen;
  }

  function showImagePreview(url) {
    if (!els.imagePreview) return;
    var ph = els.imagePlaceholder;
    if (url) {
      els.imagePreview.src = url;
      els.imagePreview.removeAttribute("hidden");
      if (ph) ph.setAttribute("hidden", "");
    } else {
      els.imagePreview.removeAttribute("src");
      els.imagePreview.setAttribute("hidden", "");
      if (ph) ph.removeAttribute("hidden");
    }
  }

  function resetForm() {
    state.editingId = null;
    state.pendingImage = null;
    if (els.editingId) els.editingId.value = "";
    if (els.title) els.title.value = "";
    if (els.content) els.content.value = "";
    if (els.titleEn) els.titleEn.value = "";
    if (els.contentEn) els.contentEn.value = "";
    if (els.dateZh) els.dateZh.value = todayZh();
    if (els.dateEn) els.dateEn.value = formatEnDateFromZh(els.dateZh.value) || "";
    if (els.imageFile) els.imageFile.value = "";
    showImagePreview("");
    if (els.hashtags) {
      els.hashtags.value =
        "#輔大國際經管 #跨國雙碩士 #FJCU_imMBA #Dual_Master_Degree";
    }
    if (els.submit) els.submit.textContent = "新增／儲存";
    if (els.cancel) els.cancel.setAttribute("hidden", "");
    showError("");
    showSuccess("");
    setTranslateStatus("");
  }

  function openEdit(id) {
    var it = null;
    for (var i = 0; i < state.items.length; i++) {
      if (state.items[i].id === id) {
        it = state.items[i];
        break;
      }
    }
    if (!it) return;
    state.editingId = id;
    state.pendingImage = null;
    if (els.editingId) els.editingId.value = id;
    if (els.title) els.title.value = it.title || "";
    if (els.content) els.content.value = it.content != null ? it.content : "";
    if (els.titleEn) els.titleEn.value = it.titleEn != null ? it.titleEn : "";
    if (els.contentEn) els.contentEn.value = it.contentEn != null ? it.contentEn : "";

    var dz = it.dateZh != null ? String(it.dateZh).trim() : "";
    var de = it.date != null ? String(it.date).trim() : "";
    if (!dz && looksLikeZhDate(de)) {
      dz = de;
      de = formatEnDateFromZh(dz) || de;
    }
    if (els.dateZh) els.dateZh.value = dz || "";
    if (els.dateEn) els.dateEn.value = de || "";

    if (els.imageFile) els.imageFile.value = "";
    var img = it.imageUrl != null ? String(it.imageUrl).trim() : "";
    showImagePreview(img || "");

    if (els.hashtags) {
      els.hashtags.value = formatHashtagsForInput(it.hashtags);
    }

    if (els.submit) els.submit.textContent = "儲存修改";
    if (els.cancel) els.cancel.removeAttribute("hidden");
    showError("");
    showSuccess("");
    setTranslateStatus("");
    if (els.form) {
      els.form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function buildItemPayload() {
    var title = els.title.value.trim();
    var content = els.content ? els.content.value.trim() : "";
    var titleEn = els.titleEn ? els.titleEn.value.trim() : "";
    var contentEn = els.contentEn ? els.contentEn.value.trim() : "";
    var dateZh = els.dateZh ? els.dateZh.value.trim() : "";
    var dateEn = els.dateEn ? els.dateEn.value.trim() : "";
    syncEnDateFromZh();
    dateEn = els.dateEn ? els.dateEn.value.trim() : dateEn;

    var imageUrl = "";
    if (state.pendingImage !== null) {
      if (state.pendingImage === false) imageUrl = "";
      else imageUrl = state.pendingImage;
    } else if (state.editingId) {
      for (var i = 0; i < state.items.length; i++) {
        if (state.items[i].id === state.editingId) {
          imageUrl = state.items[i].imageUrl != null ? String(state.items[i].imageUrl).trim() : "";
          break;
        }
      }
    }

    var nowIso = new Date().toISOString();
    var base = {
      title: title,
      date: dateEn,
      dateZh: dateZh || undefined,
      content: content,
      createdAt: nowIso,
    };
    if (titleEn) base.titleEn = titleEn;
    if (contentEn) base.contentEn = contentEn;
    base.imageUrl = imageUrl ? imageUrl : undefined;
    var tags = parseHashtagInput(els.hashtags && els.hashtags.value);
    base.hashtags = tags.length ? tags : undefined;
    return base;
  }

  function validate() {
    syncEnDateFromZh();
    var t = els.title && els.title.value.trim();
    var c = els.content && els.content.value.trim();
    var dz = els.dateZh && els.dateZh.value.trim();
    var de = els.dateEn && els.dateEn.value.trim();
    if (!dz || !/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dz)) {
      showError("請填寫中文日期，格式 YYYY/MM/DD。");
      return false;
    }
    if (!de) {
      showError("請填寫英文日期（可離開中文日期欄位自動帶入）。");
      return false;
    }
    if (!t || !c) {
      showError("請填寫中文標題與中文內文（必填）。");
      return false;
    }
    showError("");
    return true;
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    var payload = buildItemPayload();
    var editing = state.editingId;
    var nowIso = new Date().toISOString();

    if (editing) {
      state.items = state.items.map(function (it) {
        if (it.id !== editing) return it;
        return Object.assign({}, it, payload, { id: it.id, createdAt: nowIso });
      });
      persistAndRefresh();
      resetForm();
      showSuccess("已儲存修改。");
      maybeScrollToActivityList();
      return;
    }

    state.items.push(
      Object.assign({}, payload, {
        id: newId(),
        createdAt: nowIso,
      })
    );
    persistAndRefresh();
    resetForm();
    showSuccess("已新增活動。");
    maybeScrollToActivityList();
  }

  function onDelete(id) {
    if (!id || !confirm("確定刪除此活動？")) return;
    state.items = state.items.filter(function (x) {
      return x.id !== id;
    });
    persistAndRefresh();
    if (state.editingId === id) resetForm();
    showSuccess("已刪除。");
  }

  function onRestore() {
    if (
      !confirm(
        "將以專案 data/events.json 的「原始活動集錦」覆寫瀏覽器中的活動資料，確定？"
      )
    ) {
      return;
    }
    fetchProjectDefaults().then(function (items) {
      if (!items || !items.length) {
        alert(
          "無法讀取 data/events.json（若以 file:// 開啟常會失敗）。請改用本機伺服器（例如 npm start）後再試。"
        );
        return;
      }
      state.items = normalizeItems(items.slice());
      persistAndRefresh();
      resetForm();
      showSuccess("已還原為原始活動集錦內容。");
      maybeScrollToActivityList();
    });
  }

  function onListClick(e) {
    var btn = e.target.closest("button[data-action]");
    if (!btn || !els.listBody) return;
    if (els.listWrap && !els.listWrap.contains(btn)) return;
    var row = btn.closest("tr[data-pea-id]");
    if (!row) return;
    var id = row.getAttribute("data-pea-id");
    if (!id) return;
    if (btn.getAttribute("data-action") === "edit") openEdit(id);
    if (btn.getAttribute("data-action") === "del") onDelete(id);
  }

  function renderList() {
    if (!els.listBody) return;
    var items = P.sortEvents(state.items);
    if (!items.length) {
      els.listBody.innerHTML =
        '<tr><td colspan="6" class="pea-activity-table__empty">尚無資料（尚未儲存或 localStorage 為空）。可自表單新增、按「新增活動」，或還原專案預設。</td></tr>';
      return;
    }
    var html = "";
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var id = escAttr(it.id || "");
      var titleZh = esc(it.title || "");
      var titleEnRaw = it.titleEn != null ? String(it.titleEn).trim() : "";
      var titleEn = titleEnRaw ? esc(titleEnRaw) : '<span class="pea-muted">（未填）</span>';
      var dz = (it.dateZh && String(it.dateZh).trim()) || "";
      var de = it.date != null ? String(it.date).trim() : "";
      if (!dz && looksLikeZhDate(de)) {
        dz = de;
        de = formatEnDateFromZh(dz) || de;
      }
      var dateCell =
        (dz ? esc(dz) : '<span class="pea-muted">—</span>') +
        ' <span class="pea-date-sep">/</span> ' +
        (de ? esc(de) : '<span class="pea-muted">—</span>');
      var imgUrl = it.imageUrl != null ? String(it.imageUrl).trim() : "";
      var imgCell = imgUrl
        ? '<img class="pea-activity-thumb" src="' +
          escAttr(imgUrl) +
          '" alt="" width="72" height="48" loading="lazy" decoding="async" />'
        : '<span class="pea-muted">—</span>';
      var tagLine = "";
      if (it.hashtags && it.hashtags.length) {
        var tp = [];
        for (var hi = 0; hi < it.hashtags.length; hi++) {
          tp.push(esc(String(it.hashtags[hi]).trim()));
        }
        tagLine = tp.filter(Boolean).join(" ");
      }
      var tagCell =
        '<div class="pea-cell-tags">' +
        (tagLine || '<span class="pea-muted">—</span>') +
        "</div>";
      html +=
        '<tr class="pea-activity-row" data-pea-id="' +
        id +
        '">' +
        "<td>" +
        dateCell +
        "</td>" +
        '<td><div class="pea-cell-title">' +
        titleZh +
        "</div></td>" +
        '<td><div class="pea-cell-title pea-cell-title--en">' +
        titleEn +
        "</div></td>" +
        "<td>" +
        tagCell +
        "</td>" +
        "<td>" +
        imgCell +
        "</td>" +
        '<td class="pea-activity-table__actions">' +
        '<button type="button" class="pure-admin-link pure-admin-link--edit" data-action="edit">修改</button>' +
        '<button type="button" class="pure-admin-link pure-admin-link--del" data-action="del">刪除</button>' +
        "</td>" +
        "</tr>";
    }
    els.listBody.innerHTML = html;
  }

  function onImageChange() {
    var input = els.imageFile;
    if (!input || !input.files || !input.files[0]) return;
    var f = input.files[0];
    if (f.size > 1024 * 1024) {
      showError("圖片超過約 1MB，請壓縮後再上傳。");
      input.value = "";
      return;
    }
    showError("");
    var reader = new FileReader();
    reader.onload = function () {
      var data = reader.result;
      if (typeof data === "string") {
        state.pendingImage = data;
        showImagePreview(data);
      }
    };
    reader.readAsDataURL(f);
  }

  function onClearImage() {
    state.pendingImage = false;
    if (els.imageFile) els.imageFile.value = "";
    showImagePreview("");
    showError("");
  }

  function onCopyZhToEn() {
    if (els.titleEn && els.title) els.titleEn.value = els.title.value;
    if (els.contentEn && els.content) els.contentEn.value = els.content.value;
    setTranslateStatus("已將中文複製到英文欄位，請自行潤稿。", false);
  }

  function runFullTranslate() {
    if (state.translateBusy) return;
    var zhT = els.title && els.title.value.trim();
    var zhC = els.content && els.content.value.trim();
    if (!zhT && !zhC) {
      setTranslateStatus("請先填寫中文標題或內文。", true);
      return;
    }
    state.translateBusy = true;
    setTranslateStatus("翻譯中…", false);
    if (els.translateBtn) els.translateBtn.disabled = true;

    function unlock() {
      state.translateBusy = false;
      if (els.translateBtn) els.translateBtn.disabled = false;
    }

    function afterAll(ok) {
      unlock();
      if (ok) {
        setTranslateStatus(
          "已完成線上翻譯（免費 API 可能截斷長文）；請務必人工確認英文。",
          false
        );
      } else {
        setTranslateStatus("翻譯服務無回應，請改用手動填寫或「複製到英文」。", true);
      }
    }

    if (zhT) {
      translateMyMemory(zhT, function (enT) {
        if (enT && els.titleEn) els.titleEn.value = enT;
        if (!zhC) {
          unlock();
          setTranslateStatus(
            enT
              ? "標題已翻譯，請確認英文。（中文內文為空）"
              : "翻譯服務無回應，請手動填寫英文標題。",
            !enT
          );
          return;
        }
        translateMyMemory(zhC, function (enC) {
          if (enC && els.contentEn) els.contentEn.value = enC;
          afterAll(!!enT || !!enC);
        });
      });
    } else {
      translateMyMemory(zhC, function (enC) {
        if (enC && els.contentEn) els.contentEn.value = enC;
        afterAll(!!enC);
      });
    }
  }

  function onTitleBlur() {
    if (els.optAutoTranslate && !els.optAutoTranslate.checked) return;
    if (!els.titleEn || els.titleEn.value.trim()) return;
    var zh = els.title && els.title.value.trim();
    if (!zh) return;
    translateMyMemory(zh, function (en) {
      if (en && els.titleEn && !els.titleEn.value.trim()) els.titleEn.value = en;
    });
  }

  function onContentBlur() {
    if (els.optAutoTranslate && !els.optAutoTranslate.checked) return;
    if (!els.contentEn || els.contentEn.value.trim()) return;
    var zh = els.content && els.content.value.trim();
    if (!zh) return;
    translateMyMemory(zh, function (en) {
      if (en && els.contentEn && !els.contentEn.value.trim()) {
        els.contentEn.value = en;
        if (zh.length > 480) {
          setTranslateStatus("內文較長時僅翻譯前段；請按「自動翻譯英文」或手動補完。", false);
        }
      }
    });
  }

  function onDateZhBlur() {
    if (!els.dateEn) return;
    if (els.dateEn.value.trim()) return;
    var gen = formatEnDateFromZh(els.dateZh ? els.dateZh.value : "");
    if (gen) els.dateEn.value = gen;
  }

  function onAddNewClick() {
    resetForm();
    if (els.form) {
      els.form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (els.title) {
      try {
        els.title.focus();
      } catch (fe) {
        /* ignore */
      }
    }
  }

  function init() {
    bindEls();
    if (!els.form || !els.listBody) return;

    loadUiSettings();
    if (els.optAutoTranslate) {
      els.optAutoTranslate.addEventListener("change", saveUiSettings);
    }
    if (els.optScrollList) {
      els.optScrollList.addEventListener("change", saveUiSettings);
    }
    if (els.addNew) {
      els.addNew.addEventListener("click", onAddNewClick);
    }

    if (els.dateHint) {
      els.dateHint.textContent = "今日中文日期：" + todayZh() + "。";
    }
    if (els.dateZh && !els.dateZh.value) els.dateZh.value = todayZh();
    if (els.dateEn && !els.dateEn.value && els.dateZh) {
      var g = formatEnDateFromZh(els.dateZh.value);
      if (g) els.dateEn.value = g;
    }

    var fromLs = readLs();
    if (fromLs && fromLs.length) {
      state.items = normalizeItems(fromLs);
    } else {
      var emb = loadEmbeddedEventsFromPage();
      if (emb && emb.length) {
        state.items = normalizeItems(emb);
      }
      fetchProjectDefaults().then(function (d) {
        if (d && d.length) {
          state.items = normalizeItems(d);
          renderList();
        }
      });
    }

    renderList();

    els.form.addEventListener("submit", onSubmit);
    if (els.cancel) {
      els.cancel.addEventListener("click", function () {
        resetForm();
      });
    }
    if (els.restore) els.restore.addEventListener("click", onRestore);
    if (els.listWrap) els.listWrap.addEventListener("click", onListClick);
    if (els.imageFile) els.imageFile.addEventListener("change", onImageChange);
    if (els.clearImage) els.clearImage.addEventListener("click", onClearImage);
    if (els.translateBtn) els.translateBtn.addEventListener("click", runFullTranslate);
    if (els.copyZhEn) els.copyZhEn.addEventListener("click", onCopyZhToEn);
    if (els.title) els.title.addEventListener("blur", onTitleBlur);
    if (els.content) els.content.addEventListener("blur", onContentBlur);
    if (els.dateZh) els.dateZh.addEventListener("blur", onDateZhBlur);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
