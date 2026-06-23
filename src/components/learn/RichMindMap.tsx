import { useState } from "react";
import { Maximize2, X } from "lucide-react";

type Leaf = { title: string };
type Branch = { title: string; color: string; children: Leaf[] };

const FULL_TITLE =
  "DL/T 2545.1—2022《发电厂继电保护及安全自动装置检验规程 第1部分:燃煤发电厂》";

const DATA: { branches: Branch[] } = {
  branches: [
    {
      title: "1. 标准定位与适用范围",
      color: "#F2994A",
      children: [{ title: "1.1 标准性质与定位" }, { title: "1.2 适用对象" }],
    },
    {
      title: "2. 检验体系框架",
      color: "#EB5757",
      children: [{ title: "2.1 检验分类" }, { title: "2.2 总则要求" }],
    },
    {
      title: "3. 关键检验技术要求",
      color: "#828282",
      children: [
        { title: "3.1 互感器检验" },
        { title: "3.2 二次回路检验" },
        { title: "3.3 直流电源回路" },
        { title: "3.4 接地系统" },
      ],
    },
    {
      title: "4. 整组与动态检验",
      color: "#27AE60",
      children: [
        { title: "4.1 整组试验" },
        { title: "4.2 机组带负荷检验" },
        { title: "4.3 甩/降负荷及停机检验" },
      ],
    },
    {
      title: "5. 投运前闭环管理",
      color: "#2F80ED",
      children: [{ title: "5.1 安全确认" }, { title: "5.2 投运准备" }],
    },
  ],
};

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function MindMapSVG({
  scale = 1,
  rootMax = 18,
}: {
  scale?: number;
  rootMax?: number;
}) {
  const W = 1180;
  const totalLeaves = DATA.branches.reduce((s, b) => s + b.children.length, 0);
  const rowH = 52;
  const H = Math.max(560, totalLeaves * rowH + 80);

  const rootX = 110;
  const rootY = H / 2;
  const branchX = 600;
  const leafStartX = 880;

  const topPad = 50;
  const gap = (H - topPad * 2) / Math.max(totalLeaves - 1, 1);

  let leafIdx = 0;
  const branchPositions = DATA.branches.map((b) => {
    const leafYs = b.children.map(() => topPad + gap * leafIdx++);
    const y = leafYs.reduce((a, c) => a + c, 0) / leafYs.length;
    return { y, leafYs };
  });

  const rootLabel = truncate(FULL_TITLE, rootMax);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W * scale}
      height={H * scale}
      style={{ maxWidth: "100%", height: "auto" }}
      fontFamily="ui-sans-serif, system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif"
    >
      <title>{FULL_TITLE}</title>

      {/* Root */}
      <circle cx={rootX} cy={rootY} r={8} fill="#fff" stroke="#2F80ED" strokeWidth={2.5} />
      <text
        x={rootX - 14}
        y={rootY + 5}
        fontSize={14}
        fontWeight={600}
        fill="#111827"
        textAnchor="end"
      >
        {rootLabel}
      </text>

      {DATA.branches.map((b, bi) => {
        const bp = branchPositions[bi];
        const by = bp.y;
        return (
          <g key={bi}>
            {/* curve: root -> branch */}
            <path
              d={`M ${rootX + 8} ${rootY} C ${rootX + 200} ${rootY}, ${branchX - 220} ${by}, ${branchX - 8} ${by}`}
              fill="none"
              stroke={b.color}
              strokeWidth={2.5}
            />
            {/* branch circle */}
            <circle cx={branchX} cy={by} r={7} fill="#fff" stroke={b.color} strokeWidth={2.5} />
            {/* branch label — to the LEFT of node, vertically centered, with white halo */}
            <text
              x={branchX - 14}
              y={by + 5}
              fontSize={14}
              fontWeight={600}
              fill="#111827"
              textAnchor="end"
              stroke="#ffffff"
              strokeWidth={4}
              paintOrder="stroke"
              strokeLinejoin="round"
            >
              {b.title}
            </text>

            {b.children.map((leaf, li) => {
              const ly = bp.leafYs[li];
              return (
                <g key={li}>
                  {/* curve branch -> leaf endpoint */}
                  <path
                    d={`M ${branchX + 8} ${by} C ${branchX + 140} ${by}, ${leafStartX - 80} ${ly}, ${leafStartX} ${ly}`}
                    fill="none"
                    stroke={b.color}
                    strokeWidth={1.8}
                    opacity={0.9}
                  />
                  {/* short under-text bar */}
                  <line
                    x1={leafStartX}
                    y1={ly}
                    x2={leafStartX + 30}
                    y2={ly}
                    stroke={b.color}
                    strokeWidth={1.6}
                  />
                  <text
                    x={leafStartX + 36}
                    y={ly + 5}
                    fontSize={13}
                    fill="#1F2937"
                  >
                    {leaf.title}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

export function RichMindMap() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className="group relative cursor-zoom-in overflow-hidden rounded-lg border border-border bg-gradient-to-br from-primary-soft/20 to-background p-3"
        onClick={() => setOpen(true)}
        title="点击放大查看"
      >
        <div className="overflow-hidden">
          <MindMapSVG scale={0.42} rootMax={10} />
        </div>
        <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-foreground/70 px-2 py-1 text-[10.5px] text-background opacity-0 transition-opacity group-hover:opacity-100">
          <Maximize2 className="h-3 w-3" /> 点击放大
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-[1320px] overflow-auto rounded-lg bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-background/90 text-muted-foreground shadow hover:text-foreground"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
            <MindMapSVG scale={1} rootMax={22} />
          </div>
        </div>
      )}
    </>
  );
}
