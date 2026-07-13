import mineUploadIcon from "@/assets/mine-upload.png";
import { KnowledgePageTitleBanner } from "./KnowledgePageTitleBanner";

export function MyUploadTitleBanner() {
  return (
    <KnowledgePageTitleBanner
      title="我的上传"
      iconSrc={mineUploadIcon}
      subtitle={
        <>
          跟踪文件提交、审核、解析
          <br />
          的全过程
        </>
      }
    />
  );
}
