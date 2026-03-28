/**
 * NotionMCPGateway - Connects to official Notion MCP server v2.0+
 * Uses StreamableHTTP transport to https://mcp.notion.com/mcp
 * 
 * Tool names (v2.0):
 * - notion-search          → Search workspace
 * - notion-fetch           → Get page content
 * - notion-create-pages    → Create pages
 * - notion-update-page     → Update pages
 * - notion-create-database → Create databases
 * - notion-query-data-sources → Query databases
 * - notion-update-data-source → Update data sources
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export interface MCPTransaction {
  id: string;
  timestamp: string;
  method: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: string;
  duration?: number;
  thinking?: string[];
}

export class NotionMCPGateway {
  private client: Client;
  private token: string;
  private transactions: MCPTransaction[] = [];
  private connected = false;

  constructor(token: string) {
    this.token = token;
    this.client = new Client(
      { name: "forensic-career-os", version: "2.0.0" },
      { capabilities: {} }
    );
  }

  private async ensureConnected(): Promise<void> {
    if (this.connected) return;
    
    console.log(`[MCP GATEWAY] Connecting to mcp.notion.com with token prefix: ${this.token.substring(0, 15)}...`);
    
    const transport = new StreamableHTTPClientTransport(
      new URL("https://mcp.notion.com/mcp"),
      {
        requestInit: {
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Notion-Version": "2025-09-03",
          },
        },
      }
    );
    
    try {
      await this.client.connect(transport);
      this.connected = true;
      console.log(`[MCP GATEWAY] Connected successfully!`);
    } catch (e: any) {
      console.error(`[MCP GATEWAY] Connection failed:`, e.message);
      throw e;
    }
  }

  async listTools(onLog?: (tx: MCPTransaction) => void) {
    await this.ensureConnected();

    const tx: MCPTransaction = {
      id: `tx_handshake_${Date.now()}`,
      timestamp: new Date().toISOString(),
      method: "tools/list",
      thinking: [
        "⟶ MCP HANDSHAKE → mcp.notion.com",
        "  Transport: StreamableHTTP",
        "  API Version: 2025-09-03",
        "  Negotiating Notion MCP v2.0 tools...",
      ],
    };
    if (onLog) onLog(tx);

    const start = Date.now();
    try {
      const result = await this.client.listTools();
      tx.duration = Date.now() - start;
      tx.result = { toolCount: result.tools.length, tools: result.tools.map((t: any) => t.name) };
      tx.thinking!.push(`⟵ ${result.tools.length} tools available (${tx.duration}ms) ✅`);
      this.transactions.push({ ...tx });
      if (onLog) onLog({ ...tx });
      return result;
    } catch (e: any) {
      tx.duration = Date.now() - start;
      tx.error = e.message;
      tx.thinking!.push(`⟵ Handshake failed: ${e.message} ❌`);
      this.transactions.push({ ...tx });
      if (onLog) onLog({ ...tx });
      throw e;
    }
  }

  async callTool(
    toolName: string,
    args: Record<string, unknown>,
    onLog?: (tx: MCPTransaction) => void,
    extraThinking?: string[]
  ): Promise<any> {
    await this.ensureConnected();

    const tx: MCPTransaction = {
      id: `tx_${toolName.replace(/[^a-z]/gi, "")}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      method: toolName,
      params: args,
      thinking: [
        `⟶ MCP: tools/call`,
        `  tool: "${toolName}"`,
        ...(extraThinking ?? []),
        `  → mcp.notion.com`,
      ],
    };
    if (onLog) onLog({ ...tx });

    const start = Date.now();
    try {
      console.log(`[MCP GATEWAY] Calling tool: ${toolName}`);
      console.log(`[MCP GATEWAY] Args:`, JSON.stringify(args).substring(0, 200));
      
      const raw = await this.client.callTool({ name: toolName, arguments: args });
      tx.duration = Date.now() - start;

      console.log(`[MCP GATEWAY] Response received:`, JSON.stringify(raw).substring(0, 200));

      let parsed: any = {};
      const content = (raw as any).content;
      if (Array.isArray(content) && content[0]?.type === "text") {
        const text = content[0].text;
        try {
          parsed = (text.startsWith("{") || text.startsWith("[")) ? JSON.parse(text) : { text };
        } catch {
          parsed = { text };
        }
      } else {
        parsed = raw;
      }

      tx.result = parsed;
      const idStr = parsed?.id ? String(parsed.id).substring(0, 8) : "ok";
      tx.thinking!.push(`⟵ ${toolName} → ${idStr} (${tx.duration}ms) ✅`);
      this.transactions.push({ ...tx });
      if (onLog) onLog({ ...tx });
      return parsed;
    } catch (e: any) {
      tx.duration = Date.now() - start;
      tx.error = e.message;
      console.error(`[MCP GATEWAY] Error calling ${toolName}:`, e.message);
      tx.thinking!.push(`⟵ ${toolName} failed: ${e.message} ❌`);
      this.transactions.push({ ...tx });
      if (onLog) onLog({ ...tx });
      throw e;
    }
  }

  async close(): Promise<void> {
    if (this.connected) {
      try {
        await this.client.close();
      } catch {}
      this.connected = false;
    }
  }

  getTransactions(): MCPTransaction[] {
    return [...this.transactions];
  }
}
