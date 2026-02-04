import { GoogleGenAI, Type } from "@google/genai";
import { StoryBible, Chapter, Part, Section } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_MODEL = "gemini-2.5-flash-preview"; // Fast for analysis
const WRITING_MODEL = "gemini-3-pro-preview"; // Smart for writing

// 1. Phân tích cốt truyện (Story Bible)
export const analyzeStoryInput = async (input: string): Promise<StoryBible> => {
  const prompt = `
    Bạn là hệ thống phân tích cốt truyện siêu trí tuệ.
    Nhiệm vụ:
    1. Đọc toàn bộ nội dung input.
    2. Trích xuất: Tên truyện (đề xuất nếu chưa có), Thể loại, Bối cảnh, Nhân vật, Chủ đề, Cốt truyện tổng quát (Story Bible).
    Input: ${input}
  `;

  const response = await ai.models.generateContent({
    model: ANALYSIS_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          genre: { type: Type.ARRAY, items: { type: Type.STRING } },
          setting: { type: Type.STRING },
          characters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["name", "role", "description"],
            },
          },
          theme: { type: Type.ARRAY, items: { type: Type.STRING } },
          synopsis: { type: Type.STRING },
        },
        required: ["title", "synopsis", "characters", "setting"],
      },
    },
  });

  if (!response.text) throw new Error("No response from AI");
  return JSON.parse(response.text) as StoryBible;
};

// 2. Tạo cấu trúc khung (Chapters -> Parts -> Sections)
export const generateStoryStructure = async (bible: StoryBible): Promise<Chapter[]> => {
  const prompt = `
    Dựa trên Story Bible sau, hãy thiết kế cấu trúc truyện chi tiết.
    Yêu cầu:
    - Tạo 3 chương mẫu (thực tế là 10+ nhưng demo lấy 3).
    - Mỗi chương có 2 phần (demo).
    - Mỗi phần có 2 mục (demo).
    - Mỗi cấp phải có tóm tắt ngắn gọn.
    
    Story Bible:
    Tên: ${bible.title}
    Cốt truyện: ${bible.synopsis}
    
    Output JSON format:
    [
      {
        "number": 1, "title": "...", "summary": "...",
        "parts": [
          { "number": 1, "summary": "...", "sections": [{ "number": 1, "summary": "..." }] }
        ]
      }
    ]
  `;

  const response = await ai.models.generateContent({
    model: ANALYSIS_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  if (!response.text) throw new Error("No response from AI");
  const rawData = JSON.parse(response.text);
  
  // Mapping to add IDs and empty content
  return rawData.map((ch: any, cIdx: number) => ({
    id: `ch-${cIdx}`,
    number: ch.number,
    title: ch.title,
    summary: ch.summary,
    parts: ch.parts.map((p: any, pIdx: number) => ({
      id: `ch-${cIdx}-p-${pIdx}`,
      number: p.number,
      summary: p.summary,
      sections: p.sections.map((s: any, sIdx: number) => ({
        id: `ch-${cIdx}-p-${pIdx}-s-${sIdx}`,
        number: s.number,
        summary: s.summary, // Tóm tắt mục tiêu
        content: "",
        shortSummary: "",
        isWritten: false
      }))
    }))
  }));
};

// 3. Viết nội dung Mục (Section)
export const writeSectionContent = async (
  bible: StoryBible,
  chapter: Chapter,
  part: Part,
  section: Section,
  previousSummary: string
): Promise<string> => {
  const prompt = `
    Bạn là nhà văn thiên tài. Hãy viết nội dung chi tiết cho MỤC truyện sau.
    
    THÔNG TIN CỐT LÕI (BIBLE):
    - Truyện: ${bible.title}
    - Bối cảnh: ${bible.setting}
    - Cốt truyện tổng: ${bible.synopsis}
    
    NGỮ CẢNH HIỆN TẠI:
    - Chương ${chapter.number}: ${chapter.title} (${chapter.summary})
    - Phần ${part.number}: ${part.summary}
    - Tóm tắt diễn biến trước đó: ${previousSummary}
    
    NHIỆM VỤ MỤC TIÊU (Mục ${section.number}):
    - Yêu cầu cốt truyện: ${section.summary}
    
    YÊU CẦU VIẾT:
    - Viết văn phong tiểu thuyết chuyên nghiệp, giàu cảm xúc, tả cảnh chi tiết.
    - Độ dài: Viết khoảng 1000-2000 từ (cho bản demo).
    - Chỉ trả về nội dung truyện, không lời dẫn.
  `;

  const response = await ai.models.generateContent({
    model: WRITING_MODEL,
    contents: prompt,
  });

  return response.text || "";
};

// 4. Viết tiếp (Continuation)
export const continueSectionContent = async (
  bible: StoryBible,
  currentContent: string,
  sectionSummary: string
): Promise<string> => {
  // Lấy 2000 ký tự cuối làm context
  const contextText = currentContent.slice(-2000);

  const prompt = `
    Bạn đang viết tiếp một mục truyện.
    
    CONTEXT (Cốt truyện): ${bible.synopsis}
    MỤC TIÊU CỦA ĐOẠN NÀY: ${sectionSummary}
    
    ĐOẠN CUỐI CÙNG VỪA VIẾT:
    "${contextText}"
    
    NHIỆM VỤ:
    - Viết tiếp liền mạch, không lặp lại, giữ đúng tone giọng.
    - Phát triển tình tiết tiếp theo.
    - Chỉ trả về nội dung viết tiếp.
  `;

  const response = await ai.models.generateContent({
    model: WRITING_MODEL,
    contents: prompt,
  });

  return response.text || "";
};