/* Mock exam: same structure as the midterm (10 questions, 40 marks, 40 minutes), new numbers each attempt */
(function () {
  const { h, $, rand, pick, shuffle, fmt } = App; const N = App.N, L = App.logic, C = App.calc;
  const root = $("#mockRoot"); if (!root) return;
  const sub = (b) => `<sub>${b}</sub>`;
  // values used in the real midterm papers are avoided
  const AVOID = new Set([45, 182, 215, 59, 47, 200, 53, 202, 188, 78, 58, 175]);
  const uniq = (gen) => { let v; do { v = gen(); } while (AVOID.has(v)); return v; };

  /* ---------- small UI builders that return {el, grade()} ---------- */
  function textPart(label, marks, correctFn, shown, opt = {}) {
    const id = "m" + Math.random().toString(36).slice(2, 8);
    const inp = h("input", { type: "text", id, class: "mono" + (opt.wide ? " wide" : ""), autocomplete: "off", placeholder: opt.ph || "" });
    const fb = h("div", { class: "correct-ans", hidden: true });
    const el = h("div", { class: "part" }, h("label", { for: id, html: label }), " ", inp, opt.unit ? h("span", { class: "muted" }, " " + opt.unit) : "", fb);
    return { el, marks, inp, grade() {
      inp.disabled = true; const got = correctFn(inp.value.trim());
      inp.parentNode.classList.add(got === marks ? "mark-ok" : "mark-bad");
      fb.hidden = false; fb.innerHTML = `${got}/${marks} · Answer: ${shown}`; return got;
    } };
  }
  function radioPart(label, marks, options, correctIdx, extra) {
    const name = "r" + Math.random().toString(36).slice(2, 8);
    const order = shuffle(options.map((o, i) => i));
    const box = h("div", { class: "part" }, h("div", { html: label }));
    const inputs = order.map((i) => { const id = name + i; const r = h("input", { type: "radio", name, id, value: i }); box.append(h("label", { class: "opt", for: id }, r, h("span", { html: options[i] }))); return r; });
    const fb = h("div", { class: "correct-ans", hidden: true }); box.append(fb);
    return { el: box, marks, grade() {
      inputs.forEach((r) => (r.disabled = true));
      const sel = inputs.find((r) => r.checked); const ok = sel && +sel.value === correctIdx;
      box.classList.add(ok ? "mark-ok" : "mark-bad"); fb.hidden = false; fb.innerHTML = `${ok ? marks : 0}/${marks} · Answer: ${options[correctIdx]}${extra ? " " + extra : ""}`;
      return ok ? marks : 0;
    } };
  }
  function checkPart(label, marks, options, correctSet) {
    const name = "c" + Math.random().toString(36).slice(2, 8);
    const box = h("div", { class: "part" }, h("div", { html: label }));
    const order = shuffle(options.map((o, i) => i));
    const inputs = order.map((i) => { const id = name + i; const c = h("input", { type: "checkbox", id, value: i }); box.append(h("label", { class: "opt", for: id }, c, h("span", null, options[i]))); return c; });
    const fb = h("div", { class: "correct-ans", hidden: true }); box.append(fb);
    return { el: box, marks, grade() {
      inputs.forEach((c) => (c.disabled = true));
      const ticked = inputs.filter((c) => c.checked).map((c) => +c.value);
      const right = ticked.filter((i) => correctSet.includes(i)).length, wrong = ticked.length - right;
      // 1 mark per correct tick, minus 1 for every tick beyond the number asked for
      const got = Math.max(0, Math.min(marks, right) - Math.max(0, ticked.length - marks));
      void wrong;
      box.classList.add(got === marks ? "mark-ok" : "mark-bad");
      fb.hidden = false; fb.innerHTML = `${got}/${marks} · Correct: ${correctSet.map((i) => options[i]).join("; ")}`; return got;
    } };
  }
  function selectPart(label, marks, options, correct) {
    const id = "s" + Math.random().toString(36).slice(2, 8);
    const sel = h("select", { id }, h("option", { value: "" }, "— choose —"), ...options.map((o) => h("option", { value: o }, o)));
    const fb = h("div", { class: "correct-ans", hidden: true });
    const el = h("div", { class: "part" }, h("label", { for: id, html: label }), " ", sel, fb);
    return { el, marks, grade() { sel.disabled = true; const ok = sel.value === correct; el.classList.add(ok ? "mark-ok" : "mark-bad"); fb.hidden = false; fb.innerHTML = `${ok ? marks : 0}/${marks} · Answer: ${correct}`; return ok ? marks : 0; } };
  }
  const numEq = (target) => (v) => { const x = App.num(v); return x !== null && App.closeEnough(x, target); };

  /* ---------- questions ---------- */
  function q1() {
    const types = [
      { f: 10, t: 2, lbl: "Convert the denary number {n} into 8-bit binary.", r: [20, 250] },
      { f: 2, t: 10, lbl: "Convert the binary number {n} into denary.", r: [70, 250] },
      { f: 2, t: 16, lbl: "Convert the binary number {n} into hexadecimal.", r: [70, 250] },
      { f: 16, t: 10, lbl: "Convert the hexadecimal number {n} into denary.", r: [20, 250] },
      { f: 16, t: 2, lbl: "Convert the hexadecimal number {n} into 8-bit binary.", r: [20, 250] },
      { f: 10, t: 16, lbl: "Convert the denary number {n} into hexadecimal.", r: [30, 250] },
    ];
    const parts = types.map((T, i) => {
      const n = uniq(() => rand(...T.r));
      const shown = T.f === 2 ? n.toString(2).padStart(8, "0") : N.to(n, T.f);
      const ans = T.t === 2 ? n.toString(2).padStart(8, "0") : N.to(n, T.t);
      return textPart(`(${"abcdef"[i]}) ${T.lbl.replace("{n}", `<b class="mono">${shown}</b>`)}`, 1,
        (v) => { v = N.clean(v); if (T.t === 2 && v.length !== 8) return 0; return N.parse(v, T.t) === n ? 1 : 0; }, `<span class="mono">${ans}</span>`, { ph: T.t === 2 ? "8 digits" : "" });
    });
    return { title: "Number conversions", sec: "A", parts };
  }
  function q2() {
    const reasons = ["It is shorter — one hex digit replaces 4 bits", "It is easier for people to read and remember", "There are fewer mistakes when copying it", "Computers process hex faster than binary", "Hex numbers use less memory than binary"];
    const uses = [["MAC addresses", "Measuring the loudness of a sound", "Counting the pixels in an image", "Setting the sample rate"], ["HTML colour codes", "Measuring the loudness of a sound", "Counting the pixels in an image", "Setting the sample rate"], ["Error codes and memory addresses", "Measuring the loudness of a sound", "Counting the pixels in an image", "Setting the sample rate"], ["IPv6 addresses", "Measuring the loudness of a sound", "Counting the pixels in an image", "Setting the sample rate"]];
    const u = pick(uses);
    return { title: "Why hexadecimal?", sec: "A", parts: [
      checkPart("(a) Tick <b>two</b> reasons why hexadecimal is used instead of binary.", 2, reasons, [0, 1, 2]),
      radioPart("(b) Where is hexadecimal used in computing?", 1, u, 0),
    ] };
  }
  function q3() {
    const ext = Math.random() < 0.5;
    const words = ["CODE", "BYTE", "DATA", "CHIP", "GATE", "HEX", "BIT", "PIXEL", "MOUSE", "CABLE"];
    const w = pick(words);
    const letters = shuffle([...new Set(w.split("").concat(shuffle("ABEGHKLMNPRSTUW".split("")).slice(0, 2)))]).sort();
    const table = `<div class="scroll"><table class="t mono"><tr><th>Character</th>${letters.map((c) => `<th>${c}</th>`).join("")}</tr><tr><td>Binary</td>${letters.map((c) => `<td>${c.charCodeAt(0).toString(2).padStart(8, "0")}</td>`).join("")}</tr></table></div>`;
    const msg = w.split("").map((c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join("  ");
    const bits = ext ? 8 : 7, chars = ext ? 256 : 128;
    const pA = { marks: 1 };
    const i1 = h("input", { type: "text", class: "mono", style: "width:70px", "aria-label": "bits" }), i2 = h("input", { type: "text", class: "mono", style: "width:90px", "aria-label": "characters" });
    const fbA = h("div", { class: "correct-ans", hidden: true });
    pA.el = h("div", { class: "part" }, h("span", null, `(a) ${ext ? "Extended ASCII" : "ASCII"} uses `), i1, h("span", null, " bits for each character, so it can represent "), i2, h("span", null, " different characters."), fbA);
    pA.grade = () => { i1.disabled = i2.disabled = true; const ok = App.num(i1.value) === bits && App.num(i2.value) === chars; pA.el.classList.add(ok ? "mark-ok" : "mark-bad"); fbA.hidden = false; fbA.textContent = `${ok ? 1 : 0}/1 · Answer: ${bits} bits, ${chars} characters`; return ok ? 1 : 0; };
    return { title: "Text", sec: "B", parts: [pA,
      textPart(`(b) Use the table to decode the message: <span class="mono">${msg}</span>${table}Message:`, 1, (v) => (v.trim().toUpperCase() === w ? 1 : 0), w),
      radioPart("(c) Why do modern computers use Unicode and not only ASCII?", 1, ["ASCII does not have enough codes for letters of other languages, like Kazakh or Russian", "Unicode files are always smaller than ASCII files", "ASCII cannot store digits", "Unicode uses fewer bits for each character"], 0),
    ] };
  }
  function imageQ() {
    let w, hh, d, kib;
    do { [w, hh] = pick([[640, 480], [800, 600], [1280, 1024], [512, 384], [320, 256], [1024, 512], [1600, 1200], [256, 256]]); d = pick([4, 8, 16, 24]); kib = (w * hh * d) / 8 / 1024; }
    while (kib !== Math.floor(kib) || kib > 6000);
    return { w, hh, d, kib };
  }
  function q4() {
    const im = imageQ(); const cd = pick([1, 2, 3, 5, 6, 7, 8]); const flip = Math.random() < 0.5;
    const steps = C.image(im.w, im.hh, im.d, "KiB").steps;
    const pD = textPart(`(d) An image is ${im.w} × ${im.hh} pixels with a colour depth of ${im.d} bits. Calculate the file size in KiB.`, 3,
      (v) => { const x = App.num(v); if (x === null) return 0; if (App.closeEnough(x, im.kib)) return 3; if (App.closeEnough(x, im.kib * 1024)) return 2; if (App.closeEnough(x, im.kib * 8192)) return 1; return 0; },
      `${fmt(im.kib)} KiB<br>${App.steps(steps)}`, { unit: "KiB" });
    return { title: "Images", sec: "B", parts: [
      radioPart("(a) What is meant by image resolution?", 1, ["The number of pixels that make up an image", "The number of bits used for each pixel", "The number of colours on the screen", "The size of the image file in bytes"], 0),
      radioPart("(b) What is meant by colour depth?", 1, ["The number of bits used to represent the colour of each pixel", "The number of pixels in one row", "How bright the colours are", "The number of images in a file"], 0),
      flip ? textPart(`(c) Each pixel can be one of <b>${2 ** cd}</b> colours. What is the colour depth?`, 1, (v) => (App.num(v) === cd ? 1 : 0), `${cd} bits (2<sup>${cd}</sup> = ${2 ** cd})`, { unit: "bits" })
        : textPart(`(c) An image has a colour depth of <b>${cd} bits</b>. How many colours can each pixel have?`, 1, (v) => (App.num(v) === 2 ** cd ? 1 : 0), `${2 ** cd} colours`, { unit: "colours" }),
      pD,
    ] };
  }
  function soundQ() {
    let r, b, s, ch, kib;
    do { r = pick([8000, 16000, 32000, 48000, 24000]); b = pick([8, 16]); s = pick([8, 10, 16, 20, 30, 32, 64, 128]); ch = pick([1, 2]); kib = (r * b * s * ch) / 8 / 1024; }
    while (kib !== Math.floor(kib) || (r === 16000 && b === 16 && s === 64 && ch === 1) || (r === 32000 && b === 8 && s === 32 && ch === 1));
    return { r, b, s, ch, kib };
  }
  function q5() {
    const sr = pick([22050, 44100, 48000, 11025]); const which = pick(["sample rate", "sample resolution"]);
    const snd = soundQ(); const steps = C.sound(snd.r, snd.b, snd.s, snd.ch, "KiB").steps;
    return { title: "Sound", sec: "B", parts: [
      radioPart(`(a) A sound is recorded with a sample rate of ${fmt(sr)} Hz. What does this mean?`, 1, [`${fmt(sr)} samples of the sound are taken every second`, `Each sample uses ${fmt(sr)} bits`, `The sound lasts ${fmt(sr)} seconds`, `The sound is ${fmt(sr)} times louder`], 0),
      selectPart(`(b) The ${which} is increased. One <b>advantage</b>:`, 1, ["Better sound quality, closer to the real sound", "Smaller file size", "Faster to download"], "Better sound quality, closer to the real sound"),
      selectPart(`&nbsp;&nbsp;&nbsp;&nbsp;One <b>disadvantage</b>:`, 1, ["The sound becomes quieter", "Bigger file size", "Fewer samples are taken"], "Bigger file size"),
      textPart(`(c) A <b>${snd.ch === 2 ? "stereo" : "mono"}</b> sound: sample rate ${fmt(snd.r)} Hz, sample resolution ${snd.b} bits, length ${snd.s} seconds. Calculate the file size in KiB.`, 3,
        (v) => { const x = App.num(v); if (x === null) return 0; if (App.closeEnough(x, snd.kib)) return 3; if (App.closeEnough(x, snd.kib * 1024)) return 2; if (App.closeEnough(x, snd.kib * 8192)) return 1; return 0; },
        `${fmt(snd.kib)} KiB<br>${App.steps(steps)}`, { unit: "KiB" }),
    ] };
  }
  function q6() {
    const g = pick([2, 3, 5, 6, 8]), k = pick([2048, 3072, 5120, 7168, 10240]), cap = pick([2, 3, 4, 6]), ph = pick([256, 384, 512, 768, 1024]);
    const fit = Math.floor((cap * 1024) / ph);
    return { title: "Data storage", sec: "C", parts: [
      textPart(`(a) ${g} GiB = ? MiB`, 1, (v) => (App.num(v) === g * 1024 ? 1 : 0), `${fmt(g * 1024)} MiB`, { unit: "MiB" }),
      textPart(`(b) ${fmt(k)} KiB = ? MiB`, 1, (v) => (App.num(v) === k / 1024 ? 1 : 0), `${k / 1024} MiB`, { unit: "MiB" }),
      textPart(`(c) A memory card has ${cap} MiB free. Each photo is ${ph} KiB. How many photos can be saved?`, 1, (v) => (App.num(v) === fit ? 1 : 0), `${cap} × 1024 = ${cap * 1024} KiB; ${cap * 1024} ÷ ${ph} = ${fmt((cap * 1024) / ph, 2)} → <b>${fit}</b>`, { unit: "photos" }),
    ] };
  }
  function q7() {
    const T = [["Boolean value", "A value that can only be True or False (1 or 0)"], ["Truth table", "A table that shows all possible inputs and the output for each one"], ["Logic gate", "A part of a circuit that uses one rule to give an output"], ["Logic circuit", "Two or more logic gates joined together"], ["Condition", "A test or question that gives a True or False answer"], ["Rule", "An action the system does because of the result of a condition"]];
    const pickd = shuffle(T).slice(0, 4); const used = pickd.slice(0, 3); const meanings = shuffle(pickd.map((x) => x[1]));
    return { title: "Key terms", sec: "D", intro: "Choose the correct meaning for each term. One meaning is not used.", parts: used.map(([t, m]) => selectPart(`<b>${t}</b>`, 1, meanings, m)) };
  }
  function ttPart(tree, cols, markFn, label) {
    const w = L.ttWidget(tree, { cols }); const fb = h("div", { class: "correct-ans", hidden: true });
    const el = h("div", { class: "part" }, label ? h("div", { html: label }) : "", w.el, fb);
    const max = markFn(null);
    return { el, marks: max, grade() { const res = w.check(); const got = markFn(res, w.rows.length); el.classList.add(got === max ? "mark-ok" : "mark-bad"); fb.hidden = false; fb.textContent = `${got}/${max} · correct values are now shown in the table`; return got; } };
  }
  function q8() {
    const cols = shuffle([{ node: L.parse("A AND B"), name: "A AND B" }, { node: L.parse("A OR B"), name: "A OR B" }, pick([{ node: L.parse("NOT A"), name: "NOT A" }, { node: L.parse("NOT B"), name: "NOT B" }])]);
    const tree = L.parse("A AND B");
    return { title: "Logic gates", sec: "D", parts: [ttPart(tree, cols, (res, n) => (res ? res.filter((x) => x === n).length : 3), `<div class="circuit-box row" style="gap:28px">${["A AND B", "A OR B", "NOT A"].map((e) => `<div style="text-align:center">${L.svg(L.parse(e), { out: "" })}<div class="small mono">${e.split(" ").length > 2 ? e.split(" ")[1] : "NOT"}</div></div>`).join("")}</div>Complete the truth table.`)] };
  }
  function q9() {
    const tree = L.gen3(true), labels = L.pqLabels(tree);
    const cols = [...labels.entries()].map(([node, name]) => ({ node, name })).concat([{ node: tree, name: "X" }]);
    return { title: "Logic circuit", sec: "D", parts: [ttPart(tree, cols, (res, n) => { if (!res) return 4; const x = res[2]; return (res[0] === n ? 1 : 0) + (res[1] === n ? 1 : 0) + (x === n ? 2 : x >= n - 2 ? 1 : 0); },
      `<div class="circuit-box">${L.svg(tree, { labels })}</div>P and Q are the outputs of the first gates. Complete the truth table.`)], answer: `X = ${L.str(tree)}` };
  }
  function q10() {
    const pool = L.SCENARIOS.filter((s) => L.vars(L.parse(s.e)).length === 3);
    const s = pick(pool), model = L.parse(s.e), vs = L.vars(model);
    const pa = textPart(`(a) Write a logic expression for ${s.out}.<br><span class="mono">${s.out} =</span>`, 1, (v) => { try { const t = L.parse(v.replace(/^\s*[A-Z]\s*=/i, "")); if (L.vars(t).some((x) => !vs.includes(x))) return 0; return L.equiv(t, model, vs) ? 1 : 0; } catch (e) { return 0; } }, `${s.out} = ${s.e}<div class="circuit-box">${L.svg(model, { out: s.out })}</div>`, { wide: true });
    const pb = ttPart(model, [{ node: model, name: s.out }], (res, n) => (!res ? 2 : res[0] === n ? 2 : res[0] >= n - 2 ? 1 : 0), `(b) Complete the truth table for ${s.out}.`);
    return { title: "Real-life problem", sec: "D", intro: s.t, parts: [pa, pb] };
  }

  /* ---------- exam flow ---------- */
  let timerId, endAt, parts = [], exam;
  function intro() {
    clearInterval(timerId);
    const best = App.store.get("mockBest", null), hist = App.store.get("mockHist", []);
    root.innerHTML = "";
    root.append(h("div", { class: "panel" },
      h("h3", { style: "margin-top:0" }, "Before you start"),
      h("ul", null, h("li", null, "10 questions, 40 marks, 40 minutes — just like the real exam."), h("li", null, "Calculations: write the final number only (no units). Do your working on paper."), h("li", null, "8-bit binary answers need exactly 8 digits."), h("li", null, "Logic tables: click a cell to switch between 0 and 1."), h("li", null, "When the time is up, the exam is marked automatically.")),
      best !== null ? h("p", { class: "small" }, `Your best score: ${best}/40 · Attempts: ${hist.length}`) : "",
      h("div", { class: "row" }, h("button", { class: "primary", onclick: start }, "Start the mock exam"), h("label", { class: "small" }, h("input", { type: "checkbox", id: "noTimer" }), " practise without the timer"))));
  }
  function start() {
    const noTimer = $("#noTimer") && $("#noTimer").checked;
    exam = [q1(), q2(), q3(), q4(), q5(), q6(), q7(), q8(), q9(), q10()];
    parts = [];
    root.innerHTML = "";
    const timerEl = h("span", { class: "timer" }, noTimer ? "∞" : "40:00");
    const bar = h("div", { class: "mock-bar" }, h("b", null, "Mock exam"), timerEl, h("span", { class: "small muted" }, "40 marks"), h("button", { class: "primary", style: "margin-left:auto", onclick: () => submit() }, "Finish and mark"));
    root.append(bar);
    const SEC = { A: "Section A. Number systems", B: "Section B. Text, images and sound", C: "Section C. Data storage", D: "Section D. Boolean logic" };
    let lastSec = "";
    exam.forEach((q, i) => {
      if (q.sec !== lastSec) { root.append(h("h3", null, SEC[q.sec])); lastSec = q.sec; }
      const m = q.parts.reduce((a, p) => a + p.marks, 0);
      const box = h("div", { class: "mq" }, h("h4", null, h("span", null, `${i + 1}. ${q.title}`), h("span", { class: "marks" }, `[${m}]`)));
      if (q.intro) box.append(h("p", { html: q.intro }));
      q.parts.forEach((p) => { box.append(p.el); parts.push({ p, q: i }); });
      q.box = box; root.append(box);
    });
    root.append(h("div", { class: "row" }, h("button", { class: "primary", onclick: () => submit() }, "Finish and mark")));
    if (!noTimer) {
      endAt = Date.now() + 40 * 60 * 1000;
      timerId = setInterval(() => {
        const left = Math.max(0, endAt - Date.now()), mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
        timerEl.textContent = `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
        timerEl.classList.toggle("low", left < 5 * 60000);
        if (left <= 0) submit(true);
      }, 500);
    }
    window.scrollTo(0, 0);
  }
  function submit(auto) {
    clearInterval(timerId);
    let total = 0; const bySec = { A: [0, 0], B: [0, 0], C: [0, 0], D: [0, 0] };
    parts.forEach(({ p, q }) => { const g = p.grade(); total += g; bySec[exam[q].sec][0] += g; bySec[exam[q].sec][1] += p.marks; });
    exam.forEach((q) => { if (q.answer) q.box.append(h("p", { class: "correct-ans" }, q.answer)); });
    root.querySelectorAll(".mock-bar button, .row > button.primary").forEach((b) => b.remove());
    const hist = App.store.get("mockHist", []); hist.push(total); App.store.set("mockHist", hist.slice(-20));
    const best = Math.max(total, App.store.get("mockBest", 0) || 0); App.store.set("mockBest", best);
    const names = { A: "Number systems", B: "Text, images, sound", C: "Data storage", D: "Boolean logic" };
    const weakest = Object.keys(bySec).sort((a, b) => bySec[a][0] / bySec[a][1] - bySec[b][0] / bySec[b][1])[0];
    const link = { A: "numbers", B: "images", C: "storage", D: "logic" }[weakest];
    const res = h("div", { class: "panel tool" },
      h("div", { class: "tool-head" }, h("span", { class: "tool-kind" }, auto ? "Time is up" : "Result"), h("h3", null, `Your score: ${total} / 40 (${Math.round((total / 40) * 100)}%)`)),
      h("div", { class: "result-card" }, ...Object.keys(bySec).map((k) => h("div", { class: "readout" }, h("span", null, names[k]), h("b", null, `${bySec[k][0]}/${bySec[k][1]}`)))),
      h("p", { html: `Revise first: <a href="#${link}">${names[weakest]}</a>. Scroll down to see the correct answers under each question.` }),
      h("div", { class: "row" }, h("button", { class: "primary", onclick: intro }, "Try a new mock exam")));
    root.insertBefore(res, root.firstChild);
    window.scrollTo(0, 0);
  }
  intro();
  App.onShow("mock", () => { if (!parts.length) intro(); });

  App.start();
})();
