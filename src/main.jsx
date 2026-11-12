import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, ArrowLeft, BookOpen, LayoutDashboard, Route, FlaskConical, FolderKanban, NotebookPen, RotateCcw, Search, Check, ChevronRight, ChevronDown, Clock3, Target, Download, Upload, ExternalLink, Menu, X, Sprout, Compass, Lightbulb, CircleCheck, GraduationCap, Settings2, Play, Bookmark, ShieldCheck, CircleHelp, FileText } from 'lucide-react';
import { chapters, stages, allLessons } from './curriculum.js';
import { STORAGE_KEY, initialState, validateBackup, searchLessons, projects, resources, chapterProgress, stageProgress } from './learning.js';
import NeuralGraphic from './NeuralGraphic.jsx';
const Labs = lazy(() => import('./Labs.jsx'));
import { workshops, projectInstructions } from './workshops.js';
import './styles.css';
import './readability.css';
const navItems = [['home', '学习工作台', LayoutDashboard], ['curriculum', '知识地图', BookOpen], ['plan', '成长路线', Route], ['labs', '原理实验室', FlaskConical], ['projects', '项目实践', FolderKanban], ['review', '自测与复习', RotateCcw], ['notes', '我的笔记', NotebookPen]];
const lessons = allLessons();
function loadState() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
    return { state: raw ? validateBackup(JSON.parse(raw)) : initialState, recoveryRaw: null, storageError: false };
  } catch {
    return { state: initialState, recoveryRaw: raw, storageError: raw === null };
  }
}
function App() {
  const [loaded] = useState(loadState);
  const [state, setState] = useState(loaded.state),
    [recoveryRaw, setRecoveryRaw] = useState(loaded.recoveryRaw),
    [page, setPage] = useState(() => location.hash.slice(1) || 'home'),
    [drawer, setDrawer] = useState(false),
    [mobile, setMobile] = useState(() => matchMedia('(max-width: 760px)').matches),
    [query, setQuery] = useState(''),
    [stage, setStage] = useState(-1),
    [toast, setToast] = useState(''),
    [storageError, setStorageError] = useState(loaded.storageError);
  const importRef = useRef(null), sidebarRef = useRef(null);
  useEffect(() => {
    if (recoveryRaw !== null) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state, recoveryRaw]);
  useEffect(() => {
    const media = matchMedia('(max-width: 760px)');
    const changed = () => { setMobile(media.matches); if (!media.matches) setDrawer(false); };
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);
  useEffect(() => {
    const onHash = () => {
      setPage(location.hash.slice(1) || 'home');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (!drawer) return;
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebarRef.current.querySelector('nav button[aria-current="page"], nav button').focus();
    const handler = e => {
      if (e.key === 'Escape') setDrawer(false);
      if (e.key === 'Tab') {
        const controls = [...sidebarRef.current.querySelectorAll('button, a[href]')].filter(el => !el.disabled);
        const first = controls[0], last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [drawer]);
  const go = p => {
    setPage(p);
    location.hash = p;
    setDrawer(false);
    window.scrollTo(0, 0);
  };
  const openLesson = id => {
    setState(s => ({
      ...s,
      last: id
    }));
    go('lesson/' + id);
  };
  const update = patch => setState(s => ({
    ...s,
    ...patch
  }));
  const current = lessons.find(l => l.id === state.last) || lessons[0],
    nextLesson = lessons.find(l => !state.completed.includes(l.id)) || lessons[0];
  const percent = Math.round(state.completed.length / lessons.length * 100);
  function download(content, name, type = 'application/json') {
    const url = URL.createObjectURL(new Blob([content], {
      type
    }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportData() {
    download(JSON.stringify(state, null, 2), '知行AI-学习备份.json');
    setToast('学习记录已导出');
  }
  async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 3000000) throw new Error('文件过大，请选择 3 MB 以内的备份。');
      const data = validateBackup(JSON.parse(await file.text())); setRecoveryRaw(null);
      setState(s => ({
        ...s,
        ...data,
        completed: [...new Set([...s.completed, ...data.completed])],
        notes: {
          ...s.notes,
          ...data.notes
        },
        answers: {
          ...s.answers,
          ...data.answers
        },
        projects: {
          ...s.projects,
          ...data.projects
        }
      }));
      setToast('备份已合并，同一条记录使用导入版本');
    } catch (error) {
      setToast(error.message === 'Unexpected end of JSON input' ? '文件不是有效的学习备份。' : error.message);
    }
    event.target.value = '';
  }
  const selected = page.startsWith('lesson/') ? 'curriculum' : page;
  return <div className="app"><a className="skip-link" href="#main-content" onClick={e => { e.preventDefault(); document.getElementById('main-content').focus(); }}>跳到正文</a>{drawer && <button className="scrim" aria-label="关闭导航" onClick={() => setDrawer(false)} />}<aside ref={sidebarRef} id="study-navigation" className={'sidebar ' + (drawer ? 'open' : '')} inert={mobile && !drawer} role={drawer ? 'dialog' : undefined} aria-modal={drawer ? true : undefined} aria-label="学习导航">{drawer && <button className="drawer-close icon-button" aria-label="关闭导航" onClick={() => setDrawer(false)}><X size={19} /></button>}<button className="brand" onClick={() => go('home')}><span className="brand-symbol"><Sprout size={25} /></span><span>知行 <b>AI</b><small>产品经理研习室</small></span></button><div className="workspace-label">个人学习空间 <span>LOCAL</span></div><nav aria-label="主导航">{navItems.map(([id, label, Icon]) => <button key={id} onClick={() => go(id)} className={selected === id ? 'active' : ''} aria-current={selected === id ? 'page' : undefined}><Icon size={19} /><span>{label}</span>{id === 'review' && Object.keys(state.answers).some(id => state.answers[id] !== lessons.find(l => l.id === id)?.quiz.answer) && <i className="nav-dot" />}</button>)}</nav><div className="sidebar-bottom"><div className="sidebar-progress"><div><Sprout size={17} /><strong>每一步，都算数</strong></div><p>已学 {state.completed.length} / {lessons.length} 节</p><Progress value={percent} /><small>朝着能独立交付的自己</small></div><button className={selected === 'resources' ? 'utility active' : 'utility'} onClick={() => go('resources')}><Compass size={18} />参考资料与术语</button><button className={selected === 'settings' ? 'utility active' : 'utility'} onClick={() => go('settings')}><Settings2 size={18} />学习设置与备份</button><div className="profile"><span>学</span><div><strong>供应链 → AI 产品经理</strong><small>从你的行业经验出发</small></div></div></div></aside>
 <div className="main-shell" inert={drawer}><header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" aria-label="打开导航" aria-expanded={drawer} aria-controls="study-navigation" onClick={() => setDrawer(!drawer)}><Menu size={21} /></button><span>我的研习室</span><ChevronRight size={14} /><strong>{navItems.find(x => x[0] === selected)?.[1] || {
              resources: '参考资料',
              settings: '学习设置',
              search: '课程检索'
            }[selected] || '知识地图'}</strong></div><form className="top-search" onSubmit={e => {
          e.preventDefault();
          go('search');
        }}><Search size={17} /><input aria-label="搜索知识与课程" placeholder="搜索知识、概念、问题…" value={query} onChange={e => setQuery(e.target.value)} /><button type="submit" title="搜索" aria-label="提交搜索"><ArrowRight size={16} /></button></form><span className="local-indicator"><i />本地学习空间</span></header>
 <main id="main-content" tabIndex="-1">{recoveryRaw !== null && <div className="storage-alert" role="alert">已保存的记录格式异常，原始记录未被覆盖。本次学习暂存在内存；请导出记录后，在设置中导入有效备份以恢复保存。<button onClick={() => download(recoveryRaw, '知行AI-原始记录.txt', 'text/plain')}>导出原始记录</button><button onClick={exportData}>导出本次学习</button></div>}{storageError && <div className="storage-alert" role="alert">浏览器无法保存记录，当前修改仅临时保留。请及时导出备份。<button onClick={exportData}>导出备份</button></div>}
 {page === 'home' ? <><div className="page-heading"><div><span className="eyebrow">YOUR NEXT CHAPTER</span><h1>把行业经验，变成 AI 产品力<span className="heading-dot">.</span></h1><p>从一个原理，到一个能解决真实问题的产品。</p></div><span className="date-tag">循序渐进 · 学以致用</span></div><div className="home-grid"><div className="home-main"><section className="continue-panel"><div className="continue-copy"><span className="badge">{state.completed.length || current.id !== lessons[0].id ? '继续你的学习' : '从这里开始'}<span>阶段 {String(current.chapter.stage + 1).padStart(2, '0')}</span></span><h2>{current.title}</h2><p>{current.idea}</p><div className="meta"><span><BookOpen size={15} />第 {current.chapterIndex + 1} 章 · 第 {current.index + 1} 节</span><span><Clock3 size={15} />约 20 分钟</span></div><button className="primary" onClick={() => openLesson(current.id)}>{state.completed.length || current.id !== lessons[0].id ? '继续学习' : '开始第一课'}<ArrowRight size={17} /></button></div><div className="network-preview"><span className="diagram-caption">从输入，到预测</span><NeuralGraphic /><div className="diagram-key"><i />信息流动 <span>f(x) → ŷ</span></div></div></section><section className="learning-path"><SectionTitle eyebrow="LEARNING PATH" title="一张地图，五个成长阶段" action="查看完整路线" onAction={() => go('plan')} /><div className="stage-track">{stages.map((s, i) => {
                    const p = stageProgress(i, state.completed);
                    return <button key={s.name} onClick={() => {
                      setStage(i);
                      go('curriculum');
                    }} className={s.color}><span className="stage-number">0{i + 1}{p.done === p.total && p.total > 0 && <Check size={13} />}</span><strong>{s.name}</strong><small>{s.weeks}</small><span className="track-line" /></button>;
                  })}</div></section><section><SectionTitle eyebrow="THE FOUNDATIONS" title="从基础，建立你的判断力" action="全部章节" onAction={() => {
                  setStage(-1);
                  go('curriculum');
                }} /><div className="chapter-cards">{chapters.slice(0, 3).map((c, i) => <button className="chapter-card" key={c.id} onClick={() => openLesson(c.id + '-0')}><div className={'chapter-art art-' + i}>{i === 0 ? <Compass size={44} strokeWidth={1.2} /> : i === 1 ? <span className="math-art">x · w + b</span> : <span className="math-art">P(A|B)</span>}<span>0{i + 1}</span></div><div className="chapter-info"><small>CHAPTER 0{i + 1} <span>{c.lessons.length} 节</span></small><h3>{c.title}</h3><p>{c.subtitle}</p><div className="card-footer"><span>{chapterProgress(c, state.completed) ? '已学 ' + chapterProgress(c, state.completed) + ' 节' : '开始探索'}</span><ArrowRight size={17} /></div></div></button>)}</div></section><section className="practice-banner"><span className="practice-symbol"><FolderKanban size={27} /></span><div><small>从熟悉的业务开始</small><h3>把第一个 AI 作品，做在供应链里</h3><p>供应商知识库 · 需求预测 · 采购异常处理</p></div><button onClick={() => go('projects')}>进入项目实践<ArrowRight size={16} /></button></section></div><aside className="right-rail"><section className="progress-panel"><div className="section-heading"><h3>我的学习进度</h3><Target size={19} /></div><div className="progress-ring" style={{
                  '--progress': percent * 3.6 + 'deg'
                }}><div><strong>{percent}<span>%</span></strong><small>知识学习</small></div></div><div className="rail-stats"><div><strong>{state.completed.length}</strong><small>已学课程</small></div><div><strong>{Object.keys(state.notes).filter(k => state.notes[k].trim()).length}</strong><small>思考笔记</small></div><div><strong>{Object.values(state.projects).filter(p => p.checked?.length === 5).length}</strong><small>项目自查</small></div></div><p className="muted small">完成课程是起点，真实能力由项目、评测和用户反馈验证。</p></section><section className="today-panel"><span className="eyebrow">TODAY'S FOCUS</span><h3>今天，留 30 分钟给成长</h3><div className="today-step"><span>1</span><div><strong>理解一个概念</strong><small>读课程，讲出自己的解释</small></div><b>15m</b></div><div className="today-step"><span>2</span><div><strong>亲手改变一个参数</strong><small>在实验里观察因果</small></div><b>10m</b></div><div className="today-step"><span>3</span><div><strong>写下一个业务联想</strong><small>把知识连接到供应链</small></div><b>5m</b></div><button className="text-button" onClick={() => openLesson(nextLesson.id)}>开始今天的学习<ArrowRight size={16} /></button></section><section className="thought-panel"><Lightbulb size={23} /><h3>你并不是从零开始</h3><p>理解业务流程、用户需求和交付约束，是你的经验优势。接下来，补上对数据和模型的判断。</p><button className="text-button" onClick={() => openLesson('orientation-3')}>我的能力起点<ArrowRight size={15} /></button></section></aside></div></> : page === 'curriculum' ? <><PageTitle eyebrow="KNOWLEDGE MAP" title="让知识，有来路也有去处" desc={'共 ' + chapters.length + ' 章 · ' + lessons.length + ' 节。按顺序建立基础，也可以带着业务问题查阅。'} /><div className="filter-row"><button className={stage === -1 ? 'selected' : ''} onClick={() => setStage(-1)}>全部阶段</button>{stages.map((s, i) => <button key={s.name} className={stage === i ? 'selected' : ''} onClick={() => setStage(i)}>{String(i + 1).padStart(2, '0')} {s.name}</button>)}</div><div className="chapter-list">{chapters.filter(c => stage === -1 || c.stage === stage).map(c => <details className="chapter-row" key={c.id} open={stage !== -1}><summary><span className="chapter-index">{String(chapters.indexOf(c) + 1).padStart(2, '0')}</span><div><small>{stages[c.stage].name}</small><h2>{c.title}</h2><p>{c.subtitle}</p></div><span className="chapter-count">{chapterProgress(c, state.completed)} / {c.lessons.length}</span><ChevronDown size={19} /></summary><div className="lesson-list">{c.lessons.map((l, i) => <button key={i} onClick={() => openLesson(c.id + '-' + i)}><span className={state.completed.includes(c.id + '-' + i) ? 'lesson-check done' : 'lesson-check'}>{state.completed.includes(c.id + '-' + i) ? <Check size={15} /> : i + 1}</span><div><strong>{l.title}</strong><small>{l.idea}</small></div><span className="lesson-time">20 分钟</span><ChevronRight size={17} /></button>)}</div></details>)}</div></> : page.startsWith('lesson/') ? <Lesson key={page} item={lessons.find(l => l.id === page.slice(7)) || lessons[0]} state={state} setState={setState} go={go} openLesson={openLesson} notify={setToast} /> : page === 'labs' ? <><PageTitle eyebrow="THE PRINCIPLE LAB" title="看得见的原理，摸得着的变化" desc="从数学到应用，亲手改变输入，观察输出。" /><Suspense fallback={<div className="lab-loading" role="status" aria-busy="true"><FlaskConical size={26} /><p>正在准备互动实验…</p></div>}><Labs /></Suspense></> : page === 'plan' ? <><PageTitle eyebrow="YOUR GROWTH ROADMAP" title="32 周，把理解变成作品" desc="每周建议 6 小时：概念 2 小时、实验 1 小时、项目 2 小时、复盘 1 小时。可按实际时间调整。" /><div className="plan-top"><label className="field">每周可投入时间<select value={state.weeklyHours} onChange={e => update({
                weeklyHours: Number(e.target.value)
              })}>{[2, 4, 6, 8, 10, 15, 20].map(n => <option key={n} value={n}>{n} 小时 / 周</option>)}</select></label><p>按总计约 192 小时规划，你的参考周期为 <strong>{Math.ceil(192 / state.weeklyHours)} 周</strong>。真实项目耗时依数据和反馈而变化。</p></div><div className="roadmap">{stages.map((s, i) => <section key={s.name}><div className={'roadmap-marker ' + s.color}>0{i + 1}</div><div className="roadmap-body"><small>{s.weeks} · 基准 6 小时 / 周</small><h2>{s.name}</h2><p>{s.outcome}</p><div className="roadmap-chapters">{chapters.filter(c => c.stage === i).map(c => <button key={c.id} onClick={() => openLesson(c.id + '-0')}>{c.title}<ChevronRight size={15} /></button>)}</div><div className="milestone"><ShieldCheck size={18} /><span>阶段验收：{['讲清四种 AI 任务；手算点积、贝叶斯与一次梯度更新。', '完成时间回测，和朴素基线比较，解释误报与漏报成本。', '做出带来源、拒答和评测集的 RAG；画出 Agent 权限边界。', '提交 PRD、评测报告、成本方案、灰度与回滚清单。', '得到真实用户反馈，形成作品集，并完成一次事故或失败复盘。'][i]}</span></div></div></section>)}</div><p className="callout">“五年经验”无法由课时换算。用独立交付、跨团队决策、长期运营和可核验成果逐步接近成熟水平。</p></> : page === 'projects' ? <><PageTitle eyebrow="BUILD SOMETHING REAL" title="从业务问题，到你的第一份作品" desc="用脱敏或合成数据起步，再进入有授权的试点。勾选仅代表自查，不等于外部验收。" /><div className="project-list">{projects.map((p, i) => <Project key={p.id} project={p} index={i} value={state.projects[p.id]} onChange={v => setState(s => ({
              ...s,
              projects: {
                ...s.projects,
                [p.id]: v
              }
            }))} download={download} />)}</div></> : page === 'review' ? <><PageTitle eyebrow="RECALL & REFLECT" title="记住的知识，才会变成判断" desc="先尝试回忆，再返回原文查证。答错的题会留在这里，答对后移出。" /><Review state={state} openLesson={openLesson} /></> : page === 'notes' ? <><PageTitle eyebrow="YOUR THINKING JOURNAL" title="给知识，留下一点自己的理解" desc="笔记随课程保存。试着写：它是什么、为什么有用、在我的业务里怎么用。" />{lessons.filter(l => state.notes[l.id]?.trim()).length ? <div className="note-list">{lessons.filter(l => state.notes[l.id]?.trim()).map(l => <article key={l.id}><small>{l.chapter.title}</small><h2>{l.title}</h2><p>{state.notes[l.id]}</p><button className="text-button" onClick={() => openLesson(l.id)}>回到课程编辑<ArrowRight size={16} /></button></article>)}</div> : <Empty icon={NotebookPen} title="第一条思考，还在等你" text="在课程页写下理解与问题，它们会汇集在这里。" action="去写第一条笔记" onAction={() => openLesson(current.id)} />}</> : page === 'search' ? <><PageTitle eyebrow="FIND YOUR ANSWER" title="带着问题，找到知识的线索" desc="搜索范围是本地课程；结果显示课程原文，未接入生成式 AI。" /><label className="large-search"><Search size={22} /><input aria-label="搜索课程" value={query} onChange={e => setQuery(e.target.value)} placeholder="例如：梯度、RAG、评测、供应商" /></label>{query.trim() ? <><p className="muted">找到 {searchLessons(query).length} 节相关课程</p><div className="search-results">{searchLessons(query).map(l => <button key={l.id} onClick={() => openLesson(l.id)}><small>{l.chapter.title}</small><h2>{l.title}<ArrowRight size={18} /></h2><p>{l.explanation}</p><span>供应链例子：{l.example}</span></button>)}</div>{!searchLessons(query).length && <Empty icon={Search} title="没有找到这个关键词" text="试试更短的概念，例如“概率”“检索”“成本”。" action="清空搜索" onAction={() => setQuery('')} />}</> : <div className="suggestions">{['向量', '概率', '梯度', '评测', 'RAG', 'Agent', '成本'].map(q => <button key={q} onClick={() => setQuery(q)}>{q}</button>)}</div>}</> : page === 'resources' ? <><PageTitle eyebrow="GO DEEPER" title="回到可信资料，继续向下探索" desc="先用本站建立直觉，再用公开课程、论文与官方文档深入。外部资料的语言和版本可能变化。" /><div className="resource-list">{resources.map(([tag, name, url]) => <a key={url} href={url} target="_blank" rel="noreferrer"><span className="resource-icon"><BookOpen size={22} /></span><div><small>{tag}</small><h2>{name}</h2></div><ExternalLink size={19} /></a>)}</div><h2 className="spaced-heading">高频术语速查</h2><div className="table-wrap"><table><thead><tr><th>术语</th><th>白话理解</th><th>产品经理要问</th></tr></thead><tbody>{[['Token', '模型处理的文本片段，不等于汉字数', '上下文和成本预算是多少？'], ['Embedding', '把对象编码为可比较的数字向量', '编码模型和检索任务匹配吗？'], ['RAG', '先检索资料，再基于资料生成', '来源、时效和越权怎样处理？'], ['Agent', '模型在边界内选择并调用工具', '权限、停止、失败和人审在哪里？'], ['Fine-tuning', '用样本继续训练模型参数', '是行为问题，还是缺少最新知识？'], ['Hallucination', '生成看似可信但无依据的内容', '能引用、校验、拒答和回退吗？'], ['Drift', '数据或任务分布随时间变化', '谁监控？何时重新评测？'], ['Inference', '用训练好的模型处理新输入', '延迟、吞吐、成本和版本如何？']].map(row => <tr key={row[0]}>{row.map((v, i) => <td key={i}>{v}</td>)}</tr>)}</tbody></table></div></> : page === 'settings' ? <><PageTitle eyebrow="YOUR LEARNING DATA" title="让学习记录，始终在你手里" desc="进度、答案、笔记和项目草稿保存在当前浏览器，没有账号和云同步。" /><section className="settings-section"><h2>备份与恢复</h2><p>换浏览器或清理浏览数据前导出备份。导入会合并已学课程，并用导入版本更新同一条笔记和答案。</p><div className="button-row"><button className="primary" onClick={exportData}><Download size={17} />导出学习记录</button><button onClick={() => importRef.current.click()}><Upload size={17} />导入备份</button></div><input hidden ref={importRef} type="file" accept=".json,application/json" onChange={importData} /></section><section className="settings-section"><h2>课程范围与能力目标</h2><p>覆盖 AI 产品经理的核心数学、机器学习、深度学习、大模型、RAG、Agent、数据、工程、产品规划、交付运营与职业实践。AI 学科持续发展，学习地图不等于穷尽所有研究方向。</p><p>32 周为参考节奏。课程完成和自测分数不能认证五年资历；项目需要目标用户、工程协作、上线结果与外部评审。</p></section><section className="settings-section"><h2>版本与隐私</h2><p>本地课程版 v1.0 · 课程编写基准：2026 年 11 月。模型规格和价格请以使用时官方文档为准。不要把真实合同、账号密钥或个人信息放入练习笔记。</p><p>互动实验是明确标注的教学模型。课程搜索使用原文匹配，没有联网生成答案。</p></section></> : <Empty icon={Compass} title="这条路径还没有内容" text="回到学习工作台继续你的课程。" action="回到工作台" onAction={() => go('home')} />}
 <footer className="footer"><span>知行 AI · 理解原理，做出产品。</span><span>独立思考 · 实验验证 · 真实反馈</span></footer></main></div>{toast && <div className="toast" role="status"><CircleCheck size={18} /><span>{toast}</span><button aria-label="关闭提示" onClick={() => setToast('')}><X size={15} /></button></div>}</div>;
}
function Progress({
  value
}) {
  return <div className="progress-bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label="学习进度"><i style={{
      width: value + '%'
    }} /></div>;
}
function PageTitle({
  eyebrow,
  title,
  desc
}) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{desc}</p></div></div>;
}
function SectionTitle({
  eyebrow,
  title,
  action,
  onAction
}) {
  return <div className="section-title"><div><small>{eyebrow}</small><h2>{title}</h2></div>{action && <button className="text-button" onClick={onAction}>{action}<ArrowRight size={15} /></button>}</div>;
}
function Empty({
  icon: Icon,
  title,
  text,
  action,
  onAction
}) {
  return <div className="empty-state"><Icon size={35} strokeWidth={1.3} /><h2>{title}</h2><p>{text}</p><button className="primary" onClick={onAction}>{action}<ArrowRight size={16} /></button></div>;
}
function Workshop({
  chapterId
}) {
  const w = workshops[chapterId];
  if (!w) return null;
  return <section className="workshop"><h2>{w.title}</h2><div className="table-wrap"><table><thead><tr>{w.columns.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{w.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div><h3>把例子算到底</h3><p className="worked-example">{w.worked}</p><h3>落到行动</h3><ol>{w.steps.map(s => <li key={s}>{s}</li>)}</ol><p className="callout">容易忽略：{w.pitfall}</p></section>;
}
function Lesson({
  item: l,
  state,
  setState,
  go,
  openLesson,
  notify
}) {
  const [choice, setChoice] = useState(state.answers[l.id] ?? null),
    [submitted, setSubmitted] = useState(state.answers[l.id] !== undefined),
    [tab, setTab] = useState('learn');
  const tabs = [['learn', '理解与图解'], ['quiz', '自测一下'], ['note', '实践与笔记']];
  const changeTabByKey = e => {
    const at = tabs.findIndex(([id]) => id === tab);
    const index = e.key === 'ArrowRight' ? (at + 1) % tabs.length : e.key === 'ArrowLeft' ? (at + tabs.length - 1) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
    if (index === null) return;
    e.preventDefault();
    setTab(tabs[index][0]);
    e.currentTarget.parentElement.children[index].focus();
  };
  const position = lessons.findIndex(x => x.id === l.id),
    done = state.completed.includes(l.id);
  const submit = () => {
    setSubmitted(true);
    setState(s => ({
      ...s,
      answers: {
        ...s.answers,
        [l.id]: choice
      }
    }));
  };
  const mark = () => {
    setState(s => ({
      ...s,
      completed: done ? s.completed.filter(id => id !== l.id) : [...s.completed, l.id]
    }));
    notify(done ? '已取消已学标记' : '课程已标记已学，记得完成自测与实践');
  };
  return <div className="lesson-page"><button className="back-button" onClick={() => go('curriculum')}><ArrowLeft size={16} />知识地图</button><div className="lesson-header"><span className="eyebrow">CHAPTER {String(l.chapterIndex + 1).padStart(2, '0')} / LESSON {l.index + 1}</span><h1>{l.title}</h1><p>{l.idea}</p><div className="meta"><span><Clock3 size={15} />约 20 分钟</span><span><BookOpen size={15} />{l.chapter.title}</span><span>前置：{position === 0 ? '无需 AI 基础' : lessons[position - 1].title}</span></div></div><div className="lesson-tabs" role="tablist" aria-label="课程内容">{tabs.map(([id, label]) => <button role="tab" id={l.id + '-tab-' + id} aria-controls={l.id + '-panel-' + id} tabIndex={tab === id ? 0 : -1} aria-selected={tab === id} key={id} onKeyDown={changeTabByKey} onClick={() => setTab(id)}>{label}{id === 'quiz' && state.answers[l.id] !== undefined && <span>1</span>}</button>)}</div>
 <div role="tabpanel" id={l.id + '-panel-' + tab} aria-labelledby={l.id + '-tab-' + tab} tabIndex={0}>{tab === 'learn' ? <article className="lesson-content"><div className="lesson-explainer"><span className="sub-label"><Lightbulb size={17} />先用白话理解</span><p>{l.explanation}</p></div><div className="concept-map"><span className="sub-label">把过程连起来</span><div className="flow">{l.flow.map((step, i) => <React.Fragment key={i}><span>{step}</span>{i < l.flow.length - 1 && <ArrowRight size={17} />}</React.Fragment>)}</div></div><div className="formula-block"><small>关键表达</small><p>{l.formula}</p></div><div className="business-example"><span className="sub-label"><FolderKanban size={17} />换成你熟悉的供应链</span><p>{l.example}</p></div><div className="lesson-actions"><button onClick={() => go('labs')}><FlaskConical size={17} />去原理实验室</button><button className="primary" onClick={() => setTab('quiz')}>检验一下理解<ArrowRight size={16} /></button></div><a className="resource-link" href={l.chapter.resource[1]} target="_blank" rel="noreferrer"><BookOpen size={16} />延伸阅读：{l.chapter.resource[0]}<ExternalLink size={14} /></a></article> : tab === 'quiz' ? <section className="quiz-panel"><span className="eyebrow">RETRIEVAL PRACTICE</span><h2>{l.quiz.question}</h2><fieldset><legend className="sr-only">选择一个答案</legend>{l.quiz.options.map((option, i) => <label key={option} className={'quiz-option ' + (choice === i ? 'chosen ' : '') + (submitted && i === l.quiz.answer ? 'correct' : '')}><input type="radio" name={'quiz-' + l.id} value={i} checked={choice === i} onChange={() => {
            setChoice(i);
            setSubmitted(false);
          }} /><span>{String.fromCharCode(65 + i)}</span><strong>{option}</strong>{submitted && i === l.quiz.answer && <Check size={18} />}</label>)}</fieldset><button className="primary" disabled={choice === null} onClick={submit}>提交答案<ArrowRight size={16} /></button>{submitted && <div className={'quiz-feedback ' + (choice === l.quiz.answer ? 'success' : 'retry')} role="status"><strong>{choice === l.quiz.answer ? '理解正确' : '再想一想：正确答案是 ' + String.fromCharCode(65 + l.quiz.answer)}</strong><p>{l.quiz.why}</p><button className="text-button" onClick={() => setTab(choice === l.quiz.answer ? 'note' : 'learn')}>{choice === l.quiz.answer ? '把理解连接到业务' : '回看原理'}<ArrowRight size={15} /></button></div>}</section> : <section className="note-editor"><span className="sub-label"><Target size={18} />动手任务</span><p className="task-text">{l.task}</p><label className="field">我的理解、业务联想与待查问题<textarea aria-label="课程笔记" placeholder="它是什么？在我的业务里能做什么？有什么边界？" value={state.notes[l.id] || ''} maxLength={50000} onChange={e => setState(s => ({
          ...s,
          notes: {
            ...s.notes,
            [l.id]: e.target.value
          }
        }))} rows={12} /></label><small className="muted">自动保存到当前浏览器 · {(state.notes[l.id] || '').length} 字</small></section>}
 {tab === 'learn' && <Workshop chapterId={l.chapter.id} />}</div>
 <div className="lesson-navigation"><button className={done ? 'completed-button' : ''} onClick={mark}><CircleCheck size={18} />{done ? '已标记已学' : '标记已学'}</button><div><button className="icon-button" aria-label="上一节" title="上一节" disabled={!position} onClick={() => openLesson(lessons[position - 1].id)}><ArrowLeft size={17} /></button><span>{position + 1} / {lessons.length}</span><button className="primary" disabled={position === lessons.length - 1} onClick={() => openLesson(lessons[position + 1].id)}>下一节<ArrowRight size={16} /></button></div></div></div>;
}
function Project({project:p,index,value,onChange,download}) {
 const data=value||{text:'',checked:[]}; const [open,setOpen]=useState(index===0);const info=projectInstructions[index];
 return <article className="project"><div className="project-heading"><span className="project-number">0{index+1}</span><div><small>{p.tag}</small><h2>{p.title}</h2><p>{p.desc}</p></div><button onClick={()=>setOpen(!open)} aria-expanded={open}>{open?'收起':'展开'}<ChevronDown size={17}/></button></div>{open&&<>
 <div className="project-guide"><h3>从可运行基线开始</h3><p>在本项目目录打开终端运行：</p><code>{info.command}</code><ol>{info.steps.map(s=><li key={s}>{s}</li>)}</ol><p className="callout">{info.limits}</p></div>
 <div className="project-body"><div><h3>可被检查的交付物</h3>{p.deliverables.map((d,i)=><label className="deliverable" key={d}><input type="checkbox" checked={data.checked.includes(i)} onChange={()=>onChange({...data,checked:data.checked.includes(i)?data.checked.filter(x=>x!==i):[...data.checked,i]})}/><span>{d}</span></label>)}<p className="small muted">自查 {data.checked.length} / 5 · 建议邀请业务和工程同事进行外部评审。</p><button className="text-button" disabled={!!data.text} onClick={()=>onChange({...data,text:p.template})}>填入项目模板<FileText size={16}/></button></div><div><label className="field">项目工作稿<textarea rows={14} value={data.text} onChange={e=>onChange({...data,text:e.target.value})} placeholder="记录问题、假设、实验和结果…" maxLength={50000}/></label><div className="editor-footer"><small>自动保存到当前浏览器</small><button disabled={!data.text.trim()} onClick={()=>download(p.title+String.fromCharCode(10,10)+data.text,p.title+'.md','text/markdown')}><Download size={15}/>导出作品稿</button></div></div></div></>}</article>;
}
function Review({
  state,
  openLesson
}) {
  const wrong = lessons.filter(l => state.answers[l.id] !== undefined && state.answers[l.id] !== l.quiz.answer),
    answered = Object.keys(state.answers).length,
    correct = answered - wrong.length;
  return <><div className="review-stats"><div><strong>{answered}</strong><span>已自测</span></div><div><strong>{correct}</strong><span>答对</span></div><div><strong>{wrong.length}</strong><span>待复习</span></div><div><strong>{answered ? Math.round(correct / answered * 100) : 0}%</strong><span>当前正确率</span></div></div><h2 className="spaced-heading">{wrong.length ? '从这些问题，再理解一次' : '开始主动回忆'}</h2>{(wrong.length ? wrong : lessons.filter(l => state.completed.includes(l.id) || state.answers[l.id] === undefined).slice(0, 8)).map(l => <button className="review-row" key={l.id} onClick={() => openLesson(l.id)}><CircleHelp size={21} /><div><small>{l.chapter.title}</small><strong>{l.quiz.question}</strong></div><span>{wrong.includes(l) ? '重新学习' : '去自测'}</span><ChevronRight size={18} /></button>)}<p className="callout">单题自测用于学习反馈，不认证职业水平。答对之后，尝试不用提示把概念讲给同事，并完成真实业务练习。</p></>;
}
class ErrorBoundary extends React.Component {
  state = {
    error: false
  };
  static getDerivedStateFromError() {
    return {
      error: true
    };
  }
  render() {
    return this.state.error ? <div className="fatal-error"><h1>页面暂时没有加载成功</h1><p>请刷新页面重试。已保存的学习记录仍保留在当前浏览器。</p><button onClick={() => location.reload()}>重新加载</button></div> : this.props.children;
  }
}
createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>);
