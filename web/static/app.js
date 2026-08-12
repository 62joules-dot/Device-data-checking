const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const form = $("#run-form");
const statusEl = $("#status");
const runBtn = $("#run-btn");
const sampleSel = $("#sample");
const fileInput = $("#file");
const fileLabel = $("#file-label");
const drop = $("#drop");
const workspace = $("#workspace");

function money(n) {
  if (n == null || n === "" || n === "MISSING") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(num);
}

function setStatus(msg, kind = "") {
  statusEl.textContent = msg;
  statusEl.className = "status" + (kind ? ` ${kind}` : "");
}

async function loadSamples() {
  const res = await fetch("/api/samples");
  const data = await res.json();
  for (const name of data.samples || []) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    if (name === "sample_devices.xlsx") opt.selected = true;
    sampleSel.appendChild(opt);
  }
}

function renderMetrics(data) {
  const r = data.report || {};
  const publishable = r.publishable ?? data.devices.filter((d) => d.publishable).length;
  const total = r.total_devices ?? data.devices.length;
  const incomplete = (r.incomplete || []).length;
  const exports = (data.exports || []).length;
  $("#metrics").innerHTML = `
    <div class="metric"><b>${total}</b><span>Devices</span></div>
    <div class="metric"><b>${publishable}</b><span>Publishable</span></div>
    <div class="metric"><b>${incomplete}</b><span>Incomplete</span></div>
    <div class="metric"><b>${exports}</b><span>Export files</span></div>
  `;
}

function renderDevices(devices) {
  const panel = $("#panel-devices");
  if (!devices.length) {
    panel.innerHTML = `<p class="empty">No devices yet. Run the pipeline above.</p>`;
    return;
  }
  panel.innerHTML = devices
    .map((d) => {
      const badge = d.publishable
        ? `<span class="badge ok">Ready</span>`
        : `<span class="badge warn">Missing data</span>`;
      const titles = Object.entries(d.titles || {})
        .map(([k, v]) => `<li><strong>${k}</strong><span>${escapeHtml(v)}</span></li>`)
        .join("");
      const miss =
        d.missing && d.missing.length
          ? ` · missing: ${d.missing.join(", ")}`
          : "";
      return `
      <article class="device">
        <div class="device-head">
          <h3>${escapeHtml(d.brand || "")} ${escapeHtml(d.model || "")}</h3>
          ${badge}
        </div>
        <p class="meta">${escapeHtml(d.id || "")} · ${escapeHtml(d.condition || "—")} · ${escapeHtml(d.country || "—")} · ${money(d.price_recommended)}${escapeHtml(miss)}</p>
        <ul class="titles">${titles}</ul>
      </article>`;
    })
    .join("");
}

function renderResearch(research) {
  const panel = $("#panel-research");
  const entries = Object.entries(research || {});
  if (!entries.length) {
    panel.innerHTML = `<p class="empty">No research yet. Use Full pipeline mode.</p>`;
    return;
  }
  panel.innerHTML = `<div class="research-grid">${entries
    .map(([model, s]) => {
      const ask = s.asking_price || {};
      return `
      <article class="research-item">
        <h3>${escapeHtml(model)}</h3>
        <div class="stat-row">
          <div><em>Median ask</em><strong>${money(ask.median)}</strong></div>
          <div><em>Range</em><strong>${money(ask.min)} – ${money(ask.max)}</strong></div>
          <div><em>Competition</em><strong>${escapeHtml(s.competition_level || "—")}</strong></div>
          <div><em>Best market</em><strong>${escapeHtml(s.best_country_by_volume || "—")}</strong></div>
          <div><em>Listings</em><strong>${s.n_listings ?? "—"}</strong></div>
        </div>
      </article>`;
    })
    .join("")}</div>`;
}

function renderFiles(data) {
  const panel = $("#panel-files");
  const items = [
    ...(data.exports || []).map((f) => ({ ...f, group: "Export" })),
    ...(data.automation || []).map((f) => ({
      ...f,
      group: "Automation JSON",
      size: null,
    })),
  ];
  const extras = [
    { name: "master_database.json", path: "master_database.json", group: "Core" },
    { name: "report.json", path: "report.json", group: "Core" },
    { name: "priority_queue.json", path: "priority_queue.json", group: "Core" },
    { name: "market_research.json", path: "market_research.json", group: "Core" },
  ];
  for (const e of extras) items.unshift(e);

  if (!items.length) {
    panel.innerHTML = `<p class="empty">No output files yet.</p>`;
    return;
  }
  panel.innerHTML = `<ul class="file-list">${items
    .map(
      (f) => `
    <li>
      <span><strong>${escapeHtml(f.group || "")}</strong> · ${escapeHtml(f.name)}</span>
      <a href="/api/download/${encodeURI(f.path)}" download>Download</a>
    </li>`
    )
    .join("")}</ul>`;
}

function renderMissing(data) {
  const panel = $("#panel-missing");
  const incomplete = (data.report && data.report.incomplete) || [];
  const parts = [];
  if (incomplete.length) {
    parts.push(
      incomplete
        .map((i) => `${i.id}: ${(i.missing || []).join(", ")}`)
        .join("\n")
    );
  }
  if (data.intake_missing_report) {
    parts.push(data.intake_missing_report);
  }
  if (!parts.length) {
    panel.innerHTML = `<p class="empty">Nothing flagged missing in the latest run.</p>`;
    return;
  }
  panel.innerHTML = `<pre class="missing-box">${escapeHtml(parts.join("\n\n——\n\n"))}</pre>`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadDashboard() {
  const res = await fetch("/api/dashboard");
  const data = await res.json();
  if (!data.has_output && !(data.devices || []).length) {
    workspace.hidden = true;
    return;
  }
  workspace.hidden = false;
  renderMetrics(data);
  renderDevices(data.devices || []);
  renderResearch(data.research || {});
  renderFiles(data);
  renderMissing(data);
}

$$(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    $$(".tab").forEach((t) => t.classList.remove("active"));
    $$(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    $(`#panel-${btn.dataset.tab}`).classList.add("active");
  });
});

fileInput.addEventListener("change", () => {
  const name = fileInput.files[0]?.name;
  fileLabel.textContent = name || ".xlsx · max 32 MB";
  if (name) sampleSel.value = "";
});

sampleSel.addEventListener("change", () => {
  if (sampleSel.value) {
    fileInput.value = "";
    fileLabel.textContent = ".xlsx · max 32 MB";
  }
});

["dragenter", "dragover"].forEach((ev) => {
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add("drag");
  });
});
["dragleave", "drop"].forEach((ev) => {
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.remove("drag");
  });
});
drop.addEventListener("drop", (e) => {
  const files = e.dataTransfer?.files;
  if (files?.length) {
    fileInput.files = files;
    fileLabel.textContent = files[0].name;
    sampleSel.value = "";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  if (!fd.get("sample") && !fileInput.files.length) {
    setStatus("Pick a sample file or upload an Excel.", "err");
    return;
  }
  if (fd.get("sample") && fileInput.files.length) {
    fd.delete("file");
  }
  runBtn.disabled = true;
  setStatus("Running pipeline… this can take a few seconds.", "busy");
  try {
    const res = await fetch("/api/run", { method: "POST", body: fd });
    const data = await res.json();
    if (!data.ok) {
      setStatus(data.error || "Run failed.", "err");
      return;
    }
    const r = data.result || {};
    setStatus(
      `Done · ${r.total_devices ?? r.types ?? "OK"} processed` +
        (r.publishable != null ? ` · ${r.publishable} publishable` : ""),
      "ok"
    );
    await loadDashboard();
  } catch (err) {
    setStatus(String(err), "err");
  } finally {
    runBtn.disabled = false;
  }
});

$("#refresh-btn").addEventListener("click", async () => {
  setStatus("Refreshing…", "busy");
  await loadDashboard();
  setStatus("Results updated.", "ok");
});

loadSamples().then(loadDashboard).catch(console.error);
