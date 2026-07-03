import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ClipboardCheck,
  FileText,
  GraduationCap,
  History,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Doc, LearnStatus } from "@/lib/mock/data";

export type MaterialDisplayType =
  | "规程"
  | "SOP"
  | "操作指引"
  | "风险提示"
  | "事故复盘"
  | "入门材料";

const TYPE_TAG_STYLES: Record<
  MaterialDisplayType,
  { bg: string; text: string }
> = {
  规程: { bg: "#EAF7F9", text: "#1498A8" },
  SOP: { bg: "#EEF6FF", text: "#2B6CB0" },
  操作指引: { bg: "#EEF6FF", text: "#2B6CB0" },
  风险提示: { bg: "#FFF7ED", text: "#C76A16" },
  事故复盘: { bg: "#F5F3FF", text: "#6D5BD0" },
  入门材料: { bg: "#ECFDF5", text: "#198754" },
};

const TYPE_ICONS: Record<MaterialDisplayType, LucideIcon> = {
  规程: FileText,
  SOP: ListChecks,
  操作指引: ClipboardCheck,
  风险提示: AlertTriangle,
  事故复盘: History,
  入门材料: GraduationCap,
};

const DOC_TYPE_LABEL: Record<Doc["docType"], string> = {
  规程标准: "规程制度",
  典型操作: "典型操作",
  故障处置: "故障处置",
  厂站资料: "厂站资料",
  历史案例: "事故复盘",
  "两细则/考核": "制度考核",
};

const READ_MINUTES: Record<MaterialDisplayType, number> = {
  规程: 8,
  SOP: 10,
  操作指引: 9,
  风险提示: 6,
  事故复盘: 10,
  入门材料: 8,
};

export function getMaterialType(doc: Doc): MaterialDisplayType {
  const title = doc.title;

  if (/新员工|入门/.test(title)) return "入门材料";
  if (/风险|提示|迎峰度夏/.test(title)) return "风险提示";
  if (/事故|复盘|案例/.test(title)) return "事故复盘";
  if (/SOP|程序/.test(title) || (doc.docType === "典型操作" && /程序|操作/.test(title))) {
    return "SOP";
  }
  if (/操作指引|操作步骤|标准化操作/.test(title)) return "操作指引";
  if (/规程|制度/.test(title) || doc.docType === "规程标准") return "规程";

  switch (doc.docType) {
    case "典型操作":
      return "SOP";
    case "故障处置":
      return "风险提示";
    case "历史案例":
      return "事故复盘";
    case "厂站资料":
      return /规程/.test(title) ? "规程" : "入门材料";
    default:
      return "规程";
  }
}

export function getMaterialIcon(type: MaterialDisplayType): LucideIcon {
  return TYPE_ICONS[type];
}

export function getMaterialTypeTagStyle(type: MaterialDisplayType) {
  return TYPE_TAG_STYLES[type];
}

export function getLearningStatusLabel(status: LearnStatus | string): string {
  if (status === "需复习") return "需复习";
  return status;
}

function getMaterialScenario(doc: Doc, type: MaterialDisplayType): string {
  if (doc.scenarioType) return doc.scenarioType;
  if (type === "风险提示" && /迎峰度夏/.test(doc.title)) return "迎峰度夏";
  if (type === "SOP" && doc.equipment && doc.equipment !== "全站") return doc.equipment;
  if (doc.highlight[0]) return doc.highlight[0];
  if (doc.equipment && doc.equipment !== "全站") return doc.equipment;
  if (type === "入门材料") return "值班运行";
  if (type === "事故复盘") return "典型案例";
  return "值班运行";
}

export function getMaterialMeta(doc: Doc, type: MaterialDisplayType): string {
  const category = DOC_TYPE_LABEL[doc.docType] ?? doc.docType;
  const scenario = getMaterialScenario(doc, type);
  const minutes = READ_MINUTES[type];
  return `${category} · ${scenario} · 预计 ${minutes} 分钟`;
}

function getActionLabel(status: LearnStatus | string): string {
  if (status === "已学" || status === "需复习") return "回顾";
  if (status === "学习中") return "继续学习";
  return "开始学习";
}

// ─── 资料类型 icon ───────────────────────────────────────────────────────────
export function MaterialTypeIcon({
  type,
  learned,
  className,
}: {
  type: MaterialDisplayType;
  learned?: boolean;
  className?: string;
}) {
  const Icon = getMaterialIcon(type);

  return (
    <div
      className={cn(
        "grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[10px] transition-colors",
        "bg-[#EAF7F9] text-[#1498A8] group-hover:bg-[#D9F2F5]",
        learned && "opacity-80",
        className,
      )}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
    </div>
  );
}

// ─── 资料类型标签 ───────────────────────────────────────────────────────────
export function MaterialTypeTag({ type }: { type: MaterialDisplayType }) {
  const style = getMaterialTypeTagStyle(type);

  return (
    <span
      className="inline-flex h-[22px] shrink-0 items-center rounded-full px-2 text-[12px] font-medium leading-none"
      style={{ background: style.bg, color: style.text }}
    >
      {type}
    </span>
  );
}

// ─── 学习状态标签 ───────────────────────────────────────────────────────────
export function LearningStatusTag({ status }: { status: LearnStatus | string }) {
  const label = getLearningStatusLabel(status);

  if (status === "已学") {
    return (
      <span className="inline-flex h-[22px] items-center rounded-full bg-[#EAFBF1] px-2.5 text-[12px] font-medium text-[#19A974]">
        {label}
      </span>
    );
  }

  if (status === "学习中") {
    return (
      <span className="inline-flex h-[22px] items-center rounded-full bg-[#EAF7F9] px-2.5 text-[12px] font-medium text-[#1498A8]">
        {label}
      </span>
    );
  }

  if (status === "需复习") {
    return (
      <span className="inline-flex h-[22px] items-center rounded-full bg-[#FFF7ED] px-2.5 text-[12px] font-medium text-[#C76A16]">
        {label}
      </span>
    );
  }

  return (
    <span className="text-[13px] font-medium text-[#607681]">{label}</span>
  );
}

// ─── 资料列表项 ─────────────────────────────────────────────────────────────
export function MaterialListItem({
  doc,
  status,
  isLast,
  isRecommended,
}: {
  doc: Doc;
  status: LearnStatus | string;
  isLast?: boolean;
  isRecommended?: boolean;
}) {
  const materialType = getMaterialType(doc);
  const meta = getMaterialMeta(doc, materialType);
  const actionLabel = getActionLabel(status);
  const isLearned = status === "已学" || status === "需复习";
  const isReview = actionLabel === "回顾";

  return (
    <div
      className={cn(
        "group relative flex min-h-[82px] items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-[#F6FBFC]",
        isRecommended && "before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r-full before:bg-[#1498A8]",
      )}
      style={{
        borderBottom: isLast ? undefined : "1px solid #EDF3F5",
      }}
    >
      <MaterialTypeIcon type={materialType} learned={isLearned} />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to="/learn/doc/$id"
            params={{ id: doc.id }}
            className="min-w-0 truncate text-[15px] font-semibold leading-snug text-[#102A43] transition-colors group-hover:text-[#1498A8]"
          >
            {doc.title}
          </Link>
          <MaterialTypeTag type={materialType} />
          {isRecommended && (
            <span className="inline-flex h-[22px] shrink-0 items-center rounded-full bg-[#EAF7F9] px-2 text-[11px] font-medium text-[#1498A8]">
              推荐
            </span>
          )}
        </div>

        {doc.snippet && (
          <p className="mt-1 line-clamp-1 text-[13px] leading-5 text-[#607681]">
            {doc.snippet}
          </p>
        )}

        <p className="mt-1 line-clamp-1 text-[12px] text-[#91A3AA]">{meta}</p>
      </div>

      <div className="ml-1 flex shrink-0 items-center gap-3">
        <LearningStatusTag status={status} />
        <Link
          to="/learn/doc/$id"
          params={{ id: doc.id }}
          className={cn(
            "inline-flex h-9 w-[84px] items-center justify-center rounded-lg border text-[13px] font-medium transition-colors",
            isReview
              ? "border-[#B9DEE5] bg-[#F6FBFC] text-[#1498A8] hover:bg-[#EAF7F9]"
              : "border-[#1498A8] bg-transparent text-[#1498A8] hover:bg-[#EAF7F9]",
          )}
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}

// ─── 资料列表 ───────────────────────────────────────────────────────────────
export function MaterialList({
  items,
  recommendedDocId,
}: {
  items: { doc: Doc; status: LearnStatus | string }[];
  recommendedDocId?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#DCE8EA] py-12 text-center text-[13px] text-[#607681]">
        本专题暂无资料
      </div>
    );
  }

  return (
    <div>
      {items.map(({ doc, status }, index) => (
        <MaterialListItem
          key={doc.id}
          doc={doc}
          status={status}
          isLast={index === items.length - 1}
          isRecommended={recommendedDocId === doc.id}
        />
      ))}
    </div>
  );
}
