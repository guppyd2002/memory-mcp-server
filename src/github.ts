import { Octokit } from "@octokit/rest";

const OWNER = "guppyd2002";
const REPO = "claude-memory";

export function createClient() {
  // 優先讀 GITHUB_MEMORY_TOKEN（系統環境變數），fallback 到 GITHUB_TOKEN
  const token = process.env.GITHUB_MEMORY_TOKEN ?? process.env.GITHUB_TOKEN;
  if (!token) throw new Error("請設定系統環境變數 GITHUB_MEMORY_TOKEN");
  return new Octokit({ auth: token });
}

export async function readFile(path: string): Promise<string> {
  const octokit = createClient();
  const res = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path });
  const data = res.data as { content: string };
  return Buffer.from(data.content, "base64").toString("utf-8");
}

export async function writeFile(
  path: string,
  content: string,
  message: string
): Promise<string> {
  const octokit = createClient();

  // 取得現有檔案的 SHA（更新時需要）
  let sha: string | undefined;
  try {
    const existing = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path });
    sha = (existing.data as { sha: string }).sha;
  } catch {
    // 新檔案，不需要 SHA
  }

  const res = await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path,
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
    sha,
  });

  return res.data.commit.html_url ?? "";
}

export async function listFiles(dir: string = ""): Promise<string[]> {
  const octokit = createClient();
  const res = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: dir });
  const items = res.data as Array<{ type: string; path: string; name: string }>;
  const paths: string[] = [];

  for (const item of items) {
    if (item.type === "file" && item.name.endsWith(".md")) {
      paths.push(item.path);
    } else if (item.type === "dir") {
      const sub = await listFiles(item.path);
      paths.push(...sub);
    }
  }
  return paths;
}
