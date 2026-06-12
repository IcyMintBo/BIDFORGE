# BIDFORGE MVP 第八阶段 Provider 配置中心验收

## 1. 阶段目标

本阶段目标为：

```text
点击“API 接口”
→ 显示 Provider 配置中心
→ 选择 Provider
→ 显示对应 Provider 配置面板
→ 不触发真实 AI 生成
```

本阶段只完成 Provider 配置中心的 UI、状态展示和后端占位接口，不真实接入 Codex，不真实接入 OpenAI API，不接真实 API Key，不实现 Cloud API，不进入 Production，不进入 Production RC。

## 2. 已完成能力

* Provider 配置中心已完成；
* 顶部 `API 接口` 面板已升级为 Provider 配置中心；
* Provider 选择区已完成；
* 顶部重复的“当前使用”大卡片已删除；
* Provider 总览曾作为状态列表实现，后续根据人工反馈取消展示，避免与 Provider 选择区重复；
* 动态配置面板已完成；
* 当前通过 Provider 选择区支持四类 Provider：
  * Mock Provider；
  * Local Codex Provider；
  * Local OpenAI API Provider；
  * Cloud API Provider；
* 选择 Mock Provider 时，显示开发调试和界面演示说明；
* 选择 Local Codex Provider 时，显示 Codex CLI 状态、版本、非交互支持、工作目录、超时设置和检测按钮；
* 选择 Local OpenAI API Provider 时，显示 API Key 状态、Key 输入占位、Base URL、Model 和测试连接按钮占位；
* 选择 Cloud API Provider 时，显示未来云端服务占位；
* 页面文案已弱化，不再把开发边界大面积展示在前台；
* API 配置中心窗口已收窄，并支持拖动；
* API 配置中心窗口已固定尺寸，切换 Provider 时不再跳动；
* Mock 生成流程未被破坏；
* `npm run build` 已通过。

## 3. 新增与修改文件

新增文件：

```text
server/services/providerConfig.js
src/types/providerConfig.ts
src/services/providerConfigApi.ts
```

文件作用：

* `server/services/providerConfig.js`：提供 Provider 配置状态、Codex CLI 检测、OpenAI 配置状态和 Cloud API 占位状态；
* `src/types/providerConfig.ts`：定义前端 Provider 配置中心使用的类型；
* `src/services/providerConfigApi.ts`：封装前端读取 Provider 配置状态的 API 调用。

修改文件：

```text
server/index.js
src/components/SystemPanelDialog.tsx
src/index.css
src/components/TopNav.tsx
```

文件作用：

* `server/index.js`：新增 Provider 配置中心相关只读/占位接口；
* `src/components/SystemPanelDialog.tsx`：将 `API 接口` 面板升级为 Provider 配置中心，并实现按当前 Provider 动态显示配置面板；
* `src/index.css`：调整 Provider 配置中心布局、固定窗口尺寸、拖动标题栏样式和配置面板样式；
* `src/components/TopNav.tsx`：恢复顶部滚动台词，并修正顶部菜单中文显示。

## 4. 人工验收结论

本阶段已通过人工验收。

人工确认：

* 顶部 `API 接口` 面板可打开；
* 顶部重复的“当前使用”大卡片已删除；
* Provider 选择区可用；
* Provider 总览区域已取消展示，避免与下拉选择重复；
* 当前页面不会同时展开所有 Provider 配置；
* 选择 Mock Provider 时，只显示 Mock 详情；
* 选择 Local Codex Provider 时，只显示 Codex 连接与执行配置；
* 选择 Local OpenAI API Provider 时，只显示 OpenAI API 配置；
* 选择 Cloud API Provider 时，只显示 Cloud 未来占位；
* API 配置中心窗口可拖动；
* API 配置中心窗口尺寸固定，切换 Provider 时不会跳动；
* 页面未崩溃；
* Mock 生成流程仍可用；
* `npm run build` 已通过。

## 5. 当前仍未接入内容

* 不真实接入 Codex；
* 不真实接入 OpenAI API；
* 不接真实 API Key；
* 不实现 Cloud API；
* 不租服务器；
* 不做在线账号；
* 不共享开发者 Pro / Codex 额度；
* 不把 API Key 暴露给前端；
* 不解析 PDF/DOCX；
* 不做 Word 导出；
* 不进入 Production；
* 不进入 Production RC。

## 6. 阶段意义

* BIDFORGE 已具备 Provider 配置中心雏形；
* 页面从“状态说明页”变成了“连接设置中心”；
* Provider 选择与 Provider 配置详情已经形成稳定交互；
* 后续可以在同一个入口管理 Mock、Local Codex、Local OpenAI API 和 Cloud API；
* 为后续 Local Codex Provider 接入、OpenAI API Provider 接入和 Cloud API 扩展打下基础。

## 7. 下一步建议

推荐下一阶段进入：

```text
第九阶段：Local Codex Provider 非流式 MVP 接入
```

目标：

```text
前端选择 Local Codex Provider
→ Runner 生成 prompt.md
→ codexProvider 调用本机 Codex CLI
→ 非流式等待执行完成
→ 将输出写入 draft.md
→ task.json / auditor_result.md 记录调用结果
```

第九阶段仍不进入 Production，不进入 Production RC，不接 OpenAI API，不接真实 API Key，不实现 Cloud API。
