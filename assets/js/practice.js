/* Practice bank: tasks in the style of our FA and SA papers, with worked answers */
(function () {
  const { h, $, fmt } = App; const N = App.N, L = App.logic, C = App.calc;
  const sub = (b) => `<sub>${b}</sub>`;
  const NAME = { 2: "binary", 8: "octal", 10: "denary", 16: "hexadecimal" };
  const conv = (s, f, t) => { const n = parseInt(s, f); return { q: `${s}${sub(f)} = ?${sub(t)}`, a: `<p class="big-out">${N.to(n, t)}${sub(t)}</p>` + App.steps(N.steps(s, f, t)) }; };
  const circ = (e, out = "X") => `<div class="circuit-box">${L.svg(L.parse(e), { out })}</div>`;
  const tt = (e, out = "X") => `<div class="scroll">${L.table(L.parse(e), { out })}</div>`;

  const BANK = { num: [], data: [], logic: [] };

  /* ---------- Number systems worksheet (FA) ---------- */
  const P1 = [["714", 8, 2], ["2011", 8, 2], ["7", 8, 10], ["117", 8, 10], ["55", 8, 10], ["001", 2, 8], ["739", 10, 8], ["110100", 2, 8], ["537", 10, 8], ["1056", 10, 8],
    ["A63D", 16, 2], ["10010100", 2, 8], ["5FF", 16, 2], ["7A5D", 16, 2], ["110110", 2, 16], ["1111", 2, 16], ["355", 10, 16], ["912", 10, 16], ["FFAD", 16, 10], ["76AC", 16, 10]];
  BANK.num.push({ src: "FA · Number Systems worksheet", title: "Part 1 · Translate into the number system", marks: 20, html: true,
    q: "Convert each number. Use the back of your page for working.<div class='grid3' style='margin-top:8px'>" + P1.map((x, i) => `<span class="mono">${i + 1}) ${x[0]}${sub(x[1])} = ?${sub(x[2])}</span>`).join("") + "</div>",
    a: P1.map((x, i) => { const c = conv(...x); return `<details class="ans"><summary>${i + 1}) ${c.q}</summary><div class="ans-body">${c.a}</div></details>`; }).join("") });
  const P2 = [["123", 8, "52", 16], ["1011100", 2, "101011", 2], ["367", 8, "51", 8], ["1245", 10, "1152", 10], ["218", 10, "179", 16], ["100101110", 2, "7FF", 16]];
  BANK.num.push({ src: "FA · Number Systems worksheet", title: "Part 2 · Comparison (<, > or =)", marks: 6,
    q: "Put the correct sign between the numbers.<div class='grid2' style='margin-top:8px'>" + P2.map((x, i) => `<span class="mono">${i + 1}) ${x[0]}${sub(x[1])} ☐ ${x[2]}${sub(x[3])}</span>`).join("") + "</div>",
    a: App.steps(P2.map((x) => { const a = parseInt(x[0], x[1]), b = parseInt(x[2], x[3]); const s = a > b ? ">" : a < b ? "<" : "="; return `${x[0]}${sub(x[1])} = ${a}, ${x[2]}${sub(x[3])} = ${b} → <b>${x[0]}${sub(x[1])} ${s} ${x[2]}${sub(x[3])}</b>`; })) });
  const P3 = [["1010110", 2], ["427", 8], ["275", 10], ["F1B", 16]];
  BANK.num.push({ src: "FA · Number Systems worksheet", title: "Part 3 · Fill the matrix", marks: 12,
    q: `<div class="scroll"><table class="t mono"><tr><th>Binary (2)</th><th>Octal (8)</th><th>Decimal (10)</th><th>Hex (16)</th></tr>${P3.map(([s, b]) => `<tr>${[2, 8, 10, 16].map((t) => `<td>${t === b ? s : ""}</td>`).join("")}</tr>`).join("")}</table></div>`,
    a: `<div class="scroll"><table class="t mono"><tr><th>Binary (2)</th><th>Octal (8)</th><th>Decimal (10)</th><th>Hex (16)</th></tr>${P3.map(([s, b]) => { const n = parseInt(s, b); return `<tr>${[2, 8, 10, 16].map((t) => `<td>${t === b ? "<b>" + s + "</b>" : N.to(n, t)}</td>`).join("")}</tr>`; }).join("")}</table></div><p class="small muted">Tip: change the given number into binary first. From binary you can group by 3 (octal) or by 4 (hex).</p>` });

  /* ---------- Data representation SA (both variants) ---------- */
  const D = BANK.data;
  D.push({ src: "SA · Data Representation", title: "Compare ASCII and Unicode", marks: 2,
    q: "Compare ASCII and Unicode as methods of encoding text. Refer to (i) the number of bits used for one character and (ii) the range of characters each can represent.",
    a: "<ul><li>ASCII uses <b>7 bits</b> per character (8 bits in Extended ASCII), so it can represent <b>128</b> (or 256) characters — mostly English letters, digits and punctuation. (1)</li><li>Unicode uses <b>16 bits</b> per character, so it can represent <b>over 65 000</b> characters, including letters from many languages and symbols. (1)</li></ul>" });
  D.push({ src: "SA · Data Representation · V1", title: "Higher sample rate", marks: 2,
    q: "A sound engineer increases the sample rate used when recording audio. Explain one advantage and one disadvantage of a higher sample rate.",
    a: "<ul><li><b>Advantage:</b> more samples are taken each second, so the digital sound is closer to the real sound — better quality. (1)</li><li><b>Disadvantage:</b> more data is stored each second, so the file is bigger and takes longer to download. (1)</li></ul>" });
  D.push({ src: "SA · Data Representation · V2", title: "Higher bit depth (sample resolution)", marks: 2,
    q: "A sound engineer increases the bit depth used when recording audio. Explain one advantage and one disadvantage.",
    a: "<ul><li><b>Advantage:</b> more bits per sample means more possible amplitude levels, so each sample is measured more accurately — better quality, less distortion. (1)</li><li><b>Disadvantage:</b> more bits are stored for every sample, so the file is bigger. (1)</li></ul>" });
  D.push({ src: "SA · Data Representation", title: "Colour depth and resolution", marks: 2,
    q: "Explain how (a) increasing the colour depth and (b) increasing the resolution of an image affect its quality and its file size.",
    a: "<ul><li>(a) Higher colour depth → more colours for each pixel → better quality, but a <b>bigger file</b>. (1)</li><li>(b) Higher resolution → more pixels → more detail, sharper image, but a <b>bigger file</b>. (1)</li></ul>" });
  D.push({ src: "SA · Data Representation", title: "Hexadecimal for programmers", marks: 2,
    q: "Programmers often use hexadecimal instead of binary, for example in colour codes (#FF5733). (i) Give one reason why hexadecimal is more convenient. (ii) State one other real-world use of hexadecimal.",
    a: "<ul><li>(i) Hex is shorter: one hex digit = 4 bits, so it is easier to read and write and there are fewer mistakes. (1)</li><li>(ii) Any one: MAC addresses, memory addresses / error codes, IPv6 addresses. (1)</li></ul>" });
  D.push({ src: "SA · Data Representation", title: "Definitions", marks: 2,
    q: "Define the terms (a) colour depth and (b) sample resolution.",
    a: "<ul><li>(a) <b>Colour depth</b> — the number of bits used to represent the colour of each pixel. (1)</li><li>(b) <b>Sample resolution</b> — the number of bits used to store each sound sample (bit depth). (1)</li></ul>" });
  [["173", 10, 2], ["2F", 16, 10], ["200", 10, 16], ["100111111001010101", 2, 16], ["214", 10, 2], ["5C", 16, 10], ["150", 10, 16], ["101111010101010111", 2, 16]].forEach((x, i) => {
    const c = conv(...x);
    D.push({ src: `SA · Data Representation · V${i < 4 ? 1 : 2}`, title: `Convert ${NAME[x[1]]} → ${NAME[x[2]]}`, marks: 1, q: `Convert ${x[0]}${sub(x[1])} to ${NAME[x[2]]}. Show your working.`, a: c.a });
  });
  [["123", 8, "5E", 16, 1], ["133", 8, "6F", 16, 2]].forEach(([a, b1, c, b2, v]) => {
    const x = parseInt(a, b1), y = parseInt(c, b2);
    D.push({ src: `SA · Data Representation · V${v}`, title: "Which value is larger?", marks: 1, q: `Which value is larger: ${a}${sub(b1)} or ${c}${sub(b2)}? Convert both to denary to justify your answer.`,
      a: App.steps([`${a}${sub(b1)} = ${a.split("").map((d, i) => `(${d}×${8 ** (a.length - 1 - i)})`).join(" + ")} = <b>${x}</b>`, `${c}${sub(b2)} = (${parseInt(c[0], 16)}×16) + (${parseInt(c[1], 16)}×1) = <b>${y}</b>`, `${Math.max(x, y)} &gt; ${Math.min(x, y)}, so <b>${x > y ? a + sub(b1) : c + sub(b2)}</b> is larger.`]) });
  });
  [[48000, 16, 3, 1], [44100, 16, 2, 2]].forEach(([r, b, m, v]) => {
    const res = C.sound(r, b, m * 60, 2, "MiB");
    D.push({ src: `SA · Data Representation · V${v}`, title: "Stereo audio file size", marks: 2, q: `A stereo audio clip is recorded with a sample rate of ${fmt(r)} Hz and a bit depth of ${b} bits. The recording lasts ${m} minutes. Calculate the size of the file in MiB to 2 decimal places.`,
      a: App.steps([`${m} minutes = ${m * 60} seconds; stereo = 2 channels`].concat(res.steps)) + `<p class="big-out">≈ ${fmt(res.value, 2)} MiB</p>` });
  });
  [[1920, 1080, 24, 4, 1], [1280, 720, 16, 2, 2]].forEach(([w, hh, d, g, v]) => {
    const bytes = (w * hh * d) / 8, cap = g * 1024 ** 3, n = Math.floor(cap / bytes);
    D.push({ src: `SA · Data Representation · V${v}`, title: "Image size and flash drive", marks: 4, q: `A photographer saves an image of ${w} × ${hh} pixels with a colour depth of ${d} bits. (a) Calculate the size of one image in bytes. (b) How many whole images fit on a ${g} GiB flash drive?`,
      a: App.steps([`${fmt(w)} × ${fmt(hh)} = ${fmt(w * hh)} pixels`, `× ${d} bits = ${fmt(w * hh * d)} bits`, `÷ 8 = <b>${fmt(bytes)} bytes</b>`, `${g} GiB = ${g} × 1024 × 1024 × 1024 = ${fmt(cap)} bytes`, `${fmt(cap)} ÷ ${fmt(bytes)} = ${fmt(cap / bytes, 2)} → round down → <b>${fmt(n)} images</b>`]) });
  });
  D.push({ src: "Lesson task", title: "Decode the message", marks: 2, q: "Using the ASCII table, decode: <span class='mono'>01001001 00100000 01101100 01101001 01101011 01100101 00100000 01001101 01100011 01000100</span> (00100000 = space).",
    a: "<p class='big-out'>I like McD</p><p class='small'>01001001 = 73 = I, 01101100 = 108 = l, 01101001 = 105 = i, 01101011 = 107 = k, 01100101 = 101 = e, 01001101 = 77 = M, 01100011 = 99 = c, 01000100 = 68 = D.</p>" });
  D.push({ src: "Lesson task · past paper style", title: "Flash drive capacity", marks: 3, q: "A flash drive is labelled 32 GiB, but after formatting only 29.8 GiB is free. Photos are 4000 × 3000 pixels with 24-bit colour. How many photos fit?",
    a: (() => { const b = 4000 * 3000 * 3, cap = 29.8 * 1024 ** 3; return App.steps([`4000 × 3000 = 12 000 000 pixels × 24 bits ÷ 8 = ${fmt(b)} bytes`, `29.8 GiB = 29.8 × 1024³ = ${fmt(Math.round(cap))} bytes`, `${fmt(Math.round(cap))} ÷ ${fmt(b)} ≈ ${fmt(cap / b, 2)} → <b>${Math.floor(cap / b)} photos</b>`]); })() });

  /* ---------- Logic FA / SA ---------- */
  const G = BANK.logic;
  G.push({ src: "SA · Boolean Logic", title: "Knowledge check", marks: 4,
    q: "<ol><li>Which gate gives an output of 1 only when all of its inputs are 1? A) OR B) AND C) NOT</li><li>How many inputs does a NOT gate have? A) 0 B) 1 C) 2</li><li>A = 1 and B = 0. What is A OR B?</li><li>A = 1, B = 1, C = 0. What is (A AND B) AND (NOT C)?</li></ol>",
    a: App.steps(["B) AND", "B) 1 input", "1 — OR needs at least one input to be 1", "(1 AND 1) AND (NOT 0) = 1 AND 1 = <b>1</b>"]) });
  ["(NOT A) AND B", "(A OR B) AND (NOT A)", "(NOT A) OR B", "((NOT A) AND B) OR (A AND B)", "(NOT (A OR B)) AND C", "(NOT A) AND (B OR C)"].forEach((e, i) => {
    G.push({ src: i < 4 ? "FA · Logic Gates & Circuits" : "SA · Boolean Logic", title: "Circuit → expression + truth table", marks: L.vars(L.parse(e)).length === 3 ? 3 : 2,
      q: "Write the logic expression for Y and complete the truth table." + circ(e, "Y"), a: `<p><b>Y = ${L.str(L.parse(e))}</b></p>` + tt(e, "Y") });
  });
  ["A AND (NOT (B OR C))", "(NOT (A AND B)) AND (C OR (NOT D))", "A OR (NOT (B OR C))", "(NOT (A AND B)) OR (C AND D)", "((NOT A) AND B) OR (A AND (NOT B))"].forEach((e, i) => {
    G.push({ src: i < 3 ? "FA · Logic Gates & Circuits" : "SA · Boolean Logic", title: "Expression → circuit", marks: 2, q: `Using only AND, OR and NOT gates, draw a logic circuit for <b class="mono">Y = ${e}</b>.`,
      a: circ(e, "Y") + "<p class='small muted'>Start with the innermost brackets. Each bracket becomes one gate.</p>" });
  });
  G.push({ src: "SA · Boolean Logic", title: "Car alarm", marks: 4,
    q: "A car alarm sounds (Y = 1) when the alarm system is switched on (S = 1) and either a door is opened (D = 1) or a window is broken (W = 1). (a) Write the expression. (b) Draw the circuit. (c) The owner opens the door (D = 1, W = 0) while the system is off (S = 0). Does the alarm sound? Explain.",
    a: "<p>(a) <b>Y = S AND (D OR W)</b></p>" + circ("S AND (D OR W)", "Y") + "<p>(c) <b>No.</b> S = 0, and the AND gate needs S = 1 to give 1. D OR W = 1, but 0 AND 1 = 0.</p>" });
  G.push({ src: "SA · Boolean Logic", title: "Is Aisha correct?", marks: 3,
    q: "Aisha says: “NOT (A AND B) always gives the same result as (NOT A) AND (NOT B).” Complete a truth table for both and decide if she is correct.",
    a: (() => { const t1 = L.parse("NOT (A AND B)"), t2 = L.parse("(NOT A) AND (NOT B)"); return `<div class="scroll"><table class="t mono"><tr><th>A</th><th>B</th><th>NOT (A AND B)</th><th>(NOT A) AND (NOT B)</th></tr>${L.rows(["A", "B"]).map((e) => `<tr><td>${e.A}</td><td>${e.B}</td><td>${L.ev(t1, e)}</td><td>${L.ev(t2, e)}</td></tr>`).join("")}</table></div><p><b>Not correct.</b> The results are different when A = 0, B = 1 and when A = 1, B = 0. (Extra: NOT (A AND B) is the same as (NOT A) <b>OR</b> (NOT B).)</p>`; })() });
  G.push({ src: "SA · Boolean Logic", title: "AND and OR in daily life", marks: 2, q: "Explain the difference between an AND gate and an OR gate. Give one real-life example of each.",
    a: "<ul><li>AND gives 1 only if <b>all</b> inputs are 1; OR gives 1 if <b>at least one</b> input is 1. (1)</li><li>AND: a microwave runs only if the door is closed AND start is pressed. OR: a room light turns on if switch 1 OR switch 2 is on. (1)</li></ul>" });

  /* ---------- render ---------- */
  const TABS = [["num", "Number systems"], ["data", "Text, images, sound"], ["logic", "Boolean logic"]];
  let cur = App.store.get("pbTab", "num");
  function render() {
    const tabs = $("#pbTabs"); tabs.innerHTML = "";
    TABS.forEach(([k, t]) => tabs.append(h("button", { class: k === cur ? "sel" : "", onclick: () => { cur = k; App.store.set("pbTab", k); render(); } }, `${t} (${BANK[k].length})`)));
    const list = $("#pbList"); list.innerHTML = "";
    BANK[cur].forEach((it, i) => {
      const body = h("details", { class: "ans" }, h("summary", null, "Show answer"), h("div", { class: "ans-body", html: it.a }));
      list.append(h("div", { class: "qitem" },
        h("div", { class: "qh" }, h("span", { class: "num" }, `Q${i + 1}`), h("h4", null, it.title), h("span", { class: "marks" }, `[${it.marks}]`), h("span", { class: "pill src" }, it.src)),
        h("div", { html: it.q }), body));
    });
  }
  render();
})();
