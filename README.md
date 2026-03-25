<div align="center">
  <h1>🌌 Lumina: Sovereign Career Agent</h1>
  <p><strong>A Dual-Architecture Framework for the Dev.to Notion MCP Challenge</strong></p>
  <img src="https://img.shields.io/badge/Notion-MCP-black?logo=notion" alt="Notion MCP"/>
  <img src="https://img.shields.io/badge/Powered%20By-Gemini%202.5%20Flash-blue" alt="Gemini AI"/>
  <img src="https://img.shields.io/badge/Architecture-Next.js%20%7C%20Node%20MCP-emerald" alt="Next.js & MCP"/>
</div>

---

## 🏆 The Vision: Beyond Static Dashboards
The modern enterprise requires more than generic B2B SaaS interfaces. **Lumina** is a breathtaking **"Machine Experience" (MX)** terminal that reimagines how professionals construct their career trajectories. Built explicitly for the Notion MCP Challenge, Lumina bridges the gap between Web UX and autonomous Model Context Protocol capabilities.

Rather than just building a web wrapper, Lumina features a true **Dual-Node Architecture**:
1. **The Human-in-the-Loop Web Cockpit**: A visually stunning Liquid Glassmorphism Next.js dashboard providing transparent Intent-Routing, real-time JSON-RPC terminal visualizations, and strict Human-in-the-Loop safeguards prior to Notion synchronization.
2. **The Sovereign Node (Official MCP Server)**: A native, zero-dependency Node.js implementation of the standard `@modelcontextprotocol/sdk`. Judges and developers can plug this server directly into Claude Desktop to interact with Lumina's core tools completely autonomously!

---

## ⚡ Core Features

### 🕵️‍♂️ Module 1: Forensic Intelligence Engine v2.0
Tired of "Ghost Jobs" and recruitment scams? Paste a job posting URL into the Sentinel.
*   **Deep Cross-Reference:** Unlike basic scrapers, v2.0 analyzes the **root domain reputation** and **tone consistency** between the job post and company homepage.
*   **Ghost Job Detection:** Flagging vague "evergreen" descriptions and pooling language.
*   **Secure Sync:** Writes a beautifully formatted verdict directly into your **Notion Career Ledger**.

### 🎓 Module 2: Strategic Syllabus Provisioning
Enter a target trajectory (e.g., *Junior React Engineer* -> *Principal AI Architect*).
*   **90-Day Roadmap:** Generates an actionable, 3-phase syllabus using Gemini 2.5 Flash.
*   **Workspace Auto-Provisioning:** Seamlessly builds a dedicated Notion page with interactive checklists and tracking.

---

## 🛠️ The Technical Ecosystem: Built for Trust

Lumina specifically addresses the "Enterprise Trust" guidelines of the challenge. Our frontend implements **Progressive Disclosure** (explaining the AI's reasoning) and strict **Human Override Execution** buttons. Before any autonomous agent touches your Notion databases, a human must click Approve.

> *“Transparency builds trust. Lumina doesn't hide its logic; we visualize the raw JSON-RPC tool calls on-screen natively as the Agents process data.”*

---

## 🚀 Installation & Local Execution

### 1. The Web Cockpit (Next.js)
Clone the repository, configure your environment variables, and launch the Sovereign Environment:
```bash
git clone https://github.com/your-username/syndicate-sentinel.git
cd syndicate-sentinel
npm install
npm run dev
```

**Required `.env.local` Variables:**
```env
# Google Gemini setup
GEMINI_API_KEY=your_gemini_flash_key
# The Internal Notion Integration Token
NOTION_TOKEN=ntn_your_notion_internal_integration
```

### 2. The Native Notion MCP Server (Claude Desktop Integration)
Want to run the Forensic Auditor autonomously via standard MCP `stdio` architecture? Modify your Claude Desktop configuration (`claude_desktop_config.json`) to invoke our server directly:

```json
{
  "mcpServers": {
    "lumina-sovereign": {
      "command": "npx",
      "args": [
        "tsx",
        "[ABSOLUTE_PATH]/syndicate-sentinel/src/mcp-server.ts"
      ],
      "env": {
        "NOTION_TOKEN": "YOUR_NOTION_TOKEN",
        "GEMINI_API_KEY": "YOUR_GEMINI_KEY"
      }
    }
  }
}
```

Restart Claude, and you can simply prompt: *"Can you run a forensic audit on [URL] and log it to my Lumina Job Ledger?"* Claude will natively invoke the tools provided by the Lumina MCP protocol!

---
*Built with bleeding-edge intentionality for the Dev.to + Notion MCP Challenge.*
