# 安装、分享与部署指南

仓库：https://github.com/luojinghao/ai-product-manager-learning-assistant  
网站：https://luojinghao.github.io/ai-product-manager-learning-assistant/

## 1. 选择方式

| 场景 | 方式 | 条件 |
| --- | --- | --- |
| 朋友直接学习 | 分享网站 | 浏览器、网络，无需 Node |
| 自己本地使用 | 下载源码运行 | 首次联网安装 Node 和依赖；外部阅读仍需网络 |
| 办公室演示 | 局域网访问 | 主机开机、服务运行、同网、必要防火墙放行 |
| 修改维护 | Git clone、测试、推送 | Git、Node、仓库权限 |
| 迁移记录 | JSON 导出导入 | 见操作手册 |

## 2. 首次安装

从 https://nodejs.org/ 安装 Node.js 22 LTS 或更新兼容 LTS，重新打开终端检查：

    node --version
    npm --version

有 Git 时：

    git clone https://github.com/luojinghao/ai-product-manager-learning-assistant.git
    cd ai-product-manager-learning-assistant
    npm ci
    npm run dev

无 Git 时，在仓库 Code → Download ZIP，解压到普通文件夹。在含 package.json 的目录打开终端，运行 npm ci 和 npm run dev。

访问终端实际地址，默认 http://127.0.0.1:5173/ 。普通 Vite 启动遇占用会尝试下个端口；启动脚本固定 5173，冲突报错，以保持记录来源一致。

Windows 安装依赖后可双击 start-learning.cmd，检测现有服务或后台启动，日志见 .learning-server.log 和 .learning-server-error.log。自动打开浏览器失败时手动访问。前台运行 Ctrl+C 停止；后台运行可在任务管理器确认命令行含本项目 vite.js 的 Node 进程再结束，避免误关其他服务。脚本不设置开机启动。

## 3. GitHub Pages 发布

Vite 使用相对资源路径，应用使用 hash 路由，可在仓库子路径打开和刷新课程。

1. 仓库 Settings → Pages。
2. Build and deployment 的 Source 选择 GitHub Actions。
3. Actions → Verify and Deploy Learning Studio；如要求启用 Actions，先允许本仓库运行。
4. 推送 main 自动触发；也可 Run workflow 手动执行。
5. build 完成安装、内容测试、浏览器测试、构建；deploy 发布 dist。
6. 两个任务成功后，在 Pages 设置或工作流环境打开真实网址，测试后分享。

| 触发 | 结果 |
| --- | --- |
| 推送 main | 测试 → 构建 → Pages 发布 |
| Pull Request | 仅验证，不发布 |
| Run workflow | 手动验证和发布 |

工作流使用 GitHub 自带 GITHUB_TOKEN 与 Pages 部署身份，不需要额外 PAT 或模型密钥。公开仓库 Pages 的可用性与限制以当前 GitHub 套餐政策为准。公开网页可被他人访问，不把真实机密写进源码。

Configure Pages 失败时，先设置来源再重新运行。不要选 main 根目录直接发布，根目录是源码，需要构建 dist。

## 4. 更新维护

先备份浏览器记录，检查本地改动，再更新：

    git pull --ff-only
    npm ci
    npm test
    npm run test:e2e
    npm run build

修改后查看并按实际文件暂存：

    git diff
    git add README.md docs src
    git commit -m "docs: update learning guide"
    git push origin main

不要提交 node_modules、dist、日志、密钥或个人备份。修改课程 ID 应兼容已存进度，改数据结构需迁移，不能直接清空。

| 内容 | 文件 |
| --- | --- |
| 课程、案例、自测 | src/curriculum.js |
| 表格、算例、项目步骤 | src/workshops.js |
| 互动实验 | src/Labs.jsx |
| 页面导航 | src/main.jsx |
| 记录校验、搜索、模板 | src/learning.js |
| 样式 | src/styles.css、src/readability.css |
| 发布 | .github/workflows/pages.yml |

## 5. 构建和其他托管

    npm ci
    npm run build
    npm run preview

访问预览实际地址。dist 可发布到支持静态网站的托管，无需后端和环境变量。不要双击 dist/index.html 验证模块页面。fork 或改名时更新 README 和本指南网址。

不同预览端口、域名的记录不互通，用 JSON 迁移。停止网站可在仓库 Pages 设置取消发布，源码和浏览器记录各自独立。

## 6. 局域网分享

    npm run dev -- --host 0.0.0.0

用 ipconfig 查看主机局域网 IPv4。同网络设备访问 http://主机IP:终端端口/ 。127.0.0.1 不能分享给其他电脑。只在可信网络演示，按需允许防火墙；不映射开发服务到公网。主机关机或停止后失效。

## 7. 浏览器测试

本地默认 Google Chrome，CI 使用 Playwright Chromium。无 Chrome 时先运行：

    npx playwright install chromium

PowerShell 设置临时 CI 环境后运行：

    $env:CI = 'true'
    npm run test:e2e
    Remove-Item Env:CI

macOS / Linux：

    CI=true npm run test:e2e

报告在 playwright-report，失败截图和 trace 在 test-results。Actions 失败时保留报告 7 天，目录不提交。测试不等于完整无障碍或学术认证。

## 8. 排障

| 故障 | 排查 |
| --- | --- |
| npm 非命令 | 检查 Node，重开终端；PowerShell 策略问题可用 npm.cmd |
| npm ci 失败 | 网络、Node 版本、lock 文件是否完整；首次需访问 npm 源 |
| 无 package.json | 切到解压后的项目根目录 |
| 缺依赖 | 先 npm ci，再启动 |
| 5173 占用 | 确认原服务，或 npm run dev -- --port 5174；用备份迁移记录 |
| Actions 未运行 | 检查是否启用、是否推 main、权限策略 |
| Pages 404 | 看部署状态、来源、仓库名和真实 URL |
| 实验空白 | 资源网络、旧缓存；先备份再刷新或重新部署 |
| 外网访问慢 | 网络可达性依地区变化，可本地运行或换静态托管 |

添加账号、云同步或真实模型需后端、鉴权和新数据方案。不要把 API 密钥写入前端或仓库。
