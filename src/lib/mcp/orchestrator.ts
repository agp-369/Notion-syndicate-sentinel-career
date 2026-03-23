import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * SOVEREIGN MCP ORCHESTRATOR
 * Implements the Host -> Client -> Server Handshake.
 */
export class McpOrchestrator {
  private notionMcpUrl = "https://mcp.notion.com/mcp";
  private notionToken: string;
  private genAI: GoogleGenerativeAI;

  constructor(token: string) {
    this.notionToken = token;
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  /**
   * 🤝 THE HANDSHAKE
   * Connects to Notion MCP, lists tools, and coordinates with Gemini.
   */
  async executeAgenticLoop(userPrompt: string, context: any) {
    // 1. LIST TOOLS (Client -> Server)
    // We query Notion's MCP to see what tools are available for the AI.
    const tools = await this.callMcpServer("list_tools", {});

    // 2. REASONING (Client -> Host)
    // We give Gemini the prompt and the list of available Notion tools.
    const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const aiResult = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `
        ROLE: Career Forensic Architect.
        USER_PROMPT: ${userPrompt}
        AVAILABLE_TOOLS: ${JSON.stringify(tools)}
        CONTEXT: ${JSON.stringify(context)}

        TASK: 
        1. Decide which Notion tool to call first.
        2. Format the response as a JSON-RPC 2.0 tool call.
      ` }] }]
    });

    const toolCall = JSON.parse(aiResult.response.text().replace(/```json/g, '').replace(/```/g, '').trim());

    // 3. EXECUTION (Client -> Server)
    // We forward the AI's decided tool call to the official Notion MCP.
    const toolResult = await this.callMcpServer("call_tool", toolCall.params);

    // 4. SYNTHESIS (Server -> Client -> Host)
    // We give the raw Notion data back to the AI to explain to the user.
    const finalSynthesis = await model.generateContent(`
      NOTION_DATA: ${JSON.stringify(toolResult)}
      TASK: Summarize what was just performed in Notion for the user dashboard.
    `);

    return {
      success: true,
      action: toolCall.params.name,
      result: toolResult,
      summary: finalSynthesis.response.text()
    };
  }

  /**
   * 📡 JSON-RPC 2.0 TRANSPORT
   * Communicates with the official Notion MCP Server via HTTP.
   */
  private async callMcpServer(method: string, params: any) {
    const response = await fetch(this.notionMcpUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.notionToken}`,
        "Content-Type": "application/json",
        "X-Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Math.random().toString(36).substring(7),
        method: `notion/${method}`,
        params
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(`MCP_SERVER_ERROR: ${data.error.message}`);
    return data.result;
  }
}
