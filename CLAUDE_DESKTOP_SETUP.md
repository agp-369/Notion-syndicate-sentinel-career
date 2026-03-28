# Forensic Career OS - Notion MCP v2.0 Integration Guide

## ⚠️ Important: New Notion MCP v2.0

The Notion MCP Server v2.0.0+ has **breaking changes** with new tool names!

### New Tool Names (v2.0):

| Old (v1.x) | New (v2.0) | Description |
|------------|-------------|-------------|
| `notion_search` | `notion-search` | Search workspace |
| `post-database-query` | `notion-query-data-sources` | Query databases |
| `create-a-database` | `notion-create-database` | Create databases |
| `update-a-database` | `notion-update-data-source` | Update data sources |
| - | `notion-fetch` | Get page content |
| - | `notion-create-pages` | Create pages |
| - | `notion-update-page` | Update pages |

### API Version: 2025-09-03

---

## How Forensic Career OS Uses Notion MCP v2.0

### Architecture

```
┌─────────────────────────────────────────┐
│     Forensic Career OS (Next.js App)     │
├─────────────────────────────────────────┤
│                                          │
│   ┌─────────────────────────────────┐    │
│   │   NotionMCPClient (v2.0)       │    │
│   │   - notion-search               │    │
│   │   - notion-fetch                │    │
│   │   - notion-create-pages         │    │
│   │   - notion-create-database     │    │
│   └───────────────┬─────────────────┘    │
│                   │                      │
│                   ▼                      │
│   ┌─────────────────────────────────┐    │
│   │   StreamableHTTP Transport       │    │
│   │   → https://mcp.notion.com/mcp  │    │
│   └───────────────┬─────────────────┘    │
│                   │                      │
└───────────────────┼──────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   Notion MCP v2.0     │
        │   Remote Server        │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   Notion API v2       │
        │   2025-09-03         │
        └───────────────────────┘
```

---

## Claude Desktop Configuration (v2.0)

### Step 1: Get Your Notion Token

1. Go to https://www.notion.so/profile/integrations
2. Create new integration or select existing
3. Copy the **Internal Integration Secret** (starts with `ntn_`)

### Step 2: Configure Claude Desktop

Edit your config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "NOTION_TOKEN": "ntn_your_integration_token_here"
      }
    }
  }
}
```

### Step 3: Restart Claude Desktop

After adding the config, **quit and reopen Claude Desktop**.

### Step 4: Verify Connection

Look for the 🔌 MCP indicator at the bottom of Claude Desktop.

---

## Complete MCP Tool Reference (v2.0)

| Tool | Description |
|------|-------------|
| `notion-search` | Search across Notion workspace |
| `notion-fetch` | Get page/database content |
| `notion-create-pages` | Create new pages |
| `notion-update-page` | Update page properties/content |
| `notion-move-pages` | Move pages to different parent |
| `notion-duplicate-page` | Duplicate a page |
| `notion-create-database` | Create new database |
| `notion-update-data-source` | Update database schema |
| `notion-create-view` | Create new view |
| `notion-update-view` | Update view configuration |
| `notion-query-data-sources` | Query across data sources |
| `notion-query-database-view` | Query using view filters |
| `notion-create-comment` | Add comment to page |
| `notion-get-comments` | Get page comments |
| `notion-get-teams` | List workspace teams |
| `notion-get-users` | List workspace users |
| `notion-get-user` | Get current user info |
| `notion-get-self` | Get bot/workspace info |

---

## Our App's MCP Implementation

### Key Features

1. **StreamableHTTP Transport** - Uses HTTP transport for web apps
2. **Transaction Logging** - Every MCP call is logged with timing
3. **Error Handling** - Graceful degradation on failures
4. **Auto-reconnect** - Reconnects on connection loss

### Code Example

```typescript
import { NotionMCPClient } from "./notion-mcp";

// Create client with Notion token
const client = new NotionMCPClient(notionToken);

// Initialize workspace
const setup = await client.initializeWorkspace(parentPageId, (tx) => {
  console.log(tx.method, tx.duration, tx.error);
});

// Search workspace
const results = await client.searchWorkspace("resume skills");

// Create forensic entry
await client.logForensicAudit(dataSourceId, analysis, jobUrl);
```

---

## Submission Checklist for Challenge

- [x] Uses Notion MCP v2.0 (API 2025-09-03)
- [x] Correct tool names (notion-search, not notion_search)
- [x] Transaction logging for transparency
- [x] StreamableHTTP transport
- [x] OAuth or token-based auth
- [x] Working deployed app
- [x] Video demo showing MCP in action

---

## Resources

- [Notion MCP Documentation](https://developers.notion.com/docs/mcp)
- [Supported Tools](https://developers.notion.com/guides/mcp/mcp-supported-tools.md)
- [Official GitHub](https://github.com/makenotion/notion-mcp-server)
- [API Reference](https://developers.notion.com/reference/intro)

---

## Troubleshooting

### Error: "Tool not found"
→ You're using old tool names. Update to v2.0 names (hyphens, not underscores)

### Error: "401 Unauthorized"
→ Your NOTION_TOKEN is invalid or expired. Get a new one from Notion integrations.

### Error: "Rate limited"
→ You're making too many requests. Notion MCP has 180 requests/min limit.

### Claude Desktop MCP not connecting
→ Ensure config file is valid JSON and Claude Desktop is restarted.
