/* Number systems: conversions with steps, byte switchboard, colour mixer, drills */
(function () {
  const { h, $, rand, pick, fmt } = App;
  const NAME = { 2: "binary", 8: "octal", 10: "denary", 16: "hexadecimal" };
  const DIG = "0123456789ABCDEF";

  const N = (App.N = {});
  N.valid = (s, b) => s.length > 0 && [...s].every((c) => DIG.indexOf(c) >= 0 && DIG.indexOf(c) < b);
  N.clean = (s) => String(s).toUpperCase().replace(/[\s_ ]/g, "").replace(/^0X|^#/, "");
  N.parse = (s, b) => { s = N.clean(s); return N.valid(s, b) ? parseInt(s, b) : null; };
  N.to = (n, b) => n.toString(b).toUpperCase();
  N.sameValue = (ans, correctValue, base) => { const v = N.parse(ans, base); return v !== null && v === correctValue; };
  const sub = (b) => `<sub>${b}</sub>`;
  const group = (bits, g) => { const pad = Math.ceil(bits.length / g) * g; bits = bits.padStart(pad, "0"); const out = []; for (let i = 0; i < bits.length; i += g) out.push(bits.slice(i, i + g)); return out; };

  /* --- steps generators --- */
  function toDenarySteps(s, b) {
    const ds = [...s]; const L = ds.length;
    const pv = ds.map((_, i) => b ** (L - 1 - i));
    const head = `<div class="scroll"><table class="t mono"><tr>${pv.map((p) => `<th>${fmt(p)}</th>`).join("")}</tr><tr>${ds.map((d) => `<td>${d}</td>`).join("")}</tr></table></div>`;
    const terms = ds.map((d, i) => ({ d: DIG.indexOf(d), p: pv[i] })).filter((t) => t.d > 0);
    const expr = terms.map((t) => (b === 2 ? fmt(t.p) : `(${t.d}×${fmt(t.p)})`)).join(" + ") || "0";
    const notes = b === 16 ? ds.filter((d) => DIG.indexOf(d) > 9).map((d) => `${d} = ${DIG.indexOf(d)}`) : [];
    return [`Write the place values (powers of ${b}) above the digits:${head}`,
      (notes.length ? `Change letters to numbers: ${notes.join(", ")}. ` : "") + (b === 2 ? "Add the place values where there is a 1:" : "Multiply each digit by its place value and add:") + ` <span class="mono">${expr} = <b>${fmt(parseInt(s, b))}</b></span>`];
  }
  function fromDenarySteps(n, b) {
    if (n === 0) return ["0 in any base is 0."];
    const rows = []; let x = n;
    while (x > 0) { rows.push([x, Math.floor(x / b), x % b]); x = Math.floor(x / b); }
    const tbl = `<div class="scroll"><table class="t mono"><tr><th>Number</th><th>÷ ${b}</th><th>Remainder</th></tr>${rows.map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td><b>${r[2]}${b === 16 && r[2] > 9 ? " = " + DIG[r[2]] : ""}</b></td></tr>`).join("")}</table></div>`;
    return [`Divide by ${b} again and again, writing down the remainders:${tbl}`, `Read the remainders from bottom to top: <b class="mono">${N.to(n, b)}</b>`];
  }
  function subtractSteps(n) {
    const out = []; let x = n; const pv = [];
    let top = 1; while (top * 2 <= n) top *= 2;
    for (let p = Math.max(top, 1); p >= 1; p /= 2) { if (x >= p) { out.push(`${x} − ${p} = ${x - p} → put <b>1</b> under ${p}`); x -= p; } else out.push(`${p} does not fit into ${x} → put <b>0</b>`); pv.push(p); }
    return out;
  }
  function groupSteps(s, g, toBase) {
    const parts = group(s, g);
    const map = parts.map((p) => DIG[parseInt(p, 2)]);
    return [`Split into groups of ${g} bits from the right (add zeros on the left if needed): <span class="mono">${parts.join(" | ")}</span>`,
      `Change each group into one ${NAME[toBase]} digit: <span class="mono">${parts.map((p, i) => `${p}→${map[i]}`).join("  ")}</span>`,
      `Answer: <b class="mono">${map.join("").replace(/^0+(?=.)/, "")}</b>`];
  }
  function ungroupSteps(s, g) {
    const parts = [...s].map((d) => DIG.indexOf(d).toString(2).padStart(g, "0"));
    return [`Change each digit into ${g} bits: <span class="mono">${[...s].map((d, i) => `${d}→${parts[i]}`).join("  ")}</span>`,
      `Join them: <b class="mono">${parts.join(" ")}</b>` + (parts[0].startsWith("0") ? ` (you can drop the zeros at the start: ${parts.join("").replace(/^0+(?=.)/, "")})` : "")];
  }
  N.steps = function (s, from, to) {
    s = N.clean(s);
    const n = parseInt(s, from);
    if (from === to) return ["Same base — nothing to do."];
    if (to === 10 && App.positions) return ["<b>Easy way</b> · number the positions from the right, starting at 0:" + App.positions(s, from)];
    if (from === 10 && App.ladder) return ["<b>Easy way</b> · division ladder:" + App.ladder(n, to)].concat(to === 2 && n <= 255 ? [`8-bit answer: <b class="mono">${N.to(n, 2).padStart(8, "0")}</b>`, "<b>Another way</b> · subtract place values:" + App.steps(subtractSteps(n))] : []);
    if (to === 10) return toDenarySteps(s, from);
    if (from === 10) return to === 2 && n <= 255 ? ["<b>Method 1</b> · subtract place values:" + App.steps(subtractSteps(n)) + `Answer: <b class="mono">${N.to(n, 2)}</b> (8-bit: <span class="mono">${N.to(n, 2).padStart(8, "0")}</span>)`, "<b>Method 2</b> · " + fromDenarySteps(n, 2).join(" ")] : fromDenarySteps(n, to);
    if (from === 2 && (to === 16 || to === 8)) return groupSteps(s, to === 16 ? 4 : 3, to);
    if ((from === 16 || from === 8) && to === 2) return ungroupSteps(s, from === 16 ? 4 : 3);
    // hex <-> octal via binary
    const bin = N.to(n, 2);
    return [`Go through binary first. ${ungroupSteps(s, from === 16 ? 4 : 3)[1]}`, ...groupSteps(bin, to === 16 ? 4 : 3, to)];
  };

  /* --- byte switchboard --- */
  (function () {
    const row = $("#bitRow"); if (!row) return;
    let bits = [0, 0, 1, 0, 1, 1, 0, 1];
    function draw() {
      row.innerHTML = "";
      bits.forEach((b, i) => row.append(h("div", { class: "bit" }, h("span", { class: "pv" }, String(2 ** (7 - i))),
        h("button", { class: b ? "on" : "", "aria-pressed": b ? "true" : "false", "aria-label": `Bit worth ${2 ** (7 - i)}`, onclick: () => { bits[i] ^= 1; draw(); } }, String(b)))));
      const v = parseInt(bits.join(""), 2);
      $("#rbBin").textContent = bits.join(""); $("#rbDen").textContent = v;
      $("#rbHex").textContent = N.to(v, 16).padStart(2, "0"); $("#rbOct").textContent = N.to(v, 8);
    }
    $("#bitsClear").onclick = () => { bits = bits.map(() => 0); draw(); };
    $("#bitsFill").onclick = () => { bits = bits.map(() => 1); draw(); };
    $("#bitsRand").onclick = () => { bits = bits.map(() => rand(0, 1)); draw(); };
    $("#bitsShift").onclick = () => { bits = bits.slice(1).concat(0); draw(); };
    draw();
  })();

  /* --- converter --- */
  (function () {
    const inp = $("#cvIn"), f = $("#cvFrom"), t = $("#cvTo"), out = $("#cvOut"); if (!inp) return;
    function run() {
      const from = +f.value, to = +t.value, s = N.clean(inp.value);
      if (!s) { out.innerHTML = ""; return; }
      if (!N.valid(s, from)) { out.innerHTML = `<p class="fb bad">“${inp.value}” is not a ${NAME[from]} number. ${NAME[from][0].toUpperCase() + NAME[from].slice(1)} uses only the digits ${DIG.slice(0, from).split("").join(", ")}.</p>`; return; }
      const n = parseInt(s, from);
      if (n > 1048575) { out.innerHTML = `<p class="fb bad">Please use a smaller number (up to 1 048 575).</p>`; return; }
      out.innerHTML = `<p class="big-out">${s}${sub(from)} = ${N.to(n, to)}${sub(to)}</p>` + App.steps(N.steps(s, from, to));
    }
    [inp, f, t].forEach((e) => e.addEventListener("input", run)); run();
  })();

  /* --- colour mixer --- */
  (function () {
    const r = $("#cR"); if (!r) return;
    const g = $("#cG"), b = $("#cB");
    const hx = (v) => (+v).toString(16).toUpperCase().padStart(2, "0");
    function run() {
      const code = "#" + hx(r.value) + hx(g.value) + hx(b.value);
      $("#cSw").style.background = code; $("#cHex").textContent = code;
      $("#cRv").innerHTML = `<b>${hx(r.value)}</b> = ${r.value}`; $("#cGv").innerHTML = `<b>${hx(g.value)}</b> = ${g.value}`; $("#cBv").innerHTML = `<b>${hx(b.value)}</b> = ${b.value}`;
      $("#cBin").textContent = "Binary: " + [r, g, b].map((x) => (+x.value).toString(2).padStart(8, "0")).join(" ") + "  (24 bits = 6 hex digits)";
    }
    [r, g, b].forEach((e) => e.addEventListener("input", run)); run();
  })();

  /* --- conversion drill --- */
  const TYPES = [
    { f: 10, t: 2, gen: () => rand(20, 250), lbl: "Convert the denary number {n} into 8-bit binary." },
    { f: 2, t: 10, gen: () => rand(40, 255), lbl: "Convert the binary number {n} into denary." },
    { f: 2, t: 16, gen: () => rand(40, 255), lbl: "Convert the binary number {n} into hexadecimal." },
    { f: 16, t: 2, gen: () => rand(30, 255), lbl: "Convert the hexadecimal number {n} into 8-bit binary." },
    { f: 16, t: 10, gen: () => rand(20, 255), lbl: "Convert the hexadecimal number {n} into denary." },
    { f: 10, t: 16, gen: () => rand(30, 255), lbl: "Convert the denary number {n} into hexadecimal." },
    { f: 2, t: 16, gen: () => rand(300, 4000), lbl: "Convert the binary number {n} into hexadecimal." },
    { f: 16, t: 10, gen: () => rand(256, 3000), lbl: "Convert the hexadecimal number {n} into denary." },
    { f: 8, t: 10, gen: () => rand(8, 400), lbl: "Convert the octal number {n} into denary.", oct: 1 },
    { f: 8, t: 2, gen: () => rand(8, 511), lbl: "Convert the octal number {n} into binary.", oct: 1 },
    { f: 2, t: 8, gen: () => rand(20, 511), lbl: "Convert the binary number {n} into octal.", oct: 1 },
    { f: 10, t: 8, gen: () => rand(20, 600), lbl: "Convert the denary number {n} into octal.", oct: 1 },
  ];
  N.makeConv = function (type) {
    const n = type.gen();
    const shown = type.f === 2 && n <= 255 && type.t !== 2 ? N.to(n, 2).padStart(8, "0") : N.to(n, type.f);
    const ans = type.t === 2 && n <= 255 && /8-bit/.test(type.lbl) ? N.to(n, 2).padStart(8, "0") : N.to(n, type.t);
    return { n, shown, ans, text: type.lbl.replace("{n}", shown), from: type.f, to: type.t, eightBit: /8-bit/.test(type.lbl) };
  };
  N.TYPES = TYPES;
  let withOct = App.store.get("withOct", true);
  const dn = $("#drill-num");
  function startConv() {
    App.drill(dn, {
      title: "Conversion drill", kind: "Drill",
      intro: `A new conversion every time. Answers in 8-bit binary must have 8 digits. <label class="small"><input type="checkbox" id="octChk" ${withOct ? "checked" : ""}> include octal</label>`,
      gen() {
        const pool = TYPES.filter((t) => withOct || !t.oct);
        const c = N.makeConv(pick(pool));
        return {
          q: c.text.replace(c.shown, `<span class="n">${c.shown}</span>`), answer: c.ans,
          check: (v) => { v = N.clean(v); if (c.eightBit && v.length !== 8) return false; return N.parse(v, c.to) === c.n; },
          steps: App.steps(N.steps(c.shown, c.from, c.to)),
          placeholder: c.eightBit ? "8 digits" : "",
        };
      },
    });
    const chk = $("#octChk"); if (chk) chk.onchange = () => { withOct = chk.checked; App.store.set("withOct", withOct); startConv(); };
  }
  startConv();

  /* --- comparison drill (worksheet part 2 style) --- */
  App.drill($("#drill-cmp"), {
    title: "Which is bigger?", kind: "Drill", intro: "Like Part 2 of our Number Systems worksheet. Change both numbers to denary, then compare.",
    gen() {
      const bases = [2, 8, 10, 16];
      const b1 = pick(bases), b2 = pick(bases.filter((b) => b !== b1));
      const a = rand(30, 400); const b = Math.random() < 0.15 ? a : Math.max(1, a + rand(-40, 40));
      const sign = a > b ? ">" : a < b ? "<" : "=";
      const s1 = N.to(a, b1), s2 = N.to(b, b2);
      return {
        q: `<span class="n">${s1}${sub(b1)}</span> &nbsp;?&nbsp; <span class="n">${s2}${sub(b2)}</span>`,
        choices: ["<", "=", ">"], answer: sign, check: (v) => v === sign,
        steps: App.steps([`${s1}${sub(b1)} = ${a} in denary`, `${s2}${sub(b2)} = ${b} in denary`, `${a} ${sign} ${b}, so the answer is <b>${sign}</b>`]),
      };
    },
  });
})();

/* Easy way (lesson 02.09): division ladder, numbered positions, one table */
(function () {
  const { $, $$ } = App; const N = App.N;
  const DIG = "0123456789ABCDEF";
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const sup = (k) => String(k).split("").map((c) => SUP[+c]).join("");
  const sub = (b) => `<sub>${b}</sub>`;

  App.ladder = function (n, b) {
    const steps = []; let x = n;
    while (x >= b) { const q = Math.floor(x / b); steps.push({ d: x, q, p: q * b, r: x % b }); x = q; }
    const m = steps.length;
    if (!m) return `<p>${n} is smaller than ${b}, so it is already one ${b === 10 ? "" : "digit"}: <b class="mono">${DIG[n]}${sub(b)}</b></p>`;
    const cells = [];
    const put = (row, col, cls, html) => cells.push(`<div class="${cls}" style="grid-row:${row + 1};grid-column:${col + 1}">${html}</div>`);
    steps.forEach((s, k) => {
      if (k === 0) put(0, 0, "", s.d);           // first number (later dividends are the previous answers)
      put(k, k + 1, "dv", b);                     // divisor with the corner line
      put(k + 1, k, "pr", s.p);                   // base × answer, subtracted
      put(k + 2, k, "rm", `<span>${DIG[s.r]}</span>${s.r > 9 ? `<small>(${s.r})</small>` : ""}`); // remainder
      if (k < m - 1) put(k + 1, k + 1, "", s.q);  // answer = next number to divide
    });
    put(m, m, "last", `<span>${DIG[x]}</span>`);  // last answer, smaller than the base
    const read = [DIG[x]].concat(steps.slice().reverse().map((s) => DIG[s.r]));
    return `<div class="scroll"><div class="ladder" style="grid-template-columns:repeat(${m + 1},auto)">${cells.join("")}</div></div>
      <p class="ladder-read">Read the last answer, then the remainders going up: <span class="mono"><b>${read.join(" ")}</b></span> → <b class="mono">${n}${sub(10)} = ${N.to(n, b)}${sub(b)}</b></p>`;
  };

  App.positions = function (s, b) {
    s = N.clean(s); const L = s.length;
    const digits = [...s].map((c, i) => ({ c, v: DIG.indexOf(c), k: L - 1 - i }));
    const boxes = digits.map((d) => `<div class="d"><i>${d.k}</i><b>${d.c}</b><span>${b}${sup(d.k)}</span></div>`).join("");
    const terms = digits.map((d) => `${d.v}·${b}${sup(d.k)}`).join(" + ");
    const nums = digits.filter((d) => d.v).map((d) => App.fmt(d.v * b ** d.k)).join(" + ") || "0";
    const total = parseInt(s, b);
    return `<div class="pos">${boxes}</div><p class="pos-sum">${s}${sub(b)} = ${terms}<br>= ${nums} = <b>${App.fmt(total)}</b> → <b>${s}${sub(b)} = ${total}${sub(10)}</b></p>`;
  };

  $$("[data-ladder]").forEach((el) => { const [n, b] = el.dataset.ladder.split(",").map(Number); el.innerHTML = App.ladder(n, b); });
  $$("[data-pos]").forEach((el) => { const [s, b] = el.dataset.pos.split(","); el.innerHTML = App.positions(s, +b); });

  const ut = $("#uniTable");
  if (ut) {
    let html = "<thead><tr><th>Denary</th><th>Binary</th><th>Octal</th><th>Hex</th><th style='border-left:3px solid var(--line)'>Denary</th><th>Binary</th><th>Octal</th><th>Hex</th></tr></thead><tbody>";
    for (let i = 0; i < 8; i++) {
      const j = i + 8;
      html += `<tr><td>${i}</td><td>${i.toString(2).padStart(4, "0")}</td><td>${i}</td><td>${DIG[i]}</td><td style="border-left:3px solid var(--line)">${j}</td><td>${j.toString(2).padStart(4, "0")}</td><td class="dim">${j.toString(8)}</td><td><b>${DIG[j]}</b></td></tr>`;
    }
    ut.innerHTML = html + "</tbody>";
  }

  const mode = $("#ezMode"), inp = $("#ezIn"), base = $("#ezBase"), out = $("#ezOut");
  if (!mode) return;
  function run() {
    const b = +base.value, s = N.clean(inp.value);
    if (!s) { out.innerHTML = ""; return; }
    if (mode.value === "to") {
      if (!/^\d+$/.test(s)) { out.innerHTML = '<p class="fb bad">For Rule 1, type a denary number (digits 0–9).</p>'; return; }
      const n = parseInt(s, 10);
      if (n > 99999) { out.innerHTML = '<p class="fb bad">Please use a number up to 99 999.</p>'; return; }
      out.innerHTML = App.ladder(n, b);
    } else {
      if (!N.valid(s, b)) { out.innerHTML = `<p class="fb bad">“${inp.value}” is not a base-${b} number. Base ${b} uses only ${DIG.slice(0, b).split("").join(", ")}.</p>`; return; }
      if (s.length > 16) { out.innerHTML = '<p class="fb bad">Please use 16 digits or fewer.</p>'; return; }
      out.innerHTML = App.positions(s, b);
    }
  }
  mode.addEventListener("change", () => { inp.value = mode.value === "to" ? "230" : (base.value === "2" ? "11010011" : base.value === "8" ? "347" : "B7"); run(); });
  base.addEventListener("change", () => { if (mode.value === "from") inp.value = base.value === "2" ? "11010011" : base.value === "8" ? "347" : "B7"; run(); });
  inp.addEventListener("input", run);
  run();
})();
