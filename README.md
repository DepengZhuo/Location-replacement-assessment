# HAHA Location Replacement Assessment

面向无人零售运营商（客户）的点位换机评估工具。销售在现场按 3 步完成点位诊断、经营测算和客户版报告，帮助运营商判断是否用 HAHA 设备替换旧机。

## 使用方式

- 直接打开根目录 `index.html`（单文件，可离线使用）。
- 数据保存在当前浏览器 `localStorage`，不会上传服务器。
- 在「我的项目」中，每个项目可以单独 `Backup` 为 JSON；`Import` 支持单个项目备份、全部项目导出和旧版数组格式。
- 删除项目前建议先下载备份；删除弹窗内也提供 `Backup` 按钮。

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

## 版本

v2.3 · Operator Replacement Suite
