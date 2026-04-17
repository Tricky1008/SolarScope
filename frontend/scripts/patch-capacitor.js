/**
 * Post-install patch for @capacitor/android
 * Fixes deprecated proguard-android.txt reference that breaks
 * builds with AGP 9+ / Gradle 9+
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(
    __dirname,
    '..',
    'node_modules',
    '@capacitor',
    'android',
    'capacitor',
    'build.gradle'
);

if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes("proguard-android.txt")) {
        content = content.replace(
            /proguard-android\.txt/g,
            'proguard-android-optimize.txt'
        );
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('[patch-capacitor] Fixed proguard-android.txt -> proguard-android-optimize.txt');
    } else {
        console.log('[patch-capacitor] Already patched, skipping.');
    }
} else {
    console.log('[patch-capacitor] Capacitor Android build.gradle not found, skipping.');
}
