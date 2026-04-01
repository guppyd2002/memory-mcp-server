import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { IncomingMessage, ServerResponse } from "http";
import { z } from "zod";
import { memoryList } from "./tools/list.js";
import { memoryRead } from "./tools/read.js";
import { memorySearch } from "./tools/search.js";
import { memoryWrite } from "./tools/write.js";
import { memoryContribute } from "./tools/contribute.js";
import { memoryContext } from "./tools/context.js";

function buildServer(): McpServer {
  const server = new McpServer({ name: "memory-mcp-server", version: "1.0.0" });

  server.tool("memory_list", "取得記憶庫索引（README.md）。開工第一步，快速知道有什麼記憶可以讀。", {}, async () => {
    const content = await memoryList();
    return { content: [{ type: "text", text: content }] };
  });

  server.tool(
    "memory_read",
    "讀取指定記憶文件。用 path 指定文件，例如 'projects/residual/overview.md'",
    { path: z.string().describe("文件路徑，例如 identity/team.md") },
    async ({ path }) => {
      const content = await memoryRead(path);
      return { content: [{ type: "text", text: content }] };
    }
  );

  server.tool(
    "memory_search",
    "搜尋記憶庫。返回包含關鍵字的文件與匹配片段。",
    {
      query: z.string().describe("搜尋關鍵字"),
      type: z
        .enum(["identity", "memory", "log", "design", "overview", "tool", "meta"])
        .optional()
        .describe("限定記憶類型（可選）"),
    },
    async ({ query, type }) => {
      const results = await memorySearch(query, type);
      if (results.length === 0) {
        return { content: [{ type: "text", text: `找不到包含「${query}」的記憶` }] };
      }
      const text = results
        .map((r) => `## ${r.path} (${r.type})\n${r.summary}\n\n${r.matches.map((m) => `> ${m}`).join("\n\n")}`)
        .join("\n\n---\n\n");
      return { content: [{ type: "text", text }] };
    }
  );

  server.tool(
    "memory_write",
    "寫入或更新記憶文件。content 必須包含有效的 frontmatter（title/type/updated/summary）。",
    {
      path: z.string().describe("目標路徑，例如 logs/cadres/franky.md"),
      content: z.string().describe("完整文件內容（含 frontmatter）"),
      commit_message: z.string().describe("commit 訊息，例如 '更新：佛朗基日誌 2026-04-01'"),
    },
    async ({ path, content, commit_message }) => {
      const result = await memoryWrite(path, content, commit_message);
      return { content: [{ type: "text", text: result }] };
    }
  );

  server.tool(
    "memory_contribute",
    "向貢獻區寫入記憶片段。不直接修改正式記憶，適合快速記錄或不確定要放哪裡時使用。",
    {
      author: z.string().describe("貢獻者名稱，例如 'claude-code'、'cursor'、'apha'"),
      summary: z.string().describe("一句話摘要"),
      content: z.string().describe("記憶內容（markdown）"),
    },
    async ({ author, summary, content }) => {
      const result = await memoryContribute(author, summary, content);
      return { content: [{ type: "text", text: result }] };
    }
  );

  server.tool(
    "memory_context",
    "一次取得指定層次的記憶包。L0=只有索引，L1=日常開工，L2=深入情境，L3=完整脈絡。",
    {
      level: z.enum(["L0", "L1", "L2", "L3"]).describe("讀取層次"),
      project: z.string().optional().describe("專案名稱，例如 'residual'（可選）"),
    },
    async ({ level, project }) => {
      const content = await memoryContext(level, project);
      return { content: [{ type: "text", text: content }] };
    }
  );

  return server;
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf-8");
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(undefined);
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // Auth
  const apiKey = process.env.MCP_API_KEY;
  if (apiKey) {
    const auth = req.headers["authorization"];
    if (auth !== `Bearer ${apiKey}`) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }
  }

  const body = await readBody(req);
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — 適合 Vercel serverless
  });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, body);
}
