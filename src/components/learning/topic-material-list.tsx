import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { Doc } from "@/lib/mock/data";
import { getFileById } from "@/lib/knowledge/model";
import { KbFileTypeIcon } from "@/components/knowledge/ui";

function inferFileType(doc: Doc): { type: string; fileName?: string } {
  const knowledgeFile = doc.knowledgeFileId ? getFileById(doc.knowledgeFileId) : undefined;
  if (knowledgeFile) {
    return { type: knowledgeFile.type ?? "pdf", fileName: knowledgeFile.name };
  }

  const fromTitle = doc.title.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase();
  if (fromTitle) return { type: fromTitle, fileName: doc.title };

  switch (doc.docType) {
    case "厂站资料":
    case "典型操作":
    case "厂家SOP":
      return { type: "docx", fileName: `${doc.title}.docx` };
    default:
      return { type: "pdf", fileName: `${doc.title}.pdf` };
  }
}

export function MaterialListItem({
  doc,
  isLast,
}: {
  doc: Doc;
  isLast?: boolean;
}) {
  const fileIcon = inferFileType(doc);

  return (
    <div
      className="group flex min-h-[72px] items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-[#F6FBFC]"
      style={{
        borderBottom: isLast ? undefined : "1px solid #EDF3F5",
      }}
    >
      <KbFileTypeIcon
        type={fileIcon.type}
        fileName={fileIcon.fileName}
        size="md"
        className="shrink-0"
      />

      <div className="min-w-0 flex-1">
        <Link
          to="/learn/doc/$id"
          params={{ id: doc.id }}
          search={{ from: "topic" }}
          className="block min-w-0 truncate text-[15px] font-semibold leading-snug text-[#102A43] transition-colors group-hover:text-[#1498A8]"
        >
          {doc.title}
        </Link>
        {doc.snippet && (
          <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[#607681]">
            {doc.snippet}
          </p>
        )}
      </div>

      <Link
        to="/learn/doc/$id"
        params={{ id: doc.id }}
        search={{ from: "topic" }}
        className={cn(
          "inline-flex h-9 min-w-[84px] shrink-0 cursor-pointer items-center justify-center rounded-lg border px-3 text-[13px] font-medium transition-colors",
          "border-[#1498A8] bg-transparent text-[#1498A8] hover:bg-[#EAF7F9]",
        )}
      >
        去学习
      </Link>
    </div>
  );
}

export function MaterialList({ items }: { items: { doc: Doc }[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#DCE8EA] py-12 text-center text-[13px] text-[#607681]">
        本专题暂无资料
      </div>
    );
  }

  return (
    <div>
      {items.map(({ doc }, index) => (
        <MaterialListItem
          key={doc.id}
          doc={doc}
          isLast={index === items.length - 1}
        />
      ))}
    </div>
  );
}
