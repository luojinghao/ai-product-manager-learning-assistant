import { test, expect } from '@playwright/test';
import { allLessons } from '../../src/curriculum.js';
import { initialState, STORAGE_KEY } from '../../src/learning.js';

test('keyboard skip, tabs, drawer trap and focus restoration', async ({ page }) => {
  await page.goto('/#lesson/linear-0');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '跳到正文' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  expect(new URL(page.url()).hash).toBe('#lesson/linear-0');
  const tabs = page.getByRole('tab');
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'linear-0-tab-quiz');
  await page.keyboard.press('End');
  await expect(page.getByRole('textbox', { name: '课程笔记' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.getByRole('button', { name: '打开导航' });
  await menu.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const buttons = page.getByRole('dialog').getByRole('button');
  await buttons.last().focus();
  await page.keyboard.press('Tab');
  await expect(buttons.first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(buttons.last()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(page.locator('.sidebar')).toHaveAttribute('inert', '');
});

test('corrupt local data is preserved until a valid backup is imported', async ({ page }) => {
  await page.addInitScript(key => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem(key, '{broken-original');
      sessionStorage.setItem('seeded', '1');
    }
  }, STORAGE_KEY);
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('原始记录未被覆盖');
  await page.getByRole('button', { name: '开始第一课', exact: true }).click();
  await page.getByRole('button', { name: '标记已学', exact: true }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBe('{broken-original');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出原始记录' }).click();
  expect((await download).suggestedFilename()).toBe('知行AI-原始记录.txt');
  await page.goto('/#settings');
  await page.locator('input[type=file]').setInputFiles({name:'restore.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(initialState))});
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)).completed, STORAGE_KEY)).toEqual(['orientation-0']);
});

test('all lessons fit mobile and saved later-stage lesson has accurate continuation', async ({ page }) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  for (const lesson of allLessons()) {
    await page.goto('/#lesson/' + lesson.id);
    await expect(page.getByRole('heading', {level:1})).toHaveText(lesson.title);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify({...state,last:'daily-0'})),{key:STORAGE_KEY,state:initialState});
  await page.goto('/#home');
  await page.reload();
  await expect(page.locator('.badge')).toContainText('阶段 05');
  await expect(page.getByRole('button',{name:'继续学习',exact:true})).toBeVisible();
});

test('lazy experiment loading and empty notes have clear next actions', async ({ page }) => {
  let releaseLab;
  const waitForRelease = new Promise(resolve => { releaseLab = resolve; });
  await page.route('**/src/Labs.jsx*', async route => { await waitForRelease; await route.continue(); });
  await page.goto('/#notes');
  await expect(page.getByRole('heading', { name: '第一条思考，还在等你' })).toBeVisible();
  await expect(page.getByRole('button', { name: '去写第一条笔记' })).toBeVisible();
  await page.screenshot({path:'docs/empty-notes.png',fullPage:true});
  await page.getByRole('button', {name:'原理实验室',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('正在准备互动实验');
  await page.screenshot({path:'docs/loading-lab.png',fullPage:true});
  releaseLab();
  await expect(page.getByRole('region', {name:'互动实验区'})).toBeVisible();
});

test('experiments respond to parameters and illustration has rendered content', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('img',{name:/神经网络/})).toBeVisible();
  expect(await page.locator('.neural .node').count()).toBeGreaterThan(10);
  const signal=page.locator('.signal').first();
  const before=await signal.evaluate(el=>getComputedStyle(el).strokeDashoffset);
  await expect.poll(()=>signal.evaluate(el=>getComputedStyle(el).strokeDashoffset)).not.toBe(before);
  await page.goto('/#labs');
  await page.getByRole('button',{name:'03 向量相似度'}).click();
  const sliders=page.getByRole('slider');
  await sliders.first().fill('0');await sliders.nth(1).fill('0');
  await expect(page.locator('.lab-metrics')).toContainText('零向量，未定义');
  await page.getByRole('button',{name:'04 预警与概率'}).click();
  await page.getByRole('slider').nth(2).fill('0');
  await expect(page.locator('.formula')).toContainText('100.0%');
  await page.getByRole('button',{name:'05 注意力机制'}).click();
  const attentionBefore=await page.locator('.attention-bars').innerText();
  await page.getByRole('slider').first().fill('5');
  await expect(page.locator('.attention-bars')).not.toHaveText(attentionBefore);
  await page.getByRole('button',{name:'07 成本与收益'}).click();
  await page.getByRole('slider').first().fill('1000');
  await expect(page.locator('.lab-metrics strong').first()).toHaveText('¥30');
});
