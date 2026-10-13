/* Boolean logic: parser, evaluator, circuit drawing, tools and drills */
(function () {
  const { h, $, rand, pick } = App;
  const L = (App.logic = {});

  /* ---------- parser ---------- */
  L.parse = function (src) {
    const toks = [];
    const s = String(src).replace(/[¬~!]/g, " NOT ").replace(/[&·*]/g, " AND ").replace(/\|/g, " OR ");
    const re = /\s*(AND|OR|NOT|[A-Za-z]|\(|\)|\.|\+|')/giy;
    let m, pos = 0;
    while (pos < s.length) {
      if (/^\s*$/.test(s.slice(pos))) break;
      re.lastIndex = pos; m = re.exec(s);
      if (!m) throw new Error(`I don't understand “${s.slice(pos).trim().slice(0, 8)}”. Use letters, AND, OR, NOT and brackets.`);
      let t = m[1]; const up = t.toUpperCase();
      if (up === "AND" || up === "OR" || up === "NOT") t = up; else if (t === ".") t = "AND"; else if (t === "+") t = "OR"; else if (/^[a-z]$/i.test(t)) t = { v: up };
      toks.push(t); pos = re.lastIndex;
    }
    let i = 0;
    const peek = () => toks[i];
    function expr() { let a = term(); while (peek() === "OR") { i++; a = { op: "OR", a, b: term() }; } return a; }
    function term() { let a = factor(); while (peek() === "AND") { i++; a = { op: "AND", a, b: factor() }; } return a; }
    function factor() {
      const t = peek(); let n;
      if (t === "NOT") { i++; n = { op: "NOT", a: factor() }; }
      else if (t === "(") { i++; n = expr(); if (peek() !== ")") throw new Error("A bracket “)” is missing."); i++; }
      else if (t && t.v) { i++; n = { v: t.v }; }
      else throw new Error(t === undefined ? "The expression ends too early." : `Unexpected “${t}”.`);
      while (peek() === "'") { i++; n = { op: "NOT", a: n }; }
      return n;
    }
    if (!toks.length) throw new Error("Type an expression first.");
    const tree = expr();
    if (i < toks.length) throw new Error(`Unexpected “${toks[i].v || toks[i]}”. Check AND / OR between the parts.`);
    return tree;
  };
  L.ev = (n, env) => (n.v ? env[n.v] : n.op === "NOT" ? 1 - L.ev(n.a, env) : n.op === "AND" ? L.ev(n.a, env) & L.ev(n.b, env) : L.ev(n.a, env) | L.ev(n.b, env));
  L.vars = (n, s = new Set()) => { if (n.v) s.add(n.v); else { L.vars(n.a, s); if (n.b) L.vars(n.b, s); } return [...s].sort(); };
  L.str = function (n, top = true) {
    if (n.v) return n.v;
    if (n.op === "NOT") return "NOT " + (n.a.v ? n.a.v : "(" + L.str(n.a, true) + ")");
    const side = (c) => (c.v ? c.v : "(" + L.str(c, true) + ")");
    return side(n.a) + " " + n.op + " " + side(n.b);
  };
  L.rows = (vs) => Array.from({ length: 2 ** vs.length }, (_, k) => Object.fromEntries(vs.map((v, j) => [v, (k >> (vs.length - 1 - j)) & 1])));
  L.equiv = function (t1, t2, vs) { return L.rows(vs).every((env) => L.ev(t1, env) === L.ev(t2, env)); };
  L.subs = function (n, out = [], seen = new Set()) {
    if (n.v) return out;
    L.subs(n.a, out, seen); if (n.b) L.subs(n.b, out, seen);
    const s = L.str(n); if (!seen.has(s)) { seen.add(s); out.push(n); }
    return out;
  };

  /* ---------- circuit drawing ---------- */
  const ROW = 52, COLW = 96, X0 = 64, TOP = 26;
  const P = {
    AND: (x, y) => `M${x},${y - 18} H${x + 22} A18,18 0 0 1 ${x + 22},${y + 18} H${x} Z`,
    OR: (x, y) => `M${x},${y - 18} Q${x + 26},${y - 18} ${x + 46},${y} Q${x + 26},${y + 18} ${x},${y + 18} Q${x + 11},${y} ${x},${y - 18} Z`,
    NOT: (x, y) => `M${x},${y - 14} L${x + 30},${y} L${x},${y + 14} Z`,
  };
  const GW = { AND: 40, OR: 46, NOT: 38 };
  L.svg = function (tree, opt = {}) {
    let leaf = 0, maxCol = 0;
    (function lay(n, col) {
      n.col = col;
      if (n.v) { n.y = TOP + leaf++ * ROW + ROW / 2; return; }
      maxCol = Math.max(maxCol, col);
      lay(n.a, col + 1); if (n.b) lay(n.b, col + 1);
      n.y = n.b ? (n.a.y + n.b.y) / 2 : n.a.y;
    })(tree, 0);
    const gx = (c) => X0 + (maxCol - c) * COLW;
    const W = X0 + (maxCol + 1) * COLW + 40, H = TOP + leaf * ROW + 10;
    const env = opt.env; const val = (n) => (env ? L.ev(n, env) : null);
    const parts = [];
    const wire = (pts, on) => parts.push(`<polyline class="w${on ? " on" : ""}" points="${pts.map((p) => p.join(",")).join(" ")}"/>`);
    function outPt(n) { return n.v ? [26, n.y] : [gx(n.col) + GW[n.op], n.y]; }
    function draw(n) {
      if (n.v) {
        parts.push(`<text x="6" y="${n.y + 5}">${n.v}</text>`);
        if (env) parts.push(`<text class="val" x="${20}" y="${n.y - 8}">${env[n.v]}</text>`);
        return;
      }
      const x = gx(n.col), on = val(n) === 1;
      const kids = n.b ? [[n.a, n.y - 10], [n.b, n.y + 10]] : [[n.a, n.y]];
      kids.forEach(([c, iy], k) => {
        draw(c);
        const [ox, oy] = outPt(c); const ix = n.op === "OR" ? x + 6 : x; const xm = x - 14 - (n.b ? 0 : 0);
        const pts = oy === iy ? [[ox, oy], [ix, iy]] : [[ox, oy], [xm, oy], [xm, iy], [ix, iy]];
        wire(pts, val(c) === 1);
        if (opt.labels && opt.labels.get(c)) parts.push(`<text class="lbl" x="${ox + 8}" y="${oy - 7}">${opt.labels.get(c)}</text>`);
      });
      parts.push(`<path class="g${on ? " on" : ""}" d="${P[n.op](x, n.y)}"/>`);
      if (n.op === "NOT") parts.push(`<circle class="g${on ? " on" : ""}" cx="${x + 34}" cy="${n.y}" r="4"/>`);
    }
    draw(tree);
    const [ox, oy] = outPt(tree);
    wire([[ox, oy], [W - 26, oy]], val(tree) === 1);
    parts.push(`<text x="${W - 20}" y="${oy + 5}">${opt.out || "X"}</text>`);
    if (env) parts.push(`<text class="val" x="${W - 40}" y="${oy - 8}">${val(tree)}</text>`);
    return `<svg class="circuit" viewBox="0 0 ${W} ${H}" width="${Math.round(W * 1.3)}" height="${Math.round(H * 1.3)}" role="img" aria-label="Logic circuit for ${opt.out || "X"} = ${L.str(tree)}">${parts.join("")}</svg>`;
  };

  /* ---------- truth table ---------- */
  L.table = function (tree, opt = {}) {
    const vs = L.vars(tree), subs = opt.noSubs ? [tree] : L.subs(tree);
    const names = subs.map((s) => (s === tree ? (opt.out || "X") : (opt.labels && opt.labels.get(s)) || L.str(s)));
    let html = `<table class="t tt mono"><thead><tr>${vs.map((v) => `<th>${v}</th>`).join("")}${subs.map((s, k) => `<th class="${s === tree ? "" : "muted"}">${names[k]}</th>`).join("")}</tr></thead><tbody>`;
    L.rows(vs).forEach((env, r) => { html += `<tr data-r="${r}">${vs.map((v) => `<td>${env[v]}</td>`).join("")}${subs.map((s) => { const x = L.ev(s, env); return `<td class="${x ? "one" : ""}">${x}</td>`; }).join("")}</tr>`; });
    return html + "</tbody></table>";
  };

  /* ---------- random circuits ---------- */
  const V = (x) => ({ v: x }), N_ = (a) => ({ op: "NOT", a }), O = (op, a, b) => ({ op, a, b });
  const op = () => pick(["AND", "OR"]);
  // circuits used in the real midterm papers are never generated here
  L.BLOCK = ["(A AND B) OR (NOT C)", "(A OR B) AND (NOT C)"];
  L.gen3 = function (only2) {
    const shapes = [
      () => O(op(), O(op(), V("A"), V("B")), N_(V("C"))),
      () => O(op(), N_(O(op(), V("A"), V("B"))), V("C")),
      () => O(op(), V("A"), O(op(), V("B"), V("C"))),
      () => O(op(), N_(V("A")), O(op(), V("B"), V("C"))),
      () => O(op(), O(op(), V("A"), N_(V("B"))), V("C")),
      () => N_(O(op(), O(op(), V("A"), V("B")), V("C"))),
      () => O(op(), O(op(), V("A"), V("B")), O(op(), V("B"), V("C"))),
      () => O(op(), V("A"), N_(O(op(), V("B"), V("C")))),
    ];
    let t; do { t = pick(shapes)(); } while ((t.op && t.a.op === t.op && t.b && t.b.op === t.op && t.op !== "NOT") || L.BLOCK.includes(L.str(t)) || (only2 && !(t.b && !t.a.v && !t.b.v)));
    return t;
  };
  L.gen2 = function () {
    const shapes = [() => O(op(), N_(V("A")), V("B")), () => O(op(), V("A"), N_(V("B"))), () => N_(O(op(), V("A"), V("B"))), () => O(op(), O(op(), V("A"), V("B")), N_(V("A")))];
    return pick(shapes)();
  };
  L.pqLabels = function (t) {
    const m = new Map(); let k = 0;
    const kids = t.op === "NOT" ? [t.a] : [t.a, t.b];
    kids.forEach((c) => { if (!c.v) m.set(c, "PQ"[k++]); });
    return m;
  };

  /* ---------- gate cards ---------- */
  (function () {
    const box = $("#gateCards"); if (!box) return;
    const defs = [
      ["AND", "A.B", "Output is 1 only when <b>both</b> inputs are 1.", O("AND", V("A"), V("B"))],
      ["OR", "A+B", "Output is 1 when <b>at least one</b> input is 1.", O("OR", V("A"), V("B"))],
      ["NOT", "Ā", "Has <b>one</b> input. The output is the <b>opposite</b>.", N_(V("A"))],
    ];
    defs.forEach(([name, note, desc, tree]) => {
      const env = { A: 0, B: 0 };
      const card = h("div", { class: "gate-card" }, h("h4", { html: `${name} gate <code>X = ${note}</code>` }), h("p", { class: "small", html: desc }));
      const pic = h("div"), ctr = h("div", { class: "row" }), tt = h("div", { class: "scroll" });
      card.append(pic, ctr, tt); box.append(card);
      const lamp = h("span", { class: "lamp" });
      const btns = L.vars(tree).map((v) => h("button", { class: "small", onclick: () => { env[v] ^= 1; upd(); } }));
      ctr.append(...btns.map((b, i) => h("span", { class: "in-toggle" }, b)), h("span", { class: "small muted" }, "→ X ="), lamp);
      function upd() {
        pic.innerHTML = L.svg(tree, { env });
        btns.forEach((b, i) => { const v = L.vars(tree)[i]; b.textContent = `${v} = ${env[v]}`; b.classList.toggle("on", !!env[v]); });
        const x = L.ev(tree, env); lamp.textContent = x; lamp.classList.toggle("on", !!x);
        tt.innerHTML = L.table(tree, { noSubs: true });
        const vs = L.vars(tree); const r = vs.reduce((a, v) => a * 2 + env[v], 0);
        tt.querySelectorAll("tbody tr").forEach((tr, i) => tr.classList.toggle("sel", i === r));
      }
      upd();
    });
  })();

  /* ---------- expression lab ---------- */
  (function () {
    const inp = $("#labIn"); if (!inp) return;
    const ex = ["A AND (NOT (B OR C))", "(NOT (A AND B)) AND (C OR (NOT D))", "A OR (NOT (B OR C))", "((NOT A) AND B) OR (A AND (NOT B))", "S AND (D OR W)"];
    const exBox = $("#labEx"); exBox.append(h("span", { class: "muted" }, "Examples:"));
    ex.forEach((e) => exBox.append(h("button", { class: "small", onclick: () => { inp.value = e; build(); } }, e)));
    let tree, sel = -1;
    function build() {
      try { tree = L.parse(inp.value); $("#labErr").hidden = true; }
      catch (e) { $("#labErr").hidden = false; $("#labErr").textContent = e.message; return; }
      if (L.vars(tree).length > 5) { $("#labErr").hidden = false; $("#labErr").textContent = "Please use 5 inputs or fewer."; return; }
      sel = -1; draw();
    }
    function draw() {
      const vs = L.vars(tree), rows = L.rows(vs);
      $("#labSvg").innerHTML = L.svg(tree, { env: sel >= 0 ? rows[sel] : null });
      $("#labTT").innerHTML = `<p class="small" style="margin-bottom:0"><b>X = ${L.str(tree)}</b> · ${vs.length} inputs → 2<sup>${vs.length}</sup> = ${rows.length} rows. Grey columns are intermediate outputs.</p>` + L.table(tree);
      $("#labTT").querySelectorAll("tbody tr").forEach((tr, i) => { tr.classList.toggle("sel", i === sel); tr.onclick = () => { sel = sel === i ? -1 : i; draw(); }; });
    }
    $("#labGo").onclick = build;
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") build(); });
    build();
  })();

  /* ---------- scenarios ---------- */
  L.SCENARIOS = [
    { t: "A car alarm sounds (Y = 1) when the alarm system is switched on (S = 1) and either a door is opened (D = 1) or a window is broken (W = 1).", e: "S AND (D OR W)", out: "Y" },
    { t: "A greenhouse window opens (X = 1) when the temperature is high (T = 1) and it is not raining (R = 1 means it is raining).", e: "T AND (NOT R)", out: "X" },
    { t: "A microwave runs (M = 1) when the door is closed (D = 1) and the start button is pressed (S = 1).", e: "D AND S", out: "M" },
    { t: "A room light turns on (L = 1) when switch A is on (A = 1) or switch B is on (B = 1).", e: "A OR B", out: "L" },
    { t: "A school bell rings (B = 1) when it is a school day (D = 1) and the time is the end of a lesson (T = 1), but not during an exam (E = 1 means exam).", e: "D AND T AND (NOT E)", out: "B" },
    { t: "A water pump turns on (P = 1) when the tank is not full (F = 1 means full) and the system is switched on (S = 1).", e: "(NOT F) AND S", out: "P" },
    { t: "A warning lamp lights (W = 1) when the pressure is too high (P = 1) or the temperature is too high (T = 1), while the machine is on (M = 1).", e: "M AND (P OR T)", out: "W" },
    { t: "A heater turns on (H = 1) when the room is cold (C = 1) and the window is not open (W = 1 means open), or when the frost alarm is on (F = 1).", e: "(C AND (NOT W)) OR F", out: "H" },
    { t: "A gate opens (G = 1) when a correct card is shown (K = 1) or a guard presses the button (B = 1), and the gate is not locked (L = 1 means locked).", e: "(K OR B) AND (NOT L)", out: "G" },
  ];
  (function () {
    const box = $("#drill-scn"); if (!box) return;
    App.drill(box, {
      title: "Real-life problems", kind: "Drill",
      intro: "Write the logic expression using the letters in the question. Any correct equivalent answer is accepted.",
      gen() {
        const s = pick(L.SCENARIOS), model = L.parse(s.e), vs = L.vars(model);
        return {
          q: s.t, answer: `${s.out} = ${s.e}`, placeholder: `${s.out} = …`,
          check: (v) => { try { const t = L.parse(v.replace(/^\s*[A-Z]\s*=/i, "")); const tv = L.vars(t); if (tv.some((x) => !vs.includes(x))) return false; return L.equiv(t, model, vs); } catch (e) { return false; } },
          steps: `<div class="circuit-box">${L.svg(model, { out: s.out })}</div>`,
        };
      },
    });
  })();

  /* ---------- truth-table drill (click cells) ---------- */
  L.ttWidget = function (tree, opt = {}) {
    // returns {el, check() -> {right, total}, reveal()}
    const vs = L.vars(tree), rows = L.rows(vs);
    const cols = opt.cols || [{ node: tree, name: opt.out || "X" }];
    const state = cols.map(() => rows.map(() => null));
    const tbl = h("table", { class: "t tt mono" });
    tbl.innerHTML = `<thead><tr>${vs.map((v) => `<th>${v}</th>`).join("")}${cols.map((c) => `<th>${c.name}</th>`).join("")}</tr></thead>`;
    const tb = h("tbody"); tbl.append(tb);
    rows.forEach((env, r) => {
      const tr = h("tr", null, ...vs.map((v) => h("td", null, String(env[v]))));
      cols.forEach((c, k) => {
        const td = h("td", { class: "click", tabindex: "0", role: "button", "aria-label": `${c.name}, row ${r + 1}` }, "?");
        const flip = () => { if (tbl.dataset.locked) return; state[k][r] = state[k][r] === 1 ? 0 : 1; td.textContent = state[k][r]; };
        td.onclick = flip; td.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } };
        tr.append(td);
      });
      tb.append(tr);
    });
    return {
      el: h("div", { class: "scroll" }, tbl), state, cols, rows,
      check() {
        tbl.dataset.locked = "1"; const res = cols.map(() => 0);
        rows.forEach((env, r) => cols.forEach((c, k) => {
          const want = L.ev(c.node, env), td = tb.rows[r].cells[vs.length + k];
          const ok = state[k][r] === want; if (ok) res[k]++;
          td.classList.add(ok ? "right" : "wrong"); td.textContent = want;
        }));
        return res;
      },
    };
  };
  (function () {
    const box = $("#drill-tt"); if (!box) return;
    let tally = { r: 0, t: 0 };
    function run() {
      const tree = L.gen3(), labels = L.pqLabels(tree);
      const cols = [...labels.entries()].map(([node, name]) => ({ node, name })).concat([{ node: tree, name: "X" }]);
      const w = L.ttWidget(tree, { cols });
      const fb = h("div", { class: "fb", hidden: true });
      const chk = h("button", { class: "primary", onclick: () => {
        const res = w.check(); const all = res.reduce((a, b) => a + b, 0), tot = w.rows.length * cols.length;
        tally.t++; if (all === tot) tally.r++;
        fb.hidden = false; fb.className = "fb " + (all === tot ? "ok" : "bad");
        fb.innerHTML = all === tot ? "All correct!" : `${all} of ${tot} cells correct. Correct values are shown now. X = ${L.str(tree)}`;
        chk.disabled = true; score.textContent = `${tally.r}/${tally.t} perfect tables`;
      } }, "Check");
      const score = h("span", { class: "score", style: "margin-left:auto" }, `${tally.r}/${tally.t} perfect tables`);
      box.innerHTML = "";
      box.append(h("div", { class: "tool-head" }, h("span", { class: "tool-kind" }, "Drill"), h("h3", null, "Complete the truth table"), score),
        h("p", { class: "small muted" }, "Click a cell to set it to 0 or 1. Fill P and Q first, then X."),
        h("div", { class: "circuit-box", html: L.svg(tree, { labels }) }), w.el, h("div", { class: "row", style: "margin-top:10px" }, chk, h("button", { class: "small", onclick: run }, "New circuit →")), fb);
    }
    run();
  })();

  /* ---------- circuit -> expression drill ---------- */
  (function () {
    const box = $("#drill-expr"); if (!box) return;
    App.drill(box, {
      title: "Circuit → expression", kind: "Drill", intro: "Write the expression for X. Use AND, OR, NOT and brackets.",
      gen() {
        const tree = Math.random() < 0.3 ? L.gen2() : L.gen3(); const vs = L.vars(tree);
        return {
          q: `<div class="circuit-box">${L.svg(tree)}</div>`, answer: `X = ${L.str(tree)}`, placeholder: "X = …",
          check: (v) => { try { const t = L.parse(v.replace(/^\s*X\s*=/i, "")); if (L.vars(t).some((x) => !vs.includes(x))) return false; return L.equiv(t, tree, vs); } catch (e) { return false; } },
          steps: `<div class="scroll">${L.table(tree)}</div>`,
        };
      },
    });
  })();
})();
