import { chapters, allLessons } from './curriculum.js';
export const STORAGE_KEY = 'zhixing-ai-v1';
export const initialState = { version: 1, completed: [], answers: {}, notes: {}, projects: {}, last: 'orientation-0', weeklyHours: 6 };
export function validateBackup(value) {
  const ids = new Set(allLessons().map(l => l.id));
  if (!value || value.version !== 1 || !Array.isArray(value.completed) || !value.completed.every(id => ids.has(id))) throw new Error('备份格式不正确，请选择知行 AI 导出的 JSON 文件。');
  for (const key of ['answers', 'notes', 'projects']) if (!value[key] || typeof value[key] !== 'object' || Array.isArray(value[key])) throw new Error('备份字段缺失，原有记录未修改。');
  if (!Object.entries(value.notes).every(([id, note]) => ids.has(id) && typeof note === 'string' && note.length <= 50000)) throw new Error('笔记数据格式不正确。');
  if (!Object.entries(value.answers).every(([id, answer]) => ids.has(id) && Number.isInteger(answer) && answer >= 0 && answer <= 2)) throw new Error('测验记录格式不正确。');
  const projectIds = new Set(projects.map(p => p.id));
  if (!Object.entries(value.projects).every(([id, p]) => projectIds.has(id) && p && typeof p === 'object' && typeof p.text === 'string' && p.text.length <= 50000 && Array.isArray(p.checked) && p.checked.every(x => Number.isInteger(x) && x >= 0 && x <= 4))) throw new Error('项目数据格式不正确。');
  return { version: 1, completed: [...new Set(value.completed)], answers: { ...value.answers }, notes: { ...value.notes }, projects: Object.fromEntries(Object.entries(value.projects).map(([id, p]) => [id, { text: p.text, checked: [...new Set(p.checked)] }])), last: ids.has(value.last) ? value.last : initialState.last, weeklyHours: Number.isFinite(Number(value.weeklyHours)) ? Math.max(2, Math.min(20, Number(value.weeklyHours) || 6)) : 6 };
}
export function searchLessons(query) {
  const tokens = query.trim().toLowerCase().split(' ').filter(Boolean);
  if (!tokens.length) return [];
  return allLessons().map(l => ({ ...l, score: tokens.reduce((sum, t) => sum + (l.title.toLowerCase().includes(t) ? 5 : 0) + ([l.idea, l.explanation, l.example, l.chapter.title].join(' ').toLowerCase().includes(t) ? 1 : 0), 0) })).filter(l => l.score > 0).sort((a, b) => b.score - a.score);
}
const template = lines => lines.join(String.fromCharCode(10, 10));
export const projects = [
  { id: 'knowledge', title: '供应商知识库助手', tag: 'RAG · 第 13–20 周', desc: '从合同与制度中找出可追溯的答案，对无答案和越权问题拒答。', deliverables: ['脱敏资料、用户访谈与问题清单', '可运行检索原型与带来源的答案', '含无答案、过期、冲突、越权的评测集', '召回、正确性、延迟与成本的对照报告', '至少 3 位目标用户反馈及迭代复盘'], template: template(['【用户与任务】谁在什么场景遇到什么困难？现在耗时多久？','【范围与数据】资料来源、授权、脱敏、版本及更新负责人：','【方案】分块、检索、重排、回答、引用、拒答和人审：','【验收】至少 30 条分层样例；记录基线与目标，不事先虚构结果。','【实验结果】运行日期、版本、正确性、拒答率、P95、单次成本：','【用户反馈与复盘】谁验证了？失败在哪里？下一次改什么？']) },
  { id: 'forecast', title: '需求预测与补货建议', tag: '机器学习 · 第 7–12 周', desc: '用时间切分和朴素基线评估预测，把误差翻译成库存收益。', deliverables: ['字段字典、时间范围及泄漏检查', '朴素基线与模型的可复现对照', '时间回测、SKU 分层的误差报告', '缺货与持有成本的库存仿真', '人工审批、漂移监控和回退方案'], template: template(['【业务决策】预测周期、粒度、交期、缺货和持有成本：','【数据】样本时间、字段定义、缺失值、促销、断货及泄漏检查：','【实验】时间切分、朴素基线、模型和指标：','【回测结果】各 SKU 误差、区间覆盖率及失败样例：','【业务验证】仿真假设、缺货率、周转及对照：','【上线】人审、阈值、监控和回滚负责人：']) },
  { id: 'agent', title: '采购异常处理 Copilot', tag: 'Agent · 第 21–26 周', desc: '识别异常、查询订单、生成建议，在授权和人工确认后执行。', deliverables: ['异常分类、状态机和权限矩阵', '只读工具、参数校验和审计日志', '任务成功率与危险操作测试', '超时、重试、幂等和补偿方案', '试点发布、ROI 与事故复盘'], template: template(['【异常与用户】哪些异常？谁处理？哪些步骤值得自动化？','【工具与权限】输入输出 schema、只读和写入边界、确认节点：','【状态与失败】超时、重试上限、幂等键、终止、转人工及回滚：','【评测】成功、部分成功、危险操作阻断及工具错误：','【发布】影子运行、灰度范围、阈值与负责人：','【反馈与商业结果】节省时间、准确性、人工复核及成本：']) },
];
export const resources = [
 ['机器学习基础', 'Google 机器学习速成课程', 'https://developers.google.com/machine-learning/crash-course?hl=zh-cn'],
 ['数学直觉', '3Blue1Brown：线性代数与神经网络', 'https://www.3blue1brown.com/'],
 ['深度学习', '动手学深度学习（中文）', 'https://zh.d2l.ai/'],
 ['大模型工程', 'Hugging Face LLM Course', 'https://huggingface.co/learn/llm-course/'],
 ['评测与治理', 'NIST AI Risk Management Framework', 'https://www.nist.gov/itl/ai-risk-management-framework'],
 ['可执行练习', 'scikit-learn 用户指南', 'https://scikit-learn.org/stable/user_guide.html'],
];
export function chapterProgress(chapter, completed) { return chapter.lessons.filter((_, i) => completed.includes(chapter.id + '-' + i)).length; }
export function stageProgress(stage, completed) { const list = chapters.filter(c => c.stage === stage); return { done: list.reduce((s, c) => s + chapterProgress(c, completed), 0), total: list.reduce((s, c) => s + c.lessons.length, 0) }; }
