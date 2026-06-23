import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { ArrowRight, Sparkles, RotateCcw, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/workbench/PageShell";
import { SafetyBanner } from "@/components/common/SafetyBanner";
import { SelectedConditionBar, StepCard, OptionChips, ScenarioBreadcrumb } from "@/components/scenario/parts";

export const Route = createFileRoute("/scenario/peak")({
  component: PeakPicker,
  head: () => ({ meta: [{ title: "深度调峰业务辅助 · 涉网运行 AI 训练平台" }] }),
});

const CAPACITY = ["300MW", "350MW", "600MW", "630MW", "660MW", "1000MW", "1050MW", "其他"] as const;
const BOILER = [
  "亚临界",
  "超临界",
  "超超临界",
  "W型火焰锅炉",
  "切圆燃烧锅炉",
  "对冲燃烧锅炉",
  "循环流化床锅炉",
] as const;

const LOAD_RANGE = [
  "50%额定负荷以上",
  "40%~50%额定负荷",
  "30%~40%额定负荷",
  "20%~30%额定负荷",
  "20%以下",
  "不确定",
] as const;

const TASK = ["低负荷稳燃", "快速降负荷", "快速升负荷", "低负荷吹灰", "负荷受限汇报"] as const;

const SYSTEM_GROUPS: { group: string; items: string[] }[] = [
  {
    group: "锅炉本体",
    items: ["燃烧稳定性", "炉膛负压", "炉膛温度", "水冷壁超温", "受热面超温", "结焦/垮灰"],
  },
  {
    group: "制粉与风烟系统",
    items: ["磨煤机", "一次风机", "送风机", "引风机", "一次风量", "二次风配风"],
  },
  {
    group: "环保系统",
    items: ["SCR入口烟温", "NOx排放", "氨逃逸", "空预器堵塞", "低温腐蚀"],
  },
  {
    group: "控制与保护",
    items: ["火检信号", "MFT", "炉膛压力保护", "DCS协调控制", "AGC状态"],
  },
];

const DEFAULT_EXTRA =
  "机组处于深度调峰低负荷运行状态,锅炉计划执行吹灰操作。请分析吹灰前需要核查哪些风险;如果出现炉膛负压异常和火检波动,应如何复盘,并生成学员学习重点和练习题。";

function PeakPicker() {
  const navigate = useNavigate();
  const [capacity, setCapacity] = useState<string | undefined>();
  const [boiler, setBoiler] = useState<string | undefined>();
  const [loadRange, setLoadRange] = useState<string | undefined>();
  const [curMW, setCurMW] = useState("");
  const [tgtMW, setTgtMW] = useState("");
  const [rampMin, setRampMin] = useState("");
  const [task, setTask] = useState<string | undefined>();
  const [systems, setSystems] = useState<string[]>([]);
  const [extra, setExtra] = useState(DEFAULT_EXTRA);

  const toggleSystem = (s: string) =>
    setSystems((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const items = [
    { key: "capacity", label: "机组容量", value: capacity, removable: true },
    { key: "boiler", label: "锅炉类型", value: boiler, removable: true },
    { key: "loadRange", label: "当前负荷", value: loadRange, removable: true },
    { key: "task", label: "调峰任务", value: task, removable: true },
    ...(systems.length ? [{ key: "systems", label: "关注对象", value: `${systems.length} 项`, removable: true }] : []),
  ];

  const canGenerate = !!(capacity && boiler && loadRange && task);

  const onRemove = (k: string) => {
    if (k === "capacity") setCapacity(undefined);
    if (k === "boiler") setBoiler(undefined);
    if (k === "loadRange") setLoadRange(undefined);
    if (k === "task") setTask(undefined);
    if (k === "systems") setSystems([]);
  };

  const reset = () => {
    setCapacity(undefined);
    setBoiler(undefined);
    setLoadRange(undefined);
    setCurMW("");
    setTgtMW("");
    setRampMin("");
    setTask(undefined);
    setSystems([]);
    setExtra(DEFAULT_EXTRA);
    toast.success("已重置所有条件");
  };

  const generate = () => {
    toast.success("已生成深度调峰辅助参考");
    navigate({ to: "/scenario/sootblow/result/demo" });
    // navigate({ to: "/scenario/peak/result/$id", params: { id: "peak-low-stable" } });
  };

  return (
    <PageShell>
      <ScenarioBreadcrumb items={[{ label: "场景训练", to: "/scenario" }, { label: "深度调峰业务辅助" }]} />
      <div className="mt-3 mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">选择深度调峰条件</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            请选择机组类型、运行负荷与调峰任务,系统将组织深调风险核查、操作要点与学习重点(用于培训,不是正式操作票)
          </p>
        </div>
        <Link to="/scenario" className="text-[12.5px] text-muted-foreground hover:text-primary">
          ← 返回入口
        </Link>
      </div>

      <SafetyBanner />

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <StepCard step={1} title="机组容量 / 类型" required>
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 text-[11.5px] text-muted-foreground">机组容量</div>
                <OptionChips
                  options={CAPACITY.map((v) => ({ key: v, label: v }))}
                  value={capacity as any}
                  onChange={(v) => setCapacity(v)}
                />
              </div>
              <div>
                <div className="mb-1.5 text-[11.5px] text-muted-foreground">锅炉类型</div>
                <OptionChips
                  options={BOILER.map((v) => ({ key: v, label: v }))}
                  value={boiler as any}
                  onChange={(v) => setBoiler(v)}
                />
              </div>
            </div>
          </StepCard>

          <StepCard step={2} title="当前运行负荷" required>
            <OptionChips
              options={LOAD_RANGE.map((v) => ({ key: v, label: v }))}
              value={loadRange as any}
              onChange={(v) => setLoadRange(v)}
            />
            <div className="mt-3 grid grid-cols-3 gap-2">
              <label className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5">
                <span className="shrink-0 text-[11.5px] text-muted-foreground">当前</span>
                <input
                  value={curMW}
                  onChange={(e) => setCurMW(e.target.value)}
                  placeholder="MW"
                  className="w-full bg-transparent text-[12.5px] outline-none"
                />
              </label>
              <label className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5">
                <span className="shrink-0 text-[11.5px] text-muted-foreground">目标</span>
                <input
                  value={tgtMW}
                  onChange={(e) => setTgtMW(e.target.value)}
                  placeholder="MW"
                  className="w-full bg-transparent text-[12.5px] outline-none"
                />
              </label>
              <label className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5">
                <span className="shrink-0 text-[11.5px] text-muted-foreground">计划时间</span>
                <input
                  value={rampMin}
                  onChange={(e) => setRampMin(e.target.value)}
                  placeholder="分钟"
                  className="w-full bg-transparent text-[12.5px] outline-none"
                />
              </label>
            </div>
          </StepCard>

          <StepCard step={3} title="调峰任务类型" required>
            <OptionChips
              options={TASK.map((t) => ({ key: t, label: t }))}
              value={task as any}
              onChange={(v) => setTask(v)}
            />
          </StepCard>

          <StepCard step={4} title="关注系统 / 风险对象(多选)">
            <div className="space-y-3">
              {SYSTEM_GROUPS.map((g) => (
                <div key={g.group}>
                  <div className="mb-1.5 text-[11.5px] text-muted-foreground">{g.group}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.items.map((it) => {
                      const on = systems.includes(it);
                      return (
                        <button
                          key={it}
                          onClick={() => toggleSystem(it)}
                          className={`rounded-lg border px-2.5 py-1 text-[12px] transition-colors ${
                            on
                              ? "border-primary bg-primary-soft text-primary"
                              : "border-border bg-background hover:border-primary/50"
                          }`}
                        >
                          {it}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </StepCard>

          <StepCard step={5} title="补充说明(可选)">
            <textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              rows={4}
              placeholder="可输入当前负荷、目标负荷、运行方式、异常现象、报警信息、历史缺陷等补充信息。"
              className="w-full resize-none rounded-lg border border-border bg-background p-3 text-[13px] outline-none focus:border-primary"
            />
          </StepCard>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={reset}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-[12.5px] hover:bg-muted"
            >
              <RotateCcw className="h-3.5 w-3.5" /> 重置条件
            </button>
            <button
              onClick={() => toast.success("已暂存为常用场景")}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-[12.5px] hover:bg-muted"
            >
              <Bookmark className="h-3.5 w-3.5" /> 暂存为常用场景
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <SelectedConditionBar items={items} onRemove={onRemove} />

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-2 text-[14px] font-semibold">深调参考要点</div>
            <ul className="space-y-1.5 text-[12.5px] text-muted-foreground">
              <li>· 低负荷稳燃:关注火检、油枪投退、磨组合方式</li>
              <li>· 快速变负荷:关注协调控制、AGC 响应、主汽压力</li>
              <li>· 低负荷吹灰:关注炉膛负压、受热面温度、SCR入口烟温</li>
              <li>· 环保边界:NOx、氨逃逸、SCR最低投运温度</li>
            </ul>
          </div>

          <button
            onClick={generate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4" /> 生成深调辅助 <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-[11px] text-muted-foreground">必填:机组容量 / 类型、当前负荷、调峰任务</p>
        </div>
      </div>
    </PageShell>
  );
}
