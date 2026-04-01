import { writeFile } from "../github.js";

export async function memoryContribute(
  author: string,
  summary: string,
  content: string
): Promise<string> {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toISOString().slice(11, 16).replace(":", "");
  const filename = `contributions/${author}/${date}-${time}.md`;

  const fullContent = `---
title: ${summary}
type: log
owner: ${author}
updated: ${date}
summary: ${summary}
---

${content}
`;

  const commitUrl = await writeFile(
    filename,
    fullContent,
    `貢獻：[${author}] ${summary}`
  );

  return `已寫入 ${filename}\ncommit: ${commitUrl}`;
}
