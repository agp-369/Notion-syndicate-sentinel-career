import { NextResponse } from "next/server";

export async function GET() {
  const client_id = process.env.NOTION_CLIENT_ID;
  const redirect_uri = `${process.env.NEXT_PUBLIC_APP_URL}/api/notion/callback`;
  
  // Official Notion OAuth URL
  const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${client_id}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirect_uri)}`;
  
  return NextResponse.redirect(authUrl);
}
