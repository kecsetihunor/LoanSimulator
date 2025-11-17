const fs = require('fs');
const path = require('path');

const localeDir = path.join(__dirname, '..', 'src', 'locale');
const sourcePath = path.join(localeDir, 'messages.xlf');
const oldEnPath = path.join(localeDir, 'messages.en.xlf');
const outPath = oldEnPath; // overwrite existing messages.en.xlf

if (!fs.existsSync(sourcePath)) {
  console.error('Source messages.xlf not found at', sourcePath);
  process.exit(2);
}

const newXlf = fs.readFileSync(sourcePath, 'utf8');
let oldEn = '';
if (fs.existsSync(oldEnPath)) {
  oldEn = fs.readFileSync(oldEnPath, 'utf8');
}

// Build map of old targets by trans-unit id
const oldMap = new Map();
if (oldEn) {
  const re = /<trans-unit[^>]*id="([^"]+)"[^>]*>[\s\S]*?<target[^>]*>([\s\S]*?)<\/target>/g;
  let m;
  while ((m = re.exec(oldEn)) !== null) {
    const id = m[1];
    const target = m[2];
    oldMap.set(id, target);
  }
}

// Transform newXlf: for each trans-unit, insert a <target> with old translation if present
const out = newXlf.replace(/(<trans-unit[^>]*id=\"([^\"]+)\"[^>]*>)([\s\S]*?)(<\/trans-unit>)/g, (full, header, id, body, footer) => {
  // If there's already a <target> inside body, remove it first
  const bodyWithoutTarget = body.replace(/<target[^>]*>[\s\S]*?<\/target>/g, '');
  const targetContent = oldMap.has(id) ? oldMap.get(id) : '';
  const targetTag = `<target>${targetContent}</target>`;

  // Insert target tag right after </source>
  if (/<\/source>/.test(bodyWithoutTarget)) {
    return header + bodyWithoutTarget.replace(/<\/source>/, `</source>\n        ${targetTag}`) + footer;
  } else {
    // Fallback: append target at end of trans-unit body
    return header + bodyWithoutTarget + '\n        ' + targetTag + footer;
  }
});

// Ensure file header has source-language set to ro and target-language set to en
let final = out.replace(/<file[^>]*>/, (m) => {
  // if file already has target-language, keep it; otherwise add target-language="en"
  if (/target-language=/.test(m)) return m;
  return m.replace(/<file/, '<file target-language="en"');
});

// Write backup of old file
if (fs.existsSync(oldEnPath)) {
  fs.copyFileSync(oldEnPath, oldEnPath + '.bak');
  console.log('Backed up old messages.en.xlf to messages.en.xlf.bak');
}

fs.writeFileSync(outPath, final, 'utf8');
console.log('Wrote updated', outPath);
