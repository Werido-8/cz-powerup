import {
  BookOpenCheck,
  BrainCircuit,
  FileText,
  GitFork,
  GraduationCap,
  Image,
  Lightbulb,
  Presentation,
  Send,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  KNOWLEDGE_AI_SUGGESTIONS,
  type KnowledgeBase,
  type KnowledgeFile,
} from "@/lib/mock/knowledge-space";

export function KnowledgeAIPanel({
  base,
  file,
  enabled = true,
}: {
  base: KnowledgeBase;
  file: KnowledgeFile;
  enabled?: boolean;
}) {
  const questions = KNOWLEDGE_AI_SUGGESTIONS[base.id] ?? [
    "这份文件的关键执行要求是什么？",
    "有哪些需要运行人员重点关注的风险？",
    "相关历史版本有什么变化？",
  ];

  return (
    <aside className="flex w-[348px] shrink-0 flex-col border-l border-[#E2ECEF] bg-white">
      <div className="flex h-[52px] items-center justify-between border-b border-[#EDF3F5] px-4">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-[#1F3440]">
          <Sparkles className="h-4 w-4 text-[#349BAC] stroke-[1.8]" />
          问 AI
        </div>
        <span className="rounded-full border border-[#CFE9ED] bg-[#EAF7F9] px-2 py-1 text-[11px] font-medium text-[#268C9A]">
          文档助手
        </span>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-4">
        <div className="rounded-[14px] border border-[#DCE8EA] bg-[#F7FBFC] p-4 shadow-[0_12px_28px_-26px_rgba(31,52,64,0.55)]">
          <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#1F3440]">
            <BookOpenCheck className="h-4 w-4 text-[#349BAC] stroke-[1.8]" />
            知识概览
          </div>
          <p className="text-[12px] leading-relaxed text-[#607681]">
            这份资料来自 {base.name}，当前版本为 {file.currentVersion}。内容可用于制度查询、学习复盘和运行风险要点提取。
          </p>
          {!enabled && (
            <div className="mt-3 rounded-[10px] border border-[#E2ECEF] bg-white px-3 py-2 text-[12px] text-[#607681]">
              当前文件仍在解析或审批中，AI 问答暂未开放。
            </div>
          )}
        </div>

        <PanelBlock title="文档概要" icon={<FileText className="h-3.5 w-3.5" />}>
          <p className="text-[12.5px] leading-relaxed text-[#1F3440]">{file.summary}</p>
        </PanelBlock>

        <div className="mt-4">
          <div className="mb-2 text-[12px] font-semibold text-[#607681]">快捷能力</div>
          <div className="grid grid-cols-2 gap-2">
            <QuickAction icon={<BrainCircuit className="h-4 w-4 stroke-[1.8]" />} label="知识总结" />
            <QuickAction icon={<Presentation className="h-4 w-4 stroke-[1.8]" />} label="PPT 制作" />
            <QuickAction icon={<GitFork className="h-4 w-4 stroke-[1.8]" />} label="思维导图" />
            <QuickAction icon={<Image className="h-4 w-4 stroke-[1.8]" />} label="知识图解" />
            <QuickAction icon={<GraduationCap className="h-4 w-4 stroke-[1.8]" />} label="学习模式" />
          </div>
        </div>

        <PanelBlock title="相关知识" icon={<Lightbulb className="h-3.5 w-3.5" />}>
          <div className="flex flex-wrap gap-1.5">
            {file.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-[#CFE9ED] bg-[#EAF7F9] px-2 py-1 text-[11px] text-[#268C9A]">
                {tag}
              </span>
            ))}
          </div>
        </PanelBlock>

        <div className="mt-4">
          <div className="mb-2 text-[12px] font-semibold text-[#607681]">推荐问题</div>
          <div className="space-y-2">
            {questions.map((question) => (
              <button
                key={question}
                type="button"
                disabled={!enabled}
                className="w-full rounded-[12px] border border-transparent bg-[#F7FAFB] px-3 py-2 text-left text-[12px] leading-relaxed text-[#1F3440] transition-colors hover:border-[#CFE9ED] hover:bg-[#EAF7F9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[#EDF3F5] p-3">
        <div className="rounded-[14px] border border-[#E2ECEF] bg-white p-2 shadow-[0_12px_28px_-24px_rgba(31,52,64,0.5)]">
          <textarea
            disabled={!enabled}
            placeholder={enabled ? "告诉我想做什么，我来查询知识、生成PPT、整理知识库……" : "AI 问答暂未开放"}
            className="min-h-[56px] w-full resize-none bg-transparent px-1 text-[12.5px] leading-relaxed text-[#1F3440] outline-none placeholder:text-[#91A3AA] disabled:cursor-not-allowed"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-1 text-[#91A3AA]">
              <Sparkles className="h-4 w-4 stroke-[1.8]" />
              <FileText className="h-4 w-4 stroke-[1.8]" />
            </div>
            <button
              type="button"
              disabled={!enabled}
              className="grid h-8 w-8 place-items-center rounded-full bg-[#349BAC] text-white shadow-[0_8px_18px_-12px_rgba(52,155,172,0.8)] hover:bg-[#2F8D9D] disabled:bg-[#DCE8EA]"
              aria-label="发送"
            >
              <Send className="h-3.5 w-3.5 stroke-[1.9]" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function PanelBlock({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mt-4 rounded-[14px] border border-[#E2ECEF] bg-white p-4 shadow-[0_10px_24px_-26px_rgba(31,52,64,0.45)]">
      <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-[#607681]">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function QuickAction({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button className="flex h-14 items-center gap-2 rounded-[12px] border border-[#EDF3F5] bg-white px-3 text-left text-[#349BAC] transition-colors hover:border-[#CFE9ED] hover:bg-[#F7FAFB]">
      {icon}
      <span className="text-[12px] font-semibold text-[#1F3440]">{label}</span>
    </button>
  );
}
