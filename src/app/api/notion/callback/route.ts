import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

  // Exchange code for Access Token
  const response = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/notion/callback`,
    }),
  });

  const data = await response.json();

  if (data.error) return NextResponse.json({ error: data.error }, { status: 400 });

  // Redirect back to dashboard with the token (In a real app, you'd store this in a secure cookie or database)
  // For the hackathon, we redirect to the home page with a success signal.
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?notion_connected=true&access_token=${data.access_token}`);
}
