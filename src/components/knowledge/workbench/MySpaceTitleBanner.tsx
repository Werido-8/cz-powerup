import mineKnowledgeIcon from "@/assets/mine-knowledege.png";
import { KnowledgePageTitleBanner } from "./KnowledgePageTitleBanner";

export function MySpaceTitleBanner() {
  return (
    <KnowledgePageTitleBanner
      title="我的空间"
      iconSrc={mineKnowledgeIcon}
      subtitle={
        <>
          个人知识库与事务
          <br />
          上传、收藏与最近访问
        </>
      }
    />
  );
}
