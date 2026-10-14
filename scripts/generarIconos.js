const fs = require("fs");
const path = require("path");
const { getIcons } = require("@iconify/utils");
const solar = require("@iconify-json/solar/icons.json");

const ICONOS = [
  "home-2-linear",
  "notebook-linear",
  "box-linear",
  "users-group-rounded-linear",
  "user-circle-linear",
  "magnifer-linear",
  "tuning-2-linear",
  "heart-linear",
  "star-linear",
  "star-bold",
  "clock-circle-linear",
  "calendar-linear",
  "lightbulb-linear",
  "alt-arrow-right-linear",
  "alt-arrow-left-linear",
  "alt-arrow-down-linear",
  "alt-arrow-up-linear",
  "chef-hat-linear",
  "refresh-linear",
  "danger-triangle-linear",
  "check-circle-linear",
  "add-circle-linear",
];

const faltan = ICONOS.filter((n) => !solar.icons[n] && !solar.aliases?.[n]);
if (faltan.length) console.warn("No existen en Solar:", faltan.join(", "));

const subset = getIcons(solar, ICONOS.filter((n) => !faltan.includes(n)));
const destino = path.join(__dirname, "..", "assets", "iconos.json");
fs.writeFileSync(destino, JSON.stringify(subset));
console.log(`Listo: ${Object.keys(subset.icons).length} íconos en assets/iconos.json`);
