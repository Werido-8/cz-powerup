type Difficulty = "易" | "中" | "难";

type PaperQuestion = {
  id: string;
  stem: string;
  knowledge: string;
  difficulty: Difficulty;
  source: string;
  score: number;
  options?: { key: string; text: string }[];
  answer?: string;
  blankCount?: number;
  isAIGenerated?: boolean;
};

type PaperGroup = {
  type: "单选题" | "多选题" | "判断题" | "填空题" | "简答题" | "案例分析题";
  perScore: number;
  questions: PaperQuestion[];
};

const OPT = (items: [string, string][]) => items.map(([key, text]) => ({ key, text }));

function single(
  id: string,
  stem: string,
  knowledge: string,
  answer: string,
  options: { key: string; text: string }[],
  difficulty: Difficulty = "中",
  source = "两细则考核知识点汇编 v2024.05",
): PaperQuestion {
  return { id, stem, knowledge, difficulty, source, score: 2, options, answer };
}

function multi(
  id: string,
  stem: string,
  knowledge: string,
  answer: string,
  options: { key: string; text: string }[],
  difficulty: Difficulty = "中",
  source = "厂站运行规程(华东 A 厂) v2024.07",
): PaperQuestion {
  return { id, stem, knowledge, difficulty, source, score: 4, options, answer };
}

function judge(
  id: string,
  stem: string,
  knowledge: string,
  answer: "T" | "F",
  difficulty: Difficulty = "易",
  source = "两细则考核知识点汇编 v2024.05",
): PaperQuestion {
  return {
    id,
    stem,
    knowledge,
    difficulty,
    source,
    score: 1,
    options: OPT([
      ["T", "正确"],
      ["F", "错误"],
    ]),
    answer,
  };
}

function blank(
  id: string,
  stem: string,
  knowledge: string,
  difficulty: Difficulty = "中",
  source = "两细则考核知识点汇编 v2024.05",
): PaperQuestion {
  return { id, stem, knowledge, difficulty, source, score: 2, blankCount: 1 };
}

function essay(
  id: string,
  stem: string,
  knowledge: string,
  difficulty: Difficulty = "中",
  source = "安控装置运行规程 v2023.09",
): PaperQuestion {
  return { id, stem, knowledge, difficulty, source, score: 5 };
}

/** 满分 100 分：单选 20×2 + 多选 5×4 + 判断 10×1 + 填空 5×2 + 简答 4×5 */
export function buildExamPaper100Groups(): PaperGroup[] {
  return [
    {
      type: "单选题",
      perScore: 2,
      questions: [
        single(
          "e1",
          "AGC 投入后机组出力与调度指令偏差持续超 ±3% 应优先采取?",
          "AGC / 两细则",
          "A",
          OPT([
            ["A", "检查 AGC 通道及测点,必要时切至手动"],
            ["B", "立即手动大幅调整出力"],
            ["C", "退出一次调频功能"],
            ["D", "申请停机检查"],
          ]),
          "中",
          "AGC 控制器 SOP v2024.06",
        ),
        single(
          "e2",
          "一次调频的负荷响应应在频率越限后多少秒内开始?",
          "一次调频",
          "A",
          OPT([
            ["A", "3 秒内"],
            ["B", "8 秒内"],
            ["C", "15 秒内"],
            ["D", "30 秒内"],
          ]),
        ),
        single(
          "e3",
          "AGC 控制方式下机组响应速率不满足要求的考核方式?",
          "AGC / 两细则",
          "A",
          OPT([
            ["A", "按 K 值法扣减补偿"],
            ["B", "按固定分扣减"],
            ["C", "不纳入考核"],
            ["D", "按容量比折算"],
          ]),
          "中",
          "AGC 控制器 SOP v2024.06",
        ),
        single(
          "e10",
          "两细则中 AGC 考核的三项核心指标不包括下列哪一项?",
          "AGC / 两细则",
          "D",
          OPT([
            ["A", "调节速率"],
            ["B", "响应时间"],
            ["C", "调节精度"],
            ["D", "机组可用率"],
          ]),
        ),
        single(
          "e11",
          "一次调频动作后,机组有功出力变化方向应与频率偏差方向?",
          "一次调频",
          "B",
          OPT([
            ["A", "相同"],
            ["B", "相反"],
            ["C", "无关"],
            ["D", "由调度指定"],
          ]),
        ),
        single(
          "e12",
          "AGC 远方控制信号中断时,机组应?",
          "AGC / 两细则",
          "C",
          OPT([
            ["A", "保持当前出力不变"],
            ["B", "自动停机"],
            ["C", "按规程切至就地或保持安全状态"],
            ["D", "立即满出力运行"],
          ]),
        ),
        single(
          "e13",
          "调频里程补偿费用主要与下列哪项关联?",
          "一次调频",
          "A",
          OPT([
            ["A", "实际调频里程与性能系数"],
            ["B", "机组额定容量"],
            ["C", "日发电量"],
            ["D", "厂用电率"],
          ]),
        ),
        single(
          "e14",
          "PSS 投入的主要作用是?",
          "励磁系统",
          "B",
          OPT([
            ["A", "提高机组额定出力"],
            ["B", "改善系统阻尼,抑制低频振荡"],
            ["C", "替代一次调频"],
            ["D", "降低厂用电"],
          ]),
          "易",
          "PSS 励磁系统技术手册 v2023.12",
        ),
        single(
          "e15",
          "AVC 系统无功调节的基本目标是?",
          "AVC 控制",
          "A",
          OPT([
            ["A", "维持电压在合格范围"],
            ["B", "最大化有功出力"],
            ["C", "减少一次调频动作"],
            ["D", "降低主变负载率"],
          ]),
          "中",
          "AVC 控制规程 v2024.03",
        ),
        single(
          "e16",
          "机组一次调频死区设置过大可能导致?",
          "一次调频",
          "A",
          OPT([
            ["A", "小扰动下机组不动作"],
            ["B", "响应过快"],
            ["C", "出力振荡加剧"],
            ["D", "AGC 无法投入"],
          ]),
        ),
        single(
          "e17",
          "两细则考核周期一般为?",
          "AGC / 两细则",
          "B",
          OPT([
            ["A", "每日"],
            ["B", "月度"],
            ["C", "季度"],
            ["D", "年度"],
          ]),
        ),
        single(
          "e18",
          "AGC 调节精度考核主要考察?",
          "AGC / 两细则",
          "C",
          OPT([
            ["A", "机组启停次数"],
            ["B", "厂用电水平"],
            ["C", "实际出力与指令偏差"],
            ["D", "主变油温"],
          ]),
        ),
        single(
          "e19",
          "频率越限后一次调频响应延迟,首先应检查?",
          "一次调频",
          "D",
          OPT([
            ["A", "励磁电流"],
            ["B", "冷却水流量"],
            ["C", "主变档位"],
            ["D", "调频投退状态与死区设置"],
          ]),
        ),
        single(
          "e20",
          "AGC 与一次调频协调运行中,一般原则是?",
          "AGC / 两细则",
          "A",
          OPT([
            ["A", "一次调频优先响应频率扰动"],
            ["B", "AGC 闭锁一次调频"],
            ["C", "两者不可同时投入"],
            ["D", "由运行人员手动切换"],
          ]),
        ),
        single(
          "e21",
          "机组调差率增大时,一次调频?",
          "一次调频",
          "B",
          OPT([
            ["A", "动作幅度增大"],
            ["B", "动作幅度减小"],
            ["C", "响应时间缩短"],
            ["D", "不再动作"],
          ]),
        ),
        single(
          "e22",
          "AGC 指令阶跃变化时,运行人员应?",
          "AGC / 两细则",
          "C",
          OPT([
            ["A", "立即切至手动满出力"],
            ["B", "退出 AGC"],
            ["C", "监视响应并关注偏差与速率"],
            ["D", "关闭一次调频"],
          ]),
        ),
        single(
          "e23",
          "电压越限时 AVC 优先调节手段通常是?",
          "AVC 控制",
          "A",
          OPT([
            ["A", "无功出力/电压设定"],
            ["B", "有功设定"],
            ["C", "一次调频"],
            ["D", "PSS 投退"],
          ]),
        ),
        single(
          "e24",
          "取证复习中,AGC 考核数据主要来源于?",
          "AGC / 两细则",
          "B",
          OPT([
            ["A", "人工抄表"],
            ["B", "EMS/考核系统统计"],
            ["C", "巡检记录"],
            ["D", "检修报告"],
          ]),
        ),
        single(
          "e25",
          "一次调频不合格常见原因是?",
          "一次调频",
          "D",
          OPT([
            ["A", "主变检修"],
            ["B", "厂用电过高"],
            ["C", "冷却水温低"],
            ["D", "死区过大或未正确投入"],
          ]),
        ),
        single(
          "e26",
          "AGC 退出前运行人员须确认?",
          "AGC / 两细则",
          "A",
          OPT([
            ["A", "调度许可与当前出力安全"],
            ["B", "机组停机"],
            ["C", "一次调频退出"],
            ["D", "AVC 退出"],
          ]),
        ),
      ],
    },
    {
      type: "多选题",
      perScore: 4,
      questions: [
        multi(
          "e4",
          "下列关于安控装置联动配合的描述,正确的有哪些?",
          "安控配合",
          "ACD",
          OPT([
            ["A", "动作后须立即汇报调度"],
            ["B", "可不经调度许可自行复归"],
            ["C", "须核对动作原因与影响范围"],
            ["D", "动作记录应完整归档"],
          ]),
          "中",
          "安控装置运行规程 v2023.09",
        ),
        multi(
          "e5",
          "主变停役前必须确认的安全措施包括哪些?",
          "主变停役",
          "ABD",
          OPT([
            ["A", "断开各侧断路器并确认"],
            ["B", "拉开各侧隔离开关"],
            ["C", "投入备用电源自投"],
            ["D", "验明无电压并装设接地线"],
          ]),
          "难",
        ),
        multi(
          "e27",
          "AGC 考核常见指标包括哪些?",
          "AGC / 两细则",
          "ABC",
          OPT([
            ["A", "调节速率"],
            ["B", "响应时间"],
            ["C", "调节精度"],
            ["D", "日发电量"],
          ]),
        ),
        multi(
          "e28",
          "一次调频投入前应检查哪些项目?",
          "一次调频",
          "ABD",
          OPT([
            ["A", "调频功能已投运"],
            ["B", "死区与调差率设置合理"],
            ["C", "主变检修票已终结"],
            ["D", "相关测点正常"],
          ]),
        ),
        multi(
          "e29",
          "运行人员发现 AGC 异常时应采取的措施包括?",
          "AGC / 两细则",
          "ACD",
          OPT([
            ["A", "检查通道与测点"],
            ["B", "自行修改考核参数"],
            ["C", "必要时汇报调度并切手动"],
            ["D", "记录异常现象与时间"],
          ]),
        ),
      ],
    },
    {
      type: "判断题",
      perScore: 1,
      questions: [
        judge("e6", "一次调频死区设置过大会导致机组在小扰动下不动作。", "一次调频", "T"),
        judge("e7", "差动保护属于主保护,具备绝对选择性。", "差动保护", "F", "易", "差动保护误动复盘案例库 v2023.11"),
        judge("e30", "AGC 投入后机组可随时退出一次调频以提高精度。", "AGC / 两细则", "F"),
        judge("e31", "两细则考核结果直接影响调频补偿费用。", "AGC / 两细则", "T"),
        judge("e32", "一次调频响应与 AGC 调节相互独立、无需协调。", "一次调频", "F"),
        judge("e33", "AVC 调节无功时可能影响母线电压。", "AVC 控制", "T", "易"),
        judge("e34", "取证考试中,调节速率不达标仅作提醒不扣分。", "AGC / 两细则", "F"),
        judge("e35", "PSS 退出后系统阻尼可能降低。", "励磁系统", "T"),
        judge("e36", "AGC 指令与一次调频同时作用时,实际出力为两者叠加结果。", "一次调频", "T"),
        judge("e37", "运行人员可随意修改 AGC 考核统计周期。", "AGC / 两细则", "F"),
      ],
    },
    {
      type: "填空题",
      perScore: 2,
      questions: [
        blank("e8", "一次调频的转速不等率一般整定为 ____%。", "一次调频"),
        blank("e38", "AGC 调节精度考核常用偏差阈值为 ____%。", "AGC / 两细则"),
        blank("e39", "两细则中一次调频响应时间一般要求不超过 ____ 秒。", "一次调频"),
        blank("e40", "机组额定容量越大,调频里程补偿基数通常越 ____（填高/低）。", "一次调频", "易"),
        blank("e41", "AVC 系统通过调节 ____ 实现电压控制。", "AVC 控制", "中", "AVC 控制规程 v2024.03"),
      ],
    },
    {
      type: "简答题",
      perScore: 5,
      questions: [
        essay(
          "e9",
          "安控装置切机切负荷动作后,运行人员的汇报与处理流程是什么?",
          "安控配合",
        ),
        essay(
          "e42",
          "简述 AGC 投入运行的前置检查要点（至少写出 3 项）。",
          "AGC / 两细则",
          "中",
          "AGC 控制器 SOP v2024.06",
        ),
        essay(
          "e43",
          "一次调频动作不合格时,你会从哪些方面排查原因?",
          "一次调频",
        ),
        essay(
          "e44",
          "结合岗位实际,说明取证复习阶段如何针对性补强薄弱知识点。",
          "AGC / 两细则",
          "易",
        ),
      ],
    },
  ];
}

export const EXAM_PAPER_100_TOTAL = 100;
export const EXAM_PAPER_100_COUNT = 44;
