// app.js — Leonida Legend: an offline guide & tracker for the 55 PS5 trophies
// of Grand Theft Auto VI. Renders the checklist from data/trophies.json (the
// official names, descriptions and grades, each with a guide in our own words
// and its sources), the 9-stage platinum roadmap, kind/grade/search filters,
// a spoiler mode that hides story trophies until earned, and the missable and
// save-watch flags. Progress persists via tracker.js (localStorage).

import {
  loadEarned, saveEarned, loadSpoilerMode, saveSpoilerMode, exportProgress, importProgress,
} from './tracker.js';

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byName = new Map(trophies.map((t) => [t.name, t]));
const sourceUrl = new Map((doc.sources ?? []).map((s) => [s.name, s.url]));

const KIND_LABELS = {
  all: 'All kinds', story: 'Story', missable: 'Missable', collectibles: 'Collectibles',
  activities: 'Activities', crime: 'Crime & robberies', partner: 'Partner / duo',
  exploration: 'Exploration', completion: 'Completion', online: 'Online',
};
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

let earned = loadEarned();
let spoilerMode = loadSpoilerMode();
let selectedName = trophies[0]?.name ?? null;
const state = { kind: 'all', grade: 'all', query: '', hideEarned: false };

const listEl = document.getElementById('trophy-list');
const detailEl = document.getElementById('detail-pane');
const emptyEl = document.getElementById('empty-note');
const chipsEl = document.getElementById('kind-chips');

function isSpoilerHidden(t) {
  return spoilerMode && t.kind === 'story' && !earned.has(t.name);
}

function displayName(t) {
  return isSpoilerHidden(t) ? 'Hidden story trophy' : t.name;
}

function displayDescription(t) {
  return isSpoilerHidden(t) ? 'Hidden until earned — spoiler protection is on.' : t.description;
}

function matchesKind(t) {
  if (state.kind === 'all') return true;
  if (state.kind === 'missable') return Boolean(t.missable) || t.risk === 'watch';
  return t.kind === state.kind;
}

function matchesQuery(t) {
  if (!state.query) return true;
  if (isSpoilerHidden(t)) return false;
  const hay = `${t.name} ${t.description} ${t.guide} ${t.when}`.toLowerCase();
  return hay.includes(state.query);
}

function visibleTrophies() {
  return trophies.filter((t) =>
    matchesKind(t) &&
    (state.grade === 'all' || t.grade === state.grade) &&
    (!state.hideEarned || !earned.has(t.name)) &&
    matchesQuery(t));
}

function flagBadges(t) {
  const badges = [];
  if (t.missable) badges.push('<span class="badge missable">MISSABLE</span>');
  else if (t.risk === 'watch') badges.push('<span class="badge watch">SAVE WATCH</span>');
  if (t.hidden) badges.push('<span class="badge hidden-badge">HIDDEN ON PSN</span>');
  if (t.count) badges.push(`<span class="badge count">TARGET ${t.count.toLocaleString('en-US')}</span>`);
  return badges.join(' ');
}

function renderProgress() {
  const total = trophies.length;
  const done = earned.size;
  const pct = Math.round((done / total) * 100);
  document.getElementById('progress-text').textContent = `${done} of ${total} earned`;
  document.getElementById('ring-pct').textContent = `${pct}%`;
  document.getElementById('ring').style.setProperty('--pct', String(pct));
  const per = (g) => trophies.filter((t) => t.grade === g && earned.has(t.name)).length;
  document.getElementById('grade-text').textContent =
    `${per('platinum')} platinum · ${per('gold')} gold · ${per('silver')} silver · ${per('bronze')} bronze`;
  const nextMissable = trophies.find((t) => t.missable && !earned.has(t.name));
  const nextStory = trophies.find((t) => t.kind === 'story' && !earned.has(t.name));
  document.getElementById('next-up').textContent = nextMissable
    ? `Next up: protect ${nextMissable.name} (missable), then ${nextStory ? nextStory.name : 'cleanup'}.`
    : `Next up: ${nextStory ? nextStory.name : 'the platinum is yours — Vice Got a Price!'}`;
}

function renderList() {
  const visible = visibleTrophies();
  listEl.replaceChildren();
  for (const t of visible) {
    const card = document.createElement('article');
    card.className = `card grade-${t.grade}${earned.has(t.name) ? ' earned' : ''}${t.name === selectedName ? ' selected' : ''}`;
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('change', () => toggleEarned(t.name, box.checked));
    const main = document.createElement('button');
    main.type = 'button';
    main.className = 'card-main';
    main.innerHTML =
      `<span class="card-top"><span class="grade-pill">${t.grade.toUpperCase()}</span>` +
      `<span class="kind-pill">${KIND_LABELS[t.kind] ?? t.kind}</span>${flagBadges(t)}</span>` +
      `<span class="card-name">${displayName(t)}</span>` +
      `<span class="card-desc">${displayDescription(t)}</span>` +
      `<span class="card-when">${isSpoilerHidden(t) ? '' : t.when}</span>`;
    main.addEventListener('click', () => { selectedName = t.name; renderList(); renderDetail(); });
    card.append(box, main);
    listEl.append(card);
  }
  emptyEl.hidden = visible.length > 0;
  if (!visible.length) {
    emptyEl.textContent = state.kind === 'online'
      ? 'No online trophies: all 55 trophies are single-player, and there is no GTA Online trophy at launch. (Sources: Output Lag; GTAVibes.)'
      : 'No trophies match these filters. Clear the search or pick another kind.';
  }
  document.getElementById('list-heading').textContent =
    state.kind === 'all' ? `All 55 trophies — showing ${visible.length}` : `${KIND_LABELS[state.kind]} — showing ${visible.length}`;
  renderProgress();
}

function sourceLinks(t) {
  return (t.sources ?? []).map((name) => {
    const url = sourceUrl.get(name);
    return url
      ? `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a></li>`
      : `<li>${name}</li>`;
  }).join('');
}

function renderDetail() {
  const t = byName.get(selectedName) ?? trophies[0];
  if (!t) { detailEl.replaceChildren(); return; }
  const hiddenNow = isSpoilerHidden(t);
  const stage = (doc.roadmap ?? []).find((s) => s.stage === t.stage);
  detailEl.innerHTML =
    `<p class="detail-kicker">TROPHY #${t.id} OF 55 · STAGE ${t.stage}${stage ? ` — ${stage.title}` : ''}</p>` +
    `<h2>${displayName(t)}</h2>` +
    `<p class="detail-desc">“${displayDescription(t)}”</p>` +
    `<p class="detail-meta"><span class="grade-pill">${t.grade.toUpperCase()}</span> ` +
    `<span class="kind-pill">${KIND_LABELS[t.kind] ?? t.kind}</span> ${flagBadges(t)}</p>` +
    (hiddenNow
      ? '<p>Spoiler protection is on: this story trophy stays hidden until you tick it as earned, or switch spoiler protection off.</p>'
      : `<h3>Guide — in our own words</h3><p>${t.guide}</p>` +
        `<h3>When it can be missed</h3><p>${t.when}</p>` +
        `<h3>Sources for this trophy</h3><ul class="detail-sources">${sourceLinks(t)}</ul>`) +
    `<label class="detail-check"><input type="checkbox" id="detail-earned" ${earned.has(t.name) ? 'checked' : ''}> Earned</label>`;
  detailEl.querySelector('#detail-earned').addEventListener('change', (e) => toggleEarned(t.name, e.target.checked));
}

function toggleEarned(name, on) {
  if (on) earned.add(name); else earned.delete(name);
  saveEarned(earned);
  renderList();
  renderDetail();
  renderRoadmap();
}

function renderRoadmap() {
  const wrap = document.getElementById('roadmap-stages');
  wrap.replaceChildren();
  for (const s of doc.roadmap ?? []) {
    const names = (s.trophies ?? []).map((id) => trophies.find((t) => t.id === id)).filter(Boolean);
    const doneCount = names.filter((t) => earned.has(t.name)).length;
    const el = document.createElement('article');
    el.className = 'stage';
    el.innerHTML =
      `<h3><span class="stage-num">Stage ${s.stage}</span> ${s.title} <span class="stage-progress">${doneCount}/${names.length} done</span></h3>` +
      `<p>${s.body}</p>` +
      `<p class="stage-trophies">${names.map((t) => `<button type="button" class="stage-chip${earned.has(t.name) ? ' done' : ''}" data-name="${t.name}">${displayName(t)}</button>`).join(' ')}</p>`;
    el.querySelectorAll('.stage-chip').forEach((chip) => chip.addEventListener('click', () => {
      selectedName = chip.dataset.name;
      renderList();
      renderDetail();
      detailEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    wrap.append(el);
  }
}

function renderSources() {
  document.getElementById('source-list').innerHTML = (doc.sources ?? []).map((s) =>
    s.url
      ? `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name}</a></li>`
      : `<li>${s.name}</li>`).join('');
}

function buildChips() {
  chipsEl.replaceChildren();
  for (const kind of Object.keys(KIND_LABELS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `chip${state.kind === kind ? ' active' : ''}`;
    b.textContent = KIND_LABELS[kind];
    b.addEventListener('click', () => {
      state.kind = kind;
      buildChips();
      renderList();
    });
    chipsEl.append(b);
  }
}

document.getElementById('search').addEventListener('input', (e) => {
  state.query = e.target.value.trim().toLowerCase();
  renderList();
});
document.getElementById('grade-filter').addEventListener('change', (e) => {
  state.grade = e.target.value;
  renderList();
});
document.getElementById('hide-earned').addEventListener('change', (e) => {
  state.hideEarned = e.target.checked;
  renderList();
});
const spoilerToggle = document.getElementById('spoiler-toggle');
spoilerToggle.checked = spoilerMode;
spoilerToggle.addEventListener('change', (e) => {
  spoilerMode = e.target.checked;
  saveSpoilerMode(spoilerMode);
  renderList();
  renderDetail();
  renderRoadmap();
});
document.getElementById('export-btn').addEventListener('click', () => exportProgress(earned));
document.getElementById('import-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    earned = await importProgress(file, new Set(byName.keys()));
    saveEarned(earned);
    renderList();
    renderDetail();
    renderRoadmap();
  } catch {
    emptyEl.hidden = false;
    emptyEl.textContent = 'That file could not be read as trophy progress. Export from this app first, then import that file.';
  }
  e.target.value = '';
});
document.getElementById('reset-btn').addEventListener('click', () => {
  earned = new Set();
  saveEarned(earned);
  renderList();
  renderDetail();
  renderRoadmap();
});

buildChips();
renderList();
renderDetail();
renderRoadmap();
renderSources();
