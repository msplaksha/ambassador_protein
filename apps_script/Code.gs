/**
 * Results collector for "The AI Era of Biology" (static page on GitHub Pages).
 *
 * Setup (details in README.md):
 *  1. Create a new Google Sheet. Extensions > Apps Script. Paste this whole file.
 *  2. Change TEACHER_KEY below to a secret only you know. Do NOT commit the real key to GitHub.
 *  3. Deploy > New deployment > type "Web app".
 *       Execute as: Me.   Who has access: Anyone.
 *  4. Copy the Web app URL into config.js ("endpoint").
 *
 * What it stores:
 *  - Sheet "Progress": one readable row per student (name, section, activities done,
 *    right/wrong per question, some activity scores). Open it in Google Sheets any time.
 *  - Sheet "_docs": the full progress record per student (used by the teacher view).
 */
const TEACHER_KEY = 'CHANGE-ME-before-deploying';
const PROGRESS = 'Progress';
const DOCS = '_docs';
const BASE = ['id', 'name', 'section', 'joined_at', 'last_active'];
const MAX_BODY = 60000;

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function cell_(v) {            // stops spreadsheet formula injection from student-typed text
  if (typeof v === 'string') { v = v.slice(0, 200); if (/^[=+\-@\t\r]/.test(v)) return "'" + v; }
  return v;
}
function sheet_(name, headers) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(headers); sh.setFrozenRows(1); }
  return sh;
}
function findRow_(sh, id) {
  const n = sh.getLastRow(); if (n < 2) return -1;
  const ids = sh.getRange(2, 1, n - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 2;
  return -1;
}
function headers_(sh, keys) {
  const width = Math.max(sh.getLastColumn(), BASE.length);
  const h = sh.getRange(1, 1, 1, width).getValues()[0].filter(String);
  let changed = false;
  keys.forEach(function (k) { if (h.indexOf(k) < 0) { h.push(k); changed = true; } });
  if (changed) sh.getRange(1, 1, 1, h.length).setValues([h]);
  return h;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const raw = (e && e.postData && e.postData.contents) || '';
    if (!raw || raw.length > MAX_BODY) return json_({ ok: false, error: 'bad size' });
    const p = JSON.parse(raw);
    const prog = sheet_(PROGRESS, BASE), docs = sheet_(DOCS, ['id', 'last_active', 'json']);
    if (p.action === 'save') {
      const id = String(p.id || '').slice(0, 80); if (!id) return json_({ ok: false });
      const sum = p.summary || {}, keys = Object.keys(sum);
      const h = headers_(prog, keys);
      const base = { id: id, name: p.name, section: p.section, joined_at: p.joinedAt, last_active: p.lastActive };
      const row = h.map(function (k) { return cell_(k in base ? base[k] : sum[k]); });
      let r = findRow_(prog, id);
      if (r < 0) { prog.appendRow(row); } else { prog.getRange(r, 1, 1, row.length).setValues([row]); }
      const d = [id, p.lastActive || '', JSON.stringify(p.doc || {})];
      r = findRow_(docs, id);
      if (r < 0) { docs.appendRow(d); } else { docs.getRange(r, 1, 1, 3).setValues([d]); }
      return json_({ ok: true });
    }
    if (p.action === 'remove') {
      if (p.key !== TEACHER_KEY) return json_({ ok: false, error: 'key' });
      (p.ids || []).forEach(function (id) {
        [prog, docs].forEach(function (sh) { const r = findRow_(sh, id); if (r > 0) sh.deleteRow(r); });
      });
      return json_({ ok: true });
    }
    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally { lock.releaseLock(); }
}

function doGet(e) {
  const a = (e && e.parameter && e.parameter.action) || '';
  const docs = sheet_(DOCS, ['id', 'last_active', 'json']);
  if (a === 'get') {                       // a student resuming on another device
    const r = findRow_(docs, String(e.parameter.id || ''));
    if (r < 0) return json_({ ok: false });
    return json_({ ok: true, doc: JSON.parse(docs.getRange(r, 3).getValue() || '{}') });
  }
  if (a === 'list') {                      // teacher view
    if (e.parameter.key !== TEACHER_KEY) return json_({ ok: false });
    const n = docs.getLastRow(); if (n < 2) return json_({ ok: true, students: [] });
    const v = docs.getRange(2, 1, n - 1, 3).getValues();
    return json_({ ok: true, students: v.map(function (x) { let d = {}; try { d = JSON.parse(x[2]); } catch (err) { } return { id: x[0], doc: d }; }) });
  }
  return json_({ ok: true, service: 'ai-era-biology' });
}
