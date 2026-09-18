(function () {
  "use strict";

  var root = document.getElementById("main");
  var toast = document.getElementById("toast");
  var materials = { categories: [], topics: [], lessons: [] };
  var labs = [];
  var progressKey = "sitp_academy_progress_v1";
  var progress = loadProgress();
  var profileName = localStorage.getItem("sitp_name") || "Learner";

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  function text(value) { return esc(value).replace(/\n/g, "<br>"); }
  function json(value) { return JSON.stringify(value, null, 2); }
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(progressKey) || "{}"); }
    catch (_) { return {}; }
  }
  function saveProgress() {
    localStorage.setItem(progressKey, JSON.stringify(progress));
    updateTopProgress();
  }
  function markDone(id) { progress[id] = true; saveProgress(); }
  function isDone(id) { return !!progress[id]; }
  function findLab(id) { return labs.filter(function (x) { return x.id === id; })[0]; }
  function category(id) { return materials.categories.filter(function (x) { return x.id === id; })[0]; }
  function topic(id) { return materials.topics.filter(function (x) { return x.id === id; })[0]; }
  function catLabs(id) { return labs.filter(function (x) { return x.category === id; }); }
  function topicLabs(catId, topicId) {
    return labs.filter(function (x) { return x.category === catId && x.topic === topicId; });
  }
  function catTopics(id) {
    return materials.topics.filter(function (x) { return x.category === id; });
  }
  function topicForLab(lab) {
    return lab && lab.topic ? topic(lab.topic) : null;
  }
  function icon(name) {
    var paths = {
      arrow: '<path d="M5 12h13M13 6l6 6-6 6"></path>',
      book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"></path><path d="M4 5.5v15M8 7h8M8 11h7"></path>',
      grid: '<rect x="4" y="4" width="6" height="6"></rect><rect x="14" y="4" width="6" height="6"></rect><rect x="4" y="14" width="6" height="6"></rect><rect x="14" y="14" width="6" height="6"></rect>',
      chart: '<path d="M4 19V5M4 19h17"></path><path d="m7 15 3-4 3 2 5-7"></path>',
      check: '<path d="m5 12 4 4L19 6"></path>',
      search: '<circle cx="11" cy="11" r="6"></circle><path d="m16 16 4 4"></path>',
      back: '<path d="M19 12H5M11 18l-6-6 6-6"></path>',
      plus: '<path d="M12 5v14M5 12h14"></path>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || paths.arrow) + "</svg>";
  }
  function link(href, label, cls) {
    return '<a class="' + (cls || "button outline") + '" href="' + href + '">' + esc(label) + "</a>";
  }
  function badge(label, second, done) {
    return '<div class="overview-card-badges"><span class="overview-card-badge">' + esc(label) + '</span>' +
      (second ? '<span class="overview-card-badge' + (done ? " is-done" : "") + '">' + esc(second) + "</span>" : "") + "</div>";
  }
  function terminalMeta(lab) {
    var topicText = (lab.tag || "LAB").toUpperCase();
    return '<div class="overview-info-panel has-example"><div class="overview-info-meta"><code><b>' +
      esc(lab.code_id || "LAB") + "</b> / " + esc(topicText) + " · " + esc(lab.minutes || 10) + " min · " +
      esc(lab.xp || 100) + " XP" + "</code></div>" +
      '<div class="overview-info-example"><span>Contoh singkat</span><code>' + esc(exampleOneLine(lab)) + "</code></div></div>";
  }
  function exampleOneLine(lab) {
    var raw = lab && lab.example;
    if (raw == null) return "Jalankan input untuk melihat respons.";
    try {
      var parsed = JSON.parse(raw);
      return JSON.stringify(parsed);
    } catch (_) { return String(raw).replace(/\s+/g, " ").trim(); }
  }
  function categoryCard(cat) {
    var ts = catTopics(cat.id);
    var count = catLabs(cat.id).length;
    var done = catLabs(cat.id).filter(function (x) { return isDone(x.id); }).length;
    var preview = ts.slice(0, 4).map(function (t) {
      return '<span>' + esc(t.title) + "</span>";
    }).join("");
    return '<a class="overview-card overview-category-card" href="#/category/' + encodeURIComponent(cat.id) + '">' +
      badge("OWASP " + cat.id.toUpperCase().replace("-"," "), ts.length + " topik", false) +
      '<h3 class="overview-card-link">' + esc(cat.title) + "</h3>" +
      '<p>' + esc((cat.paragraphs || [])[0] || "") + "</p>" +
      '<div class="topic-preview">' + preview + "</div>" +
      '<div class="overview-info-panel"><code><b>' + esc(cat.id.slice(0, 3).toUpperCase()) + "</b> · " + ts.length + " topik · " + count + " lab · " + done + " selesai</code></div>" +
      '<div class="overview-card-actions is-single"><span class="button lime">Pilih kategori ' + icon("arrow") + "</span></div></a>";
  }
  function topicCard(cat, t) {
    var list = topicLabs(cat.id, t.id);
    var done = list.filter(function (x) { return isDone(x.id); }).length;
    var previews = list.slice(0, 8).map(function (x) {
      return '<span>' + esc(x.title) + "</span>";
    }).join("");
    return '<a class="overview-card overview-topic-card" href="#/topic/' + encodeURIComponent(cat.id) + "/" + encodeURIComponent(t.id) + '">' +
      badge(list.length + " jenis lab", done + "/" + list.length + " selesai", done === list.length && list.length > 0) +
      '<h3 class="overview-card-link">' + esc(t.title) + "</h3>" +
      '<p>' + esc((t.paragraphs || [])[0] || "") + "</p>" +
      '<div class="overview-topic-preview">' + previews + (list.length > 8 ? '<span class="preview-more">+' + (list.length - 8) + " jenis lain</span>" : "") + "</div>" +
      '<div class="overview-info-panel"><code><b>' + esc(cat.id.slice(0, 3).toUpperCase()) + "</b> / " + esc(t.id.toUpperCase()) + " · " + list.length + " lab · " + done + " selesai</code></div>" +
      '<div class="overview-card-actions is-single"><span class="button lime">Lihat jenis ' + icon("arrow") + "</span></div></a>";
  }
  function variantCard(lab, index) {
    var done = isDone(lab.id);
    var topicName = topicForLab(lab);
    var back = "#/topic/" + encodeURIComponent(lab.category || "") + "/" + encodeURIComponent(lab.topic || "");
    return '<article class="overview-card overview-variant-card">' +
      badge("JENIS " + String(index + 1).padStart(2, "0"), done ? "✓ Selesai" : (lab.level || "Pemula"), done) +
      '<h3>' + esc(lab.title) + "</h3>" +
      '<p>' + esc(lab.story || lab.goal || "") + "</p>" +
      '<details class="overview-card-details"><summary>Lihat contoh singkat</summary><p>' + esc(exampleOneLine(lab)) + "</p></details>" +
      terminalMeta(lab) +
      '<div class="overview-card-actions is-single"><a class="button lime" href="#/lab/' + encodeURIComponent(lab.id) + '">' + (done ? "Ulangi lab" : "Mulai lab") + " " + icon("arrow") + "</a></div>" +
      (topicName ? '<small class="muted" style="margin-top:10px">Topik: ' + esc(topicName.title) + "</small>" : "") +
      "</article>";
  }
  function layout(content, pageClass) {
    document.body.className = pageClass || "";
    root.innerHTML = content;
    var pageHeading = root.querySelector("h1, h2");
    document.title = pageHeading && pageHeading.textContent.trim()
      ? "SITP Academy · " + pageHeading.textContent.trim()
      : "SITP Academy";
    document.querySelectorAll(".top-nav a").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var active = (pageClass === "page-home" || pageClass === "page-category" || pageClass === "page-topic" || pageClass === "page-lab" || pageClass === "page-material" || pageClass === "page-all-labs")
        ? href === "#/"
        : (pageClass === "page-library" && href === "#/library");
      if (active) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    var crumb = document.getElementById("crumb-label");
    if (crumb) crumb.textContent = pageClass === "page-home" ? "Overview" : (pageClass || "Workspace").replace("page-", "").replace(/-/g, " ").replace(/\b\w/g, function (m) { return m.toUpperCase(); });
    window.scrollTo({ top: 0, behavior: "instant" });
    bindCommon();
  }
  function bindCommon() {
    document.querySelectorAll("[data-action='back']").forEach(function (el) {
      el.addEventListener("click", function () { history.back(); });
    });
  }
  function topIntro(kicker, title, copy) {
    return '<div class="overview-section-heading"><div><span class="eyebrow">' + esc(kicker) +
      '</span><h2>' + esc(title) + "</h2>" + (copy ? '<p class="muted" style="margin:7px 0 0;max-width:700px">' + esc(copy) + "</p>" : "") +
      "</div></div>";
  }
  function renderHome() {
    var doneCount = labs.filter(function (x) { return isDone(x.id); }).length;
    var next = labs.filter(function (x) { return !isDone(x.id); })[0] || labs[0];
    var catCards = materials.categories.map(categoryCard).join("");
    layout(
      '<section class="overview-hero"><div class="overview-hero-copy"><span class="overview-badge">SITP ACADEMY · LEARNING LAB</span>' +
      '<h1>Level up your <em>security game.</em></h1><p>Latihan keamanan web yang terarah, realistis, dan aman. Pilih kategori OWASP, masuk ke topik, lalu uji pola serangannya di lab lokal.</p>' +
      '<div class="overview-actions"><a class="button lime" href="#/category/' + encodeURIComponent(materials.categories[0] ? materials.categories[0].id : "") + '">Mulai dari OWASP ' + icon("arrow") + '</a><a class="text-link" href="#/progress">Lanjutkan latihan ↗</a></div>' +
      '<div class="overview-footnote"><span>100% lokal</span><i></i><span>Data fiktif</span><i></i><span>Hint bertahap</span></div></div>' +
      '<div class="progress-panel"><div class="progress-panel-head"><div><span class="eyebrow">LEARNING CONTROL</span><strong>Personal workspace</strong></div><span class="green-dot"></span></div><span class="muted" style="display:block;margin-top:18px;font-size:10px">Current progress</span><strong style="font-size:27px;color:#1d2b56">' + doneCount + " / " + labs.length + "</strong><progress max='" + labs.length + "' value='" + doneCount + "'></progress>" +
      '<div class="progress-panel-stats"><div><strong>' + doneCount + '</strong><span>Lab selesai</span></div><div><strong>' + materials.lessons.length + '</strong><span>Materi</span></div><div><strong>' + materials.topics.length + '</strong><span>Topik</span></div></div>' +
      '<div class="progress-panel-footer"><span>Target berikutnya</span><a href="#/lab/' + encodeURIComponent(next ? next.id : "") + '">' + esc(next ? next.title : "Semua lab selesai") + icon("arrow") + "</a></div></div></section>" +
      '<div class="overview-filterbar"><label class="search-field">' + icon("search") + '<input id="home-search" aria-label="Cari kategori, topik, atau lab" placeholder="Cari IDOR, injection, authentication..." autocomplete="off"></label><select id="home-category" aria-label="Filter berdasarkan kategori"><option value="">Semua kategori</option>' +
      materials.categories.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.id.toUpperCase() + " · " + c.title) + "</option>"; }).join("") +
      '</select><select id="home-progress" aria-label="Filter berdasarkan progres"><option value="">Semua progres</option><option value="todo">Belum selesai</option><option value="done">Selesai</option></select></div>' +
      '<section id="catalog-section">' + topIntro("OWASP TOP 10:2025", "Pilih kategori. Temukan polanya.", "") +
      '<div class="overview-grid" id="home-grid">' + catCards + "</div></section>" +
      '<section class="learning-strip"><div class="strip-icon">' + icon("book") + '</div><div><span class="eyebrow">LANJUTKAN PERJALANAN</span><h3>Semua ' + materials.lessons.length + ' materi punya lab sendiri.</h3><p>Pilih kategori di atas untuk masuk ke topik dan jenis latihan yang lebih spesifik.</p></div><a class="button outline" href="#/all-labs">Lihat semua lab ' + icon("arrow") + "</a></section>",
      "page-home"
    );
    var search = document.getElementById("home-search");
    var catSel = document.getElementById("home-category");
    var progSel = document.getElementById("home-progress");
    function filter() {
      var q = (search.value || "").toLowerCase();
      var cat = catSel.value;
      var prog = progSel.value;
      var cards = materials.categories.filter(function (c) {
        var list = catLabs(c.id);
        var hay = (c.title + " " + c.id + " " + list.map(function (x) { return x.title + " " + x.tag; }).join(" ")).toLowerCase();
        return (!cat || c.id === cat) && (!q || hay.indexOf(q) >= 0) &&
          (!prog || (prog === "done" ? list.some(function (x) { return isDone(x.id); }) : list.some(function (x) { return !isDone(x.id); })));
      });
      document.getElementById("home-grid").innerHTML = cards.length ? cards.map(categoryCard).join("") : '<div class="empty"><h2>Tidak ada hasil</h2><p>Coba kata kunci lain.</p></div>';
    }
    [search, catSel, progSel].forEach(function (x) { x.addEventListener("input", filter); x.addEventListener("change", filter); });
  }
  function renderCategory(id) {
    var cat = category(id);
    if (!cat) return renderNotFound();
    var ts = catTopics(id);
    layout('<a class="back-link" href="#/">← Kembali ke kategori OWASP</a>' +
      '<section class="compact-intro"><div><span class="eyebrow">' + esc(id.toUpperCase().replace("-"," ")) + '</span><h2>' + esc(cat.title) + '</h2><p>' + esc((cat.paragraphs || [])[0] || "") + '</p></div><details><summary>Ringkasan kategori</summary><p>' + esc((cat.paragraphs || []).slice(1).join(" ")) + "</p></details></section>" +
      topIntro("LANGKAH 2", "Pilih topik kerentanan", "Setiap topik berisi beberapa jenis latihan yang lebih spesifik.") +
      '<div class="group-grid" id="topic-grid">' + ts.map(function (t) { return topicCard(cat, t); }).join("") + "</div>" +
      '<section class="learning-strip"><div><span class="eyebrow">PILIHAN HARI INI</span><h3>' + ts.length + ' topik · ' + catLabs(id).length + ' lab siap dicoba.</h3><p>Masuk ke satu topik untuk melihat jenis lab beserta contoh inputnya.</p></div><a class="button outline" href="#/all-labs">Jelajahi semua lab ' + icon("arrow") + "</a></section>", "page-category");
  }
  function renderTopic(catId, topicId) {
    var cat = category(catId), t = topic(topicId);
    if (!cat || !t) return renderNotFound();
    var list = topicLabs(catId, topicId);
    layout('<a class="back-link" href="#/category/' + encodeURIComponent(catId) + '">← Kembali ke ' + esc(cat.title) + '</a>' +
      '<section class="compact-intro"><div><span class="eyebrow">' + esc(catId.toUpperCase().replace("-"," ")) + ' / TOPIK</span><h2>' + esc(t.title) + '</h2><p>' + esc((t.paragraphs || [])[0] || "") + '</p></div><details><summary>Materi & konteks</summary><p>' + esc((t.paragraphs || []).slice(1).join(" ")) + "</p></details></section>" +
      topIntro("PRAKTIK TERARAH", "Pilih jenis, lalu coba labnya", list.length + " skenario dengan input, hint, dan respons visual.") +
      '<div class="group-grid">' + list.map(function (lab, i) { return variantCard(lab, i); }).join("") + "</div>", "page-topic");
  }
  function renderLibrary() {
    var rows = materials.lessons.map(function (lesson, i) {
      var lab = findLab(lesson.id);
      return '<a class="lesson-row" href="#/material/' + encodeURIComponent(lesson.id) + '"><span class="lesson-index">' + String(i + 1).padStart(3, "0") +
        '</span><div class="lesson-copy"><span class="eyebrow">' + esc((lesson.category || "").toUpperCase()) + ' · ' + esc(lesson.topic || "") + '</span><h3>' + esc(lesson.title) + '</h3><small>' + esc(lesson.paragraphs ? lesson.paragraphs[0] : "") + '</small></div><span class="lesson-state">' + (lab && isDone(lab.id) ? "✓ Selesai" : (lab ? lab.minutes + " min" : "")) + '</span>' + icon("arrow") + "</a>";
    }).join("");
    layout('<div class="page-heading"><div><span class="eyebrow">PUSTAKA BELAJAR</span><h1>Materi ringkas, praktik nyata.</h1><p>Pahami konteksnya sebelum masuk ke jenis lab.</p></div><a class="button outline" href="#/">← Beranda</a></div><div class="filterbar"><label class="search-field">' + icon("search") + '<input id="library-search" aria-label="Cari materi, topik, atau kategori" placeholder="Cari materi, topik, atau kategori..." autocomplete="off"></label></div><div class="lesson-list" id="library-list">' + rows + "</div>", "page-library");
    document.getElementById("library-search").addEventListener("input", function (event) {
      var q = (event.target.value || "").toLowerCase();
      document.getElementById("library-list").innerHTML = materials.lessons.filter(function (x) {
        return (x.title + " " + x.id + " " + (x.paragraphs || []).join(" ")).toLowerCase().indexOf(q) >= 0;
      }).map(function (lesson, i) {
        var lab = findLab(lesson.id);
        return '<a class="lesson-row" href="#/material/' + encodeURIComponent(lesson.id) + '"><span class="lesson-index">' + String(i + 1).padStart(3, "0") + '</span><div class="lesson-copy"><span class="eyebrow">' + esc((lesson.category || "").toUpperCase()) + ' · ' + esc(lesson.topic || "") + '</span><h3>' + esc(lesson.title) + '</h3><small>' + esc(lesson.paragraphs ? lesson.paragraphs[0] : "") + '</small></div><span class="lesson-state">' + (lab && isDone(lab.id) ? "✓ Selesai" : (lab ? lab.minutes + " min" : "")) + '</span>' + icon("arrow") + "</a>";
      }).join("") || '<div class="empty"><h2>Materi tidak ditemukan</h2></div>';
    });
  }
  function renderMaterial(id) {
    var lesson = materials.lessons.filter(function (x) { return x.id === id; })[0];
    if (!lesson) return renderNotFound();
    var cat = category(lesson.category), t = topic(lesson.topic), lab = findLab(id);
    var paragraphs = lesson.paragraphs || [];
    layout('<a class="back-link" href="#/library">← Kembali ke pustaka materi</a><div class="reading-layout"><article class="reading-card"><span class="eyebrow">' + esc((lesson.category || "").toUpperCase()) + ' / MATERI REFERENSI</span><h1>' + esc(lesson.title) + '</h1><p class="lead">' + esc(cat ? cat.title : "") + ' · ' + esc(t ? t.title : "") + '</p><hr><h2>Konteks topik</h2>' + paragraphs.map(function (p) { return '<p>' + text(p) + "</p>"; }).join("") +
      '<div class="callout"><strong>Dari teori ke praktik</strong><p>Materi ini terhubung langsung ke lab: input fiktif, hint bertahap, dan penjelasan mitigasi.</p></div><div class="reading-actions"><a class="button lime" href="#/lab/' + encodeURIComponent(id) + '">Mulai lab materi ini ' + icon("arrow") + '</a><button class="button outline" id="mark-reading">' + (localStorage.getItem("sitp_read_" + id) ? "✓ Sudah dibaca" : "Tandai sudah dibaca") + "</button></div></article>" +
      '<aside class="reading-aside"><div class="compact-intro"><div><span class="eyebrow">RINGKASAN TOPIK</span><h3>' + esc(t ? t.title : "") + '</h3><p>' + (t ? esc((t.paragraphs || [])[0] || "") : "") + "</p></div></div><h3>Lab terkait</h3><p>Pilih satu skenario untuk menguji pola kerentanan ini.</p>" + (lab ? variantCard(lab, 0) : "") + "</aside></div>", "page-material");
    var btn = document.getElementById("mark-reading");
    if (btn) btn.addEventListener("click", function () { localStorage.setItem("sitp_read_" + id, "1"); btn.textContent = "✓ Sudah dibaca"; showToast("Materi ditandai sudah dibaca"); });
  }
  function renderAllLabs() {
    var cards = labs.map(function (lab, i) { return variantCard(lab, i); }).join("");
    layout('<div class="page-heading"><div><span class="eyebrow">KATALOG LAB</span><h1>Semua lab, satu perjalanan.</h1><p>Gunakan filter untuk menemukan latihan yang ingin kamu ulangi.</p></div><a class="button outline" href="#/">← Beranda</a></div><div class="filterbar"><label class="search-field">' + icon("search") + '<input id="labs-search" aria-label="Cari lab, payload, atau topik" placeholder="Cari lab, payload, atau topik..." autocomplete="off"></label><select id="labs-level" aria-label="Filter berdasarkan level"><option value="">Semua level</option><option>Pemula</option><option>Menengah</option><option>Lanjutan</option></select></div><div class="group-grid" id="all-labs-grid">' + cards + "</div>", "page-all-labs");
    var s = document.getElementById("labs-search"), level = document.getElementById("labs-level");
    function filter() {
      var q = (s.value || "").toLowerCase(), lv = level.value;
      var found = labs.filter(function (x) { return (!lv || x.level === lv) && (!q || (x.title + " " + x.tag + " " + x.goal + " " + x.category + " " + x.topic).toLowerCase().indexOf(q) >= 0); });
      document.getElementById("all-labs-grid").innerHTML = found.map(function (x, i) { return variantCard(x, i); }).join("") || '<div class="empty"><h2>Lab tidak ditemukan</h2><p>Coba kata kunci lain.</p></div>';
    }
    s.addEventListener("input", filter); level.addEventListener("change", filter);
  }
  function renderProgress() {
    var done = labs.filter(function (x) { return isDone(x.id); }).length;
    var read = materials.lessons.filter(function (x) { return localStorage.getItem("sitp_read_" + x.id); }).length;
    var initials = (profileName || "L").slice(0, 1).toUpperCase();
    var groups = materials.categories.map(function (c) {
      var list = catLabs(c.id), d = list.filter(function (x) { return isDone(x.id); }).length;
      return '<details class="skill-group"><summary><span>' + esc(c.id.slice(0, 3).toUpperCase()) + '</span><strong>' + esc(c.title) + '</strong><small>' + d + "/" + list.length + " selesai</small></summary><progress max='" + list.length + "' value='" + d + "'></progress></details>";
    }).join("");
    layout('<div class="page-heading"><div><span class="eyebrow">YOUR GROWTH, YOUR PACE</span><h1>Look how far <em class="serif">you\'ve come.</em></h1><p>Progres tersimpan di browser ini.</p></div><a class="button outline" href="#/">← Beranda</a></div><div class="progress-layout"><aside class="profile-card"><div class="avatar large">' + esc(initials) + '</div><h2 id="profile-display">' + esc(profileName) + '</h2><p>Level ' + (Math.floor(done / 5) + 1) + ' · ' + (done * 100) + ' XP</p><progress max="' + labs.length + '" value="' + done + '"></progress><small>' + Math.max(0, 500 - (done * 100 % 500)) + ' XP menuju level berikutnya</small><form id="profile-form"><label for="profile-name">Nama panggilan</label><input id="profile-name" value="' + esc(profileName) + '" maxlength="40"><button class="button primary" type="submit">Simpan profil</button></form><p class="privacy-note">Profil lokal tanpa password. Gunakan browser yang sama untuk melanjutkan.</p></aside><section><div class="progress-stats"><div><strong>' + done + "/" + labs.length + '</strong><span>Lab selesai</span></div><div><strong>' + read + '</strong><span>Materi dibaca</span></div><div><strong>' + materials.topics.length + '</strong><span>Topik tersedia</span></div></div><div class="section-heading"><h2>Skill map</h2><span class="muted">10 kategori, satu perjalanan</span></div>' + groups + "</section></div>", "page-progress");
    document.getElementById("profile-form").addEventListener("submit", function (event) {
      event.preventDefault(); profileName = document.getElementById("profile-name").value.trim() || "Learner"; localStorage.setItem("sitp_name", profileName); showToast("Profil disimpan"); renderProgress();
    });
  }
  function sourceBlock(lab) {
    return '<details class="source-reference"><summary>View page source</summary><pre>' + esc(lab.code || "Source fixture tersedia di data lab.") + "</pre></details>";
  }
  function visualCopy(lab, success) {
    var text = ((lab.topic || "") + " " + (lab.tag || "")).toLowerCase();
    var copy = { kicker: "FIXTURE OBSERVATION", title: success ? "Kondisi rentan teramati" : "Kondisi belum terpenuhi", request: "Input client", impact: "Dampak teramati", note: success ? "Input berhasil melewati aturan fixture sehingga dampaknya dapat diamati." : "Input diterima, tetapi kondisi target belum muncul. Gunakan hint untuk membandingkan perubahan." };
    var map = [
      { keys: ["sqli", "sql injection"], kicker: "DATABASE QUERY", title: success ? "Query mengembalikan data" : "Query belum mengembalikan target", request: "Parameter query", impact: "Hasil query", note: success ? "Input ikut memengaruhi query sehingga data yang seharusnya dibatasi terlihat." : "Query fixture belum mencapai kondisi target SQL injection." },
      { keys: ["command injection"], kicker: "COMMAND PARSER", title: success ? "Perintah virtual diterima" : "Perintah virtual ditolak", request: "Argumen command", impact: "Output command", note: "Fixture mensimulasikan parser command tanpa menjalankan shell atau proses sistem operasi." },
      { keys: ["lfi"], kicker: "FILE RESOLVER", title: success ? "Path file melewati resolver" : "Path file belum melewati resolver", request: "Path yang dikirim", impact: "Respons file", note: "Fixture menampilkan keputusan resolver secara lokal tanpa membaca file host." },
      { keys: ["file upload"], kicker: "UPLOAD PIPELINE", title: success ? "File diterima pipeline" : "File ditolak pipeline", request: "Metadata file", impact: "Keputusan storage", note: "Fixture memperlihatkan keputusan validasi nama, tipe, dan lokasi file secara aman." },
      { keys: ["csrf"], kicker: "CROSS-ORIGIN REQUEST", title: success ? "Request lintas origin diterima" : "Request lintas origin diblokir", request: "Origin dan token", impact: "Perubahan state", note: "Fixture memvisualisasikan hubungan cookie, origin, token, dan perubahan state tanpa request jaringan." },
      { keys: ["idor", "broken function access"], kicker: "AUTHORIZATION CHECK", title: success ? "Akses melewati pemeriksaan izin" : "Akses masih dibatasi", request: "Object atau function target", impact: "Data / aksi", note: "Fixture membandingkan identitas sesi dengan objek atau fungsi yang diminta." },
      { keys: ["business logic", "business rule", "flawed auth workflow"], kicker: "BUSINESS RULE ENGINE", title: success ? "Aturan bisnis dapat dilewati" : "Aturan bisnis masih menahan input", request: "Parameter transaksi", impact: "Keputusan bisnis", note: "Fixture memperlihatkan perbandingan aturan resmi dengan nilai yang dikirim client." },
      { keys: ["username enumeration", "brute force", "session management", "password reset", "authentication"], kicker: "AUTHENTICATION FLOW", title: success ? "Alur autentikasi dapat dipengaruhi" : "Alur autentikasi belum terpengaruh", request: "Kredensial atau sesi", impact: "Keputusan login", note: "Fixture memperlihatkan titik keputusan autentikasi tanpa membuat akun atau mengirim kredensial." },
      { keys: ["misconfig", "configuration", "exposed vcs", "cookie misconfig", "http methods"], kicker: "SECURITY CONFIGURATION", title: success ? "Konfigurasi membuka permukaan serang" : "Konfigurasi belum menunjukkan dampak", request: "Header atau setting", impact: "Kontrol keamanan", note: "Fixture membandingkan konfigurasi yang terlihat oleh client dengan kontrol yang seharusnya diterapkan server." },
      { keys: ["supply chain", "malicious package", "unpinned"], kicker: "BUILD SUPPLY CHAIN", title: success ? "Artefak tidak tepercaya diterima" : "Artefak belum diterima", request: "Paket / referensi build", impact: "Keputusan pipeline", note: "Fixture menampilkan keputusan trust pada paket, registry, dan referensi build secara lokal." },
      { keys: ["crypto", "hashing", "randomness", "jwt", "sensitive data"], kicker: "CRYPTOGRAPHY CHECK", title: success ? "Data sensitif dapat dipengaruhi" : "Pemeriksaan kriptografi belum terpenuhi", request: "Secret atau token", impact: "Perlindungan data", note: "Fixture memperlihatkan apakah secret, token, atau data sensitif melewati pemeriksaan yang diharapkan." },
      { keys: ["integrity"], kicker: "INTEGRITY VERIFICATION", title: success ? "Data tanpa verifikasi diterima" : "Verifikasi masih menahan data", request: "Paket / state", impact: "Keputusan integritas", note: "Fixture menunjukkan titik ketika signature, checksum, atau sumber data seharusnya diverifikasi." },
      { keys: ["logging", "alerting", "detection"], kicker: "DETECTION PIPELINE", title: success ? "Sinyal terdeteksi terlambat atau lolos" : "Rule deteksi belum terpicu", request: "Event dan threshold", impact: "Status alert", note: "Fixture memvisualisasikan event, window, threshold, dan keputusan alert tanpa mengirim log keluar." },
      { keys: ["exception", "non atomic", "type unsafe", "error handling"], kicker: "ERROR PATH", title: success ? "Error path membuka dampak" : "Error path belum terbuka", request: "Input atau kondisi gagal", impact: "State setelah error", note: "Fixture membantu membandingkan state normal dengan state ketika exception atau partial failure terjadi." }
    ];
    for (var i = 0; i < map.length; i++) {
      if (map[i].keys.some(function (key) { return text.indexOf(key) >= 0; })) return map[i];
    }
    return copy;
  }
  function displayValue(value) {
    return typeof value === "object" ? JSON.stringify(value) : String(value == null ? "—" : value);
  }
  function inputRows(raw) {
    var input;
    try { input = JSON.parse(raw); } catch (_) { input = { payload: raw || "—" }; }
    if (!input || typeof input !== "object" || Array.isArray(input)) input = { payload: displayValue(input) };
    return Object.keys(input).slice(0, 8).map(function (key) { return "<tr><td>" + esc(key) + "</td><td>" + esc(displayValue(input[key])) + "</td></tr>"; }).join("");
  }
  function fixtureVisual(lab, data, raw) {
    if (!data) return '<div class="fixture-placeholder">Jalankan request untuk melihat respons aplikasi.</div>';
    var success = data.target_reached === true || (data.target_reached == null && Number(data.status) === 200);
    if ((lab.topic || "") === "xss") {
      return '<div class="xss-safe-preview"><div><strong>Browser render preview</strong><span>escaped · tidak dieksekusi</span></div><div class="xss-browser-window"><div class="xss-browser-bar"><span></span><span></span><span></span><code>/preview</code></div><div class="xss-browser-body"><small>Rendered output</small><pre>' + esc(raw || "") + '</pre></div></div><small>Payload ditampilkan sebagai teks agar latihan GitHub Pages tetap aman. Di aplikasi rentan, konteks output ini dapat ditafsirkan browser sebagai HTML atau JavaScript.</small></div>';
    }
    var keys = Object.keys(data);
    if (keys.indexOf("invoice_id") >= 0) {
      return '<div class="fixture-specific"><div class="fixture-specific-head"><div><span class="fixture-kicker">AUTHORIZATION CHECK</span><strong>Invoice lookup</strong></div><span class="fixture-state ' + (success ? "is-success" : "is-error") + '">' + (success ? "200 · terbuka" : "403 · dibatasi") + '</span></div><table class="fixture-table"><thead><tr><th>Status</th><th>Invoice</th><th>Owner</th><th>Session user</th></tr></thead><tbody><tr><td class="status-cell">' + esc(data.status || 200) + '</td><td>' + esc(data.invoice_id) + '</td><td>' + esc(data.owner || "—") + '</td><td>' + esc(data.session_user || "training") + "</td></tr></tbody></table></div>";
    }
    if (lab.id === "lesson-a04-cryptographic-failures--weak-hashing--plaintext" && data.username) {
      var storageLabel = data.storage === "plaintext" ? "PLAINTEXT" : (data.storage || "—");
      var exposureLabel = data.password_exposed ? "terbaca" : "tidak terbaca";
      return '<div class="fixture-specific"><div class="fixture-specific-head"><div><span class="fixture-kicker">USER TABLE LOOKUP</span><strong>' + (success ? "Password plaintext terbaca" : "Baris akun belum menjadi target") + '</strong></div><span class="fixture-state ' + (success ? "is-success" : "is-error") + '">' + (success ? "200 · exposed" : "200 · hashed") + '</span></div><table class="fixture-table"><thead><tr><th>Username</th><th>Stored password</th><th>Storage</th><th>Exposure</th></tr></thead><tbody><tr><td>' + esc(data.username) + '</td><td>' + esc(data.stored_password || "—") + '</td><td>' + esc(storageLabel) + '</td><td class="status-cell">' + esc(exposureLabel) + '</td></tr></tbody></table><p class="fixture-teaching-note">Username hanya dipakai sebagai kunci lookup. Perhatikan kolom <strong>Stored password</strong>: Rio tersimpan apa adanya, sedangkan akun yang aman menyimpan hash sehingga password asli tidak muncul.</p></div>';
    }
    var copy = visualCopy(lab, success);
    var resultRows = [
      ["Status", data.status || 200],
      ["Kondisi", data.condition || "—"],
      [copy.impact, data.message || data.request || "—"]
    ];
    return '<div class="fixture-specific fixture-contextual"><div class="fixture-specific-head"><div><span class="fixture-kicker">' + esc(copy.kicker) + '</span><strong>' + esc(copy.title) + '</strong></div><span class="fixture-state ' + (success ? "is-success" : "is-error") + '">' + (success ? "CONDITION REACHED" : "TRY AGAIN") + '</span></div><div class="fixture-journey" aria-label="Alur observasi fixture"><div><b>1</b><span>Input client</span><small>' + esc(copy.request) + '</small></div><i>→</i><div><b>2</b><span>Parser server</span><small>' + esc(data.condition || "menunggu input") + '</small></div><i>→</i><div><b>3</b><span>Dampak</span><small>' + esc(copy.impact) + '</small></div></div><div class="fixture-data-grid"><div><h4>Request yang diamati</h4><table class="fixture-table"><thead><tr><th>Field</th><th>Nilai</th></tr></thead><tbody>' + inputRows(raw) + '</tbody></table></div><div><h4>Hasil fixture</h4><table class="fixture-table"><thead><tr><th>Field</th><th>Nilai</th></tr></thead><tbody>' + resultRows.map(function (row) { return '<tr><td>' + esc(row[0]) + '</td><td>' + esc(displayValue(row[1])) + '</td></tr>'; }).join("") + '</tbody></table></div></div><p class="fixture-teaching-note">' + esc(copy.note) + '</p></div>';
  }
  function defaultResponse(lab) {
    if (lab.kind === "foundation" && lab.code_id === "A01") return { status: 200, invoice_id: 5001, owner: "Naya", session_user: "Naya" };
    return { status: 200, request: "fresh request", condition: "ready", message: "Fixture siap menerima input." };
  }
  function evaluate(lab, raw) {
    var expected = lab.example;
    var parsedExpected, parsedInput;
    if (lab.format === "json" || (typeof expected === "string" && expected.trim().charAt(0) === "{")) {
      try { parsedExpected = typeof expected === "string" ? JSON.parse(expected) : expected; parsedInput = JSON.parse(raw); }
      catch (_) { return false; }
      return subset(parsedInput, parsedExpected);
    }
    return String(raw).trim().replace(/\s+/g, " ") === String(expected == null ? "" : expected).trim().replace(/\s+/g, " ");
  }
  function subset(input, expected) {
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      if (!input || typeof input !== "object") return false;
      return Object.keys(expected).every(function (key) { return subset(input[key], expected[key]); });
    }
    return String(input) === String(expected);
  }
  function responseFor(lab, raw, success) {
    var out = defaultResponse(lab);
    if (lab.id === "lesson-a04-cryptographic-failures--weak-hashing--plaintext") {
      var lookup = {};
      try { lookup = JSON.parse(raw); } catch (_) { lookup = { username: raw }; }
      var username = String(lookup.username || "").trim().toLowerCase();
      if (username === "rio") {
        out = { status: 200, username: "rio", stored_password: "rio-plaintext-demo", storage: "plaintext", password_exposed: true, target_reached: true, condition: "user row returned without password hashing", message: "Baris Rio menyimpan password apa adanya: rio-plaintext-demo." };
      } else if (username === "naya") {
        out = { status: 200, username: "naya", stored_password: "$2y$... (bcrypt hash)", storage: "bcrypt", password_exposed: false, target_reached: false, condition: "user row returned with a one-way hash", message: "Akun Naya memakai hash bcrypt; cari baris Rio untuk melihat password plaintext." };
      } else {
        out = { status: 404, username: username || "—", stored_password: "—", storage: "not found", password_exposed: false, target_reached: false, condition: "user row not found", message: "Username demo tidak ditemukan. Coba akun Rio." };
      }
    } else if (lab.id === "a01" || lab.id === "lesson-a01-access-control--idor--basic-read") {
      var input = {};
      try { input = JSON.parse(raw); } catch (_) { input = { id: raw }; }
      var id = Number(input.id || input.invoice_id || raw) || 5001;
      var rioInvoice = id === 1002 || id === 5002;
      var nayaInvoice = id === 1001 || id === 5001;
      out = { status: success ? 200 : 403, invoice_id: id, owner: rioInvoice ? "Rio" : (nayaInvoice ? "Naya" : "Demo user"), session_user: "Naya" };
    } else {
      out.status = success ? 200 : 422;
      out.request = lab.tag || lab.code_id || "fixture";
      out.condition = success ? "condition reached" : "input belum sesuai target";
      out.message = success ? (lab.explanation || "Target tercapai pada fixture lokal.") : (lab.retry || "Coba lagi dengan format sesuai hint.");
    }
    return out;
  }
  function fieldLabel(field) {
    var labels = {
      access_ms: "Waktu akses (ms)", action: "Aksi", amount: "Jumlah", api: "Mode API", api_key: "API key",
      artifact: "Artefak", attempts: "Jumlah percobaan", body: "Body request", browser: "Browser", cache_control: "Cache-Control",
      candidate: "Kandidat", checksum: "Checksum", content: "Konten", content_type: "Content-Type", coupon: "Kupon",
      csp: "Content Security Policy", csrf_token: "Token CSRF", currency: "Mata uang", data: "Data", debug: "Mode debug",
      divisor: "Pembagi", email: "Email", encoded: "Nilai ter-encode", end: "Waktu akhir", filename: "Nama file",
      frame_ancestors: "Frame ancestors", frozen: "Status freeze", host: "Host", html: "HTML", httponly: "HttpOnly",
      id: "ID objek", idempotency_key: "Idempotency key", image: "Gambar", integrity: "Integritas", is_admin: "Status admin",
      method: "HTTP method", new_password: "Password baru", operation: "Operasi", origin: "Origin", override: "Override",
      package: "Paket", parent_origin: "Parent origin", password: "Password", path: "Path", payload: "Payload",
      policy: "Kebijakan", preset_sid: "Preset SID", price: "Harga", product_id: "ID produk", provider: "Provider",
      quantity: "Jumlah", recipient: "Penerima", ref: "Referensi", referer: "Referer", region: "Region", registry: "Registry",
      retries: "Jumlah retry", return_quantity: "Jumlah retur", role: "Peran pengguna", role_cookie: "Role cookie", samesite: "SameSite",
      scheme: "Skema", script: "Script", secret: "Secret", secure: "Secure", seed: "Seed", session_id: "ID sesi",
      source: "Sumber", start: "Waktu mulai", state: "State", status: "Status", step: "Langkah", target: "Target",
      threshold: "Batas pemicu alert", times: "Jumlah kejadian", timestamp: "Timestamp", token: "Token", trusted_device: "Trusted device",
      unit_price: "Harga kiriman (rupiah)", url: "URL", user_id: "ID pengguna", username: "Username", version: "Versi",
      window_seconds: "Jendela waktu (detik)", x_demo: "Header X-Demo"
    };
    return labels[field.key] || field.label || String(field.key || "Input").replace(/_/g, " ").replace(/\b\w/g, function (m) { return m.toUpperCase(); });
  }
  function labInput(lab) {
    if (lab.fields && lab.fields.length) {
      return '<div class="guided-fields">' + lab.fields.map(function (field) {
        var value = "";
        try { var s = JSON.parse(lab.starter || "{}"); value = s[field.key] == null ? "" : s[field.key]; } catch (_) {}
        var control = field.type === "select"
          ? '<select data-field="' + esc(field.key) + '" aria-label="' + esc(fieldLabel(field)) + '">' + (field.options || []).map(function (option) { return '<option value="' + esc(option) + '"' + (String(value) === String(option) ? " selected" : "") + '>' + esc(option) + '</option>'; }).join("") + '</select>'
          : '<input data-field="' + esc(field.key) + '" aria-label="' + esc(fieldLabel(field)) + '" type="' + (field.type === "number" ? "number" : "text") + '" value="' + esc(value) + '">';
        return '<label>' + esc(fieldLabel(field)) + control + '</label>';
      }).join("") + '</div><details class="raw-input"><summary>Lihat / edit JSON (opsional)</summary><textarea id="lab-input" aria-label="JSON input latihan" rows="5">' + esc(lab.starter || "{}") + "</textarea></details>";
    }
    return '<textarea id="lab-input" aria-label="Input latihan" rows="5">' + esc(lab.starter || "") + "</textarea>";
  }
  function renderLab(id) {
    var lab = findLab(id);
    if (!lab) return renderNotFound();
    var cat = category(lab.category), t = topicForLab(lab);
    var rawData = null, lastRaw = null;
    layout('<div class="lab-heading"><div><a class="back-link" href="#/topic/' + encodeURIComponent(lab.category || "") + "/" + encodeURIComponent(lab.topic || "") + '">← Kembali ke topik</a><span class="eyebrow">' + esc((lab.code_id || "LAB") + " / " + (lab.tag || "PRACTICE")) + '</span><h1>' + esc(lab.title) + '</h1></div><div class="lab-meta"><span class="pill">' + esc(lab.level || "Pemula") + '</span><span>' + esc(lab.minutes || 10) + ' menit</span><span class="xp-label">' + esc(lab.xp || 100) + ' XP</span></div></div><div class="lab-layout"><article class="mission-panel"><div class="panel-label"><span class="step-badge">01</span> THE MISSION</div><h2>Cerita singkat</h2><p>' + text(lab.story || "") + '</p><div class="goal-box"><span>' + icon("check") + ' Target kamu</span><p>' + esc(lab.goal || "") + '</p></div><div class="beginner-guide"><h3>Mulai dari sini</h3><ol>' + (lab.steps || []).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol></div><div class=\"hint-heading\"><h3>Hint bertahap</h3><span>Gratis · XP tetap utuh</span></div>" +
      '<details class="hint" open><summary>Hint 1 · Pahami idenya <span>×</span></summary><p>' + esc(lab.hint || "") + '</p></details><details class="hint"><summary>Hint 2 · Yang perlu diubah <span>+</span></summary><p>' + text(lab.hint2 || "") + '</p></details><details class="hint"><summary>Hint 3 · Contoh jawaban & alasan <span>+</span></summary><p>' + esc(lab.explanation || "") + "</p></details><div class=\"lab-context\">" + icon("check") + " Data fiktif · Fixture lokal · Aman untuk latihan</div></article>" +
      '<section class="work-panel"><div class="terminal-top"><div><span></span><span></span><span></span></div><span>playground / ' + esc(lab.code_id || "") + ' · ' + esc(lab.id.slice(-8)) + '</span><span>STATIC FIXTURE</span></div><div class="code-label">KODE / BUKTI YANG DIAMATI</div><pre class="code-block">' + esc(lab.code || "") + "</pre>" + sourceBlock(lab) +
      '<div class="live-preview"><div class="live-preview-head"><div><strong>Live fixture runner</strong><small>Respons aplikasi divisualisasi secara lokal di browser.</small></div><span id="runtime-preview-status" role="status" aria-live="polite">HTTP 200 · fixture siap</span></div><div class="static-fixture-frame"><div class="static-fixture-bar"><strong>SITP Demo</strong><span>/demo · signed in as training</span><span class="green-dot"></span></div><div class="static-fixture-card"><div class="fixture-trace"><span>REQUEST</span> POST /virtual/' + esc(lab.code_id || "LAB") + ' <i>→</i><b>ready to send</b></div><div class="fixture-visual" id="fixture-visual" aria-live="polite"><div class="fixture-placeholder">Jalankan request untuk melihat respons aplikasi.</div></div></div></div><small>Output mengikuti parser dan state fixture lab. Tidak ada akses host, shell, jaringan, atau executable.</small></div>' +
      '<form class="lab-form" id="lab-form"><div class="guided-heading"><span>' + esc(lab.label || "Input latihan") + '</span><span>JSON dibuat otomatis</span></div>' + labInput(lab) + '<p class="input-note">Boleh mencoba berkali-kali. Jawaban salah dan hint tidak mengurangi XP.</p><div class="form-bottom"><button type="button" class="reset-input">↻ Ulang dari awal</button><button class="button lime" type="submit">Jalankan ' + icon("arrow") + "</button></div></form>" +
      '<div class="response-panel" id="response-panel" role="status" aria-live="polite"><span class="response-label">OUTPUT</span><p class="response-placeholder">Respons eksperimenmu akan muncul di sini.</p></div></section></div>', "page-lab");
    var form = document.getElementById("lab-form"), textarea = document.getElementById("lab-input"), panel = document.getElementById("response-panel"), visual = document.getElementById("fixture-visual"), status = document.getElementById("runtime-preview-status");
    function currentRaw() {
      if (lab.fields && lab.fields.length && document.querySelector(".guided-fields")) {
        var obj = {}; try { obj = JSON.parse(lab.starter || "{}"); } catch (_) {} document.querySelectorAll("[data-field]").forEach(function (el) { obj[el.getAttribute("data-field")] = el.value; }); return JSON.stringify(obj, null, 2);
      }
      return textarea ? textarea.value : "";
    }
    if (lab.fields) document.querySelectorAll("[data-field]").forEach(function (el) { el.addEventListener("input", function () { if (textarea) { var obj = {}; try { obj = JSON.parse(lab.starter || "{}"); } catch (_) {} document.querySelectorAll("[data-field]").forEach(function (f) { obj[f.getAttribute("data-field")] = f.value; }); textarea.value = JSON.stringify(obj, null, 2); } }); });
    form.addEventListener("submit", function (event) {
      event.preventDefault(); lastRaw = currentRaw(); var ok = evaluate(lab, lastRaw); rawData = responseFor(lab, lastRaw, ok); visual.innerHTML = fixtureVisual(lab, rawData, lastRaw); status.textContent = "HTTP " + rawData.status + " · respons dirender"; panel.className = "response-panel " + (ok ? "success" : "error"); panel.innerHTML = '<span class="response-label">OUTPUT</span><div class="result-status">' + (ok ? "✓ Misi selesai · +" + esc(lab.xp || 100) + " XP" : "Belum tepat · coba lagi") + '</div><pre>' + esc(json(rawData)) + "</pre>" + (ok ? '<p class="attempt-feedback">' + esc(lab.explanation || "Target tercapai.") + "</p>" : '<p class="attempt-feedback">' + esc(lab.retry || "Baca hint untuk petunjuk berikutnya.") + "</p>"); if (ok) { markDone(lab.id); showToast("Lab selesai · progres tersimpan"); } else showToast("Respons diterima · cek hint dan coba lagi"); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    });
    document.querySelector(".reset-input").addEventListener("click", function () { if (textarea) textarea.value = lab.starter || ""; if (lab.fields) { try { var s = JSON.parse(lab.starter || "{}"); document.querySelectorAll("[data-field]").forEach(function (el) { el.value = s[el.getAttribute("data-field")] == null ? "" : s[el.getAttribute("data-field")]; }); } catch (_) {} } rawData = null; visual.innerHTML = fixtureVisual(lab, null, null); panel.className = "response-panel"; panel.innerHTML = '<span class="response-label">OUTPUT</span><p class="response-placeholder">Respons eksperimenmu akan muncul di sini.</p>'; status.textContent = "HTTP 200 · fixture siap"; });
  }
  function renderNotFound() { layout('<div class="empty"><h2>Halaman tidak ditemukan</h2><p>Rute yang kamu buka tidak tersedia.</p><a class="button lime" href="#/">Kembali ke beranda ' + icon("arrow") + "</a></div>", "page-empty"); }
  function route() {
    var hash = location.hash.replace(/^#\/?/, "");
    var parts = hash.split("/").filter(Boolean).map(function (x) { try { return decodeURIComponent(x); } catch (_) { return x; } });
    if (!parts.length) return renderHome();
    if (parts[0] === "category") return renderCategory(parts[1]);
    if (parts[0] === "topic") return renderTopic(parts[1], parts[2]);
    if (parts[0] === "material") return renderMaterial(parts[1]);
    if (parts[0] === "lab") return renderLab(parts[1]);
    if (parts[0] === "all-labs") return renderAllLabs();
    if (parts[0] === "library") return renderLibrary();
    if (parts[0] === "progress") return renderProgress();
    return renderNotFound();
  }
  function updateTopProgress() {
    var count = labs.filter(function (x) { return isDone(x.id); }).length;
    var el = document.getElementById("top-progress"); if (el) el.textContent = count + "/" + labs.length + " selesai";
    var avatar = document.getElementById("top-avatar"); if (avatar) avatar.textContent = (profileName || "L").slice(0, 1).toUpperCase();
  }
  function showToast(message) {
    if (!toast) return; toast.textContent = message; toast.hidden = false; clearTimeout(showToast.timer); showToast.timer = setTimeout(function () { toast.hidden = true; }, 2800);
  }
  function initShell() {
    document.querySelectorAll("[data-nav]").forEach(function (a) {
      a.addEventListener("click", function () { document.querySelectorAll("[data-nav]").forEach(function (x) { x.classList.remove("active"); }); a.classList.add("active"); });
    });
    document.addEventListener("click", function (event) {
      var source = event.target.closest(".source-reference summary"); if (source) { setTimeout(function () { source.parentElement.scrollIntoView({ block: "nearest" }); }, 0); }
    });
    var backTop = document.getElementById("back-to-top");
    if (backTop) {
      window.addEventListener("scroll", function () { backTop.hidden = window.scrollY < 500; }, { passive: true });
      backTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    }
  }
  async function init() {
    initShell();
    try {
      var responses = await Promise.all([fetch("assets/materials.json?v=20260918-19"), fetch("assets/labs.json?v=20260918-19")]);
      materials = await responses[0].json(); labs = await responses[1].json();
      window.sitpAcademyData = { materials: materials, labs: labs };
      updateTopProgress(); route();
    } catch (error) {
      root.innerHTML = '<div class="empty"><h2>Data belum dapat dimuat</h2><p>Jalankan situs melalui server lokal (misalnya <code>python -m http.server</code>), bukan file://.</p><pre>' + esc(error.message) + "</pre></div>";
    }
  }
  window.addEventListener("hashchange", route);
  document.addEventListener("DOMContentLoaded", init);
})();
