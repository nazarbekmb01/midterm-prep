/* Text, images, sound: tools, calculators, drills */
(function () {
  const { h, $, rand, pick, fmt } = App;

  /* ================= shared file-size calculators ================= */
  const UNITS = ["bits", "bytes", "KiB", "MiB", "GiB"];
  const C = (App.calc = {});
  C.convertSteps = function (bits, unit) {
    const s = []; let v = bits;
    if (unit === "bits") return { steps: s, value: v };
    v = bits / 8; s.push(`${fmt(bits)} bits ÷ 8 = <b>${fmt(v, 4)}</b> bytes`);
    const order = ["bytes", "KiB", "MiB", "GiB"];
    for (let i = 1; i <= order.indexOf(unit); i++) { const nv = v / 1024; s.push(`${fmt(v, 4)} ${order[i - 1]} ÷ 1024 = <b>${fmt(nv, 4)}</b> ${order[i]}`); v = nv; }
    return { steps: s, value: v };
  };
  C.image = function (w, hh, d, unit) {
    const px = w * hh, bits = px * d;
    const s = [`Number of pixels: ${fmt(w)} × ${fmt(hh)} = <b>${fmt(px)}</b>`, `× colour depth: ${fmt(px)} × ${d} = <b>${fmt(bits)}</b> bits`];
    const r = C.convertSteps(bits, unit);
    return { steps: s.concat(r.steps), value: r.value };
  };
  C.sound = function (rate, bits, secs, ch, unit) {
    const tot = rate * bits * secs * ch;
    const s = [`File size = sample rate × resolution × seconds × channels`, `${fmt(rate)} × ${bits} × ${fmt(secs)} × ${ch} = <b>${fmt(tot)}</b> bits`];
    const r = C.convertSteps(tot, unit);
    return { steps: s.concat(r.steps), value: r.value };
  };
  const close = (a, b) => Math.abs(a - b) <= Math.max(0.011, Math.abs(b) * 0.0005);
  App.closeEnough = close;

  /* ================= TEXT ================= */
  (function () {
    const inp = $("#asIn"); if (!inp) return;
    function run() {
      const out = $("#asOut"); out.innerHTML = "";
      const chars = Array.from(inp.value);
      let nonAscii = 0;
      chars.forEach((ch) => {
        const cp = ch.codePointAt(0);
        if (cp < 128) {
          out.append(h("div", { class: "char" }, h("div", { class: "c" }, ch === " " ? "␣" : ch), h("div", { class: "d" }, `ASCII ${cp}`), h("div", { class: "bn" }, cp.toString(2).padStart(8, "0"))));
        } else {
          nonAscii++;
          out.append(h("div", { class: "char uni" }, h("div", { class: "c" }, ch), h("div", { class: "d" }, cp > 65535 ? "Unicode, more than 16 bits" : `Not in ASCII · Unicode ${cp}`), h("div", { class: "bn" }, cp > 65535 ? cp.toString(2) : cp.toString(2).padStart(16, "0"))));
        }
      });
      $("#asSum").innerHTML = chars.length ? (nonAscii ? `<b>${nonAscii}</b> character(s) are not in ASCII, so this text needs <b>Unicode</b>: ${chars.length} × 16 = ${chars.length * 16} bits.` : `All characters are in ASCII. Stored with 8 bits each: ${chars.length} × 8 = ${chars.length * 8} bits.`) : "";
    }
    inp.addEventListener("input", run); run();
    const di = $("#adIn");
    function dec() {
      const parts = di.value.trim().split(/\s+/).filter(Boolean);
      $("#adOut").textContent = parts.map((p) => (/^[01]{7,8}$/.test(p) ? String.fromCharCode(parseInt(p, 2)) : "?")).join("");
    }
    di.addEventListener("input", dec); dec();
  })();

  /* ================= PIXEL EDITOR ================= */
  (function () {
    const grid = $("#pxGrid"); if (!grid) return;
    const PAL = {
      1: [["#ffffff", "white"], ["#111111", "black"]],
      2: [["#ffffff", "white"], ["#f4c430", "yellow"], ["#1f3b8f", "blue"], ["#d0342c", "red"]],
      3: [["#ffffff", "white"], ["#111111", "black"], ["#d0342c", "red"], ["#2e9e48", "green"], ["#1f3b8f", "blue"], ["#f4c430", "yellow"], ["#38b6d6", "cyan"], ["#b33dc6", "magenta"]],
    };
    const ART = ["..YYYY..", ".YYYYYY.", "YYEYYEYY", "YYYYYYYY", "YMYYYYMY", "YYMMMMYY", ".YYYYYY.", "..YYYY.."];
    const MAP = { 1: { ".": 0, Y: 1, E: 0, M: 0 }, 2: { ".": 0, Y: 1, E: 2, M: 3 }, 3: { ".": 0, Y: 5, E: 1, M: 2 } };
    let depth = 2, cur = 1, px = new Array(64).fill(0), down = false;
    grid.style.gridTemplateColumns = "repeat(8,1fr)";
    const cells = [];
    for (let i = 0; i < 64; i++) {
      const c = h("div", { "data-i": i }); cells.push(c); grid.append(c);
    }
    function paint(i) { px[i] = cur; drawCell(i); info(); }
    grid.addEventListener("pointerdown", (e) => { const i = e.target.dataset.i; if (i == null) return; down = true; paint(+i); e.preventDefault(); });
    grid.addEventListener("pointermove", (e) => { if (!down) return; const el = document.elementFromPoint(e.clientX, e.clientY); if (el && el.parentNode === grid) paint(+el.dataset.i); });
    window.addEventListener("pointerup", () => (down = false));
    function drawCell(i) { cells[i].style.background = PAL[depth][px[i]][0]; }
    function pal() {
      const box = $("#pxPal"); box.innerHTML = "";
      PAL[depth].forEach((p, i) => box.append(h("button", { type: "button", class: i === cur ? "sel" : "", onclick: () => { cur = i; pal(); } }, h("i", { style: `background:${p[0]}` }), i.toString(2).padStart(depth, "0") + " " + p[1])));
    }
    function info() {
      let s = "";
      for (let r = 0; r < 8; r++) s += px.slice(r * 8, r * 8 + 8).map((v) => v.toString(2).padStart(depth, "0")).join(" ") + "\n";
      $("#pxBin").textContent = s;
      $("#pxSize").innerHTML = `8 × 8 = 64 pixels × ${depth} bit${depth > 1 ? "s" : ""} = <b>${64 * depth} bits</b> = <b>${(64 * depth) / 8} bytes</b>. With ${depth} bit${depth > 1 ? "s" : ""} each pixel can be one of 2<sup>${depth}</sup> = ${2 ** depth} colours.`;
    }
    function load() { px = []; ART.forEach((r) => [...r].forEach((c) => px.push(MAP[depth][c]))); all(); }
    function all() { for (let i = 0; i < 64; i++) drawCell(i); pal(); info(); }
    $("#pxDepth").onchange = (e) => { depth = +e.target.value; cur = Math.min(1, 2 ** depth - 1); load(); };
    $("#pxClear").onclick = () => { px.fill(0); all(); };
    $("#pxSmile").onclick = load;
    load();
  })();

  /* ================= RESOLUTION / DEPTH DEMO ================= */
  (function () {
    const cv = $("#resCv"); if (!cv) return;
    const RES = [8, 16, 32, 64, 128, 256];
    const DEP = [[1, "1 bit · 2 colours"], [2, "2 bits · 4 greys"], [3, "3 bits · 8 colours"], [4, "4 bits · 16 colours"], [6, "6 bits · 64 colours"], [8, "8 bits · 256 colours"], [12, "12 bits · 4096 colours"], [24, "24 bits · 16.7 million"]];
    const CH = { 3: [1, 1, 1], 4: [1, 2, 1], 6: [2, 2, 2], 8: [3, 3, 2], 12: [4, 4, 4], 24: [8, 8, 8] };
    const src = document.createElement("canvas"); src.width = src.height = 256;
    const g = src.getContext("2d");
    // scene: sky, sun, hills, house, tree
    let sky = g.createLinearGradient(0, 0, 0, 170); sky.addColorStop(0, "#3d7fd9"); sky.addColorStop(1, "#bfe3ff");
    g.fillStyle = sky; g.fillRect(0, 0, 256, 256);
    g.fillStyle = "#ffd23f"; g.beginPath(); g.arc(200, 52, 26, 0, 7); g.fill();
    g.fillStyle = "#ffffff"; [[60, 50, 18], [80, 44, 22], [102, 52, 16]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
    let hill = g.createLinearGradient(0, 150, 0, 256); hill.addColorStop(0, "#5cb85c"); hill.addColorStop(1, "#2d6a2d");
    g.fillStyle = hill; g.beginPath(); g.moveTo(0, 190); g.quadraticCurveTo(70, 140, 140, 180); g.quadraticCurveTo(200, 210, 256, 165); g.lineTo(256, 256); g.lineTo(0, 256); g.fill();
    g.fillStyle = "#c0392b"; g.beginPath(); g.moveTo(40, 160); g.lineTo(85, 120); g.lineTo(130, 160); g.fill();
    g.fillStyle = "#f3e2c7"; g.fillRect(50, 160, 70, 55);
    g.fillStyle = "#6b3e1f"; g.fillRect(78, 180, 16, 35);
    g.fillStyle = "#3d7fd9"; g.fillRect(56, 170, 14, 14); g.fillRect(100, 170, 14, 14);
    g.fillStyle = "#6b3e1f"; g.fillRect(186, 170, 10, 45);
    g.fillStyle = "#1e7a3a"; g.beginPath(); g.arc(191, 160, 24, 0, 7); g.fill();
    g.fillStyle = "#e74c3c"; [[182, 152], [198, 165], [190, 145]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill(); });

    const small = document.createElement("canvas"), sg = small.getContext("2d", { willReadFrequently: true });
    const ctx = cv.getContext("2d");
    const q = (v, k) => { const L = 2 ** k - 1; return Math.round((v / 255) * L) * (255 / L); };
    function run() {
      const n = RES[+$("#resW").value], [d, dl] = DEP[+$("#resD").value];
      small.width = small.height = n;
      sg.imageSmoothingEnabled = true; sg.drawImage(src, 0, 0, n, n);
      const im = sg.getImageData(0, 0, n, n), a = im.data;
      for (let i = 0; i < a.length; i += 4) {
        if (d <= 2) { const y = 0.299 * a[i] + 0.587 * a[i + 1] + 0.114 * a[i + 2]; const v = q(y, d); a[i] = a[i + 1] = a[i + 2] = v; }
        else { const [r, gg, b] = CH[d]; a[i] = q(a[i], r); a[i + 1] = q(a[i + 1], gg); a[i + 2] = q(a[i + 2], b); }
      }
      sg.putImageData(im, 0, 0);
      ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, 256, 256); ctx.drawImage(small, 0, 0, 256, 256);
      $("#resWv").textContent = `${n} × ${n} = ${fmt(n * n)} pixels`; $("#resDv").textContent = dl;
      const r = C.image(n, n, d, "KiB");
      $("#resSteps").innerHTML = r.steps.map((s) => `<li>${s}</li>`).join("");
    }
    $("#resW").addEventListener("input", run); $("#resD").addEventListener("input", run); run();
  })();

  /* ================= SOUND SAMPLER ================= */
  (function () {
    const cv = $("#wvCv"); if (!cv) return;
    const SPW = [4, 6, 8, 12, 16, 24, 32, 48]; // samples per displayed window
    const WIN = 1 / 110; // window length in seconds (2 periods of 220 Hz)
    const wave = (x) => 0.62 * Math.sin(2 * Math.PI * 2 * x) + 0.3 * Math.sin(2 * Math.PI * 5 * x + 0.5); // x in [0,1)
    const ctx = cv.getContext("2d");
    const quant = (v, bits) => { const L = 2 ** bits; let k = Math.floor(((v + 1) / 2) * L); k = Math.max(0, Math.min(L - 1, k)); return -1 + ((k + 0.5) * 2) / L; };
    function draw() {
      const s = SPW[+$("#wvRate").value], bits = +$("#wvBits").value;
      const W = cv.width, H = cv.height, pad = 16, mid = H / 2, amp = H / 2 - pad;
      const ink = App.css("--ink"), muted = App.css("--muted"), line = App.css("--line"), led = App.css("--led");
      ctx.clearRect(0, 0, W, H);
      const L = 2 ** bits;
      ctx.strokeStyle = line; ctx.lineWidth = 1;
      if (L <= 64) for (let k = 0; k <= L; k++) { const y = mid - (-1 + (2 * k) / L) * amp; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.strokeStyle = muted; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let x = 0; x <= W; x++) { const y = mid - wave(x / W) * amp; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      ctx.strokeStyle = led; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i < s; i++) {
        const x0 = (i / s) * W, x1 = ((i + 1) / s) * W, v = quant(wave(i / s), bits), y = mid - v * amp;
        i ? ctx.lineTo(x0, y) : ctx.moveTo(x0, y); ctx.lineTo(x1, y);
      }
      ctx.stroke();
      ctx.fillStyle = led; ctx.strokeStyle = ink; ctx.lineWidth = 1.5;
      for (let i = 0; i < s; i++) { const x = (i / s) * W, y = mid - quant(wave(i / s), bits) * amp; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); ctx.stroke(); }
      const rate = Math.round(s / WIN);
      $("#wvRateV").textContent = `${s} samples in this window ≈ ${fmt(rate)} Hz`;
      $("#wvBitsV").textContent = `${bits} bit${bits > 1 ? "s" : ""} = ${L} levels`;
      const kib = (rate * bits * 60) / 8 / 1024;
      $("#wvSize").textContent = `1 minute mono at this setting: ${fmt(rate)} × ${bits} × 60 bits ≈ ${fmt(kib, 1)} KiB`;
    }
    ["wvRate", "wvBits"].forEach((id) => $("#" + id).addEventListener("input", draw));
    window.addEventListener("themechange", draw);
    App.onShow("sound", draw);
    draw();
    let ac;
    function play(digital) {
      try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      const sr = ac.sampleRate, dur = 1.3, n = Math.floor(sr * dur);
      const buf = ac.createBuffer(1, n, sr), d = buf.getChannelData(0);
      const s = SPW[+$("#wvRate").value], bits = +$("#wvBits").value, rate = s / WIN;
      for (let i = 0; i < n; i++) {
        let t = i / sr;
        if (digital) t = Math.floor(t * rate) / rate;
        let v = wave((t * 110) % 1);
        if (digital) v = quant(v, bits);
        const env = Math.min(1, i / (0.03 * sr), (n - i) / (0.08 * sr));
        d[i] = v * 0.22 * env;
      }
      const src = ac.createBufferSource(); src.buffer = buf; src.connect(ac.destination); src.start();
    }
    $("#wvPlayO").onclick = () => play(false);
    $("#wvPlayD").onclick = () => play(true);
  })();

  /* ================= CALCULATORS ================= */
  function unitSelect(id, def) { return `<select id="${id}">${UNITS.map((u) => `<option ${u === def ? "selected" : ""}>${u}</option>`).join("")}</select>`; }
  (function () {
    const box = $("#calc-img"); if (!box) return;
    box.innerHTML = `<div class="tool-head"><span class="tool-kind">Calculator</span><h3>Image file size</h3></div>
      <p class="small muted">Check your homework answers. The steps show what to write in an exam.</p>
      <div class="row"><div class="field"><label for="ciW">Width (px)</label><input id="ciW" type="number" min="1" value="1920"></div>
      <div class="field"><label for="ciH">Height (px)</label><input id="ciH" type="number" min="1" value="1080"></div>
      <div class="field"><label for="ciD">Colour depth (bits)</label><input id="ciD" type="number" min="1" max="48" value="24"></div>
      <div class="field"><label for="ciU">Answer in</label>${unitSelect("ciU", "MiB")}</div></div><div id="ciOut"></div>`;
    function run() {
      const w = +$("#ciW").value, hh = +$("#ciH").value, d = +$("#ciD").value, u = $("#ciU").value;
      if (!(w > 0 && hh > 0 && d > 0)) { $("#ciOut").innerHTML = '<p class="fb bad">Enter positive numbers.</p>'; return; }
      const r = C.image(w, hh, d, u);
      $("#ciOut").innerHTML = App.steps(r.steps) + `<p class="big-out">${fmt(r.value, 2)} ${u}</p>`;
    }
    box.addEventListener("input", run); run();
  })();
  (function () {
    const box = $("#calc-snd"); if (!box) return;
    box.innerHTML = `<div class="tool-head"><span class="tool-kind">Calculator</span><h3>Sound file size</h3></div>
      <div class="row"><div class="field"><label for="csR">Sample rate (Hz)</label><input id="csR" type="number" min="1" value="44100"></div>
      <div class="field"><label for="csB">Resolution (bits)</label><input id="csB" type="number" min="1" value="16"></div>
      <div class="field"><label for="csT">Length</label><input id="csT" type="number" min="0" step="any" value="3"></div>
      <div class="field"><label for="csTU">Unit</label><select id="csTU"><option value="1">seconds</option><option value="60" selected>minutes</option></select></div>
      <div class="field"><label for="csC">Channels</label><select id="csC"><option value="1">mono (1)</option><option value="2" selected>stereo (2)</option></select></div>
      <div class="field"><label for="csU">Answer in</label>${unitSelect("csU", "MiB")}</div></div><div id="csOut"></div>`;
    function run() {
      const r0 = +$("#csR").value, b = +$("#csB").value, t = +$("#csT").value * +$("#csTU").value, c = +$("#csC").value, u = $("#csU").value;
      if (!(r0 > 0 && b > 0 && t > 0)) { $("#csOut").innerHTML = '<p class="fb bad">Enter positive numbers.</p>'; return; }
      const r = C.sound(r0, b, t, c, u);
      const pre = +$("#csTU").value === 60 ? [`Change minutes to seconds: ${$("#csT").value} × 60 = <b>${fmt(t)}</b> s`] : [];
      $("#csOut").innerHTML = App.steps(pre.concat(r.steps)) + `<p class="big-out">${fmt(r.value, 2)} ${u}</p>`;
    }
    box.addEventListener("input", run); run();
  })();

  /* ================= DRILLS ================= */
  App.genImageQ = function () {
    const sizes = [[640, 480], [800, 600], [1024, 768], [1280, 720], [1920, 1080], [512, 512], [256, 256], [2048, 1024], [320, 240], [1024, 512]];
    const [w, hh] = pick(sizes), d = pick([1, 4, 8, 16, 24]);
    const unit = w * hh * d / 8 / 1024 >= 1024 ? "MiB" : "KiB";
    const r = C.image(w, hh, d, unit);
    return { text: `An image is ${w} × ${hh} pixels with a colour depth of ${d} bit${d > 1 ? "s" : ""}. Calculate the file size in ${unit}.`, value: r.value, unit, steps: r.steps };
  };
  App.drill($("#drill-img"), {
    title: "Image practice", kind: "Drill", intro: "Give answers to 2 decimal places where needed.",
    gen() {
      if (Math.random() < 0.3) {
        const d = rand(1, 8); const ask = Math.random() < 0.5;
        return ask ? { q: `A colour depth of <span class="n">${d} bits</span>. How many different colours can each pixel have?`, answer: String(2 ** d), check: (v) => App.num(v) === 2 ** d, steps: App.steps([`colours = 2<sup>${d}</sup> = ${2 ** d}`]) }
          : { q: `Each pixel can be one of <span class="n">${2 ** d}</span> colours. What is the colour depth?`, answer: `${d} bits`, check: (v) => App.num(v) === d, steps: App.steps([`Find n so that 2<sup>n</sup> = ${2 ** d}: n = ${d}`]) };
      }
      const g = App.genImageQ();
      return { q: g.text, answer: `${fmt(g.value, 2)} ${g.unit}`, check: (v) => App.num(v) !== null && close(App.num(v), g.value), steps: App.steps(g.steps), placeholder: g.unit };
    },
  });
  App.genSoundQ = function () {
    const rate = pick([8000, 11025, 16000, 22050, 32000, 44100, 48000]), bits = pick([8, 16]), ch = pick([1, 2]);
    const mins = Math.random() < 0.5; const t = mins ? pick([1, 2, 3, 4, 5]) : pick([10, 15, 20, 30, 45]);
    const secs = mins ? t * 60 : t; const unit = rate * bits * secs * ch / 8 / 1024 >= 2048 ? "MiB" : "KiB";
    const r = C.sound(rate, bits, secs, ch, unit);
    const steps = (mins ? [`${t} minute${t > 1 ? "s" : ""} = ${secs} seconds`] : []).concat(r.steps);
    return { text: `A ${ch === 2 ? "stereo" : "mono"} sound is recorded with a sample rate of ${fmt(rate)} Hz and a sample resolution of ${bits} bits. It lasts ${t} ${mins ? "minute" + (t > 1 ? "s" : "") : "seconds"}. Calculate the file size in ${unit}.`, value: r.value, unit, steps };
  };
  App.drill($("#drill-snd"), {
    title: "Sound practice", kind: "Drill", intro: "Give answers to 2 decimal places.",
    gen() { const g = App.genSoundQ(); return { q: g.text, answer: `${fmt(g.value, 2)} ${g.unit}`, check: (v) => App.num(v) !== null && close(App.num(v), g.value), steps: App.steps(g.steps), placeholder: g.unit }; },
  });
})();
