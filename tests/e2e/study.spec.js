import { test, expect } from '@playwright/test';
import { allLessons } from '../../src/curriculum.js';
import { initialState } from '../../src/learning.js';
test('study, quiz correction, note persistence and backup recovery',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('把行业经验');
 await page.screenshot({path:'docs/desktop.png',fullPage:true});
 await page.getByRole('button',{name:'开始第一课',exact:true}).click();
 await expect(page.getByRole('heading',{level:1})).toHaveText('AI 到底在做什么？');
 await page.getByRole('tab',{name:'自测一下'}).click();await page.getByRole('radio').nth(1).check();await page.getByRole('button',{name:'提交答案'}).click();await expect(page.getByRole('status')).toContainText('再想一想');
 await page.getByRole('button',{name:'自测与复习',exact:true}).click();await expect(page.locator('.review-row')).toHaveCount(1);
 await page.locator('.review-row').click();await page.getByRole('tab',{name:/自测一下/}).click();await page.getByRole('radio').first().check();await page.getByRole('button',{name:'提交答案'}).click();await expect(page.getByRole('status')).toContainText('理解正确');
 await page.getByRole('button',{name:'把理解连接到业务'}).click();await page.getByRole('textbox',{name:'课程笔记'}).fill('需求预测输出数值，补货决策还要检查约束。');await page.getByRole('button',{name:'标记已学',exact:true}).click();
 await page.reload();await page.getByRole('tab',{name:'实践与笔记'}).click();await expect(page.getByRole('textbox',{name:'课程笔记'})).toHaveValue('需求预测输出数值，补货决策还要检查约束。');
 await page.getByRole('button',{name:'我的笔记',exact:true}).click();await expect(page.locator('.note-list')).toContainText('补货决策');
 await page.getByRole('button',{name:'学习设置与备份'}).click();
 const dl=page.waitForEvent('download');await page.getByRole('button',{name:'导出学习记录'}).click();expect((await dl).suggestedFilename()).toBe('知行AI-学习备份.json');
 await page.locator('input[type=file]').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{}')});await expect(page.getByRole('status')).toContainText('备份格式不正确');
 const restored={...initialState,completed:['linear-0'],notes:{'linear-0':'导入的向量理解'},answers:{}};
 await page.locator('input[type=file]').setInputFiles({name:'good.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(restored))});await expect(page.getByRole('status')).toContainText('备份已合并');
 await page.getByRole('button',{name:'我的笔记',exact:true}).click();await expect(page.locator('.note-list')).toContainText('导入的向量理解');expect(errors).toEqual([]);
});
test('all 80 lessons render authored diagrams and quizzes, all routes fit desktop',async({page})=>{
 await page.goto('/');
 for(const lesson of allLessons()){await page.goto('/#lesson/'+lesson.id);await expect(page.getByRole('heading',{level:1})).toHaveText(lesson.title);await expect(page.locator('.flow>span')).toHaveCount(lesson.flow.length);await page.getByRole('tab',{name:/自测一下/}).click();await expect(page.getByRole('radio')).toHaveCount(3);}
 for(const route of ['home','curriculum','plan','labs','projects','review','notes','resources','settings','search']){await page.goto('/#'+route);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
test('labs change real calculations, retrieval can decline and projects persist',async({page})=>{
 await page.goto('/#labs');await expect(page.locator('.lab-metrics')).toContainText('16.0000');await page.getByRole('button',{name:'走一步',exact:true}).click();await expect(page.locator('.lab-metrics')).toContainText('10.2400');
 await page.getByRole('button',{name:'02 需求预测'}).click();await page.getByRole('button',{name:'最小二乘拟合'}).click();await expect(page.locator('.lab-metrics')).toContainText('5.45');
 await page.getByRole('button',{name:'03 向量相似度'}).click();await expect(page.locator('.lab-metrics')).toContainText('0.789');
 await page.getByRole('button',{name:'04 预警与概率'}).click();await expect(page.locator('.formula')).toContainText('7.5%');
 await page.getByRole('button',{name:'05 注意力机制'}).click();await expect(page.locator('.attention-bars')).toContainText('61.3%');
 await page.getByRole('button',{name:'06 RAG 流程'}).click();await page.getByRole('textbox',{name:'提问',exact:true}).fill('明天天气怎样？');for(let i=0;i<3;i++)await page.getByRole('button',{name:'下一步',exact:true}).click();await page.getByRole('button',{name:'查看结果'}).click();await expect(page.getByRole('status')).toContainText('没有足够依据');
 await page.getByRole('button',{name:'07 成本与收益'}).click();await expect(page.locator('.lab-metrics')).toContainText('900');
 await page.getByRole('button',{name:'项目实践',exact:true}).click();await page.getByRole('button',{name:'填入项目模板'}).first().click();await page.getByRole('checkbox').first().check();await page.reload();await expect(page.getByRole('checkbox').first()).toBeChecked();await expect(page.locator('.project textarea').first()).toContainText('用户与任务');
});
test('mobile navigation, content and reduced motion',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.screenshot({path:'docs/mobile.png',fullPage:true});
 expect(await page.locator('.signal').first().evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 await page.getByRole('button',{name:'打开导航'}).click();await page.getByRole('button',{name:'知识地图',exact:true}).click();await expect(page.locator('.sidebar')).not.toHaveClass(/open/);
 for(const route of ['home','curriculum','plan','labs','projects','review','notes','resources','settings','search','lesson/optimization-3']){await page.goto('/#'+route);await expect(page.getByRole('heading',{level:1})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.goto('/#labs');await page.screenshot({path:'docs/mobile-lab.png',fullPage:true});
 await page.goto('/#search');await page.getByRole('textbox',{name:'搜索课程',exact:true}).fill('xyz-no-match-987');await expect(page.getByRole('heading',{name:'没有找到这个关键词'})).toBeVisible();await page.getByRole('button',{name:'清空搜索'}).click();
});
test('storage rejection reports temporary-only state without crashing',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('blocked','SecurityError');};});await page.goto('/');await expect(page.getByRole('alert')).toContainText('仅临时保留');await expect(page.getByRole('button',{name:'开始第一课',exact:true})).toBeVisible();
});
