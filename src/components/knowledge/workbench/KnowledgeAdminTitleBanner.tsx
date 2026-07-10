import type { ReactNode } from "react";
import knowledgeMgmtIcon from "@/assets/knowledge-mtmt.png";
import { KnowledgePageTitleBanner } from "./KnowledgePageTitleBanner";

export function KnowledgeAdminTitleBanner({ subtitle }: { subtitle: ReactNode }) {
  return (
    <KnowledgePageTitleBanner
      title="知识库管理"
      iconSrc={knowledgeMgmtIcon}
      subtitle={subtitle}
    />
  );
}
