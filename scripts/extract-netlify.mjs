import fs from 'node:fs';
import vm from 'node:vm';

const htmlPath = '/home/clouduser/rprx-netlify-source.html';
const html = fs.readFileSync(htmlPath, 'utf8');
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
const script = scripts.find((s) => s.includes('const FIN') && s.includes('const PHYS'));
if (!script) throw new Error('Could not find Netlify FIN/PHYS script');
const start = script.indexOf('function evalRule');
const end = script.indexOf('const FREE_AREAS');
if (start < 0 || end < 0) throw new Error(`Missing extraction markers start=${start} end=${end}`);
const code = script.slice(start, end) + `\nJSON.stringify({ FIN, PHYS });`;
const context = vm.createContext({ console });
const data = JSON.parse(vm.runInContext(code, context, { timeout: 5000 }));
const outDir = '/home/clouduser/rprx-saas-platform-v1/src/lib/rprx-assessments/generated';
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(`${outDir}/netlify-assessment-data.json`, JSON.stringify(data, null, 2));
console.log(JSON.stringify({
  financialSections: data.FIN.SECTIONS.length,
  financialQuestions: data.FIN.QUESTIONS.length,
  financialThemes: data.FIN.THEMES.length,
  financialStrategies: data.FIN.THEMES.reduce((n, t) => n + (t.tactics?.length || 0), 0),
  physicalSections: data.PHYS.SECTIONS.length,
  physicalQuestions: data.PHYS.QUESTIONS.length,
  physicalSolutions: Object.keys(data.PHYS.SOLUTIONS || {}).length,
}, null, 2));
