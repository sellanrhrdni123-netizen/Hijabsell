const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const src = 'C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm/index.html';
const desktop = path.join(os.homedir(), 'OneDrive', 'Desktop');
const downloads = path.join(os.homedir(), 'Downloads');
const brain = 'C:/Users/sella/.gemini/antigravity/brain/1f834f12-816e-435e-9970-477465f95452';

fs.copyFileSync(src, path.join(desktop, 'index.html'));
fs.copyFileSync(src, path.join(downloads, 'index.html'));
fs.copyFileSync(src, path.join(brain, 'index.html'));
console.log('index.html copied to Desktop, Downloads, and Brain!');

// Create index-html.zip
const tempDir = path.join(os.tmpdir(), 'zip_temp_' + Date.now());
fs.mkdirSync(tempDir, { recursive: true });
fs.copyFileSync(src, path.join(tempDir, 'index.html'));

const deskZip = path.join(desktop, 'index-html.zip');
const downZip = path.join(downloads, 'index-html.zip');
const brainZip = path.join(brain, 'index-html.zip');

execSync(`tar -a -c -f "${deskZip}" -C "${tempDir}" index.html`);
fs.copyFileSync(deskZip, downZip);
fs.copyFileSync(deskZip, brainZip);
console.log('index-html.zip created and copied!');

// Create project zip
const projZip1 = 'C:/Users/sella/.gemini/antigravity/scratch/PROYEK-BY-NVDILA.zip';
const projZip2 = 'C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm.zip';
execSync(`tar -a -c -f "${projZip1}" --exclude="node_modules" --exclude=".git" -C "C:/Users/sella/.gemini/antigravity/scratch/by-nvdila-crm" .`);
fs.copyFileSync(projZip1, projZip2);
console.log('Project zips created!');
