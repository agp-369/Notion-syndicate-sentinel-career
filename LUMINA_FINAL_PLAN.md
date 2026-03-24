# 💎 Project Lumina: The Autonomous Career OS
**"Where AI meets Forensics to build your future, safely."**

## 🎯 The Vision
Most job trackers are passive. **Lumina** is active. It is an AI co-pilot that lives entirely within Notion via the **Model Context Protocol (MCP)**. It doesn't just track your applications; it protects you from scams, calculates your true market value, and collaborates with you through a **Human-in-the-Loop** workflow.

---

## 🏗️ The "Hero" Architecture

### 1. 🧠 The Master Profile (The Brain)
Lumina reads your skills and experience from a dedicated Notion database. This isn't a static resume; it's a dynamic knowledge base that Lumina uses to calculate your **Match %** for every role.

### 2. 🛡️ The Sentinel (Cyber-Forensic Shield)
**The "Win" Factor:** In a market flooded with AI-generated job scams, Lumina performs a real-time forensic audit.
*   **TLD Audit:** Flags suspicious domains (.xyz, .pw, .top).
*   **Pattern Recognition:** Detects scam signals like "Recruitment via Telegram/WhatsApp," "Payment via PayPal," or "Urgent Immediate Start."
*   **Safety Scoring:** Assigns a 0-100 Safety Score and labels the job (✅ Verified, ⚠️ Suspicious, ❌ High Risk).

### 3. 🤝 The Alchemist (HITL Workflow)
Lumina follows a 2-stage "Human-in-the-Loop" process:
*   **Stage 1 (Analysis):** You set a job to `Analyze`. Lumina scrapes the JD, runs forensics, and calculates your match. It then moves the status to `Awaiting Review` and **waits**.
*   **Stage 2 (Collaboration):** You review the AI's findings. If you approve, you tick the `HITL Approval` checkbox. Only then does Lumina draft your **Tailored Cover Letter** and move the status to `Approved`.

### 4. 🔮 The Oracle (Market Intelligence)
The Oracle analyzes your application history. If you are applying for Backend roles but getting rejected, while your ML applications are getting interviews, the Oracle writes a **Strategy Report** suggesting a profile pivot.

---

## 🛠️ Technical Stack
*   **MCP Server:** Node.js + TypeScript (@modelcontextprotocol/sdk).
*   **Interface:** Notion (via Official Notion API).
*   **Forensics:** Sentinel Engine (WHOIS + Heuristic Sentiment Analysis).
*   **LLM:** Claude 3.5 Sonnet (Optimized for tool-use and structured reasoning).

---

## ✅ Why Lumina Wins the Challenge
1.  **Originality:** First-ever integration of Cyber-Forensics into the job application process.
2.  **Complexity:** Multi-stage state machine (Analyze -> Awaiting Review -> Approved) managed via MCP.
3.  **Practicality:** Solves the #1 problem for developers today: finding *real* jobs and standing out without spending hours tailoring.
