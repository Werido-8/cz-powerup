// Scenario training mock data (typical operations + fault review).
// Plus knowledge collections used by personal assets module.

export type ScenarioKind = "typical" | "fault";

export type ScenarioCard = {
  id: string;
  title: string;
  kind:
    | "applicability"
    | "dispatchTicket"
    | "plantTicket"
    | "keySteps"
    | "riskNotes"
    | "related"
    | "judgement"
    | "handling"
    | "similar";
  summary?: string;
  bullets?: { text: string; refIds?: string[] }[];
  steps?: { no: number; text: string; focus?: string; refIds?: string[] }[];
  risks?: { name: string; pitfall: string; advice: string; refIds?: string[] }[];
};

export type ScenarioEvidence = {
  id: string;
  sourceType: string;
  docId?: string;
  docTitle: string;
  section: string;
  snippet: string;
  context?: string;
  relatedCardIds: string[];
  version?: string;
};

export type SimilarCase = {
  id: string;
  title: string;
  date: string;
  device: string;
  phenomenon: string;
  matchPoint: string;
  process: string;
  lesson: string;
};

export type ScenarioTemplate = {
  id: string;
  kind: ScenarioKind;
  title: string;
  voltageLevel: string;
  device: string;
  deviceInstance: string;
  task?: string; // typical
  phenomenon?: string; // fault
  currentStatus?: string;
  instructionType?: string;
  tags: string[];
  cards: ScenarioCard[];
  evidence: ScenarioEvidence[];
  similarCases?: SimilarCase[];
  quickFollowups: string[];
};

// ---------- Typical operation templates (≥5) ----------
export const TYPICAL_TEMPLATES: ScenarioTemplate[] = [
  {
    id: "tp-main-stop",
    kind: "typical",
    title: "220kV #1 主变停役 典型操作参考",
    voltageLevel: "220kV",
    device: "主变",
    deviceInstance: "#1 主变",
    task: "停役",
    instructionType: "单步指令",
    tags: ["220kV", "主变", "#1主变", "停役", "单步指令"],
    cards: [
      {
        id: "c-app",
        kind: "applicability",
        title: "适用场景说明",
        summary:
          "本参考面向 220kV #1 主变计划停役场景,用于操作前知识复习与班组带教,不替代正式调度命令与现场操作票。",
        bullets: [
          { text: "适用范围：220kV / 500kV 双绕组主变计划停役" },
          { text: "不适用范围：事故停运、特殊试验性停役" },
          { text: "性质：培训学习与依据查阅" },
        ],
      },
      {
        id: "c-dispatch",
        kind: "dispatchTicket",
        title: "调度操作票参考",
        bullets: [
          { text: "票据标题：220kV #1 主变停役调度操作票（参考样式）" },
          { text: "适用场景：本厂内主变计划停役且 220kV 系统具备转供条件", refIds: ["e-01"] },
          { text: "关键片段：负荷转移→保护退出→开关分→刀闸操作→接地刀闸合", refIds: ["e-01"] },
        ],
      },
      {
        id: "c-plant",
        kind: "plantTicket",
        title: "厂站任务操作票参考",
        bullets: [
          { text: "任务票标题：#1 主变停役厂站任务票（参考样式）" },
          { text: "归属厂站：华东 A 厂", refIds: ["e-02"] },
          { text: "关键步骤：现场核对→连接片操作→刀闸验电→接地→挂牌", refIds: ["e-02"] },
        ],
      },
      {
        id: "c-steps",
        kind: "keySteps",
        title: "关键步骤参考",
        steps: [
          { no: 1, text: "确认负荷已完全转移,有功/无功表读数为零", focus: "负荷转移核对", refIds: ["e-02"] },
          { no: 2, text: "退出主变各侧保护出口连接片", focus: "保护连接片", refIds: ["e-02"] },
          { no: 3, text: "分各侧开关并核对位置三相一致", focus: "开关三相位置", refIds: ["e-01"] },
          { no: 4, text: "拉开各侧母线侧刀闸→线路侧刀闸", focus: "顺序不可颠倒", refIds: ["e-02"] },
          { no: 5, text: "验电合格后合上接地刀闸,挂\"禁止合闸\"牌", focus: "接地与挂牌", refIds: ["e-03"] },
        ],
      },
      {
        id: "c-risk",
        kind: "riskNotes",
        title: "易错点与注意事项",
        risks: [
          { name: "中性点接地刀闸误操作", pitfall: "停役顺序错误致非全相运行", advice: "先核对中性点方式再动开关", refIds: ["e-03"] },
          { name: "保护连接片遗漏", pitfall: "未退出造成误动", advice: "按厂站连接片清单逐项打钩", refIds: ["e-02"] },
          { name: "唱票流于形式", pitfall: "口诵但未确认", advice: "关键步骤必须双人监护、复诵到位", refIds: ["e-01"] },
          { name: "调度许可与现场许可不一致", pitfall: "现场提前动作", advice: "两方一致方可执行", refIds: ["e-01"] },
        ],
      },
      {
        id: "c-related",
        kind: "related",
        title: "关联资料与延伸阅读",
        bullets: [
          { text: "《厂站运行规程》异常处置原则一节", refIds: ["e-03"] },
          { text: "历史案例：母线倒闸误送电事故复盘" },
          { text: "题库：主变停役 / 典型操作 知识点" },
        ],
      },
    ],
    evidence: [
      {
        id: "e-01",
        sourceType: "典型操作",
        docId: "d2",
        docTitle: "500kV 主变停役标准化操作程序 v3.2",
        section: "1 前置核对",
        snippet:
          "核对项包括:主变负荷转移情况、相关保护连接片位置、中性点接地刀闸状态、调度命令与厂站操作票一致性。",
        context: "本节给出主变停役前必须完成的四项核对,任一项异常应停止操作并汇报值长。",
        relatedCardIds: ["c-dispatch", "c-risk"],
        version: "v3.2 / 2024-08",
      },
      {
        id: "e-02",
        sourceType: "厂站资料",
        docId: "d4",
        docTitle: "厂站运行规程(华东 A 厂)2024 修订版",
        section: "2 值班与巡检",
        snippet: "厂站资料优先适用,通用规程作为补充。",
        relatedCardIds: ["c-plant", "c-steps"],
        version: "2024-07",
      },
      {
        id: "e-03",
        sourceType: "厂站资料",
        docId: "d4",
        docTitle: "厂站运行规程(华东 A 厂)2024 修订版",
        section: "3 异常处置原则",
        snippet: "先汇报后处置;先停电后处理;无把握不操作。",
        relatedCardIds: ["c-steps", "c-related"],
      },
      {
        id: "e-04",
        sourceType: "规程标准",
        docId: "d5",
        docTitle: "继电保护及安全自动装置技术规程",
        section: "2 配置原则",
        snippet: "差动保护应保证选择性、速动性、灵敏性、可靠性。",
        relatedCardIds: ["c-risk"],
      },
    ],
    quickFollowups: [
      "这一步最容易错在哪里?",
      "有没有更接近本厂站的票据?",
      "相关规程条文在哪?",
      "能否补充注意事项?",
    ],
  },
  {
    id: "tp-line-trans",
    kind: "typical",
    title: "500kV 线路 状态转换 典型操作参考",
    voltageLevel: "500kV",
    device: "线路",
    deviceInstance: "5021 线路",
    task: "状态转换",
    instructionType: "线路状态令",
    tags: ["500kV", "线路", "5021", "状态转换", "线路状态令"],
    cards: [
      { id: "c-app", kind: "applicability", title: "适用场景说明", summary: "面向 500kV 线路在运行 / 热备用 / 冷备用 / 检修四态之间的转换培训。" },
      { id: "c-dispatch", kind: "dispatchTicket", title: "调度操作票参考", bullets: [{ text: "线路状态令样式参考", refIds: ["e-01"] }] },
      { id: "c-plant", kind: "plantTicket", title: "厂站任务操作票参考", bullets: [{ text: "本站 500kV 出线任务票样式参考", refIds: ["e-02"] }] },
      {
        id: "c-steps",
        kind: "keySteps",
        title: "关键步骤参考",
        steps: [
          { no: 1, text: "核对线路状态与一次系统接线", refIds: ["e-01"] },
          { no: 2, text: "退/投相关保护连接片", refIds: ["e-02"] },
          { no: 3, text: "按四态顺序操作开关与刀闸", refIds: ["e-01"] },
          { no: 4, text: "验电并挂接地", refIds: ["e-02"] },
        ],
      },
      {
        id: "c-risk",
        kind: "riskNotes",
        title: "易错点与注意事项",
        risks: [
          { name: "状态判定错误", pitfall: "把热备误判为冷备", advice: "对照\"四态判别表\"", refIds: ["e-02"] },
          { name: "保护投退顺序", pitfall: "先投后操作", advice: "严格按操作票序列", refIds: ["e-01"] },
        ],
      },
      { id: "c-related", kind: "related", title: "关联资料与延伸阅读", bullets: [{ text: "500kV 系统倒闸典型案例" }] },
    ],
    evidence: [
      { id: "e-01", sourceType: "典型操作", docId: "d2", docTitle: "500kV 典型操作程序", section: "线路状态转换", snippet: "线路状态分运行、热备用、冷备用、检修四态。", relatedCardIds: ["c-dispatch", "c-steps"] },
      { id: "e-02", sourceType: "厂站资料", docId: "d4", docTitle: "厂站运行规程(华东 A 厂)", section: "2 值班与巡检", snippet: "厂站资料优先适用。", relatedCardIds: ["c-plant", "c-steps", "c-risk"] },
    ],
    quickFollowups: ["四态如何判别?", "保护投退该按什么顺序?", "本厂有差异化要求吗?"],
  },
  {
    id: "tp-bus-switch",
    kind: "typical",
    title: "220kV 母线 倒闸 典型操作参考",
    voltageLevel: "220kV",
    device: "母线",
    deviceInstance: "220kV I 母 ↔ II 母",
    task: "倒闸",
    instructionType: "操作许可制",
    tags: ["220kV", "母线", "倒闸", "操作许可制"],
    cards: [
      { id: "c-app", kind: "applicability", title: "适用场景说明", summary: "面向 220kV 双母线倒闸的培训复习,关注母联状态、保护互联与负荷均衡。" },
      { id: "c-dispatch", kind: "dispatchTicket", title: "调度操作票参考", bullets: [{ text: "倒闸调度令参考", refIds: ["e-01"] }] },
      { id: "c-plant", kind: "plantTicket", title: "厂站任务操作票参考", bullets: [{ text: "本站 220kV 母线倒闸任务票", refIds: ["e-02"] }] },
      {
        id: "c-steps", kind: "keySteps", title: "关键步骤参考",
        steps: [
          { no: 1, text: "合母联开关,核对三相位置", focus: "母联三相核对", refIds: ["e-01"] },
          { no: 2, text: "退出母差互联跳闸", refIds: ["e-02"] },
          { no: 3, text: "倒间隔刀闸,先合后拉", refIds: ["e-01"] },
          { no: 4, text: "恢复母差互联,核对差流", refIds: ["e-02"] },
        ],
      },
      {
        id: "c-risk", kind: "riskNotes", title: "易错点与注意事项",
        risks: [
          { name: "母联未真正合闸即倒刀", pitfall: "可能非同期合闸", advice: "必须核对三相位置与电流", refIds: ["e-01"] },
          { name: "母差互联遗漏", pitfall: "区外误动", advice: "按清单逐条核对", refIds: ["e-02"] },
        ],
      },
      { id: "c-related", kind: "related", title: "关联资料与延伸阅读", bullets: [{ text: "案例:某厂母线倒闸误送电事故" }] },
    ],
    evidence: [
      { id: "e-01", sourceType: "历史案例", docId: "d12", docTitle: "某厂母线倒闸误送电事故复盘", section: "2 原因分析", snippet: "操作票漏写母联三相位置核对步骤;监护流于形式。", relatedCardIds: ["c-steps", "c-risk"] },
      { id: "e-02", sourceType: "厂站资料", docId: "d4", docTitle: "厂站运行规程(华东 A 厂)", section: "3 异常处置原则", snippet: "无把握不操作。", relatedCardIds: ["c-plant", "c-risk"] },
    ],
    quickFollowups: ["母联合闸如何确认?", "母差互联怎么管理?"],
  },
  {
    id: "tp-react-prot",
    kind: "typical",
    title: "高抗保护 投退 典型操作参考",
    voltageLevel: "500kV",
    device: "高抗",
    deviceInstance: "1# 高抗",
    task: "保护投退",
    tags: ["500kV", "高抗", "保护投退"],
    cards: [
      { id: "c-app", kind: "applicability", title: "适用场景说明", summary: "面向 500kV 高抗保护连接片投退培训。" },
      { id: "c-dispatch", kind: "dispatchTicket", title: "调度操作票参考", bullets: [{ text: "保护投退调度令参考", refIds: ["e-01"] }] },
      { id: "c-plant", kind: "plantTicket", title: "厂站任务操作票参考", bullets: [{ text: "本站高抗保护连接片清单", refIds: ["e-02"] }] },
      {
        id: "c-steps", kind: "keySteps", title: "关键步骤参考",
        steps: [
          { no: 1, text: "核对装置定值与运行方式", refIds: ["e-01"] },
          { no: 2, text: "按连接片清单逐项操作", refIds: ["e-02"] },
          { no: 3, text: "操作后复核装置状态", refIds: ["e-01"] },
        ],
      },
      {
        id: "c-risk", kind: "riskNotes", title: "易错点与注意事项",
        risks: [{ name: "误投错误连接片", pitfall: "保护误动或拒动", advice: "唱票复诵+复核", refIds: ["e-01"] }],
      },
      { id: "c-related", kind: "related", title: "关联资料与延伸阅读", bullets: [{ text: "继电保护配置原则" }] },
    ],
    evidence: [
      { id: "e-01", sourceType: "规程标准", docId: "d5", docTitle: "继电保护及安全自动装置技术规程", section: "2 配置原则", snippet: "差动保护应保证选择性、速动性、灵敏性、可靠性。", relatedCardIds: ["c-dispatch", "c-steps", "c-risk"] },
      { id: "e-02", sourceType: "厂站资料", docId: "d4", docTitle: "厂站运行规程(华东 A 厂)", section: "2 值班与巡检", snippet: "厂站资料优先适用。", relatedCardIds: ["c-plant", "c-steps"] },
    ],
    quickFollowups: ["连接片清单从哪查?", "投退顺序怎么定?"],
  },
  {
    id: "tp-secu-coop",
    kind: "typical",
    title: "安控装置 配合操作 典型操作参考",
    voltageLevel: "500kV",
    device: "安控装置",
    deviceInstance: "区域安控子站",
    task: "配合操作",
    tags: ["500kV", "安控装置", "配合操作"],
    cards: [
      { id: "c-app", kind: "applicability", title: "适用场景说明", summary: "面向安控装置在主网检修中的配合操作培训。" },
      { id: "c-dispatch", kind: "dispatchTicket", title: "调度操作票参考", bullets: [{ text: "安控配合调度令参考", refIds: ["e-01"] }] },
      { id: "c-plant", kind: "plantTicket", title: "厂站任务操作票参考", bullets: [{ text: "本站安控子站接入参数核对单", refIds: ["e-02"] }] },
      {
        id: "c-steps", kind: "keySteps", title: "关键步骤参考",
        steps: [
          { no: 1, text: "确认安控运行方式表当前版本", refIds: ["e-01"] },
          { no: 2, text: "核对策略与定值", refIds: ["e-02"] },
          { no: 3, text: "按调度令切换/退出策略", refIds: ["e-01"] },
        ],
      },
      {
        id: "c-risk", kind: "riskNotes", title: "易错点与注意事项",
        risks: [{ name: "策略版本错误", pitfall: "切除负荷错误", advice: "操作前与调度复核版本号", refIds: ["e-01"] }],
      },
      { id: "c-related", kind: "related", title: "关联资料与延伸阅读", bullets: [{ text: "区域安控运行管理办法" }] },
    ],
    evidence: [
      { id: "e-01", sourceType: "区域规则", docId: "d8", docTitle: "两细则考核常见知识点汇编", section: "1 AGC 知识点", snippet: "调节速率、精度、响应时间。", relatedCardIds: ["c-dispatch", "c-steps", "c-risk"] },
      { id: "e-02", sourceType: "厂站资料", docId: "d4", docTitle: "厂站运行规程(华东 A 厂)", section: "2 值班与巡检", snippet: "厂站资料优先适用。", relatedCardIds: ["c-plant", "c-steps"] },
    ],
    quickFollowups: ["策略版本如何确认?", "切除负荷如何统计?"],
  },
];

// ---------- Fault review templates (≥5) ----------
export const FAULT_TEMPLATES: ScenarioTemplate[] = [
  {
    id: "ft-main-diff",
    kind: "fault",
    title: "220kV #1 主变 差动保护动作 故障复盘参考",
    voltageLevel: "220kV",
    device: "主变",
    deviceInstance: "#1 主变",
    phenomenon: "差动保护动作",
    currentStatus: "已跳闸",
    tags: ["220kV", "主变", "#1主变", "差动保护动作", "已跳闸"],
    cards: [
      {
        id: "c-app", kind: "applicability", title: "适用场景说明",
        summary: "面向 220kV 主变差动保护动作后的培训复盘。本卡片不替代正式事故定性结论。",
        bullets: [
          { text: "适用范围:常规双绕组主变" },
          { text: "不适用范围:试验性运行、特殊接线" },
        ],
      },
      {
        id: "c-judge", kind: "judgement", title: "核心判断思路",
        bullets: [
          { text: "建议复盘时优先核对差动动作录波与差流方向", refIds: ["e-01"] },
          { text: "确认 TA 极性、二次回路完整性与定值", refIds: ["e-02"] },
          { text: "区分区内 / 区外故障表现", refIds: ["e-03"] },
          { text: "常见误判点:把 TA 饱和误判为内部故障", refIds: ["e-02"] },
        ],
      },
      {
        id: "c-handle", kind: "handling", title: "参考处置思路",
        steps: [
          { no: 1, text: "核对主变各侧开关位置与录波", focus: "现场信息收集", refIds: ["e-01"] },
          { no: 2, text: "核对保护动作报文、差流与制动量", refIds: ["e-02"] },
          { no: 3, text: "现场检查主变外观、油位、瓦斯继电器", refIds: ["e-04"] },
          { no: 4, text: "根据判断结果由专业人员制定试送/检修方案", refIds: ["e-04"] },
        ],
      },
      {
        id: "c-risk", kind: "riskNotes", title: "风险与注意事项",
        risks: [
          { name: "盲目试送", pitfall: "再次冲击主变", advice: "未确认故障性质前不应试送", refIds: ["e-04"] },
          { name: "录波信息遗漏", pitfall: "复盘缺关键证据", advice: "录波导出与时间戳核对", refIds: ["e-01"] },
          { name: "极性反接误诊", pitfall: "误判区内", advice: "结合一次电流方向交叉核对", refIds: ["e-02"] },
          { name: "瓦斯保护未联合判断", pitfall: "遗漏内部故障证据", advice: "差动与瓦斯联合判断", refIds: ["e-04"] },
        ],
      },
      { id: "c-similar", kind: "similar", title: "相似案例参考" },
      { id: "c-related", kind: "related", title: "关联资料与延伸阅读", bullets: [{ text: "差动保护四步法核查" }, { text: "厂家继电保护说明书" }] },
    ],
    evidence: [
      { id: "e-01", sourceType: "故障处置", docId: "d10", docTitle: "差动保护动作复盘:核查思路与典型场景", section: "1 四步法核查", snippet: "TA 极性 → 二次回路 → 定值 → 一次设备。", relatedCardIds: ["c-judge", "c-handle"] },
      { id: "e-02", sourceType: "历史案例", docId: "d3", docTitle: "某 500kV 站母差保护误动事故复盘报告", section: "2 原因分析", snippet: "二次回路绝缘破损,差动平衡被破坏。", relatedCardIds: ["c-judge", "c-risk"] },
      { id: "e-03", sourceType: "规程标准", docId: "d5", docTitle: "继电保护及安全自动装置技术规程", section: "2 配置原则", snippet: "差动保护应保证选择性、速动性、灵敏性、可靠性。", relatedCardIds: ["c-judge"] },
      { id: "e-04", sourceType: "厂站资料", docId: "d4", docTitle: "厂站运行规程(华东 A 厂)", section: "3 异常处置原则", snippet: "先汇报后处置;先停电后处理;无把握不操作。", relatedCardIds: ["c-handle", "c-risk"] },
    ],
    similarCases: [
      {
        id: "sc-1", title: "某 500kV 站母差保护误动事故", date: "2023-11-08",
        device: "500kV 母差保护", phenomenon: "母差动作并跳闸",
        matchPoint: "二次回路绝缘破损导致差流异常",
        process: "动作后检查发现 TA 二次回路绝缘破损,处理后试送恢复。",
        lesson: "TA 二次回路检修后必须做绝缘核查,极性接线建议二人复核。",
      },
      {
        id: "sc-2", title: "某厂主变差动 TA 饱和误判", date: "2022-06-14",
        device: "220kV 主变", phenomenon: "区外故障期间差动启动",
        matchPoint: "TA 饱和导致差流偏移",
        process: "复盘录波显示区外故障 TA 饱和,差流上升但未达动作值,保护未误出口。",
        lesson: "差动复盘要结合 TA 饱和特性,不能只看差流幅值。",
      },
    ],
    quickFollowups: [
      "这种保护动作一般先看哪些信息?",
      "有没有更相似的案例?",
      "这一条依据来自哪份规程?",
      "最容易遗漏的风险点是什么?",
    ],
  },
  {
    id: "ft-line-trip",
    kind: "fault",
    title: "500kV 线路 开关跳闸 故障复盘参考",
    voltageLevel: "500kV",
    device: "线路",
    deviceInstance: "5021 线路",
    phenomenon: "开关跳闸",
    currentStatus: "已跳闸",
    tags: ["500kV", "线路", "5021", "开关跳闸", "已跳闸"],
    cards: [
      { id: "c-app", kind: "applicability", title: "适用场景说明", summary: "面向 500kV 线路跳闸的培训复盘,聚焦保护动作与重合闸表现。" },
      {
        id: "c-judge", kind: "judgement", title: "核心判断思路",
        bullets: [
          { text: "建议复盘时优先核对故障录波与测距", refIds: ["e-01"] },
          { text: "区分主保护、后备保护、重合闸动作序列", refIds: ["e-02"] },
          { text: "结合气象信息与运行方式分析", refIds: ["e-03"] },
        ],
      },
      {
        id: "c-handle", kind: "handling", title: "参考处置思路",
        steps: [
          { no: 1, text: "确认线路两侧开关位置与重合闸状态", refIds: ["e-01"] },
          { no: 2, text: "对照测距进行巡线排查", refIds: ["e-02"] },
          { no: 3, text: "按调度令决定是否试送", refIds: ["e-03"] },
        ],
      },
      {
        id: "c-risk", kind: "riskNotes", title: "风险与注意事项",
        risks: [
          { name: "未明确故障性质即试送", pitfall: "造成二次故障", advice: "依据巡线结果与录波判断", refIds: ["e-03"] },
          { name: "重合闸记录遗漏", pitfall: "无法定位重合方式", advice: "导出动作报文存档", refIds: ["e-01"] },
        ],
      },
      { id: "c-similar", kind: "similar", title: "相似案例参考" },
      { id: "c-related", kind: "related", title: "关联资料与延伸阅读", bullets: [{ text: "线路保护配置原则" }] },
    ],
    evidence: [
      { id: "e-01", sourceType: "故障处置", docId: "d10", docTitle: "差动保护动作复盘:核查思路与典型场景", section: "1 四步法核查", snippet: "TA 极性 → 二次回路 → 定值 → 一次设备。", relatedCardIds: ["c-judge", "c-handle"] },
      { id: "e-02", sourceType: "规程标准", docId: "d5", docTitle: "继电保护及安全自动装置技术规程", section: "2 配置原则", snippet: "差动保护应保证选择性、速动性、灵敏性、可靠性。", relatedCardIds: ["c-judge", "c-handle"] },
      { id: "e-03", sourceType: "厂站资料", docId: "d4", docTitle: "厂站运行规程(华东 A 厂)", section: "3 异常处置原则", snippet: "先汇报后处置;先停电后处理;无把握不操作。", relatedCardIds: ["c-handle", "c-risk"] },
    ],
    similarCases: [
      { id: "sc-1", title: "线路雷击跳闸重合成功案例", date: "2023-07-22", device: "500kV 出线", phenomenon: "瞬时性接地", matchPoint: "录波显示瞬时性故障", process: "重合成功,巡线无异常。", lesson: "瞬时性故障重合后仍应安排巡线。" },
    ],
    quickFollowups: ["这次重合是否成功?", "测距对应哪个杆塔?", "气象资料如何获取?"],
  },
  {
    id: "ft-bus-lossv",
    kind: "fault",
    title: "220kV 母线 母线失压 故障复盘参考",
    voltageLevel: "220kV",
    device: "母线",
    deviceInstance: "220kV II 母",
    phenomenon: "母线失压",
    currentStatus: "已跳闸",
    tags: ["220kV", "母线", "母线失压"],
    cards: [
      { id: "c-app", kind: "applicability", title: "适用场景说明", summary: "面向 220kV 母线失压复盘,关注电压互感器、母差动作与备用条件。" },
      { id: "c-judge", kind: "judgement", title: "核心判断思路", bullets: [{ text: "区分母差动作 vs 一次失压", refIds: ["e-01"] }, { text: "核对 PT 二次回路", refIds: ["e-02"] }] },
      { id: "c-handle", kind: "handling", title: "参考处置思路", steps: [{ no: 1, text: "确认开关变位序列", refIds: ["e-01"] }, { no: 2, text: "检查 PT 二次回路与电压表读数", refIds: ["e-02"] }] },
      { id: "c-risk", kind: "riskNotes", title: "风险与注意事项", risks: [{ name: "误判 PT 故障为母线失压", pitfall: "误操作", advice: "三相 PT 联合判断", refIds: ["e-02"] }] },
      { id: "c-similar", kind: "similar", title: "相似案例参考" },
      { id: "c-related", kind: "related", title: "关联资料与延伸阅读", bullets: [{ text: "母线倒闸事故案例" }] },
    ],
    evidence: [
      { id: "e-01", sourceType: "历史案例", docId: "d12", docTitle: "某厂母线倒闸误送电事故复盘", section: "2 原因分析", snippet: "操作票漏写母联三相位置核对步骤。", relatedCardIds: ["c-judge", "c-handle"] },
      { id: "e-02", sourceType: "厂站资料", docId: "d4", docTitle: "厂站运行规程(华东 A 厂)", section: "3 异常处置原则", snippet: "无把握不操作。", relatedCardIds: ["c-handle", "c-risk"] },
    ],
    similarCases: [{ id: "sc-1", title: "某厂母联三相不一致致母线失压", date: "2022-12-08", device: "220kV 母线", phenomenon: "失压", matchPoint: "母联开关三相不同期", process: "排查发现合闸位置三相不一致。", lesson: "倒闸必须核对开关三相位置。" }],
    quickFollowups: ["如何区分母差动作与 PT 故障?", "母联开关三相位置怎么核对?"],
  },
  {
    id: "ft-aux-power",
    kind: "fault",
    title: "站用电系统 失电告警 故障复盘参考",
    voltageLevel: "0.4kV",
    device: "站用电",
    deviceInstance: "站用变 #1",
    phenomenon: "站用电失电",
    currentStatus: "已跳闸",
    tags: ["站用电", "失电告警"],
    cards: [
      { id: "c-app", kind: "applicability", title: "适用场景说明", summary: "面向站用电失电告警的培训复盘。" },
      { id: "c-judge", kind: "judgement", title: "核心判断思路", bullets: [{ text: "区分备自投动作与未动作", refIds: ["e-01"] }, { text: "核对站用变保护动作信号", refIds: ["e-02"] }] },
      { id: "c-handle", kind: "handling", title: "参考处置思路", steps: [{ no: 1, text: "现场核对备自投状态", refIds: ["e-01"] }, { no: 2, text: "保障直流电源与通信电源", refIds: ["e-02"] }] },
      { id: "c-risk", kind: "riskNotes", title: "风险与注意事项", risks: [{ name: "直流系统瞬时失电", pitfall: "保护拒动", advice: "蓄电池容量定期巡检", refIds: ["e-02"] }] },
      { id: "c-similar", kind: "similar", title: "相似案例参考" },
      { id: "c-related", kind: "related", title: "关联资料与延伸阅读", bullets: [{ text: "站用电系统运行规程" }] },
    ],
    evidence: [
      { id: "e-01", sourceType: "厂站资料", docId: "d4", docTitle: "厂站运行规程(华东 A 厂)", section: "3 异常处置原则", snippet: "先汇报后处置。", relatedCardIds: ["c-judge", "c-handle"] },
      { id: "e-02", sourceType: "厂站资料", docId: "d9", docTitle: "新员工入门:值班交接与巡视基础", section: "1 交接要点", snippet: "人员、设备、运行方式、异常事项四清。", relatedCardIds: ["c-handle", "c-risk"] },
    ],
    similarCases: [{ id: "sc-1", title: "某厂蓄电池容量不足致直流失电", date: "2021-09-01", device: "蓄电池组", phenomenon: "短时失电", matchPoint: "电池容量低于额定 60%", process: "切换备用电源恢复。", lesson: "蓄电池容量校核应纳入年度计划。" }],
    quickFollowups: ["备自投未动作怎么排查?", "直流电源如何应急?"],
  },
  {
    id: "ft-secu-fail",
    kind: "fault",
    title: "安控装置 联动异常 故障复盘参考",
    voltageLevel: "500kV",
    device: "安控装置",
    deviceInstance: "区域安控子站",
    phenomenon: "联动异常",
    currentStatus: "异常告警",
    tags: ["安控装置", "联动异常"],
    cards: [
      { id: "c-app", kind: "applicability", title: "适用场景说明", summary: "面向安控装置联动异常告警的培训复盘。" },
      { id: "c-judge", kind: "judgement", title: "核心判断思路", bullets: [{ text: "核对安控通信链路与策略版本", refIds: ["e-01"] }, { text: "确认本厂被切除负荷计算结果", refIds: ["e-02"] }] },
      { id: "c-handle", kind: "handling", title: "参考处置思路", steps: [{ no: 1, text: "汇报调度并按异常处置流程", refIds: ["e-01"] }, { no: 2, text: "记录告警时间序列", refIds: ["e-02"] }] },
      { id: "c-risk", kind: "riskNotes", title: "风险与注意事项", risks: [{ name: "策略版本不一致", pitfall: "切除负荷错误", advice: "上传/下载后必须核对", refIds: ["e-01"] }] },
      { id: "c-similar", kind: "similar", title: "相似案例参考" },
      { id: "c-related", kind: "related", title: "关联资料与延伸阅读", bullets: [{ text: "安控运行管理办法" }] },
    ],
    evidence: [
      { id: "e-01", sourceType: "区域规则", docId: "d8", docTitle: "两细则考核常见知识点汇编", section: "1 AGC 知识点", snippet: "调节速率、精度、响应时间。", relatedCardIds: ["c-judge", "c-handle", "c-risk"] },
      { id: "e-02", sourceType: "厂站资料", docId: "d4", docTitle: "厂站运行规程(华东 A 厂)", section: "2 值班与巡检", snippet: "厂站资料优先适用。", relatedCardIds: ["c-judge", "c-handle"] },
    ],
    similarCases: [{ id: "sc-1", title: "某区域安控策略版本不一致案例", date: "2023-05-19", device: "安控子站", phenomenon: "误切除负荷", matchPoint: "上下行版本号不一致", process: "排查发现策略下发后未确认。", lesson: "策略下发后必须双向校验版本。" }],
    quickFollowups: ["策略版本如何校验?", "本厂被切除负荷如何计算?"],
  },
];

export const ALL_SCENARIOS = [...TYPICAL_TEMPLATES, ...FAULT_TEMPLATES];

export function getScenario(id: string): ScenarioTemplate | undefined {
  return ALL_SCENARIOS.find((s) => s.id === id);
}

// ---------- Knowledge collections ----------
export type Collection = {
  id: string;
  name: string;
  desc: string;
  tags: string[];
  docIds: string[];
  noteIds?: string[];
  scenarioIds?: string[];
  updatedAt: string;
};

export const DEFAULT_COLLECTIONS: Collection[] = [
  {
    id: "kc-main",
    name: "主变停役专题",
    desc: "围绕 220kV / 500kV 主变停役的规程、操作、案例与易错点。",
    tags: ["主变", "典型操作"],
    docIds: ["d2", "d4", "d12"],
    noteIds: ["n-seed-2", "n-seed-4", "n-seed-5"],
    scenarioIds: ["tp-main-stop"],
    updatedAt: "2024-09-12 10:30",
  },
  {
    id: "kc-agc",
    name: "AGC 专题",
    desc: "AGC 三项指标、两细则条款、厂家 SOP 死区/速率配置。",
    tags: ["AGC", "两细则"],
    docIds: ["d1", "d6", "d8"],
    noteIds: ["n-seed-1", "n-seed-6", "n-seed-7"],
    scenarioIds: [],
    updatedAt: "2024-09-10 18:02",
  },
  {
    id: "kc-fault",
    name: "故障复盘案例",
    desc: "差动 / 母差 / 母线倒闸的复盘案例与核查思路。",
    tags: ["故障复盘", "差动保护"],
    docIds: ["d3", "d10", "d12"],
    noteIds: ["n-seed-3", "n-seed-8", "n-seed-9"],
    scenarioIds: ["ft-main-diff", "ft-line-trip"],
    updatedAt: "2024-08-30 16:18",
  },
  {
    id: "kc-exam",
    name: "考试高频易错点",
    desc: "两细则 / 一次调频 / 异常处置 高频错题与解析合集。",
    tags: ["错题", "考试"],
    docIds: ["d8", "d4"],
    noteIds: ["n-seed-10", "n-seed-11"],
    scenarioIds: [],
    updatedAt: "2024-08-22 09:41",
  },
];
