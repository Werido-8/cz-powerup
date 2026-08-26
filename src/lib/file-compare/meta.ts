import { CirclePlus, CircleMinus, PencilLine, Shuffle, type LucideIcon } from "lucide-react";
import type { DiffTone, DiffType } from "./types";

export interface DiffTypeMeta {
  label: string;
  icon: LucideIcon;
  /** 统计卡片图标底色 */
  cardIcon: string;
  /** 列表小圆点图标底色 */
  listIcon: string;
  /** 数值与文字色 */
  valueText: string;
  /** 环形图与进度条填充色 */
  chartColor: string;
  /** 胶囊筛选项激活态 */
  pillActive: string;
}

export const DIFF_TYPE_META: Record<DiffType, DiffTypeMeta> = {
  added: {
    label: "新增",
    icon: CirclePlus,
    cardIcon: "bg-[#19A974] text-white",
    listIcon: "bg-[#E8F8EF] text-[#19A974]",
    valueText: "text-[#19A974]",
    chartColor: "#19A974",
    pillActive: "border-[#BFE6D2] bg-[#EAF8F1] text-[#158A5F]",
  },
  removed: {
    label: "删除",
    icon: CircleMinus,
    cardIcon: "bg-[#E45B5B] text-white",
    listIcon: "bg-[#FDECEC] text-[#D34F4F]",
    valueText: "text-[#D9534F]",
    chartColor: "#E45B5B",
    pillActive: "border-[#F3CFCF] bg-[#FDEFEF] text-[#C24343]",
  },
  modified: {
    label: "修改",
    icon: PencilLine,
    cardIcon: "bg-[#FDF1DC] text-[#C7841B]",
    listIcon: "bg-[#FDF1DC] text-[#C7841B]",
    valueText: "text-[#D89020]",
    chartColor: "#E9A128",
    pillActive: "border-[#F0DCB6] bg-[#FDF6E8] text-[#B5791A]",
  },
  moved: {
    label: "移动",
    icon: Shuffle,
    cardIcon: "bg-[#EFEBFB] text-[#7B6BC7]",
    listIcon: "bg-[#EFEBFB] text-[#7B6BC7]",
    valueText: "text-[#7B6BC7]",
    chartColor: "#8B7BD8",
    pillActive: "border-[#DCD5F5] bg-[#F3F0FD] text-[#6B5AB8]",
  },
};

/** 正文差异高亮样式 */
export const DIFF_TONE_CLASSES: Record<DiffTone, string> = {
  add: "bg-[#DFF5E7] text-[#166F49]",
  remove: "bg-[#FDE3E4] text-[#B2413F] line-through decoration-[#C9615F]",
  modifyOld: "bg-[#FCEBD2] text-[#9C6512]",
  modifyNew: "bg-[#FFF0C9] text-[#8B5B11]",
};

/** 缩略条颜色（按差异类型） */
export function getMinimapColor(type: DiffType) {
  return DIFF_TYPE_META[type].chartColor;
}
