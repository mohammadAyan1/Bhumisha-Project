const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getRelativePath(fromFile, toFile) {
    let rel = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, '/');
    if (!rel.startsWith('.')) rel = './' + rel;
    return rel;
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (stat.isFile() && (fullPath.endsWith('.jsx') || fullPath.endsWith('.js'))) {
            processFile(fullPath);
        }
    }
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Skip utility files and the custom picker itself
    if (filePath.includes('dateUtils.js') || filePath.includes('CustomDatePicker.jsx')) return;

    // 1. Replace `.toLocaleDateString()`
    // We'll use a regex that matches `new Date(...).toLocaleDateString(...)` or `something.toLocaleDateString(...)`
    // It's a bit complex. Let's do a simpler approach: finding instances and manually verifying if possible.
    // Actually, simple regex: `([a-zA-Z0-9_.\(\)\[\]\?]+\s*)\.toLocaleDateString\(([^)]*)\)` -> `formatDateDMY($1)`
    const toLocaleRegex = /(new\s+Date\([^)]*\)|[a-zA-Z0-9_.\(\)\[\]\?]+)\.toLocaleDateString\([^)]*\)/g;
    
    if (toLocaleRegex.test(content)) {
        content = content.replace(toLocaleRegex, (match, p1) => {
            return `formatDateDMY(${p1.trim()})`;
        });
        changed = true;
        
        // Add import
        const utilsPath = path.join(srcDir, 'utils', 'dateUtils.js');
        const relPath = getRelativePath(filePath, utilsPath);
        
        if (!content.includes('formatDateDMY')) {
            // just in case
        } else if (!content.includes(`import { formatDateDMY }`)) {
            const importStmt = `import { formatDateDMY } from "${relPath}";\n`;
            // insert after the last import or at top
            content = importStmt + content;
        }
    }

    // 2. Replace `<input ... type="date" ... />`
    // This requires multiline regex because attributes can be on different lines
    const inputDateRegex = /<input([^>]*?)type=["']date["']([^>]*?)>/g;
    if (inputDateRegex.test(content)) {
        content = content.replace(inputDateRegex, (match, p1, p2) => {
            let inner = (p1 + " " + p2).replace(/\s+/g, ' ');
            // remove self-closing slash if any
            inner = inner.replace(/\/$/, '');
            return `<CustomDatePicker ${inner} />`;
        });
        changed = true;
        
        // Add import
        const compPath = path.join(srcDir, 'components', 'CustomDatePicker.jsx');
        const relPath = getRelativePath(filePath, compPath).replace('.jsx', ''); // optional
        
        if (!content.includes(`import CustomDatePicker`)) {
            const importStmt = `import CustomDatePicker from "${relPath}";\n`;
            content = importStmt + content;
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

processDirectory(srcDir);
