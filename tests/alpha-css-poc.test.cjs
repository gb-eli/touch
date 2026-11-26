const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const link = name => `<link rel="stylesheet" href="css/${name}.css?v=3.8.0">`;
const piano = '<link rel="stylesheet" href="experiences/piano/style.css?v=2.6.0">';
const script = '<script defer src="js/app.js"></script>';
const html = [link('a'), link('b'), piano, link('c'), link('d'), script].join('\n');
const source = { 'css/a.css': '.x{color:red}', 'css/b.css': '.x{color:blue}', 'css/c.css': '.y{background:url(../assets/a.svg)}', 'css/d.css': '.y{color:white}' };

test('preserves cascade order, relative URLs, piano boundary and scripts', async () => {
  const { planHomeCss } = await import('../scripts/alpha-css-poc.mjs');
  const plan = planHomeCss(html, p => source[p]);
  assert.deepEqual(plan.bundles.map(b => b.sources), [['css/a.css','css/b.css'],['css/c.css','css/d.css']]);
  assert.ok(plan.bundles[0].content.indexOf('color:red') < plan.bundles[0].content.indexOf('color:blue'));
  assert.ok(plan.bundles[1].content.includes('url(../assets/a.svg)'));
  assert.equal(plan.html, [`<link rel="stylesheet" href="${plan.bundles[0].path}">`, piano, `<link rel="stylesheet" href="${plan.bundles[1].path}">`, script].join('\n'));
  assert.deepEqual(planHomeCss(html, p => source[p]), plan);
});

test('does not combine across scripts, comments or custom link attributes', async () => {
  const { planHomeCss } = await import('../scripts/alpha-css-poc.mjs');
  assert.throws(() => planHomeCss(`<!-- ${link('a')} ${link('b')} -->`,p => source[p]), /Ambiguous HTML/);
  for (const boundary of [script,'<!-- separate -->','<link rel="stylesheet" href="css/print.css" media="print">']) {
    const input = [link('a'),boundary,link('b')].join('\n');
    assert.deepEqual(planHomeCss(input,p => source[p]),{html:input,bundles:[]});
  }
});

test('rejects directives whose semantics can change across file boundaries', async () => {
  const { planHomeCss } = await import('../scripts/alpha-css-poc.mjs');
  for (const css of ['@import "x.css";', '@charset "UTF-8";', '@namespace svg url(x);', '\uFEFF.x{}', '/*# sourceMappingURL=a.css.map */']) {
    assert.throws(() => planHomeCss([link('a'),link('b')].join('\n'), p => p.endsWith('a.css') ? css : '.x{}'), /Unsafe CSS/);
  }
});

test('writes only a new local copy and leaves source, JS and SW intact', async t => {
  const { buildLocalCopy } = await import('../scripts/alpha-css-poc.mjs');
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'alpha-css-'));
  t.after(() => fs.rmSync(root,{recursive:true,force:true}));
  const pub = path.join(root,'public'), out = path.join(root,'out');
  fs.mkdirSync(path.join(pub,'css'),{recursive:true});
  fs.writeFileSync(path.join(pub,'index.html'),html);
  for (const [p,c] of Object.entries(source)) fs.writeFileSync(path.join(pub,p),c);
  fs.writeFileSync(path.join(pub,'service-worker.js'),'// original');
  assert.throws(() => buildLocalCopy(pub,path.join(pub,'bad')),/outside public/);
  const report = buildLocalCopy(pub,out);
  assert.equal(report.productionReady,false);
  assert.equal(report.bundles.length,2);
  assert.equal(fs.readFileSync(path.join(pub,'index.html'),'utf8'),html);
  assert.equal(fs.readFileSync(path.join(out,'service-worker.js'),'utf8'),'// original');
  assert.ok(fs.readFileSync(path.join(out,'index.html'),'utf8').includes(script));
  assert.throws(() => buildLocalCopy(pub,out),/outside public/);
});
