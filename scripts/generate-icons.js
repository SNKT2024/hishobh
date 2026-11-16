const fs = require("fs");
const path = require("path");

const publicIconsDir = path.join(__dirname, "..", "public", "icons");
if (!fs.existsSync(publicIconsDir)) {
  fs.mkdirSync(publicIconsDir, { recursive: true });
}

// Generate SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" rx="128" fill="#142128"/>
  <path d="M128 160h256a32 32 0 0 1 32 32v128a32 32 0 0 1-32 32H128a32 32 0 0 1-32-32V192a32 32 0 0 1 32-32z" fill="none" stroke="#2e83b9" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M96 224h320" stroke="#064b76" stroke-width="24" stroke-linecap="round"/>
  <circle cx="340" cy="272" r="20" fill="#bce2fa"/>
</svg>`;

fs.writeFileSync(path.join(publicIconsDir, "icon.svg"), svgContent);
console.log("Created icon.svg");
