import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Use flash (better free quota)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function safeGenerateContent(prompt: string, base64Data: string) {
  let retries = 3;

  while (retries--) {
    try {
      const result = await model.generateContent([
        { text: prompt }, // ✅ wrap in { text: ... }
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg",
          },
        },
      ]);
      return result;
    } catch (err: any) {
      if (err.status === 429 && retries > 0) {
        const delay = 30000; // 30 seconds
        console.warn(`Rate limit hit. Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

export async function POST(request: Request) {
  try {
    const { image } = await request.json();
    const base64Data = image.split(",")[1];

    const prompt = `Analyze this emergency situation image and respond in this exact format without any asterisks or bullet points:
TITLE: Write a clear, brief title
TYPE: Choose one (Theft, Fire Outbreak, Medical Emergency, Natural Disaster, Violence, or Other)
DESCRIPTION: Write a clear, concise description`;

    const result = await safeGenerateContent(prompt, base64Data);

    // ✅ text() is synchronous
    const text = result.response.text();

    const titleMatch = text.match(/TITLE:\s*(.+)/);
    const typeMatch = text.match(/TYPE:\s*(.+)/);
    const descMatch = text.match(/DESCRIPTION:\s*(.+)/);

    return NextResponse.json({
      title: titleMatch?.[1]?.trim() || "",
      reportType: typeMatch?.[1]?.trim() || "",
      description: descMatch?.[1]?.trim() || "",
    });
  } catch (error) {
    console.error("Image analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}