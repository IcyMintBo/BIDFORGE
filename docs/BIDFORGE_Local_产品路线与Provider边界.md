# BIDFORGE Local 产品路线与 Provider 边界

## 1. 当前定位

BIDFORGE Local 当前定位为本地 AI 标书工作台 MVP。

当前阶段仍为 MVP / Candidate Skill 验证阶段，不进入 Production，不进入 Production RC。

当前已具备：

* Provider Adapter；
* Local Runner；
* Skill Loader；
* used_skill_manifest；
* promptBuilder；
* Runner Status；
* Provider 占位结构。

## 2. Provider 路线

BIDFORGE Local 后续支持以下 Provider。

### Mock Provider

用途：

* 开发调试；
* UI 演示；
* Runner 流程验证。

特点：

* 不调用真实 AI；
* 不消耗任何额度；
* 不能伪装成真实 AI 结果。

### Local Codex Provider

用途：

* 当前电脑已安装并登录 Codex CLI 的用户；
* 本地增强模式；
* 高级用户 / 开发者模式。

原则：

* 谁本地运行，谁消耗自己的 Codex / ChatGPT 额度；
* 不允许朋友远程调用我的 Codex；
* 不共享我的 Codex 登录状态；
* 如果用户未安装 Codex，应提示切换其他 Provider。

### Local OpenAI API Provider

用途：

* 普通用户；
* 不安装 Codex 的用户；
* 自己配置 OpenAI API Key 的用户。

原则：

* 谁配置 Key，谁承担 API 费用；
* API Key 不写入前端；
* API Key 不提交 Git；
* run 文件和日志不记录完整 Key；
* 前端只显示已配置 / 未配置或掩码状态。

### Cloud API Provider

用途：

* 未来正式上线；
* 云端统一调用 API；
* 云端账号、计费、权限和数据安全。

当前状态：

* 只做占位；
* 当前不租服务器；
* 当前不实现云端账号；
* 当前不实现统一 API 调用。

## 3. Local Access Gate

BIDFORGE Local 可在后期增加本地启动授权入口。

定位：

* 本地仪式感入口；
* 不是正式账号系统；
* 不连接服务器；
* 不做在线登录；
* 不做真实用户数据库；
* 不做强安全防破解；
* 只控制是否进入 BIDFORGE 主界面。

边界：

* 授权码不代表 OpenAI 登录；
* 授权码不代表 Codex 登录；
* 授权码不包含任何 AI 额度；
* 授权码不影响用户本地 Provider 配置。

建议阶段：

* 放在后期实现；
* 不阻塞当前 Provider / Runner / SkillLoader 主线。

## 4. Skill 资产保护路线

BIDFORGE 的 skill / prompt / 规则库是核心资产。本地版无法真正强加密，因此采用分层策略。

### dev 开发模式

* 读取明文 `candidate_skills/`、`skills/`、`knowledge/`；
* 方便本地开发和规则调试；
* 当前 MVP 默认使用此模式。

### local_release 本地发布模式

* 将 skill 打包为 `skill-bundle`；
* 可做轻度混淆或简单加密；
* 目标是防止普通用户直接打开文件看到完整提示词；
* 不承诺强安全；
* 不防高级用户逆向。

### cloud 未来模式

* 核心 skill 放服务器端；
* 用户端不下发完整 skill；
* 这是未来真正保护核心资产的方向；
* 当前 MVP 不实现。

## 5. 当前阶段优先级

当前优先做：

1. Direct Forge / Agent Pack 前台运行模式收口；
2. Agent Pack 任务包闭环打磨；
3. OpenAI-Compatible API Provider 单小节非流式最小接入；
4. API subsection_batch 批量生成；
5. SkillBundle 和本地授权入口后置。

当前不要做：

* 不真实接入云端账号；
* 不租服务器；
* 不做朋友远程调用我的 Codex；
* 不共享我的 Pro / Codex 额度；
* 不把 API Key 暴露给前端；
* 不把 skill 明文直接暴露给朋友发布版；
* 不进入正式 Production。

## 6. 建议阶段路线

建议后续阶段调整为：

```text
第十阶段：Generation Trace 与 Skill 使用追踪
第十一阶段：章节目录与 source_materials 注入
第十二阶段：Subsection Runner / 小节级生成
第十三阶段：Direct Forge / Agent Pack 运行模式收口
第十四阶段：Agent Pack 任务包体验优化
第十五阶段：OpenAI-Compatible API Provider 单小节非流式最小接入
第十六阶段：API subsection_batch 批量生成
后置阶段：SkillBundle / Local Access Gate / Word 导出 / Production RC
```

说明：

* Provider 配置中心已完成雏形；
* Agent Pack 是当前最接近可用的本地闭环；
* Direct Forge 是后续稳定自动生成主线；
* OpenAI-Compatible API Provider 更适合普通用户通用模式；
* Local Codex Auto 由于 `codex exec` 非交互调用不稳定，暂保留为实验性高级能力；
* SkillBundle 与 Access Gate 暂不阻塞当前 MVP 主线。

## 7. 与当前开发是否冲突

结论：

不冲突。

当前已有的 Provider Adapter、Runner、Skill Loader、promptBuilder、Runner Status 都是这条路线的基础。

后续只需要在当前结构上继续扩展，不需要推翻已有工作。
