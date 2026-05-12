#!/usr/bin/env node
// Organize Markdown files into DOCUMENTATION/md_by_category/<category>/
// Usage: node scripts/organize_md.js

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const targetRoot = path.join(root, 'DOCUMENTATION', 'MD_LIBRARY');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function detectCategory(fileName) {
  // Use prefix before first underscore or dash, fallback to 'misc'
  const base = path.basename(fileName);
  const nameNoExt = base.replace(/\.md$/i, '');
  const m = nameNoExt.match(/^([A-Z0-9]+)[_\-]/i);
  if (m && m[1]) return m[1].toLowerCase();

  // common keywords mapping
  const lower = nameNoExt.toLowerCase();
  if (lower.includes('admin')) return 'admin';
  if (lower.includes('archiv') || lower.includes('archival')) return 'archival';
  if (lower.includes('fix') || lower.includes('bug')) return 'fixes';
  if (lower.includes('analytics')) return 'analytics';
  if (lower.includes('esp32') || lower.includes('hardware')) return 'hardware';
  if (lower.includes('deployment') || lower.includes('render') || lower.includes('supabase')) return 'deployment';
  if (lower.includes('presentation') || lower.includes('ppt')) return 'presentation';
  return 'misc';
}

function isMarkdown(file) {
  return file.toLowerCase().endsWith('.md');
}

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      // skip node_modules and .git and DOCUMENTATION/MD_LIBRARY
      if (file === 'node_modules' || file === '.git' || full.includes(path.join('DOCUMENTATION','MD_LIBRARY'))) return;
      results.push(...walk(full));
    } else {
      if (isMarkdown(full)) results.push(full);
    }
  });
  return results;
}

function run() {
  ensureDir(targetRoot);
  const mdFiles = walk(root);
  mdFiles.forEach(src => {
    // skip files already under DOCUMENTATION/MD_LIBRARY
    if (src.includes(path.join('DOCUMENTATION','MD_LIBRARY'))) return;
    const category = detectCategory(src);
    const destDir = path.join(targetRoot, category);
    ensureDir(destDir);
    const dest = path.join(destDir, path.basename(src));
    try {
      fs.renameSync(src, dest);
      console.log(`Moved ${src} -> ${dest}`);
    } catch (err) {
      console.error(`Failed to move ${src}: ${err.message}`);
    }
  });
  console.log('Markdown organization complete.');
}

run();
