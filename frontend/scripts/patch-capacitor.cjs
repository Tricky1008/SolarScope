/**
 * Post-install patch for all @capacitor plugins.
 * Fixes deprecated proguard-android.txt reference that breaks
 * builds with AGP 9+ / Gradle 9+.
 *
 * Scans every build.gradle under node_modules/@capacitor/
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const capDir = path.join(__dirname, '..', 'node_modules', '@capacitor');

if (!fs.existsSync(capDir)) {
    console.log('[patch-capacitor] @capacitor not found, skipping.');
    process.exit(0);
}

let patched = 0;

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(full);
        } else if (entry.name === 'build.gradle') {
            let content = fs.readFileSync(full, 'utf8');
            if (content.includes("proguard-android.txt")) {
                content = content.replace(
                    /proguard-android\.txt/g,
                    'proguard-android-optimize.txt'
                );
                fs.writeFileSync(full, content, 'utf8');
                patched++;
                console.log('[patch-capacitor] Fixed: ' + path.relative(capDir, full));
            }
        }
    }
}

walk(capDir);

if (patched > 0) {
    console.log('[patch-capacitor] Patched ' + patched + ' file(s).');
} else {
    console.log('[patch-capacitor] All files already patched.');
}
