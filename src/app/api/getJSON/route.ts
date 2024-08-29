import { extractFormattedText } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") as string;
  try {
    const res = await fetch(url);
    const html = await res.text();
    const formattedText = extractFormattedText(html);
    return NextResponse.json({ formattedText });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch or process the URL" },
      { status: 500 }
    );
  }
}
