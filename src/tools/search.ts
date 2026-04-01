import { listFiles, readFile } from "../github.js";
import { extractType, extractSummary } from "../validator.js";

interface SearchResult {
  path: string;
  type: string;
  summary: string;
  matches: string[];
}

export async function memorySearch(
  query: string,
  filterType?: string
): Promise<SearchResult[]> {
  const allFiles = await listFiles();
  const results: SearchResult[] = [];
  const q = query.toLowerCase();

  for (const path of allFiles) {
    try {
      const content = await readFile(path);
      const type = extractType(content);

      if (filterType && type !== filterType) continue;
      if (!content.toLowerCase().includes(q)) continue;

      // 取出匹配的行（前後各 1 行）
      const lines = content.split("\n");
      const matches: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(q)) {
          const ctx = lines.slice(Math.max(0, i - 1), i + 2).join("\n");
          matches.push(ctx);
        }
      }

      results.push({
        path,
        type,
        summary: extractSummary(content),
        matches: matches.slice(0, 3), // 最多 3 個匹配片段
      });
    } catch {
      // 跳過無法讀取的檔案
    }
  }

  return results;
}
