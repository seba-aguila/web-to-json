import { extractTextByTag } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") as string;

  const res = await fetch(url);
  const data = await res.text();

  const webText = extractTextByTag(data);

  return NextResponse.json(webText);
}