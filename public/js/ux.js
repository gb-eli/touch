/* TV TOUCH | interface de toque e temas. */
(() => {
  'use strict';
  const $ = (q) => document.querySelector(q);
  const admin = !!$('#authView');
  const root = document.body;
  const css = [
    'body{transition:background-color .25s,color .25s}',
    'body>.layout,body>.app-shell{position:relative;z-index:1}',
    '.ux-backdrop{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;opacity:0;transition:opacity .8s}',
    '.ux-layer{position:absolute;inset:-10%;opacity:0;filter:saturate(125%);transition:opacity 3.6s ease}',
    '.ux-layer.on{opacity:1}',
    'body[data-theme="colorful"] .ux-backdrop{opacity:1}',
    '.ux-themes{display:inline-flex;gap:5px;align-items:center;flex-shrink:0;padding:5px;border:1px solid #30445c;border-radius:14px;background:#142237}',
    '.ux-theme{min-height:49px;min-width:76px;border:0;border-radius:10px;background:transparent;color:#b7c7da;font:700 14px inherit;padding:10px 13px;cursor:pointer}',
    '.ux-theme.active{background:#7fe4e9;color:#082235}',
    '.ux-pause{border:1px solid #38576d;border-radius:12px;background:#1e3447;color:#e1eff9;min-height:49px;padding:8px 13px;font-weight:750;white-space:nowrap}',
    '.ux-theme:focus-visible,.ux-pause:focus-visible{outline:3px solid #86dfff;outline-offset:2px}',
    '.ux-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0}',
    '.ux-action{min-height:128px;display:flex;flex-direction:column;align-items:flex-start;gap:8px;text-align:left;padding:18px;border:1px solid #31435d;border-radius:18px;background:#122035;color:#eff8ff;cursor:pointer}',
    '.ux-action small{font-size:11px;font-weight:800;letter-spacing:.13em;color:#8ce1ed}',
    '.ux-action strong{font-size:21px;letter-spacing:-.03em}',
    '.ux-action span{font-size:13px;line-height:1.5;color:#b5c7db}',
    '.ux-action:hover{border-color:#84d8eb;transform:translateY(-2px)}',
    '.ux-action:nth-child(2){background:linear-gradient(135deg,#272043,#142033)}',
    '.ux-action:nth-child(3){background:linear-gradient(135deg,#35283b,#142033)}',
    '.ux-action:nth-child(4){background:linear-gradient(135deg,#163b39,#142033)}',
    'body[data-theme="dark"]{--bg:#04070d;--surface:#0b1018;--surface2:#101722;--surface3:#152032;--stroke:#29384b;--text:#f3f7fc;--muted:#b1c2d2;--cyan:#75e3eb;background:#04070d}',
    'body[data-theme="light"]{--bg:#f1f6fc;--surface:#fff;--surface2:#f6faff;--surface3:#eaf2fc;--stroke:#d5e1ef;--text:#162b42;--muted:#4e6681;--cyan:#147ebc;background:#f1f6fc;color:#162b42}',
    'body[data-theme="colorful"]{--bg:#070e19;--surface:#101b2c;--surface2:#15223a;--text:#f4f8fc;--muted:#b6c9d9;background:#070e19}',
    'body[data-theme="light"] .ux-themes{background:#e7f0f8;border-color:#cee0ed}',
    'body[data-theme="light"] .ux-theme{color:#30536b}',
    'body[data-theme="light"] .ux-theme.active{background:#173e61;color:#fff}',
    'body[data-theme="light"] .ux-action{background:#fff;color:#1b334a;border-color:#d6e1ee;box-shadow:0 7px 18px #1234560d}',
    'body[data-theme="light"] .ux-action small{color:#12689e}',
    'body[data-theme="light"] .ux-action span{color:#566d85}',
    'body[data-theme="light"] .sidebar{background:#edf4fc;border-right-color:#d3e3f0}',
    'body[data-theme="light"] .brand small,body[data-theme="light"] .nav-item,body[data-theme="light"] .breadcrumb,body[data-theme="light"] .section-heading p{color:#46617d}',
    'body[data-theme="light"] .nav-item.active{background:#d8efff;color:#0a568d;border-color:#b7daef}',
    'body[data-theme="light"] .hero{background:linear-gradient(125deg,#fff,#e4efff);border-color:#c8dfed}',
    'body[data-theme="light"] .hero p{color:#475f78}',
    'body[data-theme="light"] .hero h1 span{background:linear-gradient(90deg,#0969a0,#5a4db9);-webkit-background-clip:text;background-clip:text;color:transparent}',
    'body[data-theme="light"] .topbar{background:#fffffff2;border-color:#d5e1ef}',
    'body[data-theme="light"] .quick-card,body[data-theme="light"] .lab-card,body[data-theme="light"] .resource-card,body[data-theme="light"] .lesson-callout,body[data-theme="light"] .helper-card,body[data-theme="light"] .diag-home-banner,body[data-theme="light"] .lesson-banner{background:#fff;border-color:#d9e4ef;color:#1c3148}',
    'body[data-theme="light"] .quick-card>span:nth-last-of-type(1),body[data-theme="light"] .resource-body p,body[data-theme="light"] .helper-card p{color:#52677f}',
    'body[data-theme="light"] .button.primary{background:#184e6d;color:#fff;border-color:#184e6d}',
    'body[data-theme="light"] .lesson-chip,body[data-theme="light"] .top-action{background:#fff;color:#19425d;border-color:#cfdeed}',
    'body[data-theme="light"] .footer{background:#ffffffbc;border-color:#d6e2ef;color:#506982}',
    'body[data-theme="dark"] .hero{background:linear-gradient(120deg,#0f2b39,#182138)}',
    'body[data-theme="colorful"] .hero{background:linear-gradient(130deg,#192a42e6,#1b1734e8)}',
    'body[data-theme="light"] .ux-pause{background:#e4f2fb;color:#16425d}',
    'body[data-theme="dark"] .layout,body[data-theme="colorful"] .layout{--background:#060b13;--ink:#f4f8fd;--border:#2a3b50;--teal:#7de3ec}',
    'body[data-theme="dark"].ux-admin,body[data-theme="colorful"].ux-admin{background:#060b13;color:#f0f6ff}',
    'body.ux-admin .header{position:sticky;top:0;z-index:10;height:auto;min-height:84px;gap:12px;backdrop-filter:blur(14px)}',
    'body.ux-admin .header-actions{gap:10px;flex-wrap:wrap;justify-content:flex-end}',
    'body.ux-admin .side-link{min-height:58px;font-size:15px}',
    'body.ux-admin .btn{min-height:53px;font-size:14px}',
    'body.ux-admin .feature-line{min-height:60px}',
    'body.ux-admin .feature-line input{width:28px;height:28px}',
    'body.ux-admin .control-group input[type="range"]{min-height:42px}',
    'body.ux-admin .auth-form input,body.ux-admin .filter select,body.ux-admin .control-group select{min-height:54px;font-size:15px}',
    'body.ux-admin .metric-card{min-height:150px}',
    'body.ux-admin .panel-head h2{font-size:21px}',
    'body.ux-admin .version{font-size:12px}',
    'body.ux-admin .side-link:hover{background:#1e4256}',
    'body.ux-admin .side-link.selected{background:#1c4657}',
    'body.ux-admin:not([data-theme="light"]) .side{background:#09111e;color:#dce8f6}',
    'body.ux-admin:not([data-theme="light"]) .header{background:#0a1421ee;border-color:#2c3d54}',
    'body.ux-admin:not([data-theme="light"]) .trail,body.ux-admin:not([data-theme="light"]) .intro p,body.ux-admin:not([data-theme="light"]) .auth-description,body.ux-admin:not([data-theme="light"]) .metric-card p,body.ux-admin:not([data-theme="light"]) .panel-note{color:#b1c3d4}',
    'body.ux-admin:not([data-theme="light"]) .trail strong{color:#edf6ff}',
    'body.ux-admin:not([data-theme="light"]) .auth-card,body.ux-admin:not([data-theme="light"]) .metric-card,body.ux-admin:not([data-theme="light"]) .panel,body.ux-admin:not([data-theme="light"]) .control-group{background:#111d2d;color:#f0f6fc;border-color:#2a3c53}',
    'body.ux-admin:not([data-theme="light"]) .device-card,body.ux-admin:not([data-theme="light"]) .network-item{background:#17263a;border-color:#2b415c;color:#f0f6fc}',
    'body.ux-admin:not([data-theme="light"]) .network-item>span,body.ux-admin:not([data-theme="light"]) .network-item>small,body.ux-admin:not([data-theme="light"]) .metric-label,body.ux-admin:not([data-theme="light"]) .device-line,body.ux-admin:not([data-theme="light"]) .updated,body.ux-admin:not([data-theme="light"]) .controls-help{color:#acbfd1}',
    'body.ux-admin:not([data-theme="light"]) .rank-top strong,body.ux-admin:not([data-theme="light"]) .device-line b,body.ux-admin:not([data-theme="light"]) .area-item strong{color:#f0f7ff}',
    'body.ux-admin:not([data-theme="light"]) .auth-form input,body.ux-admin:not([data-theme="light"]) .filter select,body.ux-admin:not([data-theme="light"]) .control-group select{background:#1a2a40;color:#f0f6fb;border-color:#3a5069}',
    'body.ux-admin:not([data-theme="light"]) .btn.outline{background:#1f3449;color:#f1f7ff;border-color:#3a5470}',
    'body.ux-admin:not([data-theme="light"]) .btn.primary{background:#7ce3e9;color:#082433}',
    'body.ux-admin:not([data-theme="light"]) .btn.quiet{background:#27384f;color:#d3e5f5}',
    'body.ux-admin:not([data-theme="light"]) .donut>div{background:#111d2d}',
    'body.ux-admin:not([data-theme="light"]) .rank-track,body.ux-admin:not([data-theme="light"]) .network-track,body.ux-admin:not([data-theme="light"]) .device-swatch{background:#2c3c52}',
    'body.ux-admin:not([data-theme="light"]) .feature-meta,body.ux-admin:not([data-theme="light"]) .control-group label{color:#e2ecf6}',
    'body.ux-admin:not([data-theme="light"]) .feature-line{border-color:#35475f}',
    'body.ux-admin:not([data-theme="light"]) .controls-status{background:#153845;color:#cdf2f5}',
    'body.ux-admin:not([data-theme="light"]) .donut span,body.ux-admin:not([data-theme="light"]) .auth-form label{color:#b7cad9}',
    'body.ux-admin:not([data-theme="light"]) .panel-tag{background:#22394e;color:#c1ddeb}',
    'body.ux-admin:not([data-theme="light"]) .open-portal{color:#a4edf4}',
    'body.ux-admin:not([data-theme="light"]) .area-item{color:#b7c8d9}',
    'body.ux-admin:not([data-theme="light"]) .control-group input[type="range"]{accent-color:#72e0e7}',
    'body.ux-admin:not([data-theme="light"]) .privacy{background:#112d40}',
    'body.ux-admin:not([data-theme="light"]) .auth-message,body.ux-admin:not([data-theme="light"]) .auth-note{color:#b3c4d3}',
    'body.ux-admin:not([data-theme="light"]) .controls-help{color:#afc2d1}',
    'body.ux-admin[data-theme="colorful"] .metric-card,body.ux-admin[data-theme="colorful"] .panel{background:#111d2df0}',
    'body.ux-admin[data-theme="light"] .side{background:#eaf2fb;color:#395773}',
    'body.ux-admin[data-theme="light"] .header{background:#fffffff3}',
    'body.ux-admin[data-theme="light"] .side-link{color:#38546c}',
    'body.ux-admin[data-theme="light"] .side-link.selected{background:#cee7f8;color:#0c567d}',
    'body.ux-admin[data-theme="light"] .metric-card,body.ux-admin[data-theme="light"] .panel,body.ux-admin[data-theme="light"] .auth-card{background:#fff;color:#162d43}',
    'body.ux-admin[data-theme="light"] .controls-status{background:#e6f5f9;color:#175c71}',
    'body.ux-admin[data-theme="light"] .ux-themes{background:#e7eef7;border-color:#d2dfeb}',
    'body.ux-admin[data-theme="light"] .ux-theme{color:#31536c}',
    'body.ux-admin[data-theme="light"] .ux-theme.active{background:#154b73;color:#fff}',
    '@media (min-width:1050px) and (orientation:landscape){.hero{min-height:255px;padding:26px 38px}.hero h1{font-size:clamp(32px,3vw,52px);margin:12px 0}.hero p{margin-bottom:16px}.ux-actions{grid-template-columns:repeat(4,minmax(0,1fr))}}',
    '@media (max-width:1350px){.ux-actions{grid-template-columns:repeat(2,minmax(0,1fr))}.ux-theme{min-width:60px;padding:8px}.top-right{gap:8px}.date-pill{display:none}.ux-admin .pill{display:none}}',
    '@media (max-width:930px){.ux-actions{grid-template-columns:repeat(2,minmax(0,1fr))}.ux-admin .layout{display:block}.ux-admin .side{position:relative;height:auto;min-height:0}.ux-admin .side nav{display:flex;overflow:auto}.ux-admin .side-link{white-space:nowrap}.ux-admin .side-label,.ux-admin .side-foot,.ux-admin .side-divider{display:none}.ux-admin .metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    '@media (max-width:680px){.ux-actions{grid-template-columns:1fr}.ux-themes{width:100%;justify-content:space-between}.ux-theme{flex:1}.ux-admin .header{display:block}.ux-admin .header-actions{margin-top:10px;justify-content:flex-start}.ux-admin main{padding:16px}}',
    '@media (pointer:coarse){.ux-theme,.ux-pause,.ux-action,.nav-item,.side-link,.btn,.quiz-answer,.quick-card,.lab-card{min-height:58px}}',
    '@media (prefers-reduced-motion:reduce){.ux-layer,.ux-backdrop{transition:none!important}}'
  ].join('');
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  if (admin) root.classList.add('ux-admin');
  const host = admin ? $('.header-actions') : $('.top-right');
  if (!host) return;
  const bar = $('#uxThemeBar') || document.createElement('div');
  bar.className = 'ux-themes';
  bar.setAttribute('role','group');
  bar.setAttribute('aria-label','Tema do TV TOUCH');
  if (!bar.querySelector('[data-ux-theme]')) [['dark','Black'],['light','Claro'],['colorful','Colorido']].forEach(([id,label]) => {
    const b = document.createElement('button');
    b.type = 'button';b.className='ux-theme';b.dataset.uxTheme=id;
    b.textContent=label;b.setAttribute('aria-pressed','false');bar.appendChild(b);
  });
  const pause = $('#uxPause') || document.createElement('button');
  pause.type='button';pause.className='ux-pause';pause.textContent='Pausar cores';
  pause.hidden=true;pause.setAttribute('aria-pressed','false');
  if(!bar.isConnected){if(admin)host.prepend(bar);else host.insertBefore(bar,host.querySelector('.connection'));}
  if(!pause.isConnected){if(admin)host.prepend(pause);else host.insertBefore(pause,host.querySelector('.connection'));}
  const key='tvtouch-theme-mode';
  const backdrop=document.createElement('div');backdrop.className='ux-backdrop';backdrop.setAttribute('aria-hidden','true');
  const layers=[document.createElement('div'),document.createElement('div')];
  for(let i=0;i<2;i++){layers[i].className='ux-layer';backdrop.appendChild(layers[i]);}
  root.prepend(backdrop);
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let active=0,mode='dark',timer=null,paused=false;
  const read=()=>{try{return localStorage.getItem(key)}catch{return null}};
  const store=v=>{try{localStorage.setItem(key,v)}catch{}};
  function paint(layer){
    const h=()=>Math.floor(Math.random()*360),v=.26+Math.random()*.27;
    layer.style.background='radial-gradient(ellipse at 12% 16%,hsla('+h()+',96%,63%,'+v+'),transparent 62%),radial-gradient(ellipse at 85% 22%,hsla('+h()+',93%,58%,'+(v*.82)+'),transparent 60%),radial-gradient(ellipse at 58% 84%,hsla('+h()+',90%,62%,'+(v*.75)+'),transparent 62%)';
  }
  function change(){if(mode!=='colorful'||paused||motion.matches||document.hidden)return;const n=1-active;paint(layers[n]);layers[n].classList.add('on');layers[active].classList.remove('on');active=n;}
  function schedule(){if(timer)clearInterval(timer);timer=null;if(mode==='colorful'&&!paused&&!motion.matches&&!document.hidden)timer=setInterval(change,8200);}
  function setMode(next){
    mode=['dark','light','colorful'].includes(next)?next:'dark';root.dataset.theme=mode;
    document.documentElement.style.colorScheme=mode==='light'?'light':'dark';
    bar.querySelectorAll('button').forEach(b=>{const on=b.dataset.uxTheme===mode;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
    pause.hidden=mode!=='colorful';
    if(mode==='colorful'){paint(layers[active]);layers[active].classList.add('on');}
    const meta=$('meta[name="theme-color"]');if(meta)meta.content=mode==='light'?'#f1f6fc':'#070e19';
    store(mode);schedule();
  }
  bar.addEventListener('click',e=>{const b=e.target.closest('[data-ux-theme]');if(b)setMode(b.dataset.uxTheme)});
  pause.addEventListener('click',()=>{paused=!paused;pause.textContent=paused?'Retomar cores':'Pausar cores';pause.setAttribute('aria-pressed',String(paused));schedule();});
  document.addEventListener('visibilitychange',schedule);
  if(motion.addEventListener)motion.addEventListener('change',schedule);
  setMode(read()||'dark');
  document.querySelectorAll('[data-ux-action]').forEach(b=>b.addEventListener('click',()=>{const t=b.dataset.uxAction;if(t==='lesson')$('#lessonOpen')?.click();else if(t==='fullscreen')$('#fullscreenButton')?.click();else document.querySelector('[data-page="'+t+'"]')?.click();}));
  window.TV_TOUCH_UX_BUILD='1.7.1';
  if (admin) {
    const nav=$('.side nav');
    if(nav&&!nav.querySelector('a[href="#controls"]'))nav.insertAdjacentHTML('beforeend','<a class="side-link" href="#controls"><span>⚙</span> Ferramentas e toque</a>');
    const title=$('#authTitle');if(title)title.textContent='Administração do TV TOUCH.';
    const desc=$('.auth-description');if(desc)desc.textContent='Consulte os indicadores das três TVs, gerencie as ferramentas e ajuste a resposta de toque de cada equipamento.';
    const sub=$('.logo small');if(sub)sub.textContent='Administração';
    const ver=$('.version');if(ver)ver.textContent='TV TOUCH · AGV / v1.7.1';
  } else {
    const title=$('#homeTitle');if(title)title.innerHTML='Aula pronta <span>para toque.</span>';
    const hero=$('.hero-content>p');if(hero)hero.textContent='Escolha a disciplina, abra um recurso e use a TV na horizontal: toque, arraste, amplie e explore com a turma.';
    const context=$('#lessonContextText');if(context&&!context.dataset.uxTouched)context.textContent='Defina a aula, escolha uma ferramenta e comece. As métricas são opcionais.';
    const lesson=$('#lessonCallout');
    if(lesson&&!$('.ux-actions')){
      const grid=document.createElement('div');grid.className='ux-actions';
      const entries=[['PASSO 1','Definir aula','Área, disciplina e equipamento.','lesson'],['PASSO 2','Biblioteca','Mapas, modelos 3D e simulações.','biblioteca'],['PASSO 2','Laboratório','Quadro, sólidos, encaixe e porto.','laboratorio'],['PASSO 3','Tela cheia','Mais espaço para trabalhar.','fullscreen']];
      entries.forEach(([step,label,desc,target])=>{const b=document.createElement('button');b.type='button';b.className='ux-action';b.innerHTML='<small>'+step+'</small><strong>'+label+'</strong><span>'+desc+'</span>';b.addEventListener('click',()=>{if(target==='lesson')$('#lessonOpen')?.click();else if(target==='fullscreen')$('#fullscreenButton')?.click();else document.querySelector('[data-page="'+target+'"]')?.click()});grid.appendChild(b)});
      lesson.insertAdjacentElement('afterend',grid);
    }
    const ver=$('.sidebar-signature');if(ver)ver.textContent='TV TOUCH · AGV / v1.7.1';
  }
})();