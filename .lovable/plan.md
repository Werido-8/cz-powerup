
# 按详细设计文档补齐模块路由与跳转

目标：把现有原型按 `00-通用规范` + `01-知识学习` / `02-智能问答` / `03-个人沉淀` / `04-场景训练-典型操作` / `05-场景训练-故障处置` 的页面清单与联动矩阵补齐。重点是**新增完整的「场景训练」二级模块**，并按文档对齐其余三个模块的子页与按钮跳转。

## 一、导航与路由

1. Header 的「场景训练」入口由 `/scene` 改为 `/scenario`（保留 `/scene` 自动跳转兜底）。
2. 新增以下文件路由（TanStack 文件路由，dot 分隔）：
   - `src/routes/scenario.tsx` — 场景训练入口（4 个二级卡片 + 最近使用 + 收藏场景）
   - `src/routes/scenario.typical.tsx` — 典型操作前置选择页
   - `src/routes/scenario.typical.result.$id.tsx` — 典型操作结果页
   - `src/routes/scenario.fault.tsx` — 故障处置前置页
   - `src/routes/scenario.fault.result.$id.tsx` — 故障处置结果页
3. 个人沉淀新增：
   - `src/routes/assets.collection.$id.tsx` — 知识集详情页
   - `/assets` Tab 由 5 个扩展到 7 个：我的收藏 / 我的笔记 / 我的知识集 / 错题本（跳错题本路由）/ 错题答卷 / 今日复习 / 成长徽章
4. 智能问答 `/chat` 改造为左中右三栏：会话历史 + 主问答 + 常驻 RightSourcePanel（替代现 DocDrawer 弹窗）。
5. `/learn` 资料详情按文档补「相关问答」「开始关联训练」「加入知识集」按钮的实际跳转。

## 二、共用组件新增

`src/components/scenario/`：

- `ConditionStepCard.tsx` — 条件选择步骤卡（电压等级、对象、设备、任务/现象、补充）
- `SelectedConditionBar.tsx` — 顶部「已选条件摘要」Tag 区
- `ResultCardShell.tsx` — 结果页固定卡片外壳
- `EvidenceCard.tsx` — 依据卡片
- `RightAuxPanel.tsx` — 双模式右侧辅助区（继续追问 / 原文引用）
- `SimilarCaseDrawer.tsx` — 相似案例详情抽屉

`src/components/chat/RightSourcePanel.tsx` — 智能问答常驻原文区。

## 三、跳转矩阵（按文档第 9 节联动）

| 起点 | 动作 | 终点 |
|---|---|---|
| `/learn/doc/$id` | 相关问答 | `/chat?prefill=...&docId=...` |
| `/learn/doc/$id` | 开始关联训练 | `/training/practice?docId=...` |
| `/learn/topic/$id` | 开始专题训练 | `/training/practice?topic=...` |
| `/chat` AnswerCard | 加入笔记 / 收藏 / 加入知识集 | `/assets` 对应 Tab + Toast |
| `/scenario` | 典型操作训练 | `/scenario/typical` |
| `/scenario` | 故障处置复盘 | `/scenario/fault` |
| 前置页 生成参考 | mock 创建 sessionId | `/scenario/typical/result/$id` 或 `.../fault/result/$id` |
| 结果页 修改条件 | 返回前置页保留条件 | `/scenario/typical?from=$id` |
| 结果页 收藏 / 加入知识集 | 写 mock store | `/assets` |
| 相似案例 查看详情 | 抽屉打开 | 同页 SimilarCaseDrawer |
| `/assets` 我的知识集 进入 | `/assets/collection/$id` |
| `/assets` 错题本 Tab | 内嵌跳转 | `/training/wrong` |
| `/training/wrong` 查看依据 | `/learn/doc/$id#section` |
| `/training/result/$id` 查看能力成长 | `/training/growth` |

## 四、Mock 数据扩展（`src/lib/mock/data.ts` + `store.ts`）

- `SCENARIO_TYPICAL_TEMPLATES`（≥5）：220kV 主变停役、500kV 线路状态转换、母线倒闸、高抗保护投退、安控配合
- `SCENARIO_FAULT_TEMPLATES`（≥5）：主变差动动作、线路跳闸、母线失压、站用电失电、安控联动异常
- 每个场景：6 张结果卡 + 5 条关键步骤/判断思路 + 4 条风险/易错 + 2 条相似案例 + 4 条 evidence
- `KNOWLEDGE_COLLECTIONS`（4 个）：主变停役 / AGC / 故障复盘 / 高频易错
- 会话历史扩到 ≥4 个；AnswerCard 结构化字段补齐（摘要 / 分点 / 适用范围 / 不确定项 / 依据 / 后续操作）
- store 增 `addToCollection / createCollection / saveScenarioFavorite`

## 五、视觉

沿用现有 teal 主色与 `src/styles.css` token，禁止再加大面积高饱和色块；新增的辅色（学习蓝 `#2F80ED`、训练青绿 `#2BB5A0`、风险橙 `#F5A623`、高风险红 `#D92D20`）按需作为 CSS 变量补充。

## 六、实施顺序

1. Header 改 `/scenario` + Mock 数据扩展（scenario / collections / chat 会话）。
2. 场景训练 5 个页面 + 共用组件 + SimilarCaseDrawer。
3. `/chat` 三栏改造与 RightSourcePanel。
4. `/assets` Tab 扩展 + 知识集详情页 + 抽屉补齐。
5. `/learn/doc/$id` 跳转按钮接通，`/learn` Tab 文案微调。
6. 自检：按各文档「验收清单」逐项点检所有按钮可点 / 跳转可达 / mock 数据可见。

## 技术细节

- 路由：TanStack 文件路由，dot 分隔（如 `scenario.typical.result.$id.tsx`），`createFileRoute("/scenario/typical/result/$id")`；`/scene` 文件改为 `<Navigate to="/scenario" />` 兜底。
- 搜索参数：`/chat` 用 zod `validateSearch` 接 `prefill`、`docId`、`citationId`；场景结果页接 `from` 用于回填条件。
- 数据持久化：沿用 `src/lib/mock/store.ts` 的 localStorage；新场景模板放静态 `data.ts`，session/收藏写 store。
- 路由树 `src/routeTree.gen.ts` 由 Vite 插件自动生成，无需手动改。
