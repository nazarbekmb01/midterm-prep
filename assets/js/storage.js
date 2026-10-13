/* Data storage: unit converter, "how many fit", RLE */
(function () {
  const { h, $, rand, pick, fmt } = App;
  const U = ["bits", "nibbles", "bytes", "KiB", "MiB", "GiB", "TiB"];
  const toBits = { bits: 1, nibbles: 4, bytes: 8, KiB: 8 * 1024, MiB: 8 * 1024 ** 2, GiB: 8 * 1024 ** 3, TiB: 8 * 1024 ** 4 };
  const ORDER = ["bytes", "KiB", "MiB", "GiB", "TiB"];
  App.unitSteps = function (v, from, to) {
    const steps = []; let x = v;
    if (from === to) return { steps: ["Same unit."], value: v };
    // move along: bits/nibbles <-> bytes first
    const idx = (u) => ORDER.indexOf(u);
    if (from === "bits" || from === "nibbles") {
      const f = from === "bits" ? 8 : 2; const nx = x / f; steps.push(`${fmt(x)} ${from} ÷ ${f} = <b>${fmt(nx, 4)}</b> bytes`); x = nx; from = "bytes";
      if (to === "bits" || to === "nibbles") { const g = to === "bits" ? 8 : 2; const y = x * g; steps.push(`${fmt(x, 4)} bytes × ${g} = <b>${fmt(y, 4)}</b> ${to}`); return { steps, value: y }; }
    }
    const tgt = to === "bits" || to === "nibbles" ? "bytes" : to;
    let i = idx(from); const j = idx(tgt);
    while (i < j) { const nx = x / 1024; steps.push(`${fmt(x, 4)} ${ORDER[i]} ÷ 1024 = <b>${fmt(nx, 4)}</b> ${ORDER[i + 1]}`); x = nx; i++; }
    while (i > j) { const nx = x * 1024; steps.push(`${fmt(x, 4)} ${ORDER[i]} × 1024 = <b>${fmt(nx, 4)}</b> ${ORDER[i - 1]}`); x = nx; i--; }
    if (to === "bits" || to === "nibbles") { const g = to === "bits" ? 8 : 2; const y = x * g; steps.push(`${fmt(x, 4)} bytes × ${g} = <b>${fmt(y, 4)}</b> ${to}`); x = y; }
    return { steps, value: x };
  };

  (function () {
    const box = $("#tool-units"); if (!box) return;
    const sel = (id, d) => `<select id="${id}">${U.map((u) => `<option ${u === d ? "selected" : ""}>${u}</option>`).join("")}</select>`;
    box.innerHTML = `<div class="tool-head"><span class="tool-kind">Try it</span><h3>Unit converter</h3></div>
      <div class="row"><div class="field"><label for="uV">Value</label><input id="uV" type="number" step="any" value="3"></div>
      <div class="field"><label for="uF">From</label>${sel("uF", "GiB")}</div><div class="field"><label for="uT">To</label>${sel("uT", "KiB")}</div></div>
      <div id="uOut"></div><hr style="border:0;border-top:1px dashed var(--line);margin:16px 0"><div id="uDrill"></div>`;
    function run() {
      const v = +$("#uV").value; const r = App.unitSteps(v, $("#uF").value, $("#uT").value);
      $("#uOut").innerHTML = App.steps(r.steps) + `<p class="big-out">${fmt(v)} ${$("#uF").value} = ${fmt(r.value, 4)} ${$("#uT").value}</p>`;
    }
    box.addEventListener("input", (e) => { if (e.target.closest("#uDrill")) return; run(); }); run();
    App.drill($("#uDrill"), {
      title: "Unit drill", kind: "Drill",
      gen() {
        const pairs = [["GiB", "MiB"], ["MiB", "KiB"], ["KiB", "bytes"], ["bytes", "bits"], ["MiB", "GiB"], ["KiB", "MiB"], ["bytes", "KiB"], ["bits", "bytes"], ["GiB", "KiB"], ["TiB", "GiB"]];
        const [f, t] = pick(pairs);
        const up = ORDER.indexOf(t) > ORDER.indexOf(f) || (f === "bits");
        let v = up ? pick([1, 2, 3, 4, 5, 6, 8, 10, 16]) * (f === "bits" ? 8 : 1024) * (f === "bits" ? 1 : 1) : pick([1, 2, 3, 4, 5, 8, 10, 12, 64]);
        if (f === "bits") v = pick([16, 24, 64, 128, 1024]);
        const r = App.unitSteps(v, f, t);
        return { q: `<span class="n">${fmt(v)} ${f}</span> = ? ${t}`, answer: `${fmt(r.value, 4)} ${t}`, check: (x) => App.num(x) !== null && App.closeEnough(App.num(x), r.value), steps: App.steps(r.steps) };
      },
    });
  })();

  (function () {
    const box = $("#tool-fit"); if (!box) return;
    const sel = (id, d) => `<select id="${id}">${["bytes", "KiB", "MiB", "GiB", "TiB"].map((u) => `<option ${u === d ? "selected" : ""}>${u}</option>`).join("")}</select>`;
    box.innerHTML = `<div class="tool-head"><span class="tool-kind">Calculator</span><h3>How many files fit?</h3></div>
      <p class="small muted">Like SA question B3(b): how many photos fit on a flash drive. Always round <b>down</b> — half a photo cannot be saved.</p>
      <div class="row"><div class="field"><label for="fC">Storage size</label><input id="fC" type="number" step="any" value="4"></div><div class="field"><label for="fCu">Unit</label>${sel("fCu", "GiB")}</div>
      <div class="field"><label for="fF">One file</label><input id="fF" type="number" step="any" value="6220800"></div><div class="field"><label for="fFu">Unit</label>${sel("fFu", "bytes")}</div></div><div id="fOut"></div>`;
    function run() {
      const c = +$("#fC").value, cu = $("#fCu").value, f = +$("#fF").value, fu = $("#fFu").value;
      if (!(c > 0 && f > 0)) { $("#fOut").innerHTML = '<p class="fb bad">Enter positive numbers.</p>'; return; }
      const r = App.unitSteps(c, cu, fu); const n = r.value / f;
      $("#fOut").innerHTML = App.steps([`Put both sizes in the same unit (${fu}):`].concat(r.steps).concat([`${fmt(r.value, 4)} ÷ ${fmt(f, 4)} = ${fmt(n, 3)}`, `Round down: <b>${fmt(Math.floor(n + 1e-9))}</b> whole files`])) + `<p class="big-out">${fmt(Math.floor(n + 1e-9))} files</p>`;
    }
    box.addEventListener("input", run); run();
  })();

  /* RLE */
  App.rle = function (s) { const out = []; let i = 0; while (i < s.length) { let j = i; while (j < s.length && s[j] === s[i]) j++; out.push([j - i, s[i]]); i = j; } return out; };
  (function () {
    const box = $("#tool-rle"); if (!box) return;
    box.innerHTML = `<div class="tool-head"><span class="tool-kind">Try it</span><h3>RLE encoder</h3></div>
      <p class="small muted">Type letters or a row of pixel colours (e.g. W for white, B for black). RLE works well when there are long runs.</p>
      <input id="rIn" class="mono" type="text" value="WWWWWWBBBWWWWWWWWBBW" style="width:100%" aria-label="Text to encode" autocomplete="off">
      <div class="chars" id="rRow" style="margin-top:10px"></div><p class="big-out" id="rOut"></p><p class="small" id="rSum"></p>
      <div class="row small">Try: <button class="small" data-x="AAAABBBCCD">AAAABBBCCD</button><button class="small" data-x="ABCDEFGH">ABCDEFGH</button><button class="small" data-x="0000000011111111">0000000011111111</button></div>`;
    function run() {
      const s = $("#rIn").value.replace(/\s/g, "").slice(0, 60); const r = App.rle(s);
      $("#rRow").innerHTML = r.map(([n, c]) => `<div class="char"><div class="c">${c.repeat(Math.min(n, 8))}${n > 8 ? "…" : ""}</div><div class="bn">${n}${c}</div></div>`).join("");
      $("#rOut").textContent = r.map(([n, c]) => n + c).join(" ");
      const before = s.length, after = r.length * 2;
      $("#rSum").innerHTML = s ? `Original: ${before} values. Encoded: ${r.length} pairs = ${after} values. ${after < before ? `Saved <b>${Math.round((1 - after / before) * 100)}%</b>.` : "<b>No saving</b> — RLE makes this data bigger because there are no long runs."}` : "";
    }
    $("#rIn").addEventListener("input", run);
    box.querySelectorAll("button[data-x]").forEach((b) => (b.onclick = () => { $("#rIn").value = b.dataset.x; run(); }));
    run();
  })();
})();
