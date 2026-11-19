// tracker.js — progress storage for the Leonida Legend trophy tracker.
// Earned trophies live in the browser's localStorage under one key, as a JSON
// array of trophy names. Export downloads that array as a small JSON file;
// import reads such a file back (either the bare array this app exports, or an
// object with an "earned" array) and keeps only names the data file knows.

export const STORAGE_KEY = 'leonida-legend-earned-v1';
export const SPOILER_KEY = 'leonida-legend-spoiler-v1';

export function loadEarned() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
}

export function loadSpoilerMode() {
  return localStorage.getItem(SPOILER_KEY) === 'on';
}

export function saveSpoilerMode(on) {
  localStorage.setItem(SPOILER_KEY, on ? 'on' : 'off');
}

export function exportProgress(earned) {
  const payload = JSON.stringify({ game: 'Grand Theft Auto VI', platform: 'PlayStation 5', earned: [...earned] }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importProgress(file, knownNames) {
  const parsed = JSON.parse(await file.text());
  const names = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(names)) throw new Error('not a progress file');
  return new Set(names.filter((n) => knownNames.has(n)));
}
