#!/usr/bin/env node

/**
 * Generate Safe Space Logo SVG
 * Creates an SVG file of the Safe Space logo (heart in speech bubble)
 * that can be used for app icons and splash screens
 */

const fs = require('fs');
const path = require('path');

// SVG dimensions
const size = 1024;
const viewBox = 100;
const scale = size / viewBox;

// Colors
const backgroundColor = '#000000';
const foregroundColor = '#FFFFFF';
const gradientColors = ['#1890FF', '#40A9FF']; // OceanBlue theme gradient

// Stroke width (4% of viewBox)
const strokeWidth = 4;

// Generate SVG with gradient background version (for app icon)
const svgWithGradient = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${viewBox} ${viewBox}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${gradientColors[0]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${gradientColors[1]};stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background with gradient -->
  <rect width="${viewBox}" height="${viewBox}" rx="20" fill="url(#bgGradient)"/>

  <!-- Speech Bubble Outline -->
  <path
    d="M 20 25
       Q 20 15, 30 15
       L 70 15
       Q 80 15, 80 25
       L 80 55
       Q 80 65, 70 65
       L 55 65
       L 50 75
       L 45 65
       L 30 65
       Q 20 65, 20 55
       Z"
    fill="none"
    stroke="${foregroundColor}"
    stroke-width="${strokeWidth}"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Heart Shape inside bubble -->
  <path
    d="M 50 55
       C 50 55, 45 50, 45 45
       C 45 40, 48 38, 50 38
       C 52 38, 55 40, 55 45
       C 55 50, 50 55, 50 55
       Z"
    fill="none"
    stroke="${foregroundColor}"
    stroke-width="${strokeWidth}"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Left heart curve -->
  <path
    d="M 45 45
       C 45 42, 43 40, 41 40
       C 39 40, 37 42, 37 45
       C 37 47, 39 49, 41 50"
    fill="none"
    stroke="${foregroundColor}"
    stroke-width="${strokeWidth}"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Right heart curve -->
  <path
    d="M 55 45
       C 55 42, 57 40, 59 40
       C 61 40, 63 42, 63 45
       C 63 47, 61 49, 59 50"
    fill="none"
    stroke="${foregroundColor}"
    stroke-width="${strokeWidth}"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Small decorative dots -->
  <circle cx="35" cy="30" r="3" fill="${foregroundColor}" opacity="0.6" />
  <circle cx="65" cy="30" r="3" fill="${foregroundColor}" opacity="0.6" />
</svg>`;

// Generate SVG with black background version (for splash screen)
const svgBlackBg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${viewBox} ${viewBox}" xmlns="http://www.w3.org/2000/svg">
  <!-- Black background -->
  <rect width="${viewBox}" height="${viewBox}" rx="20" fill="${backgroundColor}"/>

  <!-- Speech Bubble Outline -->
  <path
    d="M 20 25
       Q 20 15, 30 15
       L 70 15
       Q 80 15, 80 25
       L 80 55
       Q 80 65, 70 65
       L 55 65
       L 50 75
       L 45 65
       L 30 65
       Q 20 65, 20 55
       Z"
    fill="none"
    stroke="${foregroundColor}"
    stroke-width="${strokeWidth}"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Heart Shape inside bubble -->
  <path
    d="M 50 55
       C 50 55, 45 50, 45 45
       C 45 40, 48 38, 50 38
       C 52 38, 55 40, 55 45
       C 55 50, 50 55, 50 55
       Z"
    fill="none"
    stroke="${foregroundColor}"
    stroke-width="${strokeWidth}"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Left heart curve -->
  <path
    d="M 45 45
       C 45 42, 43 40, 41 40
       C 39 40, 37 42, 37 45
       C 37 47, 39 49, 41 50"
    fill="none"
    stroke="${foregroundColor}"
    stroke-width="${strokeWidth}"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Right heart curve -->
  <path
    d="M 55 45
       C 55 42, 57 40, 59 40
       C 61 40, 63 42, 63 45
       C 63 47, 61 49, 59 50"
    fill="none"
    stroke="${foregroundColor}"
    stroke-width="${strokeWidth}"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- Small decorative dots -->
  <circle cx="35" cy="30" r="3" fill="${foregroundColor}" opacity="0.6" />
  <circle cx="65" cy="30" r="3" fill="${foregroundColor}" opacity="0.6" />
</svg>`;

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '..', 'assets', 'images');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write SVG files
const gradientPath = path.join(outputDir, 'safe-space-logo-gradient.svg');
const blackBgPath = path.join(outputDir, 'safe-space-logo-black.svg');

fs.writeFileSync(gradientPath, svgWithGradient);
fs.writeFileSync(blackBgPath, svgBlackBg);

console.log('✅ Generated Safe Space logo SVG files:');
console.log(`   - ${gradientPath}`);
console.log(`   - ${blackBgPath}`);
console.log('\nTo convert to PNG, run:');
console.log('   npm install -D sharp-cli');
console.log(`   npx sharp-cli -i ${blackBgPath} -o ${path.join(outputDir, 'safe-space-logo.png')} --width 1024 --height 1024`);
