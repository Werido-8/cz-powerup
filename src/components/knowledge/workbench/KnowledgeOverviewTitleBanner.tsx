import knowledgeViewIcon from "@/assets/knowledge-view.png";
import { KnowledgePageTitleBanner } from "./KnowledgePageTitleBanner";

export function KnowledgeOverviewTitleBanner() {
  return (
    <KnowledgePageTitleBanner
      title="知识总览"
      iconSrc={knowledgeViewIcon}
      subtitle={
        <>
          全局视角，快速访问
          <br />
          核心知识资产
        </>
      }
    />
  );
}
