import { ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { KbEmptyState, KbIconButton, KbStatusTag } from "@/components/knowledge/ui";
import { isStorageOnlyFile } from "@/lib/knowledge/parseMerge";
import {
  parseStatusLabel,
  parseStatusTone,
  publishStatusLabel,
  publishStatusTone,
} from "@/lib/knowledge/status";
import type { KnowledgeFile, KnowledgeFileVersion } from "@/lib/knowledge/types";
import { kbRadius } from "@/lib/knowledge/tokens";
import { cn } from "@/lib/utils";

type PreviewBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "note"; text: string };

type PreviewPage = {
  title?: string;
  blocks: PreviewBlock[];
};

const GRID_GUIDE_PAGES: PreviewPage[] = [
  {
    title: "第一章 总则",
    blocks: [
      {
        type: "note",
        text: "本汇编依据《电力并网运行管理规定》（国能发监管规〔2021〕60号）及厂站运行管理要求整理，供值班运行人员日常查阅。",
      },
      { type: "h", text: "1.1 目的" },
      {
        type: "p",
        text: "为规范并网发电厂运行管理，保障电力系统安全、优质、经济运行，明确日常监视、异常处置与调度联系要求，制定本规程汇编。",
      },
      { type: "h", text: "1.2 适用范围" },
      {
        type: "p",
        text: "本规程适用于本厂并网运行机组、升压站及涉网一、二次设备的运行值班管理。凡参加电网统一调度的发电主体，均应执行统一调度、分级管理原则，贯彻安全第一方针。",
      },
      {
        type: "ul",
        items: [
          "适用对象：并网火电机组、升压站、涉网保护及自动化设备。",
          "适用岗位：值长、单元长、电气值班员、辅控值班员。",
          "适用场景：正常运行、启停操作、异常处置、事故处理及反事故演练。",
        ],
      },
      { type: "h", text: "1.3 基本原则" },
      {
        type: "ul",
        items: [
          "严格服从电力调度机构指挥，迅速、准确执行调度指令。",
          "严格执行两票三制，操作前核对设备状态与安全措施。",
          "发现危及人身、设备或电网安全的情况，应立即采取应急措施并汇报。",
        ],
      },
    ],
  },
  {
    title: "第二章 运行值班与日常监视",
    blocks: [
      { type: "h", text: "2.1 值班一般要求" },
      {
        type: "p",
        text: "值班人员应熟悉本岗位设备系统、运行方式、保护配置及调度管辖范围，按规定巡检、抄表、交接班，并保持通信畅通。",
      },
      {
        type: "ul",
        items: [
          "交班应交代运行方式、缺陷、限值、未完操作及调度未完指令。",
          "接班应核对表计、光字牌、保护压板及自动化通信状态。",
          "值班记录应真实完整，重要操作与异常必须留痕。",
        ],
      },
      { type: "h", text: "2.2 发电机组监视" },
      {
        type: "p",
        text: "值班人员应实时监视发电机有功功率、无功功率、定子电压/电流、转子电压/电流、频率、功率因数及关键温度，发现越限及时调整并汇报。",
      },
      {
        type: "ul",
        items: [
          "监视定子绕组、铁芯、轴承、集电环温度及振动情况。",
          "检查励磁系统、PSS、一次调频及 AGC 投退状态是否符合调度要求。",
          "检查机组有无异常声响、气味、电刷冒火或过热现象。",
        ],
      },
      { type: "h", text: "2.3 主变及升压站监视" },
      {
        type: "ul",
        items: [
          "监视主变油温、油位、油色、声音及瓦斯继电器状态。",
          "核对各侧电流、电压、负荷及冷却系统运行情况。",
          "检查断路器、隔离开关位置指示、母线接头温升及绝缘子状态。",
        ],
      },
    ],
  },
  {
    title: "第三章 调度联系与调令执行",
    blocks: [
      { type: "h", text: "3.1 调度联系制度" },
      {
        type: "p",
        text: "并网主体运行应严格服从电力调度机构指挥。接受调度指令的值班人员应复诵核对，执行后及时回令；不得以任何借口拒绝或拖延执行。",
      },
      {
        type: "ul",
        items: [
          "调令接收：听清、复诵、录音、记录、执行、回令。",
          "联系用语应规范，重要指令应双人核对。",
          "通信中断时应立即启用备用通信通道并报告调度。",
        ],
      },
      { type: "h", text: "3.2 指令异议与安全优先" },
      {
        type: "p",
        text: "值班人员认为执行调度指令将危及人身、设备或系统安全时，应立即向发布指令的值班调度员报告并说明理由，由调度员决定该指令执行或撤销。",
      },
      { type: "h", text: "3.3 运行方式与计划曲线" },
      {
        type: "ul",
        items: [
          "严格执行调度下达或市场出清的运行方式和发电计划曲线。",
          "调整有功、无功及电压应在调度批准范围内进行。",
          "未经调度同意，不得擅自改变调度管辖设备状态、定值及保护投退。",
        ],
      },
      {
        type: "note",
        text: "涉及涉网参数、保护定值、AGC/AVC 投退等变更，必须事先获得调度许可。",
      },
    ],
  },
  {
    title: "第四章 异常与事故处置",
    blocks: [
      { type: "h", text: "4.1 异常发现与报告" },
      {
        type: "p",
        text: "调度管辖设备发生事故或异常时，应按规定时限向电力调度机构汇报；可先汇报现象，详细原因查清后补充汇报，并同步报告值长及专业负责人。",
      },
      {
        type: "ul",
        items: [
          "先保人身、再保电网、后保设备。",
          "迅速判明故障范围，检查保护动作、开关位置及表计指示。",
          "做好现场记录、故障录波与相关证据保全。",
        ],
      },
      { type: "h", text: "4.2 典型异常处置要点" },
      {
        type: "ul",
        items: [
          "发电机跳闸：核对保护动作信息，确认有无内部故障迹象，汇报调度，未经允许不得擅自并网。",
          "主变重瓦斯/差动动作：立即停运相关设备，检查外观、油位及二次回路，按调度令处理。",
          "母线异常或开关拒动：按事故处理预案隔离故障点，防止事故扩大。",
          "通信/自动化中断：启用备用通道，改为电话调度并加强人工监视。",
        ],
      },
      { type: "h", text: "4.3 事故后要求" },
      {
        type: "p",
        text: "发生电力安全事故（事件）后，在未获得调度机构允许前，有关设备不得并网运行。相关单位应配合调查，落实反事故措施并组织复盘。",
      },
    ],
  },
  {
    title: "第五章 调频调压与辅助服务",
    blocks: [
      { type: "h", text: "5.1 一次调频与 AGC" },
      {
        type: "p",
        text: "发电侧并网主体应具备相应的一次调频、自动发电控制（AGC）能力，相关指标应满足调度及监管要求。",
      },
      {
        type: "ul",
        items: [
          "一次调频考核关注：可用率、调节容量、速率、精度、响应时间。",
          "AGC 考核关注：可用率、调节容量、速率、精度、响应时间。",
          "AGC/一次调频异常退出时，应立即汇报调度并说明原因。",
        ],
      },
      { type: "h", text: "5.2 无功与电压控制" },
      {
        type: "ul",
        items: [
          "根据调度指令调整励磁或无功补偿设备，维持母线电压在规定范围。",
          "AVC 装置投运率、调节合格率及电压合格率应符合考核要求。",
          "受系统电压限制、经调整仍无法达到目标值的，应及时向调度说明。",
        ],
      },
      { type: "h", text: "5.3 调峰与黑启动" },
      {
        type: "p",
        text: "机组调峰能力应达到规定要求；被确定为黑启动电源的机组，应按预案做好准备，在系统需要时及时可靠执行黑启动任务。",
      },
    ],
  },
  {
    title: "第六章 检修与二次设备管理",
    blocks: [
      { type: "h", text: "6.1 检修计划" },
      {
        type: "p",
        text: "发电侧并网主体应根据设备状况提出检修计划申请，由电力调度机构统筹安排。计划确定后双方应严格执行；确需变更须提前申请并说明原因。",
      },
      { type: "h", text: "6.2 二次设备与定值管理" },
      {
        type: "ul",
        items: [
          "继电保护、安自装置、调度自动化及通信设备检修应尽量配合一次检修。",
          "定值、压板投退按调度下达整定值和运行规定执行。",
          "改变设备状态或参数前须经调度批准，严禁擅自更改。",
        ],
      },
      { type: "h", text: "6.3 网络安全" },
      {
        type: "p",
        text: "接入电网运行的二次系统应符合《电力监控系统安全防护规定》及网络与信息安全有关要求，严禁非法外联和越权操作。",
      },
    ],
  },
  {
    title: "第七章 启停机与倒闸操作",
    blocks: [
      { type: "h", text: "7.1 操作基本原则" },
      {
        type: "ul",
        items: [
          "操作前明确任务、填写操作票，审核后模拟预演。",
          "执行“唱票—复诵—核对—操作—回令”，一人操作、一人监护。",
          "严禁带负荷拉合隔离开关，操作后检查设备状态与表计指示。",
        ],
      },
      { type: "h", text: "7.2 并网与解列" },
      {
        type: "p",
        text: "机组并网、解列必须在调度指令下进行。并网前确认保护投入正确、同期装置正常、相关隔离开关与断路器位置符合要求。",
      },
      { type: "h", text: "7.3 紧急停机" },
      {
        type: "p",
        text: "当发电机或其原动机发生需要立即切断的危险情况（如设备冒烟着火、严重振动、危及人身安全等），应立即打闸或按紧急停机按钮，并向主控发出“机器危险”信号，按事故处理流程解列灭磁。",
      },
    ],
  },
  {
    title: "第八章 交接班与记录管理",
    blocks: [
      { type: "h", text: "8.1 交接班内容" },
      {
        type: "ul",
        items: [
          "当前运行方式、负荷、电压及主要限值。",
          "未完操作、未完调令、缺陷及风险提示。",
          "保护、安自、AGC/AVC、通信自动化异常情况。",
          "下一班注意事项及待办事项。",
        ],
      },
      { type: "h", text: "8.2 记录与台账" },
      {
        type: "p",
        text: "运行日志、操作记录、异常处理记录、调度联系记录应规范填写，重要事件应可追溯。电子记录与纸质记录不一致时，以经审核确认的正式记录为准。",
      },
      {
        type: "note",
        text: "涉及考核、事故、非停等关键事项，应在当班内完成初步记录并及时报送。",
      },
    ],
  },
  {
    title: "第九章 反事故措施与演练",
    blocks: [
      { type: "h", text: "9.1 反事故措施" },
      {
        type: "p",
        text: "电力调度机构针对系统安全问题制定反事故措施后，涉及本厂的，应制定整改计划并落实。未完成整改前，应按调度要求采取临时防范措施。",
      },
      { type: "h", text: "9.2 预案与演练" },
      {
        type: "ul",
        items: [
          "编制全厂停电、机组非停、母线失压、通信中断等处理预案。",
          "定期参加反事故演练，检验指挥协调与现场处置能力。",
          "演练发现问题应闭环整改并更新预案。",
        ],
      },
    ],
  },
  {
    title: "第十章 附则与附录",
    blocks: [
      { type: "h", text: "10.1 附则" },
      {
        type: "p",
        text: "本规程与上级最新规定不一致时，以上级规定为准。本厂可根据设备实际编制实施细则，但不得低于本规程要求。",
      },
      { type: "h", text: "10.2 常用术语" },
      {
        type: "ul",
        items: [
          "并网主体：接入电力系统运行的发电、储能及可调节负荷等主体。",
          "统一调度：电力系统运行由调度机构统一组织、指挥、指导和协调。",
          "涉网设备：影响电网安全稳定运行的一、二次设备及控制系统。",
        ],
      },
      { type: "h", text: "10.3 相关文件" },
      {
        type: "ul",
        items: [
          "《电力并网运行管理规定》（国能发监管规〔2021〕60号）",
          "《电力调度管理条例》及相关调度规程",
          "本厂《电气运行规程》《两票管理规定》《事故处理预案》",
        ],
      },
    ],
  },
  {
    title: "附录 A 值班巡检提示卡",
    blocks: [
      {
        type: "ul",
        items: [
          "机组：功率、电压、电流、温度、振动、励磁与调频状态。",
          "主变：油温油位、冷却器、异响异味、瓦斯继电器。",
          "开关站：刀闸位置、接头温升、机构压力、加热驱潮。",
          "二次系统：保护运行灯、通道告警、时钟同步、安防状态。",
        ],
      },
      {
        type: "note",
        text: "巡检发现异常应立即按“确认—隔离—汇报—记录—跟踪”流程处理。",
      },
    ],
  },
  {
    title: "附录 B 异常汇报要素",
    blocks: [
      { type: "h", text: "向调度汇报建议包含" },
      {
        type: "ul",
        items: [
          "时间、机组/设备名称、当前状态。",
          "现象描述（表计、光字、保护动作、开关变位）。",
          "已采取的紧急措施。",
          "请求调度明确的下一步指令。",
        ],
      },
      { type: "h", text: "厂内汇报建议包含" },
      {
        type: "ul",
        items: [
          "是否危及人身与设备安全。",
          "是否影响出力、电压或对外供电。",
          "是否需要检修、消防或安保支援。",
        ],
      },
    ],
  },
];

function getPreviewPages(file: KnowledgeFile): PreviewPage[] {
  if (file.id === "file-grid-guide") return GRID_GUIDE_PAGES;
  return [
    {
      blocks: [
        { type: "p", text: file.summary ?? "解析完成后可在此预览文件正文。" },
        {
          type: "note",
          text: "此处为在线预览画布。接入真实接口后，可替换为 PDF 阅读器、Office 预览服务或媒体播放器。",
        },
        { type: "h", text: "1. 适用范围" },
        {
          type: "p",
          text: "操作人员应了解文件适用范围、执行边界和协同要求。对条款存在疑问时，应向主管部门确认后执行。",
        },
        { type: "h", text: "2. 执行要求" },
        {
          type: "p",
          text: "相关单位应结合现场实际制定实施细则，定期复盘执行情况，并将更新内容沉淀回对应知识库。",
        },
      ],
    },
  ];
}

function PreviewBlocks({ blocks }: { blocks: PreviewBlock[] }) {
  return (
    <div className="mt-6 space-y-5">
      {blocks.map((block, index) => {
        if (block.type === "h") {
          return (
            <h3 key={index} className="text-[16px] font-semibold text-kb-heading">
              {block.text}
            </h3>
          );
        }
        if (block.type === "note") {
          return (
            <div
              key={index}
              className="rounded-[8px] border border-[#BFE8ED] bg-[#F4FCFD] px-4 py-3 text-[13px] leading-relaxed text-kb-body"
            >
              {block.text}
            </div>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={index} className="list-disc space-y-2 pl-5 text-[13.5px] leading-[1.9] text-kb-body/90">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="text-[13.5px] leading-[1.9] text-kb-body/90">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

export function FilePreviewCanvas({
  file,
  version,
  historyVersion,
  page: pageProp,
  onPageChange,
}: {
  file: KnowledgeFile;
  version?: KnowledgeFileVersion;
  historyVersion?: boolean;
  /** Controlled page number; when provided the component acts as controlled */
  page?: number;
  onPageChange?: (page: number) => void;
}) {
  const [internalPage, setInternalPage] = useState(1);
  const page = pageProp ?? internalPage;
  const setPage = (value: number | ((prev: number) => number)) => {
    const next = typeof value === "function" ? value(page) : value;
    if (onPageChange) {
      onPageChange(next);
    } else {
      setInternalPage(next);
    }
  };

  const previewPages = useMemo(() => getPreviewPages(file), [file]);
  const totalPages = previewPages.length;
  const current = previewPages[Math.min(Math.max(page, 1), totalPages) - 1];

  useEffect(() => {
    if (pageProp == null) setInternalPage(1);
  }, [file.id, pageProp]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const [zoom, setZoom] = useState(100);
  const storageOnly = isStorageOnlyFile(file);

  if (storageOnly) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <KbEmptyState
          title="暂不支持在线预览"
          description="当前格式无法直接展示内容，可下载原文件后查看。"
        />
      </div>
    );
  }

  if (file.status === "parseFailed") {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <KbEmptyState
          title="文件解析失败"
          description={
            file.parseError ??
            "当前文件暂时无法在线预览，请下载原文件或联系管理员处理。"
          }
        />
      </div>
    );
  }

  return (
    <section className="scrollbar-thin flex min-w-0 flex-1 flex-col overflow-hidden bg-[rgb(246,247,249)]">
      <div className="flex h-14 shrink-0 items-center justify-center gap-2 border-b border-[#E3ECEE] bg-[rgb(246,247,249)] px-4">
        <KbIconButton
          icon={ChevronLeft}
          label="上一页"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        />
        <span className="text-[12px] tabular-nums text-kb-muted">
          第 {page} 页 / 共 {totalPages} 页
        </span>
        <KbIconButton
          icon={ChevronRight}
          label="下一页"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
        <div className="mx-2 h-5 w-px bg-[#DCE7E9]" />
        <KbIconButton
          icon={ZoomOut}
          label="缩小"
          onClick={() => setZoom((z) => Math.max(50, z - 10))}
        />
        <span className="min-w-[40px] text-center text-[12px] tabular-nums text-kb-muted">
          {zoom}%
        </span>
        <KbIconButton
          icon={ZoomIn}
          label="放大"
          onClick={() => setZoom((z) => Math.min(200, z + 10))}
        />
        <KbIconButton icon={Maximize2} label="适合宽度" onClick={() => setZoom(100)} />
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-6 py-5 lg:px-9 lg:py-6">
        {historyVersion && (
          <div
            className={cn(
              "mx-auto mb-4 max-w-[900px] rounded-[8px] border border-warning/30 bg-warning-soft px-4 py-3 text-[12.5px] text-warning-foreground",
            )}
          >
            当前为历史版本，只读预览，可下载，不参与默认 AI 问答召回。
          </div>
        )}
        <article
          className={cn(
            "mx-auto min-h-[720px] w-full max-w-[900px] border border-[#E7EEF0] bg-white px-10 py-9 shadow-[0_10px_28px_rgba(31,52,64,0.09)] lg:px-14 lg:py-11",
            kbRadius.lg,
          )}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
        >
          <div className="mb-7 flex items-center justify-between border-b border-[#E8EFF1] pb-4 text-[11.5px] text-kb-muted">
            <span>
              第 {page} 页 / 共 {totalPages} 页
            </span>
            <span>{version?.version ?? file.version}</span>
          </div>
          <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-kb-heading">
            {file.name.replace(/\.(pdf|docx|xlsx|pptx)$/i, "")}
          </h2>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-kb-muted">
            <span>上传人：{file.uploaderName}</span>
            <span>更新时间：{file.updatedAt}</span>
            <span>文件大小：{file.size}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <KbStatusTag tone={publishStatusTone(file.status)}>
              {publishStatusLabel(file.status)}
            </KbStatusTag>
            <KbStatusTag tone={parseStatusTone(file.parseStatus)}>
              {parseStatusLabel(file.parseStatus)}
            </KbStatusTag>
          </div>
          {page === 1 ? (
            <p className="mt-8 text-[14px] leading-[1.9] text-kb-body">{file.summary}</p>
          ) : null}
          {current.title ? (
            <h3 className="mt-8 text-[18px] font-semibold text-kb-heading">{current.title}</h3>
          ) : null}
          <PreviewBlocks blocks={current.blocks} />
        </article>
      </div>
    </section>
  );
}
