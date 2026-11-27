# HAHA Location Replacement Assessment

面向无人零售运营商（客户）的点位换机评估工具。销售在现场按 3 步完成点位诊断、经营测算和客户版报告，帮助运营商判断是否用 HAHA 设备替换旧机。

## 使用方式

- 直接打开根目录 `index.html`（单文件，可离线使用）。
- 数据保存在当前浏览器 `localStorage`，不会上传服务器。
- 在「我的项目」中，每个项目可以单独 `Backup` 为 JSON；`Import` 支持单个项目备份、全部项目导出和旧版数组格式。
- 删除项目前建议先下载备份；删除弹窗内也提供 `Backup` 按钮。
- 分期默认：0% APR、标准 12 期、最长 24 期、签约现付 $50 手续费（可在页面内调整）。

## 开发

源码在 `src/`，根目录 `index.html` 是构建产物，**不要直接改根目录 HTML**。

```text
src/
  index.html            开发用外壳（外链 CSS/JS）
  css/
    base.css            变量、reset、排版
    layout.css          app shell、侧边栏、topbar、页面骨架
    controls.css        按钮、表单、分段控件
    views.css           dashboard、step1、step2、projects、step footer
    report.css          报告纸与打印
    components.css      modal、toast
    responsive.css      响应式
    print.css           打印
  js/
    config.js           常量、机型、默认项目、摊销
    utils.js            格式化、DOM 工具、下载、CSS 收集
    i18n.js             EN/中文文案
    store.js            localStorage、schema normalize、备份/导入
    calc.js             评分、财务模型、图表、步骤校验
    ui-shell.js         侧边栏、topbar、modal、存储警告
    ui-pages.js         dashboard、My Projects
    ui-step1.js         第 01 步
    ui-step2.js         第 02 步
    ui-report.js        第 03 步报告
    sync.js             实时输出、按钮门禁、侧边栏锁
    events.js           事件委托、导入文件、下载报告
    boot.js             挂载与启动
```

构建：

```bash
python build.py
```

构建脚本会把 `src/css/*` 和 `src/js/*` 内联回根目录 `index.html`，保留 GitHub Pages 直接部署和单文件离线分享能力。

## 机型推荐规则

推荐同时看日均订单、场地类型和旧机类型：

| 日均订单 | 推荐机型 | 说明 |
|---|---|---|
| < 10 | Mini 360 | 常规小流量点位 |
| 10 – 17.99 | Plus 440 | 标准单门 |
| 18 – 34.99 | Pro 542 | 北美畅销单门 |
| 35 – 55 | Max 660 / Max 620S | 35–55 单按场地类型二选一 |
| > 55 | Ultra 1200 | 双门超大容积 |
| 旧机为冷冻/鲜食 | Freezer 550 | 优先于订单区间；< 15 单/天提示回本偏慢 |

35–55 单/天的场地拆分：

- **Max 620S（带广告屏）**：酒店、医院、机场/交通枢纽、健身房、高端办公（`office_premium`）。
- **Max 660（最大单门柜）**：工厂、工地、学校、公寓、零售、普通办公。

边界按“35 单进 Max、55 单仍 Max、>55 进 Ultra、18 单进 Pro、10 单进 Plus”处理。

## 版本

v2.3 · Operator Replacement Suite
