import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ArrowRight, Sparkles, ChevronRight, History, Star, RotateCcw, Bookmark, Search } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/workbench/PageShell";
import { SafetyBanner } from "@/components/common/SafetyBanner";
import {
  SelectedConditionBar,
  StepCard,
  OptionChips,
  ScenarioBreadcrumb,
} from "@/components/scenario/parts";
import { TYPICAL_TEMPLATES, getScenario, ALL_SCENARIOS } from "@/lib/mock/scenario";
import { useMockStore } from "@/lib/mock/store";

const searchSchema = z.object({ from: z.string().optional() });

export const Route = createFileRoute("/scenario/typical/")({
  validateSearch: searchSchema,
  component: TypicalPicker,
  head: () => ({ meta: [{ title: "典型操作训练 · 涉网运行 AI 训练平台" }] }),
});

const VOLTAGE = ["1000kV", "500kV", "220kV", "110kV", "35kV", "10kV", "0.4kV"] as const;

// Grouped device categories (spec §6.5)
const DEVICE_GROUPS: { group: string; items: string[] }[] = [
  { group: "一次设备", items: ["线路", "主变", "高抗", "母线", "开关", "闸刀", "电容器", "电抗器"] },
  { group: "二次设备与装置", items: ["线路主保护", "后备保护", "母差保护", "安控装置", "自动化系统", "重合闸"] },
  { group: "特殊场景对象", items: ["串抗装置", "新投运设备", "特高压专题对象", "特殊厂站对象"] },
];

// Mock device instances per device category
const INSTANCE_LIB: Record<string, { name: string; meta: string }[]> = {
  主变: [
    { name: "#1 主变", meta: "华东 A 厂 · 220kV" },
    { name: "#2 主变", meta: "华东 A 厂 · 220kV" },
    { name: "#3 主变", meta: "华东 B 厂 · 500kV" },
  ],
  线路: [
    { name: "5021 线路", meta: "华东 B 厂 · 500kV" },
    { name: "2231 线路", meta: "华东 A 厂 · 220kV" },
  ],
  母线: [
    { name: "220kV I 母 ↔ II 母", meta: "华东 A 厂" },
    { name: "500kV I 母", meta: "华东 B 厂" },
  ],
  高抗: [{ name: "1# 高抗", meta: "华东 B 厂 · 500kV" }],
  安控装置: [{ name: "区域安控子站", meta: "华东 A 厂" }],
};

// Task suggestions per device (spec §6.7)
const TASK_BY_DEVICE: Record<string, string[]> = {
  主变: ["停役", "复役", "主变切换", "中性点切换", "操作许可"],
  线路: ["停役", "复役", "状态转换", "保护投退"],
  母线: ["倒闸", "停役", "复役"],
  高抗: ["保护投退", "切换", "状态调整"],
  安控装置: ["投退", "切换", "配合操作", "状态调整"],
};
const DEFAULT_TASKS = ["停役", "复役", "状态转换", "倒闸", "保护投退", "配合操作"];

const INSTR = ["单步指令", "线路状态令", "操作许可制", "集中监控操作", "未明确或不区分"] as const;

function TypicalPicker() {
  const navigate = useNavigate();
  const { from } = Route.useSearch();
  const fromScene = from ? getScenario(from) : undefined;
  const { state, saveScenarioFavorite } = useMockStore();

  const [voltage, setVoltage] = useState<string | undefined>(fromScene?.voltageLevel);
  const [device, setDevice] = useState<string | undefined>(fromScene?.device);
  const [instance, setInstance] = useState<string | undefined>(fromScene?.deviceInstance);
  const [instanceQuery, setInstanceQuery] = useState("");
  const [task, setTask] = useState<string | undefined>(fromScene?.task);
  const [instr, setInstr] = useState<string | undefined>(fromScene?.instructionType);
  const [extra, setExtra] = useState("");
  const [menu, setMenu] = useState<"recent" | "fav" | null>(null);

  const items = [
    { key: "voltage", label: "电压等级", value: voltage, removable: true },
    { key: "device", label: "设备大类", value: device, removable: true },
    { key: "instance", label: "设备实例", value: instance, removable: true },
    { key: "task", label: "任务类型", value: task, removable: true },
    { key: "instr", label: "指令类型", value: instr, removable: true },
  ];

  const instanceOptions = useMemo(() => {
    const base = device ? INSTANCE_LIB[device] ?? [] : Object.values(INSTANCE_LIB).flat();
    if (!instanceQuery) return base;
    const q = instanceQuery.toLowerCase();
    return base.filter((x) => x.name.toLowerCase().includes(q) || x.meta.toLowerCase().includes(q));
  }, [device, instanceQuery]);

  const taskOptions = useMemo(() => (device && TASK_BY_DEVICE[device]) || DEFAULT_TASKS, [device]);

  const matches = useMemo(
    () =>
      TYPICAL_TEMPLATES.filter(
        (t) =>
          (!voltage || t.voltageLevel === voltage) &&
          (!device || t.device === device) &&
          (!task || t.task === task),
      ),
    [voltage, device, task],
  );

  const canGenerate = !!(device && task);
  const rareCombo = device && task && matches.length === 0;

  const onRemove = (k: string) => {
    if (k === "voltage") setVoltage(undefined);
    if (k === "device") {
      setDevice(undefined);
      setInstance(undefined);
      setTask(undefined);
    }
    if (k === "instance") setInstance(undefined);
    if (k === "task") setTask(undefined);
    if (k === "instr") setInstr(undefined);
  };

  const reset = () => {
    setVoltage(undefined);
    setDevice(undefined);
    setInstance(undefined);
    setInstanceQuery("");
    setTask(undefined);
    setInstr(undefined);
    setExtra("");
    toast.success("已重置所有条件");
  };

  const saveAsFavorite = () => {
    if (!canGenerate) return toast.error("请先选择设备大类与任务类型");
    const tagBits = [voltage, device, instance, task, instr].filter(Boolean).join(" / ");
    saveScenarioFavorite({
      scenarioId: matches[0]?.id ?? "tp-custom",
      title: `常用场景:${tagBits}`,
      kind: "typical",
    });
    toast.success("已暂存为常用场景");
  };

  const generate = (scenarioId?: string) => {
    const target = scenarioId ?? matches[0]?.id ?? TYPICAL_TEMPLATES[0]?.id ?? "tp-demo";
    toast.success("已生成操作辅助参考");
    navigate({ to: "/scenario/typical/result/$id", params: { id: target } });
  };

  const recent = state.recentScenarios
    .map((id) => ALL_SCENARIOS.find((s) => s.id === id && s.kind === "typical"))
    .filter(Boolean)
    .slice(0, 5) as { id: string; title: string }[];
  const favs = state.scenarioFavorites.filter((f) => f.kind === "typical").slice(0, 5);

  return (
    <PageShell>
      <ScenarioBreadcrumb
        items={[
          { label: "场景训练", to: "/scenario" },
          { label: "典型操作训练" },
        ]}
      />
      <div className="mt-3 mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">选择操作条件</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            请选择设备和任务,系统将组织典型操作参考内容、关联票据与依据资料(用于培训,不是正式操作票)
          </p>
        </div>
        <div className="relative flex items-center gap-2">
          <button
            onClick={() => setMenu(menu === "recent" ? null : "recent")}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[12.5px] hover:bg-muted"
          >
            <History className="h-3.5 w-3.5" /> 查看最近使用
          </button>
          <button
            onClick={() => setMenu(menu === "fav" ? null : "fav")}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[12.5px] hover:bg-muted"
          >
            <Star className="h-3.5 w-3.5" /> 从收藏场景带入
          </button>
          <Link to="/scenario" className="text-[12.5px] text-muted-foreground hover:text-primary">
            ← 返回入口
          </Link>
          {menu && (
            <div className="absolute right-0 top-9 z-20 w-72 rounded-lg border border-border bg-card p-2 shadow-lg">
              {(menu === "recent" ? recent : favs.map((f) => ({ id: f.scenarioId, title: f.title }))).length === 0 ? (
                <div className="p-3 text-center text-[12px] text-muted-foreground">暂无内容</div>
              ) : (
                <ul className="space-y-1">
                  {(menu === "recent" ? recent : favs.map((f) => ({ id: f.scenarioId, title: f.title }))).map((it) => (
                    <li key={it.id}>
                      <button
                        onClick={() => {
                          const s = getScenario(it.id);
                          if (!s) return;
                          setVoltage(s.voltageLevel);
                          setDevice(s.device);
                          setInstance(s.deviceInstance);
                          setTask(s.task);
                          setInstr(s.instructionType);
                          setMenu(null);
                          toast.success("已带入条件");
                        }}
                        className="block w-full rounded-md px-2 py-1.5 text-left text-[12.5px] hover:bg-muted"
                      >
                        {it.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <SafetyBanner />

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <StepCard step={1} title="电压等级(可选)">
            <OptionChips
              options={VOLTAGE.map((v) => ({ key: v, label: v }))}
              value={voltage as any}
              onChange={(v) => setVoltage(v)}
            />
          </StepCard>

          <StepCard step={2} title="设备大类" required>
            <div className="space-y-3">
              {DEVICE_GROUPS.map((g) => (
                <div key={g.group}>
                  <div className="mb-1.5 text-[11.5px] text-muted-foreground">{g.group}</div>
                  <OptionChips
                    options={g.items.map((d) => ({ key: d, label: d }))}
                    value={device as any}
                    onChange={(v) => {
                      setDevice(v);
                      setInstance(undefined);
                      setTask(undefined);
                    }}
                  />
                </div>
              ))}
            </div>
          </StepCard>

          <StepCard step={3} title="设备实例(可选)">
            <div className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={instanceQuery}
                  onChange={(e) => setInstanceQuery(e.target.value)}
                  placeholder="请输入设备名称、编号、厂站名"
                  className="flex-1 bg-transparent text-[13px] outline-none"
                />
              </div>
              {instanceOptions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-center text-[12px] text-muted-foreground">
                  未匹配设备,可不选实例,按设备大类生成通用参考
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {instanceOptions.map((opt) => (
                    <button
                      key={opt.name}
                      onClick={() => setInstance(opt.name)}
                      className={`rounded-lg border px-3 py-1.5 text-left text-[12px] transition-colors ${
                        instance === opt.name
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border bg-background hover:border-primary/50"
                      }`}
                    >
                      <div className="font-medium">{opt.name}</div>
                      <div className="text-[11px] text-muted-foreground">{opt.meta}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </StepCard>

          <StepCard step={4} title="任务类型" required>
            <OptionChips
              options={taskOptions.map((t) => ({ key: t, label: t }))}
              value={task as any}
              onChange={(v) => setTask(v)}
            />
            {rareCombo && (
              <p className="mt-2 text-[11.5px] text-warning-foreground">
                当前组合较少见,建议在补充说明中补充更多上下文后继续。
              </p>
            )}
          </StepCard>

          <StepCard step={5} title="指令类型(可选)">
            <OptionChips
              options={INSTR.map((i) => ({ key: i, label: i }))}
              value={instr as any}
              onChange={(v) => setInstr(v)}
            />
          </StepCard>

          <StepCard step={6} title="补充说明(可选)">
            <textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              rows={3}
              placeholder="可输入特殊运行方式、厂站差异、安控配合、只看某类票据等补充说明。"
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
              onClick={saveAsFavorite}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-[12.5px] hover:bg-muted"
            >
              <Bookmark className="h-3.5 w-3.5" /> 暂存为常用场景
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <SelectedConditionBar items={items} onRemove={onRemove} />

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[14px] font-semibold">匹配的参考场景</div>
              <span className="text-[11px] text-muted-foreground">{matches.length} 项</span>
            </div>
            {matches.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-[12px] text-muted-foreground">
                未匹配到典型参考,可调整条件或直接生成最相关案例
              </div>
            ) : (
              <ul className="space-y-2">
                {matches.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-lg border border-border bg-background p-3 hover:border-primary/40"
                  >
                    <div className="text-[13px] font-medium">{m.title}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {m.tags.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="rounded bg-muted px-1.5 py-0.5 text-[10.5px] text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => generate(m.id)}
                      className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-primary"
                    >
                      使用该场景 <ChevronRight className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={() => generate()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4" /> 生成操作辅助 <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-[11px] text-muted-foreground">
            建议填写:设备大类 / 任务类型(演示阶段可直接生成查看示例)
          </p>
        </div>
      </div>
    </PageShell>
  );
}
