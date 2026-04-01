import { writeFile } from "../github.js";
import { validateFrontmatter } from "../validator.js";

export async function memoryWrite(
  path: string,
  content: string,
  commitMessage: string
): Promise<string> {
  // 保護核心身份文件不被覆蓋（需要明確路徑前綴）
  const PROTECTED = ["identity/soul.md", "identity/user.md"];
  if (PROTECTED.includes(path)) {
    throw new Error(`${path} 是受保護文件，請手動更新`);
  }

  // 驗證 frontmatter
  const error = validateFrontmatter(content);
  if (error) throw new Error(`frontmatter 錯誤：${error}`);

  const commitUrl = await writeFile(path, content, commitMessage);
  return `已寫入 ${path}\ncommit: ${commitUrl}`;
}
