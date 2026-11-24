#!/usr/bin/env node
// Validate a Lilliput task family (a directory holding one main file + its sub-files + artifacts).
//
//   node scripts/validate-task-family.mjs <dir> [--teams <teamsDir>]
//
// Exit code 0 = conforming; 1 = violations (printed); 2 = usage error.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MAIN = /^(\d{8})_([a-z0-9-]+)\.md$/;
const SUB = /^(\d{8})_([a-z0-9-]+)\.(\d{3})\.md$/;
const ARTIFACT = /^(\d{8})_([a-z0-9-]+)\.(\d{3})\..+\..+$/;
const STATUSES = new Set(['pending', 'running', 'handoff', 'done', 'failed']);

const args = process.argv.slice(2);
let dir = null;
let teamsDir = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--teams') teamsDir = args[++i];
  else if (!dir) dir = args[i];
}
if (!dir) {
  console.error('usage: node scripts/validate-task-family.mjs <dir> [--teams <dir>]');
  process.exit(2);
}

const errors = [];
const fail = (m) => errors.push(m);

// --- minimal YAML front-matter reader (flat scalars, inline [..] lists, block "- item" lists) ---
function readFrontMatter(file) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return null;
  }
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return null;
  const lines = text.slice(3, end).split(/\r?\n/);
  const fm = {};
  let listKey = null;
  for (const raw of lines) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const item = raw.match(/^\s*-\s+(.*)$/);
    if (item && listKey) {
      fm[listKey].push(item[1].trim().replace(/^['"]|['"]$/g, ''));
      continue;
    }
    const kv = raw.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let val = kv[2].replace(/\s+#.*$/, '').trim();
    if (val === '') {
      fm[key] = [];
      listKey = key;
    } else if (val.startsWith('[') && val.endsWith(']')) {
      fm[key] = val.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
      listKey = null;
    } else {
      fm[key] = val.replace(/^['"]|['"]$/g, '');
      listKey = null;
    }
  }
  return fm;
}

// --- collect entries ---
let entries;
try {
  entries = readdirSync(dir);
} catch (e) {
  console.error(`cannot read directory: ${dir}`);
  process.exit(2);
}

const mains = entries.filter((f) => MAIN.test(f));
const subs = entries.filter((f) => SUB.test(f));
const artifacts = entries.filter((f) => ARTIFACT.test(f) && !SUB.test(f));

if (mains.length !== 1) {
  fail(`expected exactly one main file (<YYYYMMDD>_<slug>.md), found ${mains.length}`);
  if (mains.length === 0) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
}

const mainName = mains[0];
const mainBase = mainName.replace(/\.md$/, '');
const fm = readFrontMatter(join(dir, mainName));
if (!fm) fail(`${mainName}: missing or malformed front matter`);

if (fm) {
  const required = ['task_id', 'team_id', 'origin_soul', 'assigned_soul', 'status', 'hop_count', 'updated_at', 'target_dir', 'segments'];
  for (const k of required) if (fm[k] === undefined) fail(`${mainName}: missing front-matter field "${k}"`);

  if (fm.task_id && fm.task_id !== mainBase) fail(`${mainName}: task_id "${fm.task_id}" != filename "${mainBase}"`);
  if (fm.status && !STATUSES.has(fm.status)) fail(`${mainName}: invalid status "${fm.status}"`);
  const hop = Number.parseInt(fm.hop_count, 10);
  if (!Number.isInteger(hop) || hop < 0) fail(`${mainName}: hop_count must be an integer >= 0`);
  if (fm.team_id && fm.team_id !== '-') {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fm.team_id)) fail(`${mainName}: team_id "${fm.team_id}" is not kebab-case`);
  }
  if (Array.isArray(fm.segments) && Number.isInteger(hop) && fm.segments.length !== hop) {
    fail(`${mainName}: segments length (${fm.segments.length}) != hop_count (${hop})`);
  }
  if (fm.target_dir && fm.target_dir !== '-' && !/^([A-Za-z]:[\\/]|[\\/]|~[\\/])/.test(fm.target_dir)) {
    fail(`${mainName}: target_dir must be an absolute path or "-"`);
  }
  if (fm.updated_at && !/^\d{4}-\d{2}-\d{2}T/.test(fm.updated_at)) {
    fail(`${mainName}: updated_at must be an ISO-8601 timestamp`);
  }
}

// --- check sub-files 1..hop_count ---
if (fm && Number.isInteger(Number.parseInt(fm.hop_count, 10))) {
  const hop = Number.parseInt(fm.hop_count, 10);
  const present = new Set(subs.map((f) => f.match(SUB)[3]));
  for (let i = 1; i <= hop; i++) {
    const nnn = String(i).padStart(3, '0');
    const name = `${mainBase}.${nnn}.md`;
    if (!present.has(nnn)) {
      fail(`missing sub-file for hop ${i}: ${name}`);
      continue;
    }
    const sfm = readFrontMatter(join(dir, name));
    if (!sfm) {
      fail(`${name}: missing or malformed front matter`);
      continue;
    }
    for (const k of ['hop', 'task_id', 'soul_id', 'at']) if (sfm[k] === undefined) fail(`${name}: missing field "${k}"`);
    if (String(sfm.hop) !== String(i)) fail(`${name}: hop "${sfm.hop}" != ${i}`);
    if (sfm.task_id && fm.task_id && sfm.task_id !== fm.task_id) fail(`${name}: task_id mismatch with main file`);
    if (sfm.at && !/^\d{4}-\d{2}-\d{2}T/.test(sfm.at)) fail(`${name}: at must be an ISO-8601 timestamp`);
  }
  for (const nnn of present) {
    if (Number.parseInt(nnn, 10) > hop) fail(`orphan sub-file: ${mainBase}.${nnn}.md (beyond hop_count ${hop})`);
  }
}

// --- optional: verify each hop's soul matches the team's members order ---
if (teamsDir && fm && fm.team_id && fm.team_id !== '-') {
  const teamFile = join(teamsDir, `${fm.team_id}.md`);
  const tfm = readFrontMatter(teamFile);
  if (!tfm) fail(`cannot read team file: ${teamFile}`);
  else if (Array.isArray(tfm.members)) {
    for (let i = 1; i <= tfm.members.length; i++) {
      const name = `${mainBase}.${String(i).padStart(3, '0')}.md`;
      const sfm = readFrontMatter(join(dir, name));
      if (sfm && sfm.soul_id && sfm.soul_id !== tfm.members[i - 1]) {
        fail(`${name}: soul_id "${sfm.soul_id}" != team member[${i - 1}] "${tfm.members[i - 1]}"`);
      }
    }
  }
}

if (errors.length) {
  console.error(`FAIL: ${dir}`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`OK: ${dir} (main ${mainName}, ${subs.length} sub-file(s), ${artifacts.length} artifact(s))`);
