// Renders the coverage badge (badgen-like flat SVG) from a vitest/istanbul json-summary report.
// Usage: node coverage-badge.mjs <coverage-summary.json> <output.svg>
// Coverage = the lowest of lines / statements / functions / branches.

import { readFileSync, writeFileSync } from 'node:fs';
import console from 'node:console';
import process from 'node:process';

const [summaryPath, outputPath] = process.argv.slice(2);

if (!summaryPath || !outputPath) {
	console.error('Usage: node coverage-badge.mjs <coverage-summary.json> <output.svg>');
	process.exit(1);
}

const { total } = JSON.parse(readFileSync(summaryPath, 'utf8'));
const coverage = Math.min(...['lines', 'statements', 'functions', 'branches'].map((key) => total[key].pct));

if (!Number.isFinite(coverage)) {
	console.error(`Invalid coverage value in ${summaryPath}.`);
	process.exit(1);
}

const label = 'coverage';
const value = `${coverage}%`;
const color = coverage >= 95 ? '#3C1' : '#F73';

// Verdana glyph widths at font-size 110 (the badge is drawn at 10x scale).
const CHAR_WIDTHS = { '.': 40, '%': 120 };
const textWidth = (text) => [...text].reduce((sum, ch) => sum + (CHAR_WIDTHS[ch] ?? 70), 0);

const PADDING = 50;
const labelTextWidth = 503; // "coverage"
const valueTextWidth = textWidth(value);
const labelWidth = labelTextWidth + PADDING * 2;
const valueWidth = valueTextWidth + PADDING * 2;
const width = labelWidth + valueWidth;

const svg = `<svg width="${width / 10}" height="20" viewBox="0 0 ${width} 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="gradient" x2="0" y2="100%">
    <stop offset="0" stop-opacity=".1" stop-color="#EEE"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="mask"><rect width="${width}" height="200" rx="30" fill="#FFF"/></mask>
  <g mask="url(#mask)">
    <rect width="${labelWidth}" height="200" fill="#555"/>
    <rect width="${valueWidth}" height="200" fill="${color}" x="${labelWidth}"/>
    <rect width="${width}" height="200" fill="url(#gradient)"/>
  </g>
  <g aria-hidden="true" text-anchor="start" font-family="Verdana,DejaVu Sans,sans-serif" font-size="110">
    <text x="${PADDING + 10}" y="148" textLength="${labelTextWidth}" fill="#000" opacity="0.25">${label}</text>
    <text x="${PADDING}" y="138" textLength="${labelTextWidth}" fill="#fff">${label}</text>
    <text x="${labelWidth + PADDING + 5}" y="148" textLength="${valueTextWidth}" fill="#000" opacity="0.25">${value}</text>
    <text x="${labelWidth + PADDING - 5}" y="138" textLength="${valueTextWidth}" fill="#fff">${value}</text>
  </g>
</svg>
`;

writeFileSync(outputPath, svg);
console.log(`Coverage badge: ${value} -> ${outputPath}`);
