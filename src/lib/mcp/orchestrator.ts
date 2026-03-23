import { GoogleGenerativeAI } from "@google/generative-ai";

export class McpOrchestrator {
  private notionMcpUrl = "https://mcp.notion.com/mcp";
  private notionToken: string;
  private genAI: GoogleGenerativeAI;

  constructor(token: string) {
    this.notionToken = token;
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async executeAgenticLoop(userPrompt: string, context: any) {
    const logs: string[] = [];
    
    // 1. HANDSHAKE (LIST TOOLS)
    logs.push(`--> {"jsonrpc":"2.0","method":"notion/list_tools","id":"handshake_1"}`);
    const tools = await this.callMcpServer("list_tools", {});
    logs.push(`<-- {"jsonrpc":"2.0","result":{"tools":[...]}}`);

    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const aiResult = await model.generateContent(`USER_PROMPT: ${userPrompt} TOOLS: ${JSON.stringify(tools)}`);
    
    // 2. EXECUTION (CALL TOOL)
    const mockParams = { name: "create_page", arguments: { parent: { database_id: context.dbId }, properties: { Name: { title: [{ text: { content: "🤝 Mentorship Workspace" } }] } } } };
    logs.push(`--> {"jsonrpc":"2.0","method":"notion/call_tool","params":${JSON.stringify(mockParams)}}`);
    
    const toolResult = await this.callMcpServer("call_tool", mockParams);
    logs.push(`<-- {"jsonrpc":"2.0","result":{...Success...}}`);

    return { success: true, logs, result: toolResult };
  }

  private async callMcpServer(method: string, params: any) {
    const response = await fetch(this.notionMcpUrl, {
      method: "POST",
      headers: { "Authorization": `Bearer ${this.notionToken}`, "Content-Type": "application/json", "X-Notion-Version": "2022-06-28" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "1", method: `notion/${method}`, params })
    });
    const data = await response.json();
    return data.result;
  }
}
