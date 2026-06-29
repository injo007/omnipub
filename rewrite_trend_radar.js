const fs = require('fs');
const content = fs.readFileSync('src/components/SaaSAdvancedSuites.tsx', 'utf8');

// Find the start of the grid
const gridStartPattern = "{/* BENCHWORK HUB GRID */}";
const gridStart = content.indexOf(gridStartPattern);

// Find the end: {/* SEARCH VELOCITY SCAN ENGINE
const gridEndPattern = "{/* SEARCH VELOCITY SCAN ENGINE - ALWAYS VISIBLE */}";
const gridEnd = content.indexOf(gridEndPattern);

if (gridStart !== -1 && gridEnd !== -1) {
    const newContent = content.slice(0, gridStart) + content.slice(gridEnd);
    fs.writeFileSync('src/components/SaaSAdvancedSuites.tsx', newContent);
    console.log("Successfully removed grid!");
} else {
    console.log("Could not find start or end patterns.");
}
