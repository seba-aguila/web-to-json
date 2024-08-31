import {
  extractFormattedText,
  extractTextByTag,
  generateSEOStats,
  analyzeWithClaude,
} from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url") as string;
  try {
    const res = await fetch(url);
    const html = await res.text();
    const { simplifiedText, detailedText } = extractFormattedText(html);
    const jsonData = extractTextByTag(html);
    const seoStats = generateSEOStats(detailedText);

    // Get Claude's analysis using the simplified text
    const claudeAnalysis = await analyzeWithClaude(simplifiedText);

    return NextResponse.json({
      simplifiedText,
      detailedText,
      jsonData,
      seoStats,
      claudeAnalysis,
      url,
      extractionDate: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch or process the URL" },
      { status: 500 }
    );
  }
}
