/* Core helpers, router, theme, progress, shared drill widget */
(function () {
  const App = (window.App = {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  App.$ = $; App.$$ = $$;

  App.h = function (tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
    return e;
  };
  App.rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  App.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  App.shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  App.fmt = (n, dp) => {
    if (dp != null) n = Math.round(n * 10 ** dp) / 10 ** dp;
    const [i, f] = String(n).split(".");
    return i.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + (f ? "." + f : "");
  };
  App.num = (s) => { const v = parseFloat(String(s).replace(/[\s ,]/g, "")); return isNaN(v) ? null : v; };

  /* safe storage */
  App.store = {
    get(k, d) { try { const v = localStorage.getItem("mp8:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("mp8:" + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };

  /* hex digit grid */
  App.nibbleMap = function (id) {
    const box = document.getElementById(id); if (!box) return;
    for (let i = 0; i < 16; i++) box.append(App.h("div", null, App.h("b", null, i.toString(16).toUpperCase()), App.h("span", null, i.toString(2).padStart(4, "0")), App.h("span", { class: "muted" }, String(i))));
  };

  /* ------------ shared drill widget ------------
     opts: {title, kind, intro, gen() -> {q (html), answer (string shown), check(str)->bool, steps (html), input:'text'|'choice', choices:[..], placeholder}} */
  App.drill = function (container, opts) {
    if (!container) return;
    const st = { right: 0, total: 0, streak: 0 };
    container.innerHTML = "";
    const head = App.h("div", { class: "tool-head" }, App.h("span", { class: "tool-kind" }, opts.kind || "Drill"), App.h("h3", null, opts.title), App.h("span", { class: "score", style: "margin-left:auto" }, ""));
    const intro = opts.intro ? App.h("p", { class: "small muted", html: opts.intro }) : null;
    const qEl = App.h("div", { class: "drill-q" });
    const form = App.h("form", { class: "row" });
    const fb = App.h("div", { class: "fb", hidden: true });
    const stepsBox = App.h("div");
    const next = App.h("button", { type: "button", class: "small", onclick: () => newQ() }, "New question →");
    container.append(head, intro || "", qEl, form, fb, stepsBox, App.h("div", { class: "row", style: "margin-top:10px" }, next));
    let cur, answered;
    function score() { head.querySelector(".score").textContent = `${st.right}/${st.total} correct · streak ${st.streak}`; }
    function newQ() {
      cur = opts.gen(); answered = false;
      qEl.innerHTML = cur.q; fb.hidden = true; stepsBox.innerHTML = ""; form.innerHTML = "";
      if (cur.choices) {
        cur.choices.forEach((c) => form.append(App.h("button", { type: "button", class: "", onclick: () => submit(c) }, c)));
      } else {
        const inp = App.h("input", { type: "text", class: "mono", placeholder: cur.placeholder || "Your answer", autocomplete: "off", "aria-label": "Your answer", style: "flex:1;min-width:0;max-width:320px" });
        form.append(inp, App.h("button", { type: "submit", class: "primary" }, "Check"));
        form.onsubmit = (e) => { e.preventDefault(); submit(inp.value); };
      }
      if (cur.after) cur.after(qEl);
    }
    function submit(v) {
      if (answered) return;
      if (!cur.choices && String(v).trim() === "") return;
      answered = true;
      const ok = cur.check(String(v));
      st.total++; if (ok) { st.right++; st.streak++; } else st.streak = 0;
      fb.hidden = false; fb.className = "fb " + (ok ? "ok" : "bad");
      fb.innerHTML = ok ? "Correct! " + (cur.answerNote || "") : `Not quite. The answer is <span class="mono">${cur.answer}</span>.`;
      if (cur.steps) stepsBox.innerHTML = `<p class="small muted" style="margin-bottom:0">How to solve it:</p>` + cur.steps;
      score();
    }
    score(); newQ();
  };

  /* steps list helper */
  App.steps = (arr) => '<ol class="steps">' + arr.map((s) => `<li>${s}</li>`).join("") + "</ol>";

  /* ------------ router ------------ */
  const routes = ["home", "numbers", "text", "images", "sound", "storage", "logic", "practice", "mock", "sheet", "glossary"];
  const hooks = {};
  App.onShow = (r, fn) => { (hooks[r] = hooks[r] || []).push(fn); };
  function show() {
    let r = (location.hash || "#home").slice(1);
    if (!routes.includes(r)) r = "home";
    $$(".page").forEach((p) => (p.hidden = p.dataset.route !== r));
    $$(".nav a").forEach((a) => a.classList.toggle("active", a.dataset.r === r));
    closeMenu();
    (hooks[r] || []).forEach((f) => f());
    window.scrollTo(0, 0);
    App.store.set("route", r);
  }
  window.addEventListener("hashchange", show);

  /* mobile menu */
  const rail = $("#rail"), scrim = $("#scrim"), menuBtn = $("#menuBtn");
  function closeMenu() { rail.classList.remove("open"); scrim.hidden = true; menuBtn && menuBtn.setAttribute("aria-expanded", "false"); }
  menuBtn && menuBtn.addEventListener("click", () => { rail.classList.add("open"); scrim.hidden = false; menuBtn.setAttribute("aria-expanded", "true"); });
  scrim.addEventListener("click", closeMenu);

  /* theme */
  const themeBtn = $("#themeBtn");
  const modes = ["auto", "light", "dark"];
  function applyTheme(m) {
    if (m === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", m);
    themeBtn.textContent = "Theme: " + m;
    window.dispatchEvent(new Event("themechange"));
  }
  let mode = App.store.get("theme", "auto");
  applyTheme(mode);
  themeBtn.addEventListener("click", () => { mode = modes[(modes.indexOf(mode) + 1) % 3]; App.store.set("theme", mode); applyTheme(mode); });
  App.css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  /* "I can" checklists + topic cards */
  const topics = [
    { r: "numbers", code: "DR.01–02", t: "Number systems", d: "Binary, denary, hex, octal. Conversions and uses of hex." },
    { r: "text", code: "DR.03", t: "Text", d: "ASCII, Extended ASCII and Unicode." },
    { r: "images", code: "DR.04–05", t: "Images", d: "Pixels, resolution, colour depth, file size." },
    { r: "sound", code: "DR.06–07", t: "Sound", d: "Sampling, sample rate, resolution, file size." },
    { r: "storage", code: "DR.08–09", t: "Data storage", d: "Units from bit to TiB. Bonus: compression and RLE." },
    { r: "logic", code: "BL.01–05", t: "Boolean logic", d: "AND, OR, NOT, truth tables, circuits, real-life problems." },
  ];
  const done = App.store.get("cando", {});
  function topicProgress(r) {
    const boxes = $$(`.cando[data-topic="${r}"] input`);
    const n = boxes.filter((b) => done[b.id]).length;
    return boxes.length ? n / boxes.length : 0;
  }
  function renderCards() {
    const box = $("#topicCards"); box.innerHTML = "";
    topics.forEach((t) => {
      const p = Math.round(topicProgress(t.r) * 100);
      box.append(App.h("a", { class: "topic-card", href: "#" + t.r },
        App.h("span", { class: "code" }, t.code), App.h("h3", null, t.t), App.h("p", null, t.d),
        App.h("span", { class: "small muted" }, p ? `${p}% of “I can…” ticked` : "Not started"),
        App.h("div", { class: "progress" }, App.h("i", { style: `width:${p}%` }))));
    });
  }
  $$(".cando input").forEach((b) => {
    b.checked = !!done[b.id];
    b.addEventListener("change", () => { done[b.id] = b.checked; App.store.set("cando", done); renderCards(); });
  });
  App.onShow("home", renderCards);

  /* home byte banner */
  (function () {
    const box = $("#homeByte"), out = $("#homeByteOut");
    const bits = [0, 1, 0, 0, 1, 1, 0, 1];
    function draw() {
      box.innerHTML = "";
      bits.forEach((b, i) => box.append(App.h("button", { class: "b" + (b ? " on" : ""), "aria-label": `bit worth ${2 ** (7 - i)}`, onclick: () => { bits[i] ^= 1; draw(); } }, String(b))));
      const v = parseInt(bits.join(""), 2);
      out.textContent = `Click the bits. This byte = ${v} in denary = ${v.toString(16).toUpperCase().padStart(2, "0")} in hex${v >= 32 && v < 127 ? ` = "${String.fromCharCode(v)}" in ASCII` : ""}.`;
    }
    draw();
  })();

  /* glossary */
  const G = [
    ["Bit", "A single binary digit, 0 or 1.", "бит"], ["Nibble", "4 bits.", "полубайт"], ["Byte", "8 bits.", "байт"],
    ["Binary", "Number system with base 2 (digits 0, 1).", "двоичная система"], ["Denary", "Number system with base 10 (digits 0–9).", "десятичная система"],
    ["Hexadecimal", "Number system with base 16 (0–9, A–F).", "шестнадцатеричная система"], ["Octal", "Number system with base 8 (0–7).", "восьмеричная система"],
    ["Place value", "How much a digit is worth because of its position.", "разрядное значение"], ["Remainder", "What is left over after division.", "остаток"],
    ["MAC address", "A unique hex number given to a network card.", "MAC-адрес"], ["Memory address", "A number that shows a location in memory.", "адрес памяти"],
    ["Character set", "A list of characters a computer knows and their binary codes.", "набор символов (кодировка)"],
    ["ASCII", "Character set using 7 bits, 128 characters.", "ASCII"], ["Unicode", "Character set using 16 bits, 65 000+ characters from many languages.", "Юникод"],
    ["Pixel", "The smallest single dot of colour in an image.", "пиксель"], ["Bitmap", "An image stored as a grid of pixels.", "растровое изображение"],
    ["Resolution", "The number of pixels in an image (width × height).", "разрешение"], ["Colour depth", "The number of bits used for the colour of each pixel.", "глубина цвета"],
    ["Analogue", "A smooth signal that changes continuously, like real sound.", "аналоговый"], ["Digital", "Data stored as separate binary values.", "цифровой"],
    ["Sample", "One measurement of the sound wave’s amplitude.", "отсчёт (сэмпл)"], ["Amplitude", "The height of a sound wave (how loud).", "амплитуда"],
    ["Sample rate", "Number of samples taken per second, in hertz (Hz).", "частота дискретизации"], ["Sample resolution", "Number of bits used to store each sample (bit depth).", "разрядность (глубина) звука"],
    ["Mono / Stereo", "1 sound channel / 2 sound channels.", "моно / стерео"], ["File size", "How much storage a file needs.", "размер файла"],
    ["Kibibyte (KiB)", "1024 bytes.", "кибибайт"], ["Mebibyte (MiB)", "1024 KiB.", "мебибайт"], ["Gibibyte (GiB)", "1024 MiB.", "гибибайт"],
    ["Compression", "Making a file smaller.", "сжатие"], ["Lossy", "Compression that removes some data forever.", "сжатие с потерями"], ["Lossless", "Compression where the original can be rebuilt exactly.", "сжатие без потерь"],
    ["RLE", "Run-length encoding: stores how many times a value repeats.", "кодирование длин серий"],
    ["Boolean", "Data with only two values: True or False.", "логический (булев) тип"], ["Truth value", "The value of a condition: True (1) or False (0).", "значение истинности"],
    ["Truth table", "A table of all possible inputs and their outputs.", "таблица истинности"], ["Logic gate", "A part of a circuit that uses one logic rule.", "логический вентиль (элемент)"],
    ["Logic circuit", "Two or more logic gates joined together.", "логическая схема"], ["Condition", "A test or question with a True/False answer.", "условие"],
    ["Rule", "The action taken because of the result of a condition.", "правило"], ["Input / Output", "Value going into / coming out of a gate.", "вход / выход"],
    ["Intermediate output", "The output of a gate in the middle of a circuit (P, Q).", "промежуточный выход"], ["Expression", "A logic statement like A AND (NOT B).", "логическое выражение"],
  ];
  function renderGloss(q = "") {
    const t = $("#glT"); q = q.toLowerCase();
    t.innerHTML = "<thead><tr><th class='l'>Term</th><th class='l'>Meaning</th><th class='l'>Русский</th></tr></thead>";
    const tb = App.h("tbody");
    G.filter((g) => !q || g.join(" ").toLowerCase().includes(q)).forEach((g) => tb.append(App.h("tr", null, App.h("td", { class: "l" }, g[0]), App.h("td", { class: "l" }, g[1]), App.h("td", { class: "l" }, g[2]))));
    t.append(tb);
  }
  renderGloss();
  $("#glQ").addEventListener("input", (e) => renderGloss(e.target.value));

  App.nibbleMap("nibbleMap"); App.nibbleMap("nibbleMap2");

  App.start = function () {
    if (!location.hash) { const r = App.store.get("route", "home"); if (r !== "home") { location.hash = r; return; } }
    show();
  };
})();
