import { createHash } from 'node:crypto';
import { cpSync, existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Experiment only: keep classic scripts, CSS source files and their order intact.
// Output is a disposable local copy, never a release artifact.
const LINK = /<link rel="stylesheet" href="(css\/[a-z0-9-]+\.css)(?:\?v=[0-9.]+)?">/g;
const FORBIDDEN = /@(?:import|charset|namespace)\b|sourceMappingURL\s*=/i;
const digest = text => createHash('sha256').update(text).digest('hex').slice(0, 16);

export function planHomeCss(html, readCss) {
  // Fail closed if a candidate link occurs in a comment or a raw-text block.
  for (const block of html.matchAll(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi)) {
    if ([...block[0].matchAll(LINK)].length) throw new Error('Ambiguous HTML stylesheet reference');
  }
  const links = [...html.matchAll(LINK)];
  const groups = [];
  for (const link of links) {
    const last = groups.at(-1);
    if (last && /^\s*$/.test(html.slice(last.end, link.index))) {
      last.paths.push(link[1]);
      last.end = link.index + link[0].length;
    } else groups.push({ start: link.index, end: link.index + link[0].length, paths: [link[1]] });
  }
  let candidate = html;
  const bundles = [];
  for (const group of groups.reverse()) {
    if (group.paths.length < 2) continue;
    const content = group.paths.map(path => {
      const css = readCss(path);
      if (FORBIDDEN.test(css) || css.startsWith('\uFEFF')) throw new Error(`Unsafe CSS directive: ${path}`);
      return `/* source: ${path} */\n${css}\n`;
    }).join('\n');
    const path = `css/alpha-home-${digest(content)}.css`;
    bundles.unshift({ path, content, sources: group.paths });
    candidate = candidate.slice(0, group.start) + `<link rel="stylesheet" href="${path}">` + candidate.slice(group.end);
  }
  return { html: candidate, bundles };
}

const within = (parent, child) => {
  const rel = relative(parent, child);
  return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`));
};

export function buildLocalCopy(source, destination) {
  const root = realpathSync(source);
  const out = resolve(destination);
  // Resolve existing parent as well, so aliases cannot write into the source.
  const actualOut = resolve(realpathSync(dirname(out)), basename(out));
  if (existsSync(out) || within(root, actualOut) || within(actualOut, root)) throw new Error('Use a new output directory outside public.');
  const original = readFileSync(resolve(root, 'index.html'), 'utf8');
  const plan = planHomeCss(original, path => {
    const file = realpathSync(resolve(root, path));
    if (!within(root, file)) throw new Error(`CSS escapes public: ${path}`);
    return readFileSync(file, 'utf8');
  });
  for (const bundle of plan.bundles) if (existsSync(resolve(root, bundle.path))) throw new Error(`Bundle collision: ${bundle.path}`);
  cpSync(root, out, { recursive: true, force: false, errorOnExist: true });
  for (const bundle of plan.bundles) writeFileSync(resolve(out, bundle.path), bundle.content, { flag: 'wx' });
  writeFileSync(resolve(out, 'index.html'), plan.html);
  const report = { mode: 'local-only', productionReady: false, bundles: plan.bundles.map(({ path, sources }) => ({ path, sources })), serviceWorker: 'unchanged; offline and cache integration pending' };
  writeFileSync(resolve(out, 'alpha-poc-report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  return report;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 4) throw new Error('Usage: node scripts/alpha-css-poc.mjs public /absolute/new-output');
  console.log(JSON.stringify(buildLocalCopy(process.argv[2], process.argv[3]), null, 2));
}
