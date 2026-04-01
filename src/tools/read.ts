import { readFile } from "../github.js";

export async function memoryRead(path: string): Promise<string> {
  if (!path.endsWith(".md")) throw new Error("只能讀取 .md 檔案");
  return await readFile(path);
}
