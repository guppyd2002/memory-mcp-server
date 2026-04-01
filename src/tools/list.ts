import { readFile } from "../github.js";

export async function memoryList(): Promise<string> {
  return await readFile("README.md");
}
