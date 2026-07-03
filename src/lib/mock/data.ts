// Mock data for the AI grid training platform prototype.
// No network calls — pure in-memory typed data.

export type DocType =
  | "规程标准"
  | "典型操作"
  | "故障处置"
  | "厂站资料"
  | "历史案例"
  // | "厂家SOP"
  | "两细则/考核";

export type LearnStatus = "未学" | "学习中" | "已学" | "需复习";

export type Doc = {
  id: string;
  title: string;
  docType: DocType;
  source: "厂站资料" | "区域规则" | "通用规程" | "行业标准";
  plant: string;
  equipment: string;
  year: number;
  updatedAt: string;
  snippet: string;
  highlight: string[];
  toc: { id: string; title: string }[];
  body: { id: string; title: string; text: string; highlight?: boolean }[];
  status: LearnStatus;
  topicId?: string;
  related?: string[];
  scenarioType?: string;
};


export const DOC_TYPES: DocType[] = [
  "规程标准",
  "典型操作",
  "故障处置",
  "厂站资料",
  "历史案例",
  // "厂家SOP",
  "两细则/考核",
];

export const PLANTS = ["华东 A 厂", "华东 B 厂", "华北 C 厂", "西南 D 厂", "通用"];

export const DOCS: Doc[] = [
  {
    id: "d1",
    title: "《并网发电厂辅助服务管理实施细则》AGC 考核条款解读",
    docType: "两细则/考核",
    source: "区域规则",
    plant: "通用",
    equipment: "AGC",
    year: 2024,
    updatedAt: "2024-09-12",
    snippet:
      "AGC 调节性能由调节速率、调节精度与响应时间三项指标综合考核,任一项不满足均按对应规则进行补偿/考核计算。",
    highlight: ["AGC", "考核", "调节性能", "两细则"],
    toc: [
      { id: "s1", title: "一、适用范围" },
      { id: "s2", title: "二、AGC 考核三项指标" },
      { id: "s3", title: "三、补偿与考核计算" },
      { id: "s4", title: "四、厂站侧执行要点" },
    ],
    body: [
      { id: "s1", title: "一、适用范围", text: "本细则适用于直接调度的并网发电厂及对应辅助服务市场成员。" },
      {
        id: "s2",
        title: "二、AGC 考核三项指标",
        text: "调节速率、调节精度、响应时间三项指标综合反映 AGC 调节性能,任一项未达标的均纳入考核。",
        highlight: true,
      },
      { id: "s3", title: "三、补偿与考核计算", text: "K 值法综合三项指标按月统计,具体公式参见附录 A。" },
      { id: "s4", title: "四、厂站侧执行要点", text: "应建立 AGC 日常巡检和异常上报机制,关注控制策略和死区设置。" },
    ],
    status: "学习中",
    topicId: "t-agc",
    related: ["d2", "d6"],
  },
  {
    id: "d2",
    title: "500kV 主变停役标准化操作程序 v3.2",
    docType: "典型操作",
    source: "厂站资料",
    plant: "华东 A 厂",
    equipment: "500kV 主变",
    year: 2024,
    updatedAt: "2024-08-03",
    snippet:
      "主变停役前应核对负荷、保护连接片状态、中性点接地方式、调度许可与现场许可,确认无异常方可执行操作。",
    highlight: ["主变", "停役", "保护连接片", "中性点"],
    toc: [
      { id: "p1", title: "1 前置核对" },
      { id: "p2", title: "2 操作步骤" },
      { id: "p3", title: "3 风险与禁忌" },
      { id: "p4", title: "4 异常处置预案" },
      { id: "p5", title: "5 恢复送电与验收" },
      { id: "p6", title: "6 相关记录与归档" },
    ],
    body: [
      {
        id: "p1",
        title: "1 前置核对",
        text: "核对项包括:\n(1) 主变负荷转移情况,确认对侧线路、母线及备用变压器具备承接负荷的能力,潮流分布满足 N-1 校核要求;\n(2) 相关保护连接片位置,重点核查主变差动、后备保护、本体重瓦斯/轻瓦斯、有载分接开关保护以及失灵联跳压板的投退状态;\n(3) 中性点接地刀闸状态,根据系统方式调整,确保停役过程中中性点接地方式符合调度规定;\n(4) 调度命令与厂站操作票一致性,逐项核对受令时间、操作设备双重命名、操作目的、操作步骤与监护人签名。\n以上任一项存在疑问的,运行值班负责人应立即向当值调度员汇报,严禁带疑问操作。",
        highlight: true,
      },
      {
        id: "p2",
        title: "2 操作步骤",
        text: "按照已审核的操作票顺序执行,每步唱票复诵,关键步骤双人监护:\n步骤 1:在监控后台核对主变三侧开关、刀闸实际位置与遥信指示一致;\n步骤 2:依次断开主变低压侧、中压侧、高压侧负荷开关,断开后检查弧光、声响、油位、油温等无异常;\n步骤 3:拉开三侧母线侧刀闸,检查刀闸三相同步到位,机械指示与电气指示一致;\n步骤 4:合上主变三侧接地刀闸,放置围栏并悬挂\"禁止合闸,有人工作\"标示牌;\n步骤 5:在控制屏退出主变差动保护、后备保护出口压板,做好压板退出记录;\n步骤 6:完成上述操作后,向调度汇报操作结果并请求许可办理工作票。",
      },
      {
        id: "p3",
        title: "3 风险与禁忌",
        text: "(1) 禁止在保护连接片未投入情况下进行带电操作;\n(2) 严禁在主变带电状态下合上任一侧接地刀闸,操作前必须再次确认无电压;\n(3) 严禁省略验电步骤,验电必须使用合格的高压验电器并先在带电体上验证其完好;\n(4) 拉合刀闸过程中如出现卡涩、弧光或异常声响,应立即停止操作并汇报;\n(5) 退出压板时严禁误碰相邻压板,退出后应再次核对压板编号与状态。",
      },
      {
        id: "p4",
        title: "4 异常处置预案",
        text: "停役过程中如发生下列异常,按对应预案处置:\n(1) 主变本体重瓦斯保护动作:立即停止操作,保持现场状态,通知专业人员到现场分析气体;\n(2) 开关拒分:迅速汇报调度,采用越级跳闸或对侧开关切除负荷,严禁人工强分;\n(3) 刀闸机械故障:停止操作,转入手动操作前必须确认电气闭锁完整、设备已停电;\n(4) 通信中断:就地核对设备状态,使用备用通信手段与调度保持联系,严禁盲目操作。",
      },
      {
        id: "p5",
        title: "5 恢复送电与验收",
        text: "工作结束后按反顺序恢复送电:\n(1) 工作票终结,所有工作人员撤离,拆除接地线和标示牌;\n(2) 拉开三侧接地刀闸,核对位置;\n(3) 投入主变差动、后备保护出口压板,核对压板状态记录;\n(4) 合上母线侧刀闸,检查同期条件;\n(5) 依次合上高、中、低压侧开关,合闸后冲击 5 分钟,监视油温、油位、声响、振动正常;\n(6) 向调度汇报送电完成,负荷分配按调度指令逐步恢复。",
      },
      {
        id: "p6",
        title: "6 相关记录与归档",
        text: "操作完成后应及时完成下列记录,并按规定归档保存不少于 3 年:\n(1) 操作票存根,记录每步操作时间、监护人、操作人签名;\n(2) 保护压板投退记录;\n(3) 设备异常及处置记录;\n(4) 主变停送电前后的油色谱、绕组直阻、绝缘电阻等试验数据;\n(5) 与调度通话录音及调度令编号。\n相关电子记录应同步上传至厂站运行管理系统,便于后续追溯与培训复盘。",
      },
    ],
    status: "需复习",
    topicId: "t-op",
    related: ["d3", "d7"],
  },
  {
    id: "d3",
    title: "某 500kV 站母差保护误动事故复盘报告",
    docType: "历史案例",
    source: "区域规则",
    plant: "华北 C 厂",
    equipment: "母线差动保护",
    year: 2023,
    updatedAt: "2023-11-08",
    snippet:
      "案例显示电流互感器二次回路绝缘破损导致差动保护误动,复盘应关注 TA 二次回路检修后绝缘核查环节。",
    highlight: ["差动保护", "误动", "TA", "复盘"],
    toc: [
      { id: "c1", title: "1 事件经过" },
      { id: "c2", title: "2 原因分析" },
      { id: "c3", title: "3 培训复习要点" },
    ],
    body: [
      { id: "c1", title: "1 事件经过", text: "保护动作时间、开关变位、报警序列时间线..." },
      {
        id: "c2",
        title: "2 原因分析",
        text: "二次回路绝缘破损,差动平衡被破坏。",
        highlight: true,
      },
      { id: "c3", title: "3 培训复习要点", text: "差动动作后建议核查方向:TA 极性、二次回路、定值。" },
    ],
    status: "未学",
    topicId: "t-fault",
    related: ["d2"],
  },
  {
    id: "d4",
    title: "厂站运行规程(华东 A 厂)2024 修订版 摘要",
    docType: "厂站资料",
    source: "厂站资料",
    plant: "华东 A 厂",
    equipment: "全站",
    year: 2024,
    updatedAt: "2024-07-01",
    snippet:
      "本规程规定值班、巡检、设备投退、异常处理等基本要求,厂站资料应优先于通用规程在本站使用。",
    highlight: ["厂站资料", "运行规程"],
    toc: [
      { id: "r1", title: "1 总则" },
      { id: "r2", title: "2 值班与巡检" },
      { id: "r3", title: "3 异常处置原则" },
    ],
    body: [
      { id: "r1", title: "1 总则", text: "厂站资料优先适用,通用规程作为补充。" },
      { id: "r2", title: "2 值班与巡检", text: "交接班、巡视周期、记录要求等。" },
      { id: "r3", title: "3 异常处置原则", text: "先汇报后处置;先停电后处理;无把握不操作。", highlight: true },
    ],
    status: "已学",
    topicId: "t-newbie",
    related: ["d2"],
  },
  {
    id: "d5",
    title: "发电厂继电保护及安全自动装置检验规程",
    docType: "规程标准",
    source: "行业标准",
    plant: "通用",
    equipment: "继电保护",
    year: 2022,
    updatedAt: "2024-01-15",
    scenarioType: "技术规范",
    snippet:
      "规定继电保护装置的检验种类、周期、仪器仪表配置、检验前准备及现场检验要求,涵盖互感器、二次回路等关键环节。",
    highlight: ["检验种类", "定期检验", "互感器", "二次回路"],
    toc: [
      { id: "g5", title: "5 检验种类及周期" },
      { id: "g6", title: "6 检验要求" },
      { id: "g7", title: "7 现场检验" },
    ],
    body: [
      {
        id: "g5",
        title: "5 检验种类及周期",
        text: "5.1 检验种类分为新安装保护装置的验收检验、运行中保护装置的定期检验、运行中保护装置的补充检验。\n5.2 定期检验宜尽可能在一次设备停电检修期间进行。\n5.3 运行中的保护装置经过较大的更改或装置的二次回路变动后,应进行检验。\n5.4 详细检验的内容及周期按照 DL/T 995—2016 中 5.1 的规定执行。",
        highlight: true,
      },
      {
        id: "g6",
        title: "6 检验要求",
        text: "6.1 仪器、仪表的基本要求与配置\n6.1.1 装置检验所使用的仪器、仪表应经过检验合格,并应满足 GB/T 7261 的规定,定值检验所使用的仪器、仪表的准确度等级不应低于 0.5 级。\n6.1.2 继电保护专业部门应至少配置以下仪器、仪表:微机继电保护试验仪、便携式录波器(波形记录仪)、可记忆示波器、电压表、电流表、钳形电流表、相位表、相序表、绝缘电阻表(500V、1000V 及 2500V)、毫秒计、电桥等。\n\n6.2 检验前的准备工作\n6.2.1 在现场进行检验工作前,应认真了解被检验保护装置的一次设备情况及相邻的一、二次设备情况,据此制定确保系统安全运行的技术措施。\n6.2.2 应具备与实际状况一致的图纸、上次检验的记录、有效的定值通知单、标准化作业指导书、合格的仪器仪表、备品备件、工具和连接导线等。\n6.2.3 有接地端的测试仪表,在现场进行检验时,不应直接接到直流电源回路中,以防发生直流电源接地现象。\n6.2.6 继电保护检验人员在运行设备上进行检验工作时,应遵照 GB 26860 的规定履行工作许可手续,并采取必要的安全措施之后,才能进行检验工作。\n6.2.7 检验现场应提供安全可靠的检修试验电源,不准许从运行设备上接取试验电源。",
      },
      {
        id: "g7",
        title: "7 现场检验",
        text: "7.1 电流、电压互感器的检验\n7.1.1 新安装电流互感器的验收检验,应检查铭牌参数、出厂合格证及试验资料,包括:所有绕组的极性;所有绕组及其抽头的变比;各绕组的准确度等级、容量及内部安装位置;二次绕组的直流电阻;各绕组的励磁特性曲线。安装竣工后还应核对变比、容量、准确度等级符合设计要求,测试极性关系,检查备用绕组可靠短接并一点接地。\n7.1.2 新安装电压互感器的验收检验,应检查铭牌参数、出厂合格证及试验资料,安装竣工后检查极性关系、相别、端子号标志正确。\n\n7.2 二次回路检验\n7.2.1 新安装二次回路的检验,在被保护设备的断路器、电流互感器以及电压回路与其他单元设备的回路完全断开后方可进行。应对回路所有部件进行观察、清扫与必要的检修及调整;利用导通法依次经过所有中间接线端子,检查电缆回路及电缆芯的标号;检查屏柜上设备及端子排连接正确、牢靠、标号完整。\n端子接入要求:每个端子接入的导线应在两侧均匀分布,一个连接点接入的导线宜为 1 根,不应超过 2 根;电流回路端子的一个连接点不应压 2 根导线;使用多股软线时,应采用冷压接端头;电压回路的相间、正负电源之间、跳(合)闸引出线之间应至少采用一个空端子隔开。",
        highlight: true,
      },
    ],
    status: "未学",
    related: ["d3"],
  },

  {
    id: "d6",
    title: "厂家 SOP:AGC 控制器死区与速率配置说明",
    docType: "厂家SOP",
    source: "厂站资料",
    plant: "华东 A 厂",
    equipment: "AGC 控制器",
    year: 2024,
    updatedAt: "2024-06-20",
    snippet:
      "AGC 控制器调节死区建议设置 ≤1MW,速率限制根据机组爬坡能力调整,变更前须经调度同意。",
    highlight: ["AGC", "死区", "速率"],
    toc: [
      { id: "k1", title: "1 死区参数" },
      { id: "k2", title: "2 速率限制" },
    ],
    body: [
      { id: "k1", title: "1 死区参数", text: "推荐 ≤1MW,过大会导致考核分降低。", highlight: true },
      { id: "k2", title: "2 速率限制", text: "应与机组实际爬坡能力匹配。" },
    ],
    status: "学习中",
    topicId: "t-agc",
    related: ["d1"],
  },
  {
    id: "d7",
    title: "迎峰度夏运行风险提示(第 12 期)",
    docType: "厂站资料",
    source: "区域规则",
    plant: "通用",
    equipment: "全站",
    year: 2024,
    updatedAt: "2024-07-22",
    snippet: "高温大负荷期间应重点关注主变温升、冷却系统、保护装置环境温度等关键指标。",
    highlight: ["迎峰度夏", "主变温升"],
    toc: [{ id: "x1", title: "1 重点关注" }],
    body: [{ id: "x1", title: "1 重点关注", text: "主变温升、冷却系统、保护环境温度。" }],
    status: "未学",
  },
  {
    id: "d8",
    title: "两细则考核常见知识点汇编(2024)",
    docType: "两细则/考核",
    source: "区域规则",
    plant: "通用",
    equipment: "AGC/AVC",
    year: 2024,
    updatedAt: "2024-05-30",
    snippet: "整理 AGC、AVC、一次调频、惯量响应等考核条款的常见知识点与典型计算示例。",
    highlight: ["两细则", "AGC", "AVC", "一次调频"],
    toc: [
      { id: "y1", title: "1 AGC 知识点" },
      { id: "y2", title: "2 AVC 知识点" },
      { id: "y3", title: "3 一次调频" },
    ],
    body: [
      { id: "y1", title: "1 AGC 知识点", text: "调节速率、精度、响应时间。", highlight: true },
      { id: "y2", title: "2 AVC 知识点", text: "电压调节性能与无功响应。" },
      { id: "y3", title: "3 一次调频", text: "死区、调差率、贡献电量。" },
    ],
    status: "需复习",
    topicId: "t-agc",
  },
  {
    id: "d9",
    title: "新员工入门:值班交接与巡视基础",
    docType: "厂站资料",
    source: "厂站资料",
    plant: "华东 A 厂",
    equipment: "全站",
    year: 2024,
    updatedAt: "2024-03-12",
    snippet: "新员工值班期间应完成交接班核对、设备巡视记录、异常情况上报的基本流程训练。",
    highlight: ["新员工", "交接班", "巡视"],
    toc: [{ id: "n1", title: "1 交接要点" }],
    body: [{ id: "n1", title: "1 交接要点", text: "人员、设备、运行方式、异常事项四清。" }],
    status: "已学",
    topicId: "t-newbie",
  },
  {
    id: "d10",
    title: "差动保护动作复盘:核查思路与典型场景",
    docType: "故障处置",
    source: "通用规程",
    plant: "通用",
    equipment: "差动保护",
    year: 2024,
    updatedAt: "2024-04-18",
    snippet: "复盘差动保护动作建议按 TA 极性 → 二次回路 → 定值 → 一次设备状态四步法进行核查。",
    highlight: ["差动", "复盘", "核查"],
    toc: [{ id: "z1", title: "1 四步法核查" }],
    body: [{ id: "z1", title: "1 四步法核查", text: "TA 极性 → 二次回路 → 定值 → 一次设备。", highlight: true }],
    status: "需复习",
    topicId: "t-fault",
    related: ["d3", "d5"],
  },
  {
    id: "d11",
    title: "AVC 投自动后电压越限典型处置流程",
    docType: "故障处置",
    source: "厂站资料",
    plant: "华东 A 厂",
    equipment: "AVC",
    year: 2024,
    updatedAt: "2024-09-25",
    snippet:
      "AVC 投自动后若发生电压越限报警,值班员应在 1 分钟内确认报警,核查 AVC 控制策略并具备手动接管能力。",
    highlight: ["AVC", "电压越限", "手动接管"],
    toc: [
      { id: "a1", title: "1 报警判别" },
      { id: "a2", title: "2 处置步骤" },
      { id: "a3", title: "3 复盘要点" },
    ],
    body: [
      { id: "a1", title: "1 报警判别", text: "区分母线电压越限、AVC 控制偏差、通讯中断三类报警。", highlight: true },
      { id: "a2", title: "2 处置步骤", text: "汇报值长 → 切换 AVC 至手动 → 调节无功补偿设备 → 恢复后总结。" },
      { id: "a3", title: "3 复盘要点", text: "关注 AVC 策略与电网无功平衡匹配,以及无功补偿设备响应速率。" },
    ],
    status: "学习中",
    topicId: "t-agc",
    related: ["d8"],
  },
  {
    id: "d12",
    title: "某厂母线倒闸操作误送电事故复盘",
    docType: "历史案例",
    source: "区域规则",
    plant: "西南 D 厂",
    equipment: "220kV 母线",
    year: 2022,
    updatedAt: "2022-12-08",
    snippet:
      "倒闸过程中因母联开关未完全合闸即拉开旁路,导致非同期合闸冲击,事后定位为操作票漏写状态核对。",
    highlight: ["母线倒闸", "误送电", "非同期"],
    toc: [
      { id: "m1", title: "1 事件经过" },
      { id: "m2", title: "2 原因分析" },
      { id: "m3", title: "3 复盘启示" },
    ],
    body: [
      { id: "m1", title: "1 事件经过", text: "母联合闸不到位、旁路提前拉开造成非同期。" },
      { id: "m2", title: "2 原因分析", text: "操作票漏写母联三相位置核对步骤;监护流于形式。", highlight: true },
      { id: "m3", title: "3 复盘启示", text: "倒闸操作必须核对开关三相位置、辅助接点状态,严格唱票复诵。" },
    ],
    status: "未学",
    topicId: "t-fault",
    related: ["d2", "d3"],
  },
  {
    id: "d13",
    title: "220kV 线路停送电标准化操作要点",
    docType: "典型操作",
    source: "厂站资料",
    plant: "华东 B 厂",
    equipment: "220kV 线路",
    year: 2024,
    updatedAt: "2024-10-08",
    snippet: "线路停送电应核对重合闸、备自投、保护定值区及两侧开关位置,按调度命令逐项执行。",
    highlight: ["线路", "停送电", "重合闸"],
    toc: [
      { id: "l1", title: "1 停役核对" },
      { id: "l2", title: "2 送电恢复" },
    ],
    body: [
      { id: "l1", title: "1 停役核对", text: "核对两侧开关、刀闸位置,确认重合闸已退出。", highlight: true },
      { id: "l2", title: "2 送电恢复", text: "按反顺序恢复,合闸后检查三相电流平衡。" },
    ],
    status: "学习中",
    topicId: "t-op",
    related: ["d2"],
  },
  {
    id: "d14",
    title: "GIS 组合电器 SF6 气体压力异常处置导则",
    docType: "故障处置",
    source: "通用规程",
    plant: "华北 C 厂",
    equipment: "GIS",
    year: 2024,
    updatedAt: "2024-09-18",
    snippet: "SF6 压力降至报警值时应立即汇报,查明泄漏点前不得带压补气,必要时申请停电处理。",
    highlight: ["GIS", "SF6", "气体压力"],
    toc: [{ id: "g1", title: "1 报警判别与汇报" }],
    body: [{ id: "g1", title: "1 报警判别与汇报", text: "区分报警与闭锁,记录压力曲线并汇报调度。", highlight: true }],
    status: "需复习",
    topicId: "t-fault",
  },
  {
    id: "d15",
    title: "继电保护定值单管理与执行核对规范",
    docType: "规程标准",
    source: "行业标准",
    plant: "通用",
    equipment: "继电保护",
    year: 2023,
    updatedAt: "2024-02-20",
    snippet: "定值单须双人核对、审批生效后方可执行,现场变更应留存影像与签字记录。",
    highlight: ["定值单", "核对", "继电保护"],
    toc: [{ id: "s1", title: "1 定值管理流程" }],
    body: [{ id: "s1", title: "1 定值管理流程", text: "编制 → 审核 → 批准 → 执行 → 归档,全程可追溯。" }],
    status: "未学",
    related: ["d5"],
  },
  {
    id: "d16",
    title: "某电厂励磁限制动作导致无功不足事件复盘",
    docType: "历史案例",
    source: "区域规则",
    plant: "西南 D 厂",
    equipment: "励磁系统",
    year: 2023,
    updatedAt: "2023-08-14",
    snippet: "高峰负荷时段励磁限制频繁动作,根因为 AVR 参数与电网电压水平不匹配,事后优化 V/Hz 限制曲线。",
    highlight: ["励磁", "无功", "复盘"],
    toc: [{ id: "f1", title: "1 事件与原因" }],
    body: [{ id: "f1", title: "1 事件与原因", text: "AVR 限制设置偏紧,高峰时段无功支撑不足。" }],
    status: "已学",
    topicId: "t-agc",
    related: ["d11"],
  },
  {
    id: "d17",
    title: "厂家 SOP:一次调频试验步骤与记录要求",
    docType: "厂家SOP",
    source: "厂站资料",
    plant: "华东 A 厂",
    equipment: "一次调频",
    year: 2024,
    updatedAt: "2024-11-02",
    snippet: "一次调频试验前须确认 DEH/DCS 协调、频率扰动量设定及录波装置投入,试验后 24h 内提交记录。",
    highlight: ["一次调频", "试验", "录波"],
    toc: [
      { id: "p1", title: "1 试验准备" },
      { id: "p2", title: "2 试验步骤" },
    ],
    body: [
      { id: "p1", title: "1 试验准备", text: "核对机组状态、调频投退压板、录波触发条件。", highlight: true },
      { id: "p2", title: "2 试验步骤", text: "施加频率扰动,记录响应时间、贡献电量与恢复时间。" },
    ],
    status: "学习中",
    topicId: "t-agc",
    related: ["d1", "d8"],
  },
  {
    id: "d18",
    title: "华东电网迎峰度冬运行方式安排通知",
    docType: "厂站资料",
    source: "区域规则",
    plant: "通用",
    equipment: "全站",
    year: 2024,
    updatedAt: "2024-11-15",
    snippet: "度冬期间强化设备防寒防冻、直流融冰准备及备用电源检查,重点关注线路覆冰与主变油温。",
    highlight: ["迎峰度冬", "防寒", "覆冰"],
    toc: [{ id: "w1", title: "1 重点工作" }],
    body: [{ id: "w1", title: "1 重点工作", text: "防寒防冻、覆冰监测、备用电源与柴油发电机试验。" }],
    status: "未学",
  },
  {
    id: "d19",
    title: "母线倒闸操作标准化程序(华东 B 厂)",
    docType: "典型操作",
    source: "厂站资料",
    plant: "华东 B 厂",
    equipment: "220kV 母线",
    year: 2024,
    updatedAt: "2024-08-27",
    snippet: "母线倒闸须逐项核对母联、旁路、刀闸位置,严禁带负荷拉合刀闸,操作全程双人监护。",
    highlight: ["母线倒闸", "刀闸", "监护"],
    toc: [{ id: "b1", title: "1 操作原则" }],
    body: [{ id: "b1", title: "1 操作原则", text: "先合后拉、逐项核对、唱票复诵、异常即停。", highlight: true }],
    status: "需复习",
    topicId: "t-op",
    related: ["d12"],
  },
  {
    id: "d20",
    title: "变压器有载分接开关检修后验收要点",
    docType: "规程标准",
    source: "行业标准",
    plant: "通用",
    equipment: "有载分接开关",
    year: 2022,
    updatedAt: "2024-04-05",
    snippet: "检修后应核对档位指示、油位、瓦斯继电器及电动机构联锁,送电前做升降温试验。",
    highlight: ["有载开关", "检修", "验收"],
    toc: [{ id: "o1", title: "1 验收项目" }],
    body: [{ id: "o1", title: "1 验收项目", text: "档位、油位、瓦斯、联锁、电动操作各 2 个循环。" }],
    status: "未学",
    related: ["d2"],
  },
  {
    id: "d21",
    title: "直流系统接地故障查找与处置流程",
    docType: "故障处置",
    source: "通用规程",
    plant: "华东 A 厂",
    equipment: "直流系统",
    year: 2024,
    updatedAt: "2024-10-22",
    snippet: "直流接地时应采用拉路法分段排查,先信号后控制,先次要后重要,全程做好绝缘监测记录。",
    highlight: ["直流接地", "拉路法", "绝缘"],
    toc: [
      { id: "d1", title: "1 查找原则" },
      { id: "d2", title: "2 处置步骤" },
    ],
    body: [
      { id: "d1", title: "1 查找原则", text: "先信号回路后控制回路,先备用后运行。", highlight: true },
      { id: "d2", title: "2 处置步骤", text: "拉路排查 → 定位支路 → 隔离故障 → 恢复运行。" },
    ],
    status: "学习中",
    topicId: "t-fault",
  },
  {
    id: "d22",
    title: "机组深调工况下环保设施运行注意事项",
    docType: "厂站资料",
    source: "厂站资料",
    plant: "华北 C 厂",
    equipment: "环保设施",
    year: 2024,
    updatedAt: "2024-06-30",
    snippet: "深调期间关注脱硝、除尘、脱硫系统投退协调,防止超低排放超标及设备结露腐蚀。",
    highlight: ["深调", "环保", "超低排放"],
    toc: [{ id: "e1", title: "1 运行注意" }],
    body: [{ id: "e1", title: "1 运行注意", text: "深调时提前与环保专工沟通,监视各污染物浓度趋势。" }],
    status: "已学",
  },
  {
    id: "d23",
    title: "某站备自投误动导致全站失电事故通报",
    docType: "历史案例",
    source: "区域规则",
    plant: "华东 B 厂",
    equipment: "备自投",
    year: 2022,
    updatedAt: "2022-10-19",
    snippet: "备自投定值与运行方式不匹配,检修期间未退出相关功能,导致误合至故障母线。",
    highlight: ["备自投", "误动", "全站失电"],
    toc: [{ id: "h1", title: "1 原因与教训" }],
    body: [{ id: "h1", title: "1 原因与教训", text: "检修前应退出备自投并核对方式单,防止误动。", highlight: true }],
    status: "未学",
    topicId: "t-fault",
  },
  {
    id: "d24",
    title: "AVC 与 AGC 协调控制常见问题汇编",
    docType: "两细则/考核",
    source: "区域规则",
    plant: "通用",
    equipment: "AGC/AVC",
    year: 2024,
    updatedAt: "2024-12-01",
    snippet: "汇总 AVC 越限、AGC 闭锁、无功考核扣分等典型场景的处理思路与参数核查清单。",
    highlight: ["AVC", "AGC", "协调控制"],
    toc: [
      { id: "v1", title: "1 AVC 越限" },
      { id: "v2", title: "2 协调闭锁" },
    ],
    body: [
      { id: "v1", title: "1 AVC 越限", text: "检查电压设定、无功曲线与电容器投切策略。", highlight: true },
      { id: "v2", title: "2 协调闭锁", text: "AGC 与 AVC 目标冲突时的优先级与解锁条件。" },
    ],
    status: "需复习",
    topicId: "t-agc",
    related: ["d8", "d11"],
  },
];

export const HOT_KEYWORDS = ["AGC 考核", "主变停役", "差动保护", "两细则", "迎峰度夏", "新员工入门"];

// ---------- Topics ----------
export type Topic = {
  id: string;
  title: string;
  desc: string;
  role: "运行" | "运检" | "管理" | "通用";
  cover: string; // tailwind gradient class
  docIds: string[];
  questionCount: number;
  progress: number;
};

export const TOPICS: Topic[] = [
  {
    id: "t-newbie",
    title: "新员工入门包",
    desc: "面向首次上岗人员,涵盖值班、巡检与基本异常处置流程。",
    role: "运行",
    cover: "from-[oklch(0.55_0.12_205)] to-[oklch(0.65_0.13_188)]",
    docIds: ["d4", "d9", "d7", "d12", "d2"],
    questionCount: 12,
    progress: 45,
  },
  {
    id: "t-op",
    title: "典型操作专题",
    desc: "主变停送电、母线倒闸、线路停役等典型操作的标准化要点。",
    role: "运行",
    cover: "from-[oklch(0.6_0.12_165)] to-[oklch(0.7_0.15_160)]",
    docIds: ["d2"],
    questionCount: 18,
    progress: 60,
  },
  {
    id: "t-fault",
    title: "故障复盘专题",
    desc: "差动、距离、零序等保护动作后的复盘思路与典型案例。",
    role: "运行",
    cover: "from-[oklch(0.65_0.18_45)] to-[oklch(0.75_0.16_55)]",
    docIds: ["d3", "d10"],
    questionCount: 14,
    progress: 25,
  },
  {
    id: "t-agc",
    title: "AGC / 两细则专项",
    desc: "AGC 性能指标、两细则考核条款与厂站侧执行要点。",
    role: "运行",
    cover: "from-[oklch(0.55_0.18_280)] to-[oklch(0.65_0.16_265)]",
    docIds: ["d1", "d6", "d8"],
    questionCount: 16,
    progress: 35,
  },
  {
    id: "t-chem",
    title: "化学水处理专题",
    desc: "凝结水、补给水与循环水水质指标控制及异常处置。",
    role: "运行",
    cover: "from-[oklch(0.58_0.1_200)] to-[oklch(0.68_0.12_195)]",
    docIds: ["d4", "d7"],
    questionCount: 10,
    progress: 18,
  },
  {
    id: "t-boiler",
    title: "锅炉运行基础",
    desc: "燃烧调整、汽温汽压控制与典型异常工况处理。",
    role: "运行",
    cover: "from-[oklch(0.62_0.14_40)] to-[oklch(0.72_0.16_50)]",
    docIds: ["d5"],
    questionCount: 14,
    progress: 52,
  },
  {
    id: "t-relay",
    title: "继电保护专项强化",
    desc: "主保护、后备保护配置原则与定值核对要点。",
    role: "运行",
    cover: "from-[oklch(0.55_0.12_250)] to-[oklch(0.65_0.14_245)]",
    docIds: ["d3", "d10"],
    questionCount: 12,
    progress: 12,
  },
  {
    id: "t-dispatch",
    title: "调度纪律与合规",
    desc: "调度命令执行、信息汇报与涉网安全合规要求。",
    role: "运行",
    cover: "from-[oklch(0.56_0.11_220)] to-[oklch(0.66_0.13_215)]",
    docIds: ["d1", "d6"],
    questionCount: 9,
    progress: 0,
  },
  {
    id: "t-safety",
    title: "安全生产与两票",
    desc: "工作票、操作票办理流程与现场安全措施落实。",
    role: "运行",
    cover: "from-[oklch(0.6_0.12_165)] to-[oklch(0.7_0.15_160)]",
    docIds: ["d2", "d9"],
    questionCount: 11,
    progress: 68,
  },
  {
    id: "t-inspect",
    title: "设备巡检规范",
    desc: "日常巡检路线、记录要点与缺陷上报闭环。",
    role: "运行",
    cover: "from-[oklch(0.58_0.1_180)] to-[oklch(0.68_0.12_175)]",
    docIds: ["d12"],
    questionCount: 8,
    progress: 40,
  },
  {
    id: "t-net",
    title: "涉网稳定性专题",
    desc: "一次调频、PSS 与涉网性能试验相关知识点。",
    role: "运行",
    cover: "from-[oklch(0.55_0.18_280)] to-[oklch(0.65_0.16_265)]",
    docIds: ["d1", "d8"],
    questionCount: 13,
    progress: 22,
  },
  {
    id: "t-meter",
    title: "电能计量与关口",
    desc: "关口表计、互感器误差与电量结算核对流程。",
    role: "运行",
    cover: "from-[oklch(0.57_0.11_210)] to-[oklch(0.67_0.13_205)]",
    docIds: ["d11"],
    questionCount: 7,
    progress: 8,
  },
  {
    id: "t-turbine",
    title: "汽机专业基础",
    desc: "汽轮机启停、振动监测与真空系统运行要点。",
    role: "运行",
    cover: "from-[oklch(0.59_0.12_190)] to-[oklch(0.69_0.14_185)]",
    docIds: ["d4"],
    questionCount: 10,
    progress: 30,
  },
];

// ---------- Questions ----------
export type QuestionType = "single" | "multiple" | "judge" | "text";
export type Question = {
  id: string;
  type: QuestionType;
  stem: string;
  options?: { key: string; label: string }[];
  answer: string | string[];
  analysis: string;
  knowledgePoints: string[];
  /** mock 专项练习难度筛选 */
  difficulty?: "easy" | "hard";
  scene?: string;
  relatedDocId?: string;
  relatedDocTitle?: string;
};

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    type: "single",
    stem: "两细则中 AGC 考核的三项核心指标不包括下列哪一项?",
    options: [
      { key: "A", label: "调节速率" },
      { key: "B", label: "调节精度" },
      { key: "C", label: "响应时间" },
      { key: "D", label: "无功补偿容量" },
    ],
    answer: "D",
    analysis: "AGC 考核三项指标为:调节速率、调节精度、响应时间。无功补偿属于 AVC 相关。",
    knowledgePoints: ["AGC", "两细则"],
    scene: "AGC",
    relatedDocId: "d1",
    relatedDocTitle: "AGC 考核条款解读",
  },
  {
    id: "q2",
    type: "multiple",
    stem: "500kV 主变停役前应核对的项目包括(多选):",
    options: [
      { key: "A", label: "负荷转移情况" },
      { key: "B", label: "保护连接片位置" },
      { key: "C", label: "中性点接地刀闸状态" },
      { key: "D", label: "调度命令与操作票一致性" },
    ],
    answer: ["A", "B", "C", "D"],
    analysis: "四项均为停役前必须核对项,缺一不可。",
    knowledgePoints: ["主变停役", "典型操作"],
    relatedDocId: "d2",
    relatedDocTitle: "500kV 主变停役标准化程序",
  },
  {
    id: "q3",
    type: "judge",
    stem: "厂站资料与通用规程冲突时,应优先按照通用规程执行。",
    answer: "F",
    analysis: "厂站资料优先适用,通用规程作为补充。",
    knowledgePoints: ["厂站规程"],
    relatedDocId: "d4",
  },
  {
    id: "q4",
    type: "single",
    stem: "差动保护动作后,推荐的核查顺序四步法是:",
    options: [
      { key: "A", label: "定值 → TA → 二次回路 → 一次设备" },
      { key: "B", label: "TA 极性 → 二次回路 → 定值 → 一次设备" },
      { key: "C", label: "一次设备 → 二次回路 → TA → 定值" },
      { key: "D", label: "二次回路 → 一次设备 → TA → 定值" },
    ],
    answer: "B",
    analysis: "推荐 TA 极性 → 二次回路 → 定值 → 一次设备四步核查法。",
    knowledgePoints: ["差动保护", "故障复盘"],
    relatedDocId: "d10",
  },
  {
    id: "q5",
    type: "judge",
    stem: "AGC 控制器死区设置过大不会影响两细则考核成绩。",
    answer: "F",
    analysis: "死区过大会导致调节精度下降,直接影响考核分。",
    knowledgePoints: ["AGC", "死区"],
    relatedDocId: "d6",
  },
  {
    id: "q6",
    type: "single",
    stem: "下列属于「两细则」中辅助服务考核的是:",
    options: [
      { key: "A", label: "AGC 调节性能" },
      { key: "B", label: "线损率" },
      { key: "C", label: "供电可靠率" },
      { key: "D", label: "线路检修周期" },
    ],
    answer: "A",
    analysis: "AGC 调节性能属于两细则中的辅助服务考核范围。",
    knowledgePoints: ["两细则"],
    relatedDocId: "d8",
  },
  {
    id: "q7",
    type: "multiple",
    stem: "继电保护配置应满足的基本要求包括:",
    options: [
      { key: "A", label: "选择性" },
      { key: "B", label: "速动性" },
      { key: "C", label: "灵敏性" },
      { key: "D", label: "可靠性" },
    ],
    answer: ["A", "B", "C", "D"],
    analysis: "四性要求是继电保护配置的基本原则。",
    knowledgePoints: ["继电保护"],
    relatedDocId: "d5",
  },
  {
    id: "q8",
    type: "single",
    stem: "迎峰度夏期间运行重点关注的不包括:",
    options: [
      { key: "A", label: "主变温升" },
      { key: "B", label: "冷却系统" },
      { key: "C", label: "保护装置环境温度" },
      { key: "D", label: "冬季融冰装置" },
    ],
    answer: "D",
    analysis: "融冰装置为冬季关注项。",
    knowledgePoints: ["迎峰度夏"],
    relatedDocId: "d7",
  },
  {
    id: "q9",
    type: "judge",
    stem: "差动保护误动可能由 TA 二次回路绝缘破损引起。",
    answer: "T",
    analysis: "TA 二次回路绝缘破损会破坏差动平衡导致误动。",
    knowledgePoints: ["差动保护", "故障复盘"],
    relatedDocId: "d3",
  },
  {
    id: "q10",
    type: "single",
    stem: "AGC 控制器速率限制应根据什么调整?",
    options: [
      { key: "A", label: "调度审批口令" },
      { key: "B", label: "机组实际爬坡能力" },
      { key: "C", label: "气候条件" },
      { key: "D", label: "负荷高峰" },
    ],
    answer: "B",
    analysis: "速率限制应与机组实际爬坡能力匹配。",
    knowledgePoints: ["AGC"],
    relatedDocId: "d6",
  },
  {
    id: "q11",
    type: "multiple",
    stem: "厂站异常处置原则包括:",
    options: [
      { key: "A", label: "先汇报后处置" },
      { key: "B", label: "先停电后处理" },
      { key: "C", label: "无把握不操作" },
      { key: "D", label: "尽快试送" },
    ],
    answer: ["A", "B", "C"],
    analysis: "前三项为异常处置基本原则;无把握的盲目试送可能扩大事故。",
    knowledgePoints: ["异常处置"],
    relatedDocId: "d4",
  },
  {
    id: "q12",
    type: "judge",
    stem: "操作票关键步骤可以由单人独立执行无需监护。",
    answer: "F",
    analysis: "关键步骤必须双人监护,唱票复诵。",
    knowledgePoints: ["典型操作"],
    relatedDocId: "d2",
  },
  {
    id: "q13",
    type: "single",
    stem: "AVC 主要调节对象是:",
    options: [
      { key: "A", label: "有功功率" },
      { key: "B", label: "无功功率/电压" },
      { key: "C", label: "频率" },
      { key: "D", label: "相位" },
    ],
    answer: "B",
    analysis: "AVC(自动电压控制)调节无功与电压。",
    knowledgePoints: ["AVC"],
    relatedDocId: "d8",
  },
  {
    id: "q14",
    type: "text",
    stem: "简述差动保护动作后的复盘核查思路。",
    answer: "按 TA 极性 → 二次回路 → 定值 → 一次设备四步法进行复盘核查,记录时间线与保护动作序列。",
    analysis: "参考答案:四步法核查,关注 TA 极性、回路完整性、定值正确性和一次设备状态。",
    knowledgePoints: ["差动保护", "故障复盘"],
    relatedDocId: "d10",
  },
  {
    id: "q15",
    type: "single",
    stem: "一次调频死区设置过小会带来的问题是:",
    options: [
      { key: "A", label: "调节响应过于灵敏,设备频繁动作" },
      { key: "B", label: "考核分必然提高" },
      { key: "C", label: "无影响" },
      { key: "D", label: "设备无需维护" },
    ],
    answer: "A",
    analysis: "死区过小将导致频繁动作,加速设备磨损。",
    knowledgePoints: ["一次调频"],
    relatedDocId: "d8",
  },
  {
    id: "q16",
    type: "single",
    stem: "并网机组一次调频的「调差率」一般推荐设置范围是:",
    options: [
      { key: "A", label: "1% ~ 2%" },
      { key: "B", label: "3% ~ 5%" },
      { key: "C", label: "6% ~ 8%" },
      { key: "D", label: "10% 以上" },
    ],
    answer: "B",
    analysis: "并网常规火电机组一次调频调差率一般在 3%~5% 范围,过大将削弱响应贡献。",
    knowledgePoints: ["一次调频", "两细则"],
    relatedDocId: "d8",
  },
  {
    id: "q17",
    type: "multiple",
    stem: "下列情形属于差动保护「区外故障」表现的有(多选):",
    options: [
      { key: "A", label: "保护差流接近为零" },
      { key: "B", label: "保护启动但未出口" },
      { key: "C", label: "保护出口跳闸" },
      { key: "D", label: "录波显示流入流出电流方向一致" },
    ],
    answer: ["A", "B", "D"],
    analysis: "区外故障下差动平衡保持,差流近零、保护启动但不出口、流入流出方向一致。",
    knowledgePoints: ["差动保护", "故障复盘"],
    relatedDocId: "d3",
  },
  {
    id: "q18",
    type: "single",
    stem: "操作票执行中遇到与现场实际不符时,应优先:",
    options: [
      { key: "A", label: "按操作票继续执行" },
      { key: "B", label: "停止操作,向值长/调度汇报" },
      { key: "C", label: "现场修改操作票后执行" },
      { key: "D", label: "由监护人独立判断" },
    ],
    answer: "B",
    analysis: "操作票与现场不符必须停操汇报,严禁现场私自改票或继续执行。",
    knowledgePoints: ["典型操作", "异常处置"],
    relatedDocId: "d2",
  },
  {
    id: "q19",
    type: "judge",
    stem: "AVC 装置投自动后,值班员仍需关注电压越限报警并具备手动接管能力。",
    answer: "T",
    analysis: "AVC 自动运行不免除值班员监盘和异常接管职责。",
    knowledgePoints: ["AVC", "运行值班"],
    relatedDocId: "d11",
  },
  {
    id: "q20",
    type: "single",
    stem: "迎峰度夏期间主变上层油温持续上升至 75℃ 报警,首要处置应为:",
    options: [
      { key: "A", label: "立即拉开主变" },
      { key: "B", label: "汇报值长,检查冷却装置投入与油位" },
      { key: "C", label: "无需处理继续观察" },
      { key: "D", label: "等待自然降温" },
    ],
    answer: "B",
    analysis: "应先汇报并检查冷却系统/油位,不可盲目停运或被动等待。",
    knowledgePoints: ["迎峰度夏", "异常处置"],
    relatedDocId: "d7",
  },
  {
    id: "q21",
    type: "multiple",
    stem: "母差保护「TA 极性反接」可能表现为:",
    options: [
      { key: "A", label: "正常运行中差流持续较大" },
      { key: "B", label: "区外故障误动" },
      { key: "C", label: "区内故障拒动" },
      { key: "D", label: "保护装置自检告警" },
    ],
    answer: ["A", "B", "C"],
    analysis: "极性反接导致差流异常,可引起误动或拒动,自检通常不会主动报极性错误。",
    knowledgePoints: ["差动保护", "继电保护"],
    relatedDocId: "d5",
  },
  {
    id: "q22",
    type: "judge",
    stem: "厂家 SOP 与厂站运行规程冲突时,默认按厂家 SOP 执行。",
    answer: "F",
    analysis: "厂站资料优先适用,厂家 SOP 仅作为补充,冲突时应走变更流程协调。",
    knowledgePoints: ["厂站规程", "厂家SOP"],
    relatedDocId: "d4",
  },
  {
    id: "q23",
    type: "single",
    stem: "下列哪项不属于「两细则」中惯量响应考核要素?",
    options: [
      { key: "A", label: "频率变化率 RoCoF 响应" },
      { key: "B", label: "有功增量贡献" },
      { key: "C", label: "动作持续时间" },
      { key: "D", label: "无功调节速率" },
    ],
    answer: "D",
    analysis: "无功调节速率属 AVC 范畴,不在惯量响应考核内。",
    knowledgePoints: ["一次调频", "两细则"],
    relatedDocId: "d8",
  },
  {
    id: "q24",
    type: "text",
    stem: "简述 500kV 主变停役过程中关键风险点及监护要求。",
    answer: "关键风险:负荷未完全转移、保护连接片状态错误、中性点接地刀闸误操作。监护要求:双人监护、唱票复诵、关键步骤值长把关、调度许可与现场许可一致。",
    analysis: "应包括负荷/连接片/中性点/调度许可四项核对要点及双人监护、唱票复诵流程。",
    knowledgePoints: ["主变停役", "典型操作"],
    relatedDocId: "d2",
  },
  {
    id: "q25",
    type: "single",
    stem: "关于「依据可追溯」原则,下列做法正确的是:",
    options: [
      { key: "A", label: "口头叙述结论,不必标注出处" },
      { key: "B", label: "结论必须能追溯到具体规程章节或案例片段" },
      { key: "C", label: "只要培训人记忆深刻即可" },
      { key: "D", label: "复盘只看结果不看过程" },
    ],
    answer: "B",
    analysis: "结论可追溯到原文片段,是 AI 训练平台问答与培训的可信基础。",
    knowledgePoints: ["故障复盘", "运行值班"],
    relatedDocId: "d10",
  },
];

// ---------- Knowledge categories (for 专项练习 selector) ----------
export const KNOWLEDGE_CATEGORIES = [
  { key: "电力系统基础知识", label: "电力系统基础知识", desc: "电力系统基本理论、一次设备基础、电网结构、运行方式、潮流与稳定等基础内容", questionCount: 892 },
  { key: "规程规定和制度", label: "规程规定和制度", desc: "安全规程、运行规程、调度规程、操作票制度、反事故措施及公司管理制度", questionCount: 756 },
  { key: "电网调度运行操作", label: "电网调度运行操作", desc: "调控运行、倒闸操作、运行方式调整、许可汇报、异常信号处置等内容", questionCount: 634 },
  { key: "电网运行危险点与反事故演习", label: "电网运行危险点与反事故演习", desc: "国家法规、行业规程、公司制度、本市调控规程、变电运行规程、配网运维规程、标准化作业要求", questionCount: 521 },
  { key: "其他专业知识", label: "其他专业知识", desc: "继电保护、安全自动装置、通信自动化、配电网运行、发电厂及电气设备等扩展专业内容", questionCount: 487 },
  { key: "AGC", label: "AGC / 两细则", desc: "AGC 三项指标、调频、考核计算", questionCount: 648 },
  { key: "主变停役", label: "典型操作", desc: "主变停送电、母线倒闸、操作票", questionCount: 412 },
  { key: "差动保护", label: "继电保护与故障复盘", desc: "差动、距离、零序复盘四步法", questionCount: 538 },
  { key: "AVC", label: "AVC / 无功电压", desc: "AVC 自动控制、电压越限处置", questionCount: 356 },
  { key: "迎峰度夏", label: "季节性运行", desc: "迎峰度夏、冷却系统、温升监测", questionCount: 289 },
  { key: "异常处置", label: "异常处置原则", desc: "先汇报后处置、无把握不操作", questionCount: 445 },
  { key: "厂站规程", label: "厂站资料 / 新员工", desc: "值班、交接、规程优先适用", questionCount: 367 },
  { key: "一次调频", label: "一次调频 / 惯量响应", desc: "死区、调差率、贡献电量", questionCount: 423 },
] as const;

// ---------- Conversations (mock chat) ----------
export type AnswerCitation = {
  docId: string;
  section: string;
  quote: string;
  label?: string;
  position?: string;
};
export type AnswerCard = {
  summary: string;
  body?: string;
  citations: AnswerCitation[];
  scope: string;
  uncertainty?: string;
};
export type ChatMsg =
  | { role: "user"; text: string; time?: string }
  | { role: "assistant"; card: AnswerCard; time?: string };

export type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMsg[];
  pinned?: boolean;
};

export const CONVERSATIONS: Conversation[] = [
  {
    id: "c-agc",
    title: "AGC 考核依据哪些规程?",
    updatedAt: "今天 14:08",
    messages: [
      { role: "user", text: "AGC 考核主要依据哪些文件?", time: "今天 14:08" },
      {
        role: "assistant",
        time: "今天 14:08",
        card: {
          summary:
            "AGC 考核主要依据《并网发电厂辅助服务管理实施细则》[1]、《厂站运行规程》[2] 以及厂家提供的 AGC 控制器 SOP 配置说明 [3]。不同地区的细则口径可能存在差异，实际应以当地调度发布版本为准。",
          citations: [
            {
              docId: "d1",
              section: "二、AGC 考核三项指标",
              quote: "调节速率、调节精度、响应时间可作为考核关注指标……",
              label: "题库",
              position: "二、AGC 考核三项指标",
            },
            {
              docId: "d4",
              section: "1 总则",
              quote: "厂站资料优先适用，通用规程作为补充……",
              label: "厂站",
              position: "1 总则",
            },
            {
              docId: "d6",
              section: "1 死区参数",
              quote: "推荐 ≤ 1MW，过大会导致考核响应降低……",
              label: "SOP",
              position: "1 死区参数",
            },
          ],
          scope: "适用厂站：接入辅助服务市场的并网发电厂；岗位：运行值班、技术管理。",
          uncertainty: "各区域细则版本差异，具体计算公式以本区域最新发布版本为准。",
        },
      },
      { role: "user", text: "三项指标具体怎么理解？K 值和考核有什么关系？", time: "今天 14:12" },
      {
        role: "assistant",
        time: "今天 14:12",
        card: {
          summary:
            "三项指标分别衡量调节速率、调节精度与响应时间 [1]。K 值法将三项综合为月度考核系数 [2]，任一项未达标均可能拉低综合 K 值。厂站侧应重点关注死区设置与指令跟踪偏差 [3]。",
          citations: [
            {
              docId: "d1",
              section: "二、AGC 考核三项指标",
              quote: "调节速率、调节精度、响应时间三项指标综合反映 AGC 调节性能,任一项未达标的均纳入考核。",
              label: "题库",
              position: "二、AGC 考核三项指标",
            },
            {
              docId: "d1",
              section: "三、补偿与考核计算",
              quote: "K 值法综合三项指标按月统计,具体公式参见附录 A。",
              label: "题库",
              position: "三、补偿与考核计算",
            },
            {
              docId: "d6",
              section: "1 死区参数",
              quote: "推荐 ≤ 1MW，过大会导致考核响应降低……",
              label: "SOP",
              position: "1 死区参数",
            },
          ],
          scope: "适用对象：AGC 运行值班与技术管理人员。",
          uncertainty: "不同区域 K 值计算公式存在版本差异，以本区域细则附录为准。",
        },
      },
      { role: "user", text: "厂站日常巡检 AGC 要关注哪些点？", time: "今天 14:18" },
      {
        role: "assistant",
        time: "今天 14:18",
        card: {
          summary:
            "建议建立日常巡检机制 [1]：① 控制模式与投退状态；② 指令跟踪与死区设置 [2]；③ 异常上报与记录归档。出现响应迟缓时优先核对 SOP 参数与通信状态 [3]。",
          citations: [
            {
              docId: "d1",
              section: "四、厂站侧执行要点",
              quote: "应建立 AGC 日常巡检和异常上报机制,关注控制策略和死区设置。",
              label: "题库",
              position: "四、厂站侧执行要点",
            },
            {
              docId: "d6",
              section: "1 死区参数",
              quote: "推荐 ≤ 1MW，过大会导致考核响应降低……",
              label: "SOP",
              position: "1 死区参数",
            },
            {
              docId: "d4",
              section: "1 总则",
              quote: "厂站资料优先适用，通用规程作为补充……",
              label: "厂站",
              position: "1 总则",
            },
          ],
          scope: "适用场景：并网发电厂 AGC 日常运行管理。",
        },
      },
      { role: "user", text: "如果本月 K 值偏低，可以从哪些方面改进？", time: "今天 14:25" },
      {
        role: "assistant",
        time: "今天 14:25",
        card: {
          summary:
            "可从三方面改进：① 优化控制策略，减小死区与响应滞后 [1][2]；② 加强运行人员培训，规范指令确认与异常处置 [3]；③ 对照历史考核数据做专项复盘，识别反复失分时段。",
          citations: [
            {
              docId: "d6",
              section: "1 死区参数",
              quote: "推荐 ≤ 1MW，过大会导致考核响应降低……",
              label: "SOP",
              position: "1 死区参数",
            },
            {
              docId: "d1",
              section: "二、AGC 考核三项指标",
              quote: "调节速率、调节精度、响应时间三项指标综合反映 AGC 调节性能,任一项未达标的均纳入考核。",
              label: "题库",
              position: "二、AGC 考核三项指标",
            },
            {
              docId: "d1",
              section: "四、厂站侧执行要点",
              quote: "应建立 AGC 日常巡检和异常上报机制,关注控制策略和死区设置。",
              label: "题库",
              position: "四、厂站侧执行要点",
            },
          ],
          scope: "适用厂站：已接入辅助服务市场、存在 AGC 考核压力的并网电厂。",
          uncertainty: "改进措施需结合本厂 DCS/AGC 系统实际情况，重大参数调整应履行审批程序。",
        },
      },
    ],
  },
  {
    id: "c-trans",
    title: "主变停役前要核对哪些状态?",
    updatedAt: "昨天 16:42",
    messages: [
      { role: "user", text: "主变停役前需要核对哪些状态?" },
      {
        role: "assistant",
        card: {
          summary:
            "建议核对四项:① 负荷转移情况;② 相关保护连接片位置 [1];③ 中性点接地刀闸状态;④ 调度命令与厂站操作票一致性。培训复习可关注厂站接线方式差异 [2]。",
          citations: [
            { docId: "d2", section: "1 前置核对", quote: "核对项包括:主变负荷转移情况、相关保护连接片位置..." },
            { docId: "d4", section: "3 异常处置原则", quote: "先汇报后处置;先停电后处理;无把握不操作。" },
          ],
          scope: "适用设备:220kV/500kV 主变;场景:计划停役。",
          uncertainty: "厂站接线方式差异较大,本回答以典型双绕组接线为基础,具体仍以本厂站接线图为准。",
        },
      },
    ],
  },
  {
    id: "c-diff",
    title: "差动保护误动如何复盘?",
    updatedAt: "20 天前",
    messages: [
      { role: "user", text: "差动保护误动后,复盘思路是什么?" },
      {
        role: "assistant",
        card: {
          summary:
            "建议按 TA 极性 → 二次回路 → 定值 → 一次设备四步法核查 [1],并对照同类历史案例 [2]、母线倒闸事故 [3] 排查相似隐患。重点关注 TA 二次回路绝缘与极性接线。",
          citations: [
            { docId: "d10", section: "1 四步法核查", quote: "TA 极性 → 二次回路 → 定值 → 一次设备。" },
            { docId: "d3", section: "2 原因分析", quote: "二次回路绝缘破损,差动平衡被破坏。" },
            { docId: "d12", section: "2 原因分析", quote: "操作票漏写母联三相位置核对步骤..." },
          ],
          scope: "适用场景:母差、线路差动、变压器差动保护动作后的复盘训练。",
          uncertainty: "差动保护类型不同,核查重点略有差异,具体以本厂保护装置说明书为准。",
        },
      },
    ],
  },
  {
    id: "c-rules",
    title: "交易类型与方式",
    updatedAt: "5 天前",
    messages: [],
  },
  {
    id: "c-avc",
    title: "双碳目标及电力作用",
    updatedAt: "6 天前",
    messages: [],
  },
  {
    id: "c-relay",
    title: "继电保护动作逻辑",
    updatedAt: "18 天前",
    messages: [],
  },
  {
    id: "c-deep",
    title: "深度调峰低负荷稳燃",
    updatedAt: "25 天前",
    messages: [],
  },
];

// ---------- Today review (Ebbinghaus mock) ----------
export const TODAY_REVIEW = [
  { id: "r1", kind: "错题", title: "AGC 三项考核指标识别", nextAt: "今天 18:00" },
  { id: "r2", kind: "资料", title: "主变停役前置核对四项", nextAt: "今天 18:30" },
  { id: "r3", kind: "错题", title: "差动保护误动核查四步法", nextAt: "明天 09:00" },
  { id: "r4", kind: "资料", title: "厂站资料优先适用原则", nextAt: "明天 14:00" },
  { id: "r5", kind: "错题", title: "AVC 调节对象判别", nextAt: "后天 10:00" },
];

// ---------- Growth (radar + trend) ----------
export const RADAR = [
  { dim: "规程制度", value: 78 },
  { dim: "典型操作", value: 82 },
  { dim: "故障复盘", value: 64 },
  { dim: "AGC/调频", value: 71 },
  { dim: "运行值班", value: 88 },
];

export const TREND_7 = [
  { day: "周一", rate: 72 },
  { day: "周二", rate: 75 },
  { day: "周三", rate: 70 },
  { day: "周四", rate: 78 },
  { day: "周五", rate: 80 },
  { day: "周六", rate: 76 },
  { day: "周日", rate: 84 },
];
export const TREND = TREND_7; // backwards compat

export const TREND_30 = Array.from({ length: 30 }, (_, i) => ({
  day: `D-${30 - i}`,
  rate: 65 + Math.round(Math.sin(i / 3) * 6) + Math.round(i / 3),
}));

export const TREND_ALL = Array.from({ length: 12 }, (_, i) => ({
  day: `${i + 1} 月`,
  rate: 60 + Math.round(Math.cos(i / 2) * 5) + i * 2,
}));

export const RADAR_PREV = [
  { dim: "规程制度", value: 68 },
  { dim: "典型操作", value: 70 },
  { dim: "故障复盘", value: 55 },
  { dim: "AGC/调频", value: 62 },
  { dim: "运行值班", value: 80 },
];

export const WEAK_TOP5 = [
  { name: "母线差动保护原理", rate: 62, filter: "差动保护" },
  { name: "AGC/AVC 闭环逻辑", rate: 66, filter: "AGC" },
  { name: "变压器有载调压", rate: 68, filter: "主变停役" },
  { name: "保护定值整定原则", rate: 70, filter: "差动保护" },
  { name: "两细则计算公式", rate: 71, filter: "AGC" },
];

// ---------- Achievements / badges (assets) ----------
export const ACHIEVEMENTS = [
  { id: "a1", name: "连续学习 7 天", desc: "本周已连续学习 7 天", earned: true, icon: "🔥" },
  { id: "a2", name: "AGC 入门", desc: "完成 AGC 专题全部资料", earned: true, icon: "⚡" },
  { id: "a3", name: "差动复盘达人", desc: "差动相关题目正确率 ≥ 90%", earned: false, icon: "🛡️" },
  { id: "a4", name: "模拟考试合格", desc: "至少一次模拟考试 ≥ 60 分", earned: true, icon: "📋" },
  { id: "a5", name: "百题斩", desc: "累计答题数 ≥ 100", earned: false, icon: "💯" },
  { id: "a6", name: "无错周", desc: "一周内无新增错题", earned: false, icon: "🌟" },
];
