import archiveFileIcon from "@/assets/archive-file-icon.svg";
import audioFileIcon from "@/assets/audio-file-icon.svg";
import codeFileIcon from "@/assets/code-file-icon.svg";
import docxFileIcon from "@/assets/docx-file-icon.svg";
import imageFileIcon from "@/assets/image-file-icon.svg";
import pdfFileIcon from "@/assets/pdf.svg";
import pptFileIcon from "@/assets/ppt-file-icon.svg";
import textFileIcon from "@/assets/text-file-icon.svg";
import videoFileIcon from "@/assets/video-file-icon.svg";
import xlsxFileIcon from "@/assets/xlsx.svg";
import { cn } from "@/lib/utils";

type FileIconKind =
  | "pdf"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "image"
  | "video"
  | "audio"
  | "text"
  | "code"
  | "archive"
  | "other";

type FileIconConfig = {
  label: string;
  src: string;
};

/**
 * All file entrances share this SVG asset family: white page, folded corner,
 * and a strong type-colour footer. Keeping the mapping here prevents one list
 * from falling back to the older outline icons.
 */
const fileIconConfig: Record<FileIconKind, FileIconConfig> = {
  pdf: { label: "PDF", src: pdfFileIcon },
  document: { label: "DOCX", src: docxFileIcon },
  spreadsheet: { label: "XLSX", src: xlsxFileIcon },
  presentation: { label: "PPTX", src: pptFileIcon },
  image: { label: "IMG", src: imageFileIcon },
  video: { label: "VIDEO", src: videoFileIcon },
  audio: { label: "AUDIO", src: audioFileIcon },
  text: { label: "TXT", src: textFileIcon },
  code: { label: "CODE", src: codeFileIcon },
  archive: { label: "ZIP", src: archiveFileIcon },
  other: { label: "FILE", src: textFileIcon },
};

const extensionKinds: Record<string, FileIconKind> = {
  pdf: "pdf",
  doc: "document",
  docx: "document",
  odt: "document",
  rtf: "document",
  xls: "spreadsheet",
  xlsx: "spreadsheet",
  csv: "spreadsheet",
  ods: "spreadsheet",
  ppt: "presentation",
  pptx: "presentation",
  odp: "presentation",
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  bmp: "image",
  heic: "image",
  avif: "image",
  tif: "image",
  tiff: "image",
  ico: "image",
  mp4: "video",
  mov: "video",
  avi: "video",
  mkv: "video",
  webm: "video",
  mpeg: "video",
  mpg: "video",
  m4v: "video",
  wmv: "video",
  flv: "video",
  mp3: "audio",
  wav: "audio",
  m4a: "audio",
  aac: "audio",
  flac: "audio",
  ogg: "audio",
  opus: "audio",
  wma: "audio",
  txt: "text",
  md: "text",
  log: "text",
  rst: "text",
  json: "code",
  xml: "code",
  yml: "code",
  yaml: "code",
  sql: "code",
  html: "code",
  css: "code",
  js: "code",
  ts: "code",
  tsx: "code",
  jsx: "code",
  py: "code",
  java: "code",
  go: "code",
  rs: "code",
  c: "code",
  h: "code",
  cpp: "code",
  cs: "code",
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
  bz2: "archive",
  iso: "archive",
};

function resolveFileIconKind(type?: string, fileName?: string): FileIconKind {
  const extension = fileName?.trim().toLowerCase().split(".").pop();
  if (extension && extensionKinds[extension]) return extensionKinds[extension];

  if (type === "pdf") return "pdf";
  if (type === "docx" || type === "word") return "document";
  if (type === "xlsx" || type === "excel") return "spreadsheet";
  if (type === "pptx" || type === "ppt") return "presentation";
  if (type === "image") return "image";
  if (type === "video") return "video";
  if (type === "audio") return "audio";
  return "other";
}

export function getKbFileTypeLabel(type?: string, fileName?: string) {
  return fileIconConfig[resolveFileIconKind(type, fileName)].label;
}

export function KbFileTypeIcon({
  type,
  fileName,
  size = "sm",
  showLabel = false,
  className,
}: {
  type?: string;
  fileName?: string;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}) {
  const config = fileIconConfig[resolveFileIconKind(type, fileName)];
  const sizeClass = {
    xs: "h-4 w-4",
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  }[size];

  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-1.5", className)}
      title={config.label}
      aria-label={config.label}
    >
      <span className={cn("block shrink-0 overflow-hidden", sizeClass)}>
        <img
          src={config.src}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-contain"
        />
      </span>
      {showLabel && <span className="text-[11px] font-semibold tracking-[0.02em]">{config.label}</span>}
    </span>
  );
}
