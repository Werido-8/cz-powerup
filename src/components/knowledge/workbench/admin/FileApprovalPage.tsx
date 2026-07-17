import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, ChevronDown, Download, Maximize2, Minus, Pencil, Plus, Printer, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import docIcon from "@/assets/doc.png";
import knowledgeIcon from "@/assets/b69a8633-c81d-42e2-80f5-aae7e7edc146.png";
import pdfIcon from "@/assets/pdf.png";
import xlsxIcon from "@/assets/xlsx.png";
import { ExerciseEditorDialog } from "@/components/knowledge/workbench/admin/ExerciseEditorDialog";
import { KbEmptyState } from "@/components/knowledge/ui/KbEmptyState";
import { KbFormDialog } from "@/components/knowledge/ui/KbFormDialog";
import { AppDialogButton } from "@/components/ui/app-dialog";
import { AppFormTextarea } from "@/components/ui/app-form";
import { getStoreUploadApprovals, subscribeKnowledgeStore, updateStoreUploadApproval } from "@/lib/knowledge/store";
import type { KnowledgeExercise, UploadApproval } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

const CARD = "flex min-h-0 flex-col overflow-hidden rounded-[8px] border border-[#E6EDF3] bg-white";
const icons: Record<string, string> = { pdf: pdfIcon, xlsx: xlsxIcon, xls: xlsxIcon, doc: docIcon, docx: docIcon };
const stamp = (value?: string) => value ? value.replace("T", " ").slice(0, 16) : "-";
const ext = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";
const iconFor = (name: string) => icons[ext(name)] ?? docIcon;
const normalizeKeywords = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").join("，") : typeof value === "string" ? value : "";
const tags = (text: unknown) => normalizeKeywords(text).split(/[，,]/).map((x) => x.trim()).filter(Boolean);
const copyExercises = (items?: KnowledgeExercise[]) => (items ?? []).map((item) => ({ ...item, options: (item.options ?? []).map((option) => ({ ...option })), correctAnswers: [...(item.correctAnswers ?? [])] }));

function FileIcon({ name, className }: { name: string; className?: string }) {
  return <img src={iconFor(name)} alt="" className={cn("size-8 shrink-0 object-contain", className)} />;
}

function Header({ item, readOnly, back, reject, approve }: { item: UploadApproval; readOnly: boolean; back: () => void; reject: () => void; approve: () => void }) {
  return <header className="flex min-h-[76px] shrink-0 items-center justify-between gap-5 border-b border-[#E6EDF3] bg-white px-5 py-3 2xl:px-7">
    <div className="flex min-w-0 items-center gap-5">
      <button type="button" onClick={back} className="inline-flex shrink-0 items-center gap-2 text-[14px] font-medium text-[#44576A] hover:text-[#1496B4]"><ArrowLeft className="size-4" />返回审批台</button>
      <span className="hidden h-8 w-px bg-[#DCE7EF] sm:block" />
      <div className="flex min-w-0 items-center gap-3"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#D8EAF1] bg-[#F1FBFD]"><img src={knowledgeIcon} alt="知识库" className="size-8 object-contain" /></div>
        <div className="min-w-0"><p className="truncate text-[13px] text-[#65788B]">目标知识库 / {item.knowledgeBaseName}</p><div className="mt-0.5 flex items-center gap-2"><h1 className="truncate text-[18px] font-semibold text-[#1F2D3D]">{item.fileName}</h1><span className="shrink-0 rounded-full bg-[#FFF3E7] px-2 py-0.5 text-[12px] font-medium text-[#E87B1B]">待审批</span></div></div>
      </div>
    </div>
    <div className="hidden shrink-0 items-center gap-2 xl:flex">
      <button type="button" onClick={reject} disabled={readOnly} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#FFB5B2] px-3 text-[13px] font-medium text-[#F15454] hover:bg-[#FFF7F7] disabled:opacity-45"><X className="size-3.5" />驳回</button>
      <button type="button" onClick={approve} disabled={readOnly} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#1496B4] px-3 text-[13px] font-medium text-white hover:bg-[#0C819D] disabled:opacity-45"><Check className="size-3.5" />通过审批</button>
    </div>
  </header>;
}

function CardHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#EEF3F6] px-5 py-4"><div><div className="flex items-center gap-2.5"><span className="relative h-7 w-[3px] shrink-0" aria-hidden="true"><i className="absolute left-0 top-1.5 h-3 w-[2px] rounded-full bg-[#2AA6BD]" /><i className="absolute bottom-0 left-0 size-[3px] rounded-[1px] bg-[#CBEAF0]" /></span><h2 className="text-[15px] font-semibold leading-5 text-[#1F2D3D]">{title}</h2></div>{desc && <p className="mt-1 pl-[14px] text-[12px] leading-4 text-[#7C8A9A]">{desc}</p>}</div>{action}</div>;
}
function EditAction({ children, completed, disabled, onClick }: { children: React.ReactNode; completed?: boolean; disabled?: boolean; onClick: () => void }) {
  return <button type="button" disabled={disabled} onClick={onClick} className="inline-flex items-center gap-1 text-[13px] font-medium text-[#1496B4] hover:text-[#0C7895] disabled:opacity-45">{completed ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}{children}</button>;
}

function Queue({ items, active, visible, choose, more }: { items: UploadApproval[]; active: string; visible: number; choose: (id: string) => void; more: () => void }) {
  return <aside className={CARD}><CardHeader title="待审批文件" action={<span className="flex size-6 items-center justify-center rounded-full bg-[#EEF6F9] text-[13px] font-semibold text-[#315068]">{items.length}</span>} />
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">{items.slice(0, visible).map((entry) => <button key={entry.id} type="button" onClick={() => choose(entry.id)} className={cn("flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors", active === entry.id ? "border-[#1496B4] bg-[#F0FAFC]" : "border-transparent border-b-[#EEF3F6] hover:bg-[#F8FBFC]")}><FileIcon name={entry.fileName} className="mt-0.5" /><span className="min-w-0 flex-1"><span className={cn("block truncate text-[14px] font-medium leading-5", active === entry.id ? "text-[#107F99]" : "text-[#263B50]")}>{entry.fileName}</span><span className="mt-1 block truncate text-[12px] text-[#7C8A9A]">{entry.submitterName}<b className="px-1 font-normal text-[#B2BEC9]">|</b>{stamp(entry.submittedAt)}</span></span></button>)}
      {visible < items.length && <button type="button" onClick={more} className="mx-auto mt-3 flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-[#52677B] hover:text-[#1496B4]">加载更多<ChevronDown className="size-4" /></button>}</div>
  </aside>;
}

function Metadata({ values, editing, readOnly, change, toggle }: { values: { id: string; label: string; value: string }[]; editing: boolean; readOnly: boolean; change: (id: string, value: string) => void; toggle: () => void }) {
  return <section className={CARD}><CardHeader title="元数据" desc="核对文档归属、适用范围等基础信息" action={<EditAction completed={editing} disabled={readOnly} onClick={toggle}>{editing ? "完成" : "编辑"}</EditAction>} />
    <div className="grid min-h-0 flex-1 content-start grid-cols-1 gap-x-5 gap-y-3 overflow-y-auto p-5 sm:grid-cols-2">{values.map((value) => <div key={value.id}><p className="mb-1.5 text-[12px] text-[#7C8A9A]">{value.label}</p>{editing ? <input value={value.value} onChange={(event) => change(value.id, event.target.value)} className="h-9 w-full rounded-[6px] border border-[#DCE7EF] px-3 text-[13px] text-[#33485D] outline-none focus:border-[#1496B4]" /> : <p className="flex h-9 items-center truncate rounded-lg bg-[#F8FAFC] px-3 text-[13px] text-[#33485D]">{value.value || "未填写"}</p>}</div>)}</div>
  </section>;
}

function Keywords({ keywordText, summary, editing, expanded, readOnly, setKeywordText, setSummary, toggle, expand }: { keywordText: string; summary: string; editing: boolean; expanded: boolean; readOnly: boolean; setKeywordText: (value: string) => void; setSummary: (value: string) => void; toggle: () => void; expand: () => void }) {
  const items = tags(keywordText);
  return <section className={CARD}><CardHeader title="关键词与摘要" desc="确认主题标签与内容概述" action={<EditAction completed={editing} disabled={readOnly} onClick={toggle}>{editing ? "完成" : "编辑"}</EditAction>} />
    <div className="min-h-0 flex-1 overflow-y-auto p-5"><p className="text-[12px] text-[#7C8A9A]">关键词</p>{editing ? <input value={keywordText} onChange={(event) => setKeywordText(event.target.value)} className="mt-2 h-9 w-full rounded-[6px] border border-[#DCE7EF] px-3 text-[13px] outline-none focus:border-[#1496B4]" placeholder="多个关键词使用逗号分隔" /> : <div className="mt-2 flex flex-wrap gap-2">{items.length ? items.map((tag) => <span key={tag} className="rounded-md bg-[#EEF8FA] px-2.5 py-1 text-[12px] text-[#137E98]">{tag}</span>) : <span className="text-[13px] text-[#9AA8B6]">暂无关键词</span>}</div>}
      <div className="mt-5 border-t border-[#EEF3F6] pt-4"><div className="flex items-center justify-between"><p className="text-[12px] text-[#7C8A9A]">摘要</p>{!editing && <button type="button" onClick={expand} className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1496B4]">{expanded ? "收起" : "展开全文"}<ChevronDown className={cn("size-3.5", expanded && "rotate-180")} /></button>}</div>{editing ? <AppFormTextarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={4} className="mt-2 min-h-[96px] !rounded-[6px] resize-none text-[13px] leading-6" /> : <p className={cn("mt-2 text-[13px] leading-6 text-[#4D6175]", !expanded && "line-clamp-3")}>{summary || "暂无摘要"}</p>}</div>
    </div>
  </section>;
}

function Exercises({ items, selected, readOnly, toggleSelected, edit, remove, upload }: { items: KnowledgeExercise[]; selected: string[]; readOnly: boolean; toggleSelected: (id: string) => void; edit: (item: KnowledgeExercise) => void; remove: (id: string) => void; upload: () => void }) {
  return <section className={CARD}><CardHeader title="练习题" desc="多选题目后加入题库" action={<button type="button" disabled={readOnly || selected.length === 0} onClick={upload} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#B8DFE8] px-2.5 text-[12px] font-medium text-[#137E98] disabled:opacity-45"><Upload className="size-3.5" />加入题库</button>} />
    <div className="min-h-0 flex flex-1 flex-col overflow-hidden p-4"><div className="min-h-0 flex-1 overflow-y-auto">{items.length ? <div className="divide-y divide-[#EEF3F6]">{items.map((item) => <div key={item.id} className="flex items-center gap-3 py-3 first:pt-1"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelected(item.id)} disabled={readOnly} className="size-4 shrink-0 rounded border-[#B9C9D6] accent-[#1496B4]" /><p className="min-w-0 flex-1 truncate text-[13px] leading-5 text-[#34495D]">{item.stem}</p><span className="flex shrink-0 items-center gap-1"><button type="button" aria-label={`编辑题目：${item.stem}`} title="编辑" disabled={readOnly} onClick={() => edit(item)} className="flex size-7 items-center justify-center rounded-md text-[#1496B4] transition-colors hover:bg-[#EEF8FA] disabled:opacity-45"><Pencil className="size-3.5" /></button><button type="button" aria-label={`删除题目：${item.stem}`} title="删除" disabled={readOnly} onClick={() => remove(item.id)} className="flex size-7 items-center justify-center rounded-md text-[#F05A5A] transition-colors hover:bg-[#FFF2F2] disabled:opacity-45"><Trash2 className="size-3.5" /></button></span></div>)}</div> : <KbEmptyState title="暂无练习题" description="可新增题目或补充解析结果。" />}</div>
    </div>
  </section>;
}

function MindMap({ item, keywordText }: { item: UploadApproval; keywordText: string }) {
  const [zoom, setZoom] = useState(100); const branches = (tags(keywordText).length ? tags(keywordText) : ["适用范围", "审批流程", "执行要点", "协同处置"]).slice(0, 4);
  return <section className={CARD}><CardHeader title="脑图" desc="以核心主题梳理内容结构" /><div className="min-h-0 flex flex-1 flex-col p-4"><div className="relative min-h-[210px] flex-1 overflow-hidden rounded-lg border border-[#EEF3F6] bg-[#FAFCFD]"><div className="absolute inset-0 transition-transform" style={{ transform: `scale(${zoom / 100})` }}><div className="absolute left-1/2 top-1/2 z-10 flex h-[72px] w-[126px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl bg-[#1496B4] px-3 text-center text-[14px] font-semibold leading-5 text-white">{item.fileName.replace(/\.[^.]+$/, "")}</div>{branches.map((branch, index) => { const left = index % 2 === 0; return <div key={branch} className={cn("absolute flex w-[42%] items-center gap-2", left ? "left-[6%] justify-end" : "right-[6%]")} style={{ top: index < 2 ? "30%" : "70%" }}>{!left && <span className="h-px flex-1 bg-[#A8DCE8]" />}<span className="rounded-md border border-[#D6E9EE] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#52677B]">{branch}</span>{left && <span className="h-px flex-1 bg-[#A8DCE8]" />}</div>; })}</div></div><div className="mt-3 flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg border border-[#E6EDF3] px-2"><button type="button" onClick={() => setZoom((n) => Math.max(80, n - 10))} className="flex size-7 items-center justify-center rounded hover:bg-[#F0FAFC]"><Minus className="size-4" /></button><span className="min-w-12 text-center text-[12px] font-medium">{zoom}%</span><button type="button" onClick={() => setZoom((n) => Math.min(120, n + 10))} className="flex size-7 items-center justify-center rounded hover:bg-[#F0FAFC]"><Plus className="size-4" /></button><span className="mx-2 h-4 w-px bg-[#E6EDF3]" /><button type="button" onClick={() => setZoom(100)} className="flex size-7 items-center justify-center rounded hover:bg-[#F0FAFC]"><Maximize2 className="size-4" /></button></div></div></section>;
}

function Reader({ item, keywordText, summary }: { item: UploadApproval; keywordText: string; summary: string }) {
  const sections = ["适用范围与职责", "审批流程与执行要求", "风险提示与协同事项"];
  return <aside className={CARD}><div className="flex h-[58px] shrink-0 items-center justify-between border-b border-[#E6EDF3] px-5"><div className="flex items-center gap-2.5"><span className="relative h-7 w-[3px] shrink-0" aria-hidden="true"><i className="absolute left-0 top-1.5 h-3 w-[3px] rounded-full bg-[#2AA6BD]" /><i className="absolute bottom-0 left-0 size-[3px] rounded-[1px] bg-[#CBEAF0]" /></span><h2 className="text-[15px] font-semibold text-[#1F2D3D]">文件详情阅读</h2></div><span className="flex items-center gap-3"><button type="button" onClick={() => toast.success("已开始下载文件")} className="inline-flex items-center gap-1 text-[13px] font-medium text-[#52677B]"><Download className="size-4" />下载</button><i className="h-4 w-px bg-[#DCE7EF]" /><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1 text-[13px] font-medium text-[#52677B]"><Printer className="size-4" />打印</button></span></div>
    <article className="min-h-0 flex-1 overflow-y-auto px-6 py-5"><h3 className="text-[18px] font-semibold leading-7 text-[#1F2D3D]">{item.fileName}</h3><p className="mt-2 text-[12px] leading-5 text-[#7C8A9A]">上传人：{item.submitterName}<b className="px-2 font-normal text-[#C0CBD5]">|</b>{stamp(item.submittedAt)}{item.fileSize && <><b className="px-2 font-normal text-[#C0CBD5]">|</b>{item.fileSize}</>}</p>
      <section className="mt-6 border-t border-[#E6EDF3] pt-5"><h4 className="text-[15px] font-semibold text-[#1496B4]">1 文档概览</h4><p className="mt-3 text-[13px] leading-7 text-[#4D6175]">{summary || "本文档用于明确相关业务的操作要求、审批节点与协同边界，保障流程执行规范、信息留痕完整。"}</p></section>
      <section className="mt-6 border-t border-[#E6EDF3] pt-5"><h4 className="text-[15px] font-semibold text-[#1496B4]">2 重点关键词</h4><div className="mt-3 flex flex-wrap gap-2">{tags(keywordText).map((tag) => <span key={tag} className="rounded-md bg-[#EEF8FA] px-2.5 py-1 text-[12px] text-[#137E98]">{tag}</span>)}</div></section>
      {sections.map((title, index) => <section key={title} className="mt-6 border-t border-[#E6EDF3] pt-5"><h4 className="text-[15px] font-semibold text-[#1496B4]">{index + 3} {title}</h4><p className="mt-3 text-[13px] leading-7 text-[#4D6175]">本节说明相关工作要求及执行要点。应结合实际业务场景核对材料内容，确保审批信息、适用范围和关键流程保持一致；涉及跨部门事项时，按职责分工及时沟通、跟踪并留存记录。</p><ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13px] leading-6 text-[#4D6175] marker:text-[#1496B4]"><li>明确责任边界与执行时点，确保信息完整准确。</li><li>发现异常情形及时处置，并同步相关责任人员。</li></ul></section>)}</article>
  </aside>;
}

export function FileApprovalPage({ approvalId }: { approvalId: string }) {
  const navigate = useNavigate(); const approvals = useSyncExternalStore(subscribeKnowledgeStore, getStoreUploadApprovals, getStoreUploadApprovals); const current = approvals.find((item) => item.id === approvalId) ?? approvals[0]; const pending = useMemo(() => approvals.filter((item) => item.status === "pendingApproval" || !item.status), [approvals]); const queue = pending.length ? pending : approvals;
  const [visible, setVisible] = useState(6), [metadataEditing, setMetadataEditing] = useState(false), [keywordsEditing, setKeywordsEditing] = useState(false), [expanded, setExpanded] = useState(false), [selected, setSelected] = useState<string[]>([]), [editing, setEditing] = useState<KnowledgeExercise | null>(null), [keywordText, setKeywordText] = useState(""), [summary, setSummary] = useState(""), [metadata, setMetadata] = useState<{ id: string; label: string; value: string }[]>([]), [exercises, setExercises] = useState<KnowledgeExercise[]>([]);
  useEffect(() => { if (!current) return; setKeywordText(normalizeKeywords(current.aiKeywords)); setSummary(current.summary ?? ""); setMetadata(current.aiMetadata ?? []); setExercises(copyExercises(current.aiExercises)); setSelected([]); setMetadataEditing(false); setKeywordsEditing(false); setExpanded(false); }, [current?.id]);
  if (!current) return <KbEmptyState title="未找到待审批文件" description="请返回审批台重新选择文件。" />;
  const readOnly = current.status === "approved" || current.status === "rejected";
  const persist = () => { updateStoreUploadApproval(current.id, { aiKeywords: keywordText, summary, aiMetadata: metadata, aiExercises: exercises }); toast.success("审批内容已保存"); };
  const finish = (status: "approved" | "rejected") => { persist(); updateStoreUploadApproval(current.id, { status, reviewerName: "当前审批人", reviewedAt: new Date().toISOString() }); toast.success(status === "approved" ? "文件已通过审批" : "文件已驳回"); const next = queue.find((item) => item.id !== current.id); if (next) navigate({ to: "/knowledge/approval/$approvalId", params: { approvalId: next.id } }); else navigate({ to: "/knowledge/admin", search: { section: "approvals" } }); };
  return <main className="flex min-h-0 flex-1 flex-col bg-[#F6F9FC] text-[#1F2D3D]"><Header item={current} readOnly={readOnly} back={() => navigate({ to: "/knowledge/admin", search: { section: "approvals" } })} reject={() => finish("rejected")} approve={() => finish("approved")} />
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-3 2xl:grid-cols-[300px_minmax(0,1fr)_470px] 2xl:p-4"><Queue items={queue} active={current.id} visible={visible} choose={(id) => navigate({ to: "/knowledge/approval/$approvalId", params: { approvalId: id } })} more={() => setVisible((n) => Math.min(n + 4, queue.length))} />
      <section className="grid min-h-0 grid-cols-1 gap-3 2xl:grid-cols-2 2xl:grid-rows-2"><Metadata values={metadata} editing={metadataEditing} readOnly={readOnly} change={(id, value) => setMetadata((items) => items.map((item) => item.id === id ? { ...item, value } : item))} toggle={() => setMetadataEditing((value) => !value)} /><Keywords keywordText={keywordText} summary={summary} editing={keywordsEditing} expanded={expanded} readOnly={readOnly} setKeywordText={setKeywordText} setSummary={setSummary} toggle={() => setKeywordsEditing((value) => !value)} expand={() => setExpanded((value) => !value)} /><Exercises items={exercises} selected={selected} readOnly={readOnly} toggleSelected={(id) => setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])} edit={setEditing} remove={(id) => { setExercises((items) => items.filter((item) => item.id !== id)); setSelected((items) => items.filter((item) => item !== id)); }} upload={() => { toast.success(`已将 ${selected.length} 道题加入题库`); setSelected([]); }} /><MindMap item={current} keywordText={keywordText} /></section>
      <Reader item={current} keywordText={keywordText} summary={summary} />
    </div><ExerciseEditorDialog item={editing} open={Boolean(editing)} sourceName={current.fileName} close={() => setEditing(null)} save={(item) => { setExercises((items) => items.map((entry) => entry.id === item.id ? item : entry)); setEditing(null); }} />
  </main>;
}
