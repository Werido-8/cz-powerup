import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import {
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  History,
  BookMarked,
  RotateCcw,
  Bookmark,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/workbench/PageShell";
import { SafetyBanner } from "@/components/common/SafetyBanner";
import {
  SelectedConditionBar,
  StepCard,
  OptionChips,
  ScenarioBreadcrumb,
} from "@/components/scenario/parts";
import { FAULT_TEMPLATES, getScenario, ALL_SCENARIOS } from "@/lib/mock/scenario";
import { useMockStore } from "@/lib/mock/store";

const searchSchema = z.object({ from: z.string().optional() });

export const Route = createFileRoute("/scenario/fault")({
  validateSearch: searchSchema,
  component: FaultPicker,
  head: () => ({ meta: [{ title: "故障处置复盘 · 涉网运行 AI 训练平台" }] }),
});

const VOLTAGE = ["1000kV", "500kV", "220kV", "110kV", "35kV", "10kV", "0.4kV"] as const;

// Fault objects grouped (spec §5.5)
const OBJECT_GROUPS: { group: string; items: string[] }[] = [
  { group: "一次设备对象", items: ["线路", "主变", "母线", "高抗", "开关", "补偿设备", "站用电"] },
  { group: "二次设备与装置", items: ["线路保护", "主变保护", "母差保护", "开关保护", "自动投切装置", "自动化系统", "安控装置", "数字化保护"] },
  { group: "系统与协同", items: ["厂站整体状态", "集中监控场景", "特殊厂站对象"] },
];

const INSTANCE_LIB: Record<string, { name: string; meta: string }[]> = {
  主变: [
    { name: "#1 主变", meta: "华东 A 厂 · 220kV" },
    { name: "#2 主变", meta: "华东 A 厂 · 220kV" },
  ],
  线路: [{ name: "5021 线路", meta: "华东 B 厂 · 500kV" }],
  母线: [{ name: "220kV I 母", meta: "华东 A 厂" }],
  站用电: [{ name: "站用电 I 段", meta: "华东 A 厂 · 0.4kV" }],
  安控装置: [{ name: "区域安控子站", meta: "华东 A 厂" }],
};

// Phenomena per object (spec §5.7)
const PHENO_BY_OBJ: Record<string, string[]> = {
  主变: ["差动保护动作", "瓦斯保护动作", "后备保护动作", "油温异常", "伴随异常告警"],
  线路: ["开关跳闸", "重合闸异常", "保护动作", "线路失压", "异常信号"],
  母线: ["母线失压", "母差动作", "多间隔异常", "备用条件异常"],
  站用电: ["站用电失电", "电源切换异常"],
  安控装置: ["装置异常信号", "通信中断", "定值切换异常", "联动异常"],
};
const DEFAULT_PHENO = [
  "差动保护动作",
  "开关跳闸",
  "母线失压",
  "站用电失电",
  "联动异常",
  "保护动作",
];

const STATUS = ["已跳闸", "未跳闸但异常", "待恢复", "已复归"] as const;

// Common fault templates (spec §3-4 抽屉简化为顶部入口)
const COMMON_TEMPLATES = [
  { label: "主变差动动作", obj: "主变", pheno: "差动保护动作", status: "已跳闸" },
  { label: "线路开关跳闸", obj: "线路", pheno: "开关跳闸", status: "已跳闸" },
  { label: "母线失压", obj: "母线", pheno: "母线失压", status: "已跳闸" },
  { label: "站用电失电", obj: "站用电", pheno: "站用电失电", status: "异常告警" },
  { label: "安控联动异常", obj: "安控装置", pheno: "联动异常", status: "运行中" },
];

function FaultPicker() {
  const navigate = useNavigate();
  const { from } = Route.useSearch();
  const fromScene = from ? getScenario(from) : undefined;
  const { state, saveScenarioFavorite } = useMockStore();

  const [voltage, setVoltage] = useState<string | undefined>(fromScene?.voltageLevel);
  const [object, setObject] = useState<string | undefined>(fromScene?.device);
  const [instance, setInstance] = useState<string | undefined>(fromScene?.deviceInstance);
  const [instanceQuery, setInstanceQuery] = useState("");
  const [pheno, setPheno] = useState<string | undefined>(fromScene?.phenomenon);
  const [status, setStatus] = useState<string | undefined>(fromScene?.currentStatus);
  const [extra, setExtra] = useState("");
  const [menu, setMenu] = useState<"recent" | "tpl" | null>(null);

  const items = [
    { key: "voltage", label: "电压等级", value: voltage, removable: true },
    { key: "object", label: "故障对象", value: object, removable: true },
    { key: "instance", label: "设备实例", value: instance, removable: true },
    { key: "pheno", label: "当前现象", value: pheno, removable: true },
    { key: "status", label: "当前状态", value: status, removable: true },
  ];

  const instanceOptions = useMemo(() => {
    const base = object ? INSTANCE_LIB[object] ?? [] : Object.values(INSTANCE_LIB).flat();
    if (!instanceQuery) return base;
    const q = instanceQuery.toLowerCase();
    return base.filter((x) => x.name.toLowerCase().includes(q) || x.meta.toLowerCase().includes(q));
  }, [object, instanceQuery]);

  const phenoOptions = useMemo(() => (object && PHENO_BY_OBJ[object]) || DEFAULT_PHENO, [object]);

  const matches = useMemo(
    () =>
      FAULT_TEMPLATES.filter(
        (t) =>
          (!voltage || t.voltageLevel === voltage) &&
          (!object || t.device === object) &&
          (!pheno || t.phenomenon === pheno),
      ),
    [voltage, object, pheno],
  );

  const canGenerate = !!(object && pheno);

  const onRemove = (k: string) => {
    if (k === "voltage") setVoltage(undefined);
    if (k === "object") {
      setObject(undefined);
      setInstance(undefined);
      setPheno(undefined);
    }
    if (k === "instance") setInstance(undefined);
    if (k === "pheno") setPheno(undefined);
    if (k === "status") setStatus(undefined);
  };

  const reset = () => {
    setVoltage(undefined);
    setObject(undefined);
    setInstance(undefined);
    setInstanceQuery("");
    setPheno(undefined);
    setStatus(undefined);
    setExtra("");
    toast.success("已重置所有条件");
  };

  const saveAsFavorite = () => {
    if (!canGenerate) return toast.error("请先选择故障对象与当前现象");
    const tagBits = [voltage, object, instance, pheno, status].filter(Boolean).join(" / ");
    saveScenarioFavorite({
      scenarioId: matches[0]?.id ?? "ft-custom",
      title: `常用故障场景:${tagBits}`,
      kind: "fault",
    });
    toast.success("已暂存为常用场景");
  };

  const generate = (scenarioId?: string) => {
    if (!scenarioId && !canGenerate) {
      toast.error("请先选择故障对象与当前现象");
      return;
    }
    const target = scenarioId ?? matches[0]?.id ?? FAULT_TEMPLATES[0]?.id ?? "ft-demo";
    toast.success("已生成处置复盘参考");
    navigate({ to: "/scenario/fault/result/$id", params: { id: target } });
  };

  const recent = state.recentScenarios
    .map((id) => ALL_SCENARIOS.find((s) => s.id === id && s.kind === "fault"))
    .filter(Boolean)
    .slice(0, 5) as { id: string; title: string }[];

  return (
    <PageShell>
      <ScenarioBreadcrumb
        items={[
          { label: "场景训练", to: "/scenario" },
          { label: "故障处置复盘" },
        ]}
      />
      <div className="mt-3 mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">识别故障场景</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            请选择故障对象和现象,系统将组织判断思路、参考处置、风险与相似案例(培训复盘用,不替代正式调度命令)
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
            onClick={() => setMenu(menu === "tpl" ? null : "tpl")}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[12.5px] hover:bg-muted"
          >
            <BookMarked className="h-3.5 w-3.5" /> 从常见故障模板带入
          </button>
          <Link to="/scenario" className="text-[12.5px] text-muted-foreground hover:text-primary">
            ← 返回入口
          </Link>
          {menu && (
            <div className="absolute right-0 top-9 z-20 w-72 rounded-lg border border-border bg-card p-2 shadow-lg">
              {menu === "recent" ? (
                recent.length === 0 ? (
                  <div className="p-3 text-center text-[12px] text-muted-foreground">暂无最近场景</div>
                ) : (
                  <ul className="space-y-1">
                    {recent.map((r) => (
                      <li key={r.id}>
                        <button
                          onClick={() => {
                            const s = getScenario(r.id);
                            if (!s) return;
                            setVoltage(s.voltageLevel);
                            setObject(s.device);
                            setInstance(s.deviceInstance);
                            setPheno(s.phenomenon);
                            setStatus(s.currentStatus);
                            setMenu(null);
                            toast.success("已带入条件");
                          }}
                          className="block w-full rounded-md px-2 py-1.5 text-left text-[12.5px] hover:bg-muted"
                        >
                          {r.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <ul className="space-y-1">
                  {COMMON_TEMPLATES.map((t) => (
                    <li key={t.label}>
                      <button
                        onClick={() => {
                          setObject(t.obj);
                          setPheno(t.pheno);
                          setStatus(t.status);
                          setMenu(null);
                          toast.success(`已带入模板:${t.label}`);
                        }}
                        className="block w-full rounded-md px-2 py-1.5 text-left text-[12.5px] hover:bg-muted"
                      >
                        <div className="font-medium">{t.label}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {t.obj} · {t.pheno} · {t.status}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft/40 px-4 py-3 text-[12.5px] text-warning-foreground">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          复盘内容为培训参考,事故定性以正式调查结论为准。处置应按调度指令与本厂运行规程执行。
        </span>
      </div>

      <SafetyBanner compact />

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <StepCard step={1} title="电压等级(可选)">
            <OptionChips
              options={VOLTAGE.map((v) => ({ key: v, label: v }))}
              value={voltage as any}
              onChange={(v) => setVoltage(v)}
            />
          </StepCard>

          <StepCard step={2} title="故障对象" required>
            <div className="space-y-3">
              {OBJECT_GROUPS.map((g) => (
                <div key={g.group}>
                  <div className="mb-1.5 text-[11.5px] text-muted-foreground">{g.group}</div>
                  <OptionChips
                    options={g.items.map((d) => ({ key: d, label: d }))}
                    value={object as any}
                    onChange={(v) => {
                      setObject(v);
                      setInstance(undefined);
                      setPheno(undefined);
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
                  未匹配设备,可不选实例,按对象与现象生成通用复盘参考
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

          <StepCard step={4} title="当前现象" required>
            <OptionChips
              options={phenoOptions.map((p) => ({ key: p, label: p }))}
              value={pheno as any}
              onChange={(v) => setPheno(v)}
            />
          </StepCard>

          <StepCard step={5} title="当前状态(可选)">
            <OptionChips
              options={STATUS.map((s) => ({ key: s, label: s }))}
              value={status as any}
              onChange={(v) => setStatus(v)}
            />
          </StepCard>

          <StepCard step={6} title="补充说明(可选)">
            <textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              rows={3}
              placeholder="可输入保护动作组合、现场现象、近期检修、特殊运行方式等补充信息。"
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
              <div className="text-[14px] font-semibold">匹配的复盘参考</div>
              <span className="text-[11px] text-muted-foreground">{matches.length} 项</span>
            </div>
            {matches.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-[12px] text-muted-foreground">
                未匹配,可调整条件或直接生成最相关复盘
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
                      使用该复盘 <ChevronRight className="h-3 w-3" />
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
            <Sparkles className="h-4 w-4" /> 生成处置复盘参考 <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-[11px] text-muted-foreground">
            必填:故障对象 / 当前现象
          </p>
        </div>
      </div>
    </PageShell>
  );
}
