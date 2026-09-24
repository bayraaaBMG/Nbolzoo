// Бүх тестийг дараалан ажиллуулна. Аль нэг нь унавал exit code 1.
// Ажиллуулах: node tests/run-all.js   (төслийн үндсэн хавтаснаас)
const { execFileSync } = require("child_process");
const fs = require("fs");

const SUITES = [
  ["page load (12 pages)", "tests/page_load.js", ["."]],
  ["permission matrix", "tests/roles_test.js", []],
  ["security rules (static)", "tests/rules_test.js", []],
  ["cms overlay logic", "tests/cms_test.js", []],
  ["cms integration", "tests/cms_integration.js", []],
  ["xss regression", "tests/xss_test.js", []],
  ["links & wiring", "tests/link_check.js", []],
  ["dataset integrity", "tests/data_check.js", []],
];

let failed = 0;

// 1. Эхлээд бүх JS файлын syntax
const jsFiles = fs.readdirSync("js").filter(f => f.endsWith(".js")).map(f => "js/" + f).concat(["service-worker.js"]);
try {
  jsFiles.forEach(f => execFileSync(process.execPath, ["--check", f], { stdio: "pipe" }));
  console.log("PASS  syntax (" + jsFiles.length + " files)\n");
} catch (e) {
  failed++;
  console.log("FAIL  syntax\n" + (e.stderr || "").toString() + "\n");
}

// 2. Тестийн багцууд
for (const [name, file, args] of SUITES) {
  try {
    const out = execFileSync(process.execPath, [file, ...args], { stdio: "pipe" }).toString();
    console.log("PASS  " + name + " — " + (out.trim().split("\n").pop() || ""));
  } catch (e) {
    failed++;
    console.log("FAIL  " + name);
    console.log((e.stdout || "").toString().split("\n").filter(l => l.includes("FAIL")).join("\n"));
  }
}

console.log("\n" + (failed ? failed + " suite(s) failed" : "All suites passed"));
process.exit(failed ? 1 : 0);
