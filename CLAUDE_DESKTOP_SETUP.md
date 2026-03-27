# Forensic Career OS - Claude Desktop Integration Guide

## Step-by-Step: How to Test Notion MCP with Claude Desktop

### Part 1: Configure Claude Desktop

#### Step 1.1: Find Claude Desktop Config File

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```bash
~/.config/Claude/claude_desktop_config.json
```

#### Step 1.2: Create/Edit the Config

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-sdk-py"]
    }
  }
}
```

**Alternative: Use the Notion API directly via curl command:**

```json
{
  "mcpServers": {
    "notion-api": {
      "command": "curl",
      "args": ["-X", "POST", "https://api.notion.com/v1/search", 
               "-H", "Authorization: Bearer YOUR_NOTION_TOKEN",
               "-H", "Notion-Version: 2022-06-28",
               "-H", "Content-Type: application/json",
               "-d", "{\"filter\": {\"property\": \"object\", \"value\": \"page\"}}"]
    }
  }
}
```

#### Step 1.3: Restart Claude Desktop

After editing the config, **quit and reopen Claude Desktop**.

---

### Part 2: Test Notion MCP

#### Test 1: Search Your Notion Workspace

Ask Claude:
```
Search my Notion workspace for any pages containing "resume" or "profile"
```

Claude should use the Notion MCP to:
1. Call `notion_search` tool
2. Return list of pages found
3. Show the MCP tool being used

#### Test 2: Create a Test Page

Ask Claude:
```
Create a new page called "Claude MCP Test" in my Notion workspace
```

Claude should use:
1. `notion_create_page` tool
2. Show the page creation result

#### Test 3: Read Page Content

Ask Claude:
```
Read the content of the "Claude MCP Test" page you just created
```

Claude should use:
1. `notion_get_block_children` tool
2. Display the page content

---

### Part 3: Verify MCP in Forensic Career OS Dashboard

1. Go to **https://syndicate-sentinel.vercel.app**
2. Connect Notion via OAuth
3. Click **MCP Monitor** tab
4. Click **Test MCP** button
5. Watch the transaction log show real MCP operations

---

### Part 4: What MCP Operations Look Like

When using Notion MCP, you'll see these operations:

```
⟶ MCP: tools/call
  name: "notion_search"
  query: {"filter": {"object": "page"}}
  Sending to mcp.notion.com...

⟵ notion_search → id: abc123... (234ms) ✅
```

---

### Part 5: Troubleshooting

#### Issue: "MCP Server not found"

**Solution:** Make sure Claude Desktop is updated to the latest version that supports MCP.

#### Issue: "Notion token invalid"

**Solution:** 
1. Go to https://www.notion.so/my-integrations
2. Create a new integration or copy the existing token
3. Update the config with your token

#### Issue: "Permission denied"

**Solution:** 
1. Open Notion
2. Share the pages with your integration
3. Go to page settings → Connections → Add connection

---

### Part 6: Quick Test Commands for Claude

Copy and paste these commands into Claude Desktop:

```
1. "List all available MCP tools"
2. "Search Notion for pages with 'career'"
3. "Create a test page in Notion"
4. "Show me your Notion workspace structure"
5. "What Notion databases do I have access to?"
```

---

## How Forensic Career OS Uses Notion MCP

Our app connects to the **official Notion MCP server** at:
```
https://mcp.notion.com/mcp
```

### What Our App Does with MCP:

1. **Workspace Setup**
   - Creates databases for job tracking
   - Creates pages for skills and roadmaps
   - Sets up the Career OS infrastructure

2. **Real-time Monitoring**
   - Every Notion operation is logged as a transaction
   - Shows MCP method, parameters, and duration
   - Displays success/error status

3. **Forensic Analysis**
   - Uses MCP to write forensic reports to Notion
   - Creates trust score databases
   - Logs all job verifications

---

## Architecture: How We Use Notion MCP

```
┌─────────────────────────────────────────────────────────────┐
│                     Forensic Career OS                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐     ┌──────────────┐     ┌────────────┐  │
│   │   Clerk     │     │  Job Engine  │     │  Forensic  │  │
│   │   Auth      │     │  (AI Jobs)   │     │  Analyzer  │  │
│   └──────┬──────┘     └──────┬───────┘     └─────┬──────┘  │
│          │                   │                     │         │
│          └─────────────┬─────┴─────────────────────┘         │
│                        ▼                                    │
│              ┌─────────────────────┐                          │
│              │  NotionMCPClient   │                          │
│              │  (Gateway Layer)    │                          │
│              └──────────┬──────────┘                          │
│                         │                                    │
│                         ▼                                    │
│              ┌─────────────────────┐                          │
│              │  MCP Protocol SDK   │                          │
│              │  StreamableHTTP    │                          │
│              └──────────┬──────────┘                          │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │   Notion MCP Server    │
              │   https://mcp.notion.com/mcp   │
              └────────────┬────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │    Notion API          │
              │  (Your Workspace)      │
              └─────────────────────────┘
```

---

## Environment Variables Required

For the app to work, ensure these are set in Vercel:

```
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
GEMINI_API_KEY=your_gemini_api_key (optional, for forensics)
NEXT_PUBLIC_APP_URL=https://syndicate-sentinel.vercel.app
```

---

## Getting Your Notion OAuth Credentials

1. Go to https://www.notion.so/my-integrations
2. Click **+ New integration**
3. Name it "Forensic Career OS"
4. Select **OAuth** as the authentication type
5. Set redirect URI to: `https://syndicate-sentinel.vercel.app/api/notion/callback`
6. Enable these capabilities:
   - Read content
   - Update content
   - Insert content
7. Copy the **OAuth Client ID** and **Client Secret**

---

## Final Verification Checklist

After setup, verify these work:

- [ ] Claude Desktop shows Notion MCP in available tools
- [ ] Can search Notion workspace from Claude Desktop
- [ ] App dashboard shows "MCP Monitor" tab
- [ ] "Test MCP" button shows connection success
- [ ] Transaction log shows MCP operations

---

## Support

If issues persist:
1. Check Vercel logs: `vercel logs`
2. Verify Notion integration is shared with your workspace
3. Ensure OAuth credentials are correct
4. Check browser console for errors
