import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { initialState, STORAGE_KEY } from '../src/learning.js';

const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const base = 'http://127.0.0.1:5173/';
const contrast = [];
async function capture(route, name) {
  await page.goto(base + '#' + route);
  await page.getByRole('heading', { level: 1 }).waitFor();
  if (page.viewportSize().width <= 760) await page.waitForFunction(() => { const box = document.querySelector('.sidebar').getBoundingClientRect(); return box.right <= 1; });
  if (route === 'labs') await page.getByRole('region', { name: '互动实验区' }).waitFor();
  await page.screenshot({ path: 'docs/' + name + '.png', fullPage: true });
}
async function sampleContrast(route) {
  await page.goto(base + '#' + route);
  await page.getByRole('heading', { level: 1 }).waitFor();
  if (route === 'labs') await page.getByRole('region', {name:'互动实验区'}).waitFor();
  const result = await page.evaluate(() => {
    const color = value => (value.match(/[0-9.]+/g) || []).map(Number);
    const composite = (fg, bg) => { const a = fg[3] ?? 1; return [0,1,2].map(i => fg[i]*a+bg[i]*(1-a)); };
    const luminance = rgb => rgb.map(x => x/255).map(x => x <= 0.04045 ? x/12.92 : ((x+0.055)/1.055)**2.4).reduce((sum,x,i)=>sum+x*[0.2126,0.7152,0.0722][i],0);
    const tested = [];
    for (const el of document.querySelectorAll('main *, .sidebar *, .topbar *')) {
      if (!el.getClientRects().length || el.closest('[inert], [disabled], svg') || ![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())) continue;
      const style = getComputedStyle(el);
      const chain = []; for (let at=el; at; at=at.parentElement) chain.unshift(at);
      let bg=[255,255,255];for(const node of chain)bg=composite(color(getComputedStyle(node).backgroundColor),bg);
      const fg = composite(color(style.color), bg);
      const light = luminance(fg), dark = luminance(bg);
      const ratio = (Math.max(light,dark)+0.05)/(Math.min(light,dark)+0.05);
      const size = parseFloat(style.fontSize), weight=parseFloat(style.fontWeight);
      const threshold = size >= 24 || size >= 18.66 && weight >= 700 ? 3 : 4.5;
      if (!Number.isFinite(ratio)) throw new Error('Color parsing failed: ' + style.color);
      tested.push({text:el.textContent.trim().slice(0,60),selector:el.tagName.toLowerCase()+'.'+[...el.classList].join('.'),ratio:Number(ratio.toFixed(2)),threshold});
    }
    return {count:tested.length,failures:tested.filter(x=>x.ratio<x.threshold)};
  });
  contrast.push({route,...result});
}
try {
  await capture('home', 'desktop');
  await capture('lesson/optimization-2', 'desktop-lesson');
  await capture('projects', 'desktop-project');
  for (const route of ['home','curriculum','plan','lesson/optimization-2','projects','labs','settings','resources','notes','review','search']) await sampleContrast(route);
  await page.setViewportSize({width:390,height:844});
  await capture('home','mobile');
  await capture('labs','mobile-lab');
  await capture('lesson/optimization-2','mobile-lesson');
  await capture('projects','mobile-project');
  await page.getByRole('button',{name:'打开导航'}).click();
  await page.waitForFunction(() => Math.abs(document.querySelector('.sidebar').getBoundingClientRect().x) < 1);
  await page.screenshot({path:'docs/mobile-drawer.png',fullPage:false});
  await page.keyboard.press('Escape');
  await page.setViewportSize({width:1440,height:900});
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify({...state,completed:['orientation-0'],notes:{'orientation-0':'AI 输出需要与业务约束、评测和人工责任一起设计。'}})),{key:STORAGE_KEY,state:initialState});
  await page.reload();
  await capture('home','partial-progress');
  await capture('settings','settings');
  await page.locator('input[type=file]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{}')});
  await page.getByRole('status').waitFor();
  await page.screenshot({path:'docs/error-backup.png',fullPage:true});
  await context.close();
  const deniedContext=await browser.newContext({viewport:{width:1440,height:900}});
  await deniedContext.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('blocked','SecurityError');};});
  const denied=await deniedContext.newPage();await denied.goto(base);await denied.getByRole('alert').waitFor();
  await denied.screenshot({path:'docs/storage-permission.png',fullPage:true});
  writeFileSync('docs/contrast-observations.json',JSON.stringify({method:'Computed text contrast against ancestor solid colors; excludes SVG, disabled and inert content. Manual visual review supplements sampling; not a full accessibility audit.',contrast,errors},null,2));
  console.log(JSON.stringify({contrast:contrast.map(({route,count,failures})=>({route,count,failures:failures.slice(0,10),failureCount:failures.length})),errors},null,2));
} finally { await browser.close(); }
