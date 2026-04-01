const REQUIRED_FIELDS = ["title", "type", "updated", "summary"];
const VALID_TYPES = ["identity", "memory", "log", "design", "overview", "tool", "meta"];

export function validateFrontmatter(content: string): string | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return "缺少 frontmatter（需要 --- 開頭）";

  const fm = match[1];
  for (const field of REQUIRED_FIELDS) {
    if (!fm.includes(`${field}:`)) return `frontmatter 缺少必填欄位：${field}`;
  }

  const typeMatch = fm.match(/type:\s*(.+)/);
  if (typeMatch && !VALID_TYPES.includes(typeMatch[1].trim())) {
    return `type 必須是：${VALID_TYPES.join(" | ")}`;
  }

  return null; // 驗證通過
}

export function extractSummary(content: string): string {
  const match = content.match(/summary:\s*(.+)/);
  return match ? match[1].trim() : "";
}

export function extractType(content: string): string {
  const match = content.match(/type:\s*(.+)/);
  return match ? match[1].trim() : "";
}
