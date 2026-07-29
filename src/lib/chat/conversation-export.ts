import { DOCS, type Conversation } from "@/lib/mock/data";

function blockquote(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => `> ${line}`)
    .join("\n");
}

function cleanHeading(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function buildAssistantMessage(
  message: Extract<Conversation["messages"][number], { role: "assistant" }>,
) {
  const { card } = message;
  const sections = [`${card.summary.trim()}`];

  if (card.body?.trim() && card.body.trim() !== card.summary.trim()) {
    sections.push(card.body.trim());
  }

  if (card.citations.length > 0) {
    const citations = card.citations.map((citation, index) => {
      const doc = DOCS.find((item) => item.id === citation.docId);
      const title = doc?.title ?? citation.label ?? citation.docId;
      const position = citation.position || citation.section;
      const lines = [`${index + 1}. **${cleanHeading(title)}**${position ? ` · ${position}` : ""}`];
      if (citation.quote.trim()) lines.push(`   ${blockquote(citation.quote.trim())}`);
      return lines.join("\n");
    });
    sections.push(`### 参考依据\n\n${citations.join("\n\n")}`);
  }

  if (card.scope.trim()) {
    sections.push(`### 适用范围\n\n${card.scope.trim()}`);
  }

  if (card.uncertainty?.trim()) {
    sections.push(`### 注意事项\n\n${card.uncertainty.trim()}`);
  }

  return sections.join("\n\n");
}

export function conversationToMarkdown(conversation: Conversation) {
  const content = conversation.messages
    .map((message) => {
      const time = message.time ? ` · ${message.time}` : "";
      if (message.role === "user") {
        return `## 用户${time}\n\n${message.text.trim()}`;
      }
      return `## 智能助手${time}\n\n${buildAssistantMessage(message)}`;
    })
    .join("\n\n---\n\n");

  const exportedAt = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  return [
    `# ${cleanHeading(conversation.title)}`,
    `> 导出时间：${exportedAt}`,
    conversation.updatedAt ? `> 会话更新：${conversation.updatedAt}` : "",
    content || "_当前会话暂无消息。_",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function downloadConversationMarkdown(conversation: Conversation) {
  const markdown = conversationToMarkdown(conversation);
  const safeTitle =
    cleanHeading(conversation.title).replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_") || "智能问答会话";
  const blob = new Blob([`\uFEFF${markdown}`], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeTitle}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
