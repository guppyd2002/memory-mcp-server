import { readFile } from "../github.js";

type Level = "L0" | "L1" | "L2" | "L3";

// 每個層次要讀的文件
const LAYERS: Record<Level, string[]> = {
  L0: ["README.md"],
  L1: ["README.md", "identity/team.md"],
  L2: [
    "README.md",
    "identity/soul.md",
    "identity/user.md",
    "identity/team.md",
    "memory/global.md",
  ],
  L3: [
    "README.md",
    "identity/soul.md",
    "identity/user.md",
    "identity/team.md",
    "memory/global.md",
    "principles.md",
  ],
};

const PROJECT_LAYERS: Record<Level, string[]> = {
  L0: [],
  L1: ["projects/{project}/overview.md"],
  L2: ["projects/{project}/overview.md", "projects/{project}/logs/cadres/franky.md"],
  L3: [
    "projects/{project}/overview.md",
    "projects/{project}/design/concept.md",
    "projects/{project}/logs/cadres/franky.md",
    "projects/{project}/logs/cadres/apha.md",
  ],
};

export async function memoryContext(
  level: Level,
  project?: string
): Promise<string> {
  const paths = [...LAYERS[level]];

  // 加入最新日誌（L1 以上）
  if (level !== "L0") {
    try {
      // 取得最新日誌（檔名最大 = 最新）
      const { listFiles } = await import("../github.js");
      const all = await listFiles("logs/daily");
      const latest = all.sort().at(-1);
      if (latest) paths.push(latest);
    } catch { /* 忽略 */ }
  }

  // 加入專案相關文件
  if (project && PROJECT_LAYERS[level].length > 0) {
    for (const p of PROJECT_LAYERS[level]) {
      paths.push(p.replace("{project}", project));
    }
  }

  const sections: string[] = [];
  for (const path of paths) {
    try {
      const content = await readFile(path);
      sections.push(`\n\n<!-- ${path} -->\n${content}`);
    } catch {
      sections.push(`\n\n<!-- ${path} (not found) -->`);
    }
  }

  return `# Memory Context (${level}${project ? ` / ${project}` : ""})\n${sections.join("")}`;
}
