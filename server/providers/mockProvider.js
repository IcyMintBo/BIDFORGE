export const providerName = "Mock Provider";
export const modelName = "bidforge-mock-local";

const defaultArchitectureParagraphs = {
  "5.1.1": "建筑设计围绕重卡智能制造产业园的生产承载、配套服务和园区运行需求展开，统筹标准厂房、配套用房、室外道路、绿地和相关附属设施之间的空间关系，形成便于后续施工图深化的建筑专业表达。",
  "5.1.2": "建筑专业设计范围以产业园建筑群体为核心，结合 source_materials 中已明确的标准厂房、辅助用房、食堂、门卫室、变配电站、垃圾收集房及地下消防设备附属房等对象进行组织，不扩大至未明确的工艺或设备参数。",
  "5.1.3": "总平面关系重点处理建筑群体与园区道路、生态修复绿地、围墙和市政配套设施的衔接，建筑章节只表达空间界面和设计协同关系，市政、景观、电气等专项内容由对应专业深化。",
  "5.1.4": "建筑功能组织应服务生产、后勤、配套和管理需求，在不编造具体平面轴网、楼层高度和工艺流线的前提下，强调功能分区清晰、交通联系顺畅、运维管理便利。",
  "5.1.5": "综合楼建筑设计应结合园区办公、管理和配套服务需求展开，重点控制公共空间、使用安全、立面形象及与室外交通的衔接，具体房间数量和面积以正式图纸资料为准。",
  "5.1.6": "多层丙类标准厂房建筑设计应围绕生产承载、标准化空间、消防疏散和机电接口条件进行表达，结构体系、荷载取值和设备布置不在建筑章节中展开计算。",
  "5.1.7": "2-5#厂房复合功能建筑设计应强调生产、辅助和配套空间之间的组织关系，兼顾建筑平面弹性、立面统一和后续专业协同，避免自行补写未提供的工艺参数。",
  "5.1.8": "2-6#单层丁类厂房建筑设计应结合单层厂房的生产使用特点，关注大空间使用、出入口组织、围护系统、消防和室外场地衔接，具体跨度、层高和设备条件依据后续图纸深化。",
  "5.1.9": "门卫、垃圾站及后勤配套建筑设计应服务园区运行管理、出入控制、后勤保障和环境卫生需求，与道路、围墙、安防和市政设施形成清晰接口。",
  "5.1.10": "建筑立面与形象设计应结合发包人要求和建筑方案深化，统筹厂房、综合楼及配套建筑的整体形象，并处理外墙材料、屋面、门窗、百叶和雨水管等构件与立面效果的关系。",
  "5.1.11": "竖向交通与剖面设计应围绕人员通行、使用安全、疏散组织和设备检修需求展开，具体楼梯、电梯、坡道及剖面尺寸应以施工图阶段资料为准。",
  "5.1.12": "建筑构造与装修做法应依据现行规范和发包人要求控制围护、屋面、防水、保温、门窗和内外装修做法，未明确品牌、型号、厚度或性能等级时不得作确定性描述。",
  "5.1.13": "建筑消防设计应从防火分隔、疏散、安全出口、消防救援和地下消防设备附属房等方面建立建筑专业条件，并与给排水、电气、暖通等消防系统专业保持边界清晰。",
  "5.1.14": "无障碍、卫生防疫与使用安全设计应结合公共使用空间、后勤服务空间和园区运行需求，落实通行安全、卫生条件、维护便利和使用风险控制。",
  "5.1.15": "建筑设计综合说明应汇总本节建筑专业的设计范围、事实依据、目录响应、专业边界和后续深化要求，形成可供人工确认与后续扩写的章节基础。",
};

function buildMockMarkdown(input, sectionContext) {
  const outlineItems = sectionContext?.sectionOutline?.items ?? [];
  const subsection = sectionContext?.currentSubsection;

  if (input.sectionId === "5.1" && subsection) {
    const paragraph = defaultArchitectureParagraphs[subsection.id] ?? "本小节按目录保真要求进行精简表达，后续可结合 source_materials 和专业图纸继续扩写。";

    return `## ${subsection.id} ${subsection.title}

${paragraph}`;
  }

  if (input.sectionId === "5.1" && outlineItems.length > 0) {
    const sections = outlineItems
      .map((item) => {
        const paragraph = defaultArchitectureParagraphs[item.id] ?? "本小节按目录保真要求进行精简表达，后续可结合 source_materials 和专业图纸继续扩写。";
        return `## ${item.id} ${item.title}\n\n${paragraph}`;
      })
      .join("\n\n");

    return `# ${input.sectionId} ${input.sectionTitle}

> 本文件由 BIDFORGE 本地 Runner 的 Mock Provider 生成，当前用于验证目录注入、source_materials 注入和 generation_trace 记录链路。

${sections}`;
  }

  return `# ${input.sectionId} ${input.sectionTitle}

> 本文件由 BIDFORGE 本地 Runner 的 Mock Provider 生成，当前仍为 mock 内容。

本章节用于验证 BIDFORGE Provider Adapter 的任务创建、文件写入、Markdown 返回和前台预览下载闭环。后续接入真实 Codex、OpenAI、资料读取和 Skill 加载后，将由真实 Provider 生成章节草稿。`;
}

export async function generateCompactSection(context) {
  const sectionContext = context.subsection
    ? {
        ...context.sectionContext,
        currentSubsection: context.subsection,
      }
    : context.sectionContext;
  const markdown = buildMockMarkdown(context.input, sectionContext).trim();

  return {
    markdown,
    providerName,
    modelName,
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    },
    rawMeta: {
      mock: true,
      realAi: false,
      stage: context.stage?.name ?? "mvp",
      promptBuilderUsed: Boolean(context.promptSummary),
      sourceMaterialsInjected: Boolean(context.promptMeta?.hasSourceMaterials),
      sectionOutlineItems: context.promptMeta?.sectionOutlineItems ?? 0,
    },
  };
}
