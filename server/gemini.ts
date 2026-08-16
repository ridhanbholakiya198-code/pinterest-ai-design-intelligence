import { Request, Response, Router } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import path from "path";

export const geminiRouter = Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Load the Creative Intelligence specification
let creativeIntelligenceSpec = "";
try {
  creativeIntelligenceSpec = fs.readFileSync(path.join(process.cwd(), "CREATIVE_INTELLIGENCE.md"), "utf-8");
} catch (e) {
  console.warn("Could not load CREATIVE_INTELLIGENCE.md");
}

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    primaryCategory: { type: Type.STRING },
    secondaryCategories: { type: Type.ARRAY, items: { type: Type.STRING } },
    designTypes: { type: Type.ARRAY, items: { type: Type.STRING } },
    visualStyles: { type: Type.ARRAY, items: { type: Type.STRING } },
    aesthetics: { type: Type.ARRAY, items: { type: Type.STRING } },
    colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
    typography: { type: Type.ARRAY, items: { type: Type.STRING } },
    layoutPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
    designPrinciples: { type: Type.ARRAY, items: { type: Type.STRING }, description: "e.g., negative space, tension, symmetry, hierarchy" },
    materiality: { type: Type.ARRAY, items: { type: Type.STRING }, description: "e.g., lighting, texture, depth, shadows" },
    designDna: { type: Type.STRING, description: "Normalized design DNA representation" },
    visualSummary: { type: Type.STRING },
    whyDidISaveThis: { type: Type.STRING, description: "Probabilistic explanation of why the user might have saved this based on visual evidence." },
    crossCategoryUtility: { type: Type.STRING, description: "How could this reference inform other disciplines (e.g., poster informing web UI)?" },
    confidence: { type: Type.NUMBER }
  },
  required: ["primaryCategory", "aesthetics", "colorPalette", "designDna", "visualSummary", "designPrinciples", "whyDidISaveThis"]
};

export async function getGeminiAnalysis(pinData: any) {
  let imagePart = null;
  let imageUrl = null;

  // Try to extract image URL from Pinterest media object
  if (pinData.media && pinData.media.images) {
    const images = pinData.media.images;
    // Prefer higher resolution
    imageUrl = (images["1200x"] || images["600x"] || images["400x"] || Object.values(images)[0])?.url;
  }

  if (imageUrl) {
    try {
      const imgRes = await fetch(imageUrl);
      if (imgRes.ok) {
        const arrayBuffer = await imgRes.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = imgRes.headers.get("content-type") || "image/jpeg";
        imagePart = { inlineData: { mimeType, data: base64Data } };
      }
    } catch (err) {
      console.error(`Failed to fetch image for pin ${pinData.pinterest_id}:`, err);
    }
  }

  const promptText = `
    Analyze this Pinterest design artifact according to our Creative Intelligence specification.
    
    Title: ${pinData.title || "N/A"}
    Description: ${pinData.description || "N/A"}
    Alt Text: ${pinData.alt_text || "N/A"}
    Dominant Color: ${pinData.dominant_color || "N/A"}
    
    Tasks:
    1. Extract visual principles (composition, hierarchy, spacing, contrast).
    2. Determine probable reasons for saving ("Why did I save this?").
    3. Evaluate potential for cross-pollination (e.g. how a poster could inform app UI).
    4. Focus on transformation potential rather than just describing the image.
  `;

  const contents: any[] = [{ text: promptText }];
  if (imagePart) contents.push(imagePart);

  const response = await ai.models.generateContent({
    model: "gemini-3.7-flash",
    contents: contents,
    config: {
      systemInstruction: creativeIntelligenceSpec,
      responseMimeType: "application/json",
      responseSchema: analysisSchema
    }
  });

  const text = response.text || "{}";
  try {
    const analysis = JSON.parse(text);
    analysis.analysisMode = imagePart ? "visual" : "metadata";
    if (!imagePart) {
      analysis.image_unavailable = true;
    }
    return analysis;
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", text);
    throw new Error("Failed to parse Gemini response");
  }
}

// ... existing analyze route
geminiRouter.post("/analyze", async (req: Request, res: Response) => {
  const sessionId = req.signedCookies?.session_id;
  if (!sessionId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { pinData } = req.body;
  if (!pinData) {
    return res.status(400).json({ error: "pinData is required" });
  }

  try {
    const analysis = await getGeminiAnalysis(pinData);
    res.json({ analysis });
  } catch (err) {
    console.error("Gemini analysis error:", err);
    res.status(500).json({ error: "Failed to analyze pin" });
  }
});

const directionSchema = {
  type: Type.OBJECT,
  properties: {
    concept: { type: Type.STRING },
    visualMood: { type: Type.STRING },
    hierarchy: { type: Type.STRING },
    colorDirection: { type: Type.STRING },
    typographyDirection: { type: Type.STRING },
    composition: { type: Type.STRING },
    imagery: { type: Type.STRING },
    materialTexture: { type: Type.STRING },
    motion: { type: Type.STRING },
    interactionBehavior: { type: Type.STRING },
    originalityStrategy: { type: Type.STRING }
  },
  required: ["concept", "visualMood", "colorDirection", "typographyDirection", "composition", "originalityStrategy"]
};

const projectSchema = {
  type: Type.OBJECT,
  properties: {
    files: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          path: { type: Type.STRING },
          content: { type: Type.STRING }
        },
        required: ["path", "content"]
      }
    }
  },
  required: ["files"]
};

geminiRouter.post("/generate-project", async (req: Request, res: Response) => {
  const sessionId = req.signedCookies?.session_id;
  if (!sessionId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { direction, request, userVisualDna, references } = req.body;
  if (!direction || !request) {
    return res.status(400).json({ error: "direction and request are required" });
  }

  try {
    const promptText = `
      You are an elite frontend engineering AI. Your task is to output the ACTUAL functional code for a complete, production-ready React + Tailwind CSS web application based on the provided Creative Direction.

      User Request: "${request}"

      Creative Direction:
      ${JSON.stringify(direction, null, 2)}

      User's Visual DNA:
      ${userVisualDna || "N/A"}

      References (Inspiration):
      ${references ? JSON.stringify(references, null, 2) : "N/A"}

      Requirements:
      1. DO NOT generate just a boilerplate or scaffold. Generate the ACTUAL application.
      2. Include responsive layout, typography, actual color tokens, functional components, interactions, and state where appropriate.
      3. Use 'lucide-react' for icons.
      4. Assume a Vite + React + Tailwind + TypeScript environment.
      5. The main entry point will be src/main.tsx and src/App.tsx.
      6. Provide the complete code for src/App.tsx and any necessary subcomponents (e.g. src/components/Header.tsx).
      7. Provide the tailwind.config.js if custom theme extensions are needed based on the color direction.
      8. Provide the index.html and package.json if needed.
      9. NEVER use placeholder text if you can generate meaningful content based on the concept.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview", // Use pro for complex coding task
      contents: [{ text: promptText }],
      config: {
        systemInstruction: creativeIntelligenceSpec,
        responseMimeType: "application/json",
        responseSchema: projectSchema,
        temperature: 0.2
      }
    });

    const outputText = response.text || "{}";
    res.json({ project: JSON.parse(outputText) });
  } catch (err) {
    console.error("Gemini project generation error:", err);
    res.status(500).json({ error: "Failed to generate project source" });
  }
});

geminiRouter.post("/generate-image", async (req: Request, res: Response) => {
  const sessionId = req.signedCookies?.session_id;
  if (!sessionId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { prompt, aspectRatio } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt is required" });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image', // Supports 1K and non-standard ratios
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || "1:1",
          imageSize: "1K"
        }
      }
    });

    let imageUrl = null;
    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (imageUrl) {
      res.json({ imageUrl });
    } else {
      res.status(500).json({ error: "Failed to extract image from response" });
    }
  } catch (err) {
    console.error("Gemini image generation error:", err);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

geminiRouter.post("/edit-image", async (req: Request, res: Response) => {
  const sessionId = req.signedCookies?.session_id;
  if (!sessionId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { prompt, imageBase64, mimeType, preserveFace } = req.body;
  if (!prompt || !imageBase64 || !mimeType) {
    return res.status(400).json({ error: "prompt, imageBase64, and mimeType are required" });
  }

  try {
    const fullPrompt = preserveFace 
      ? `${prompt}. IMPORTANT INSTRUCTION: You MUST strictly preserve the exact facial identity, features, and expression of any person in the original image. Never intentionally replace or alter the face.` 
      : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: fullPrompt },
        ],
      },
    });

    let imageUrl = null;
    if (response.candidates && response.candidates.length > 0) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (imageUrl) {
      res.json({ imageUrl });
    } else {
      res.status(500).json({ error: "Failed to extract edited image from response" });
    }
  } catch (err) {
    console.error("Gemini image editing error:", err);
    res.status(500).json({ error: "Failed to edit image" });
  }
});

geminiRouter.post("/creative-direction", async (req: Request, res: Response) => {
  const sessionId = req.signedCookies?.session_id;
  if (!sessionId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { request, references, userVisualDna } = req.body;
  if (!request) {
    return res.status(400).json({ error: "request is required" });
  }

  try {
    const promptText = `
      You are the Creative Director AI.
      Create a Design Direction for the following request:
      "${request}"

      User's Visual DNA summary:
      ${userVisualDna || "No DNA available yet. Use general premium creative principles."}

      Selected References (Analysis):
      ${references ? JSON.stringify(references, null, 2) : "None provided."}

      Task:
      Apply our Creative Intelligence specification. Do not copy the references directly.
      Synthesize a strong, original visual direction using the provided DNA and cross-category inspiration.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [{ text: promptText }],
      config: {
        systemInstruction: creativeIntelligenceSpec,
        responseMimeType: "application/json",
        responseSchema: directionSchema
      }
    });

    res.json({ direction: JSON.parse(response.text || "{}") });
  } catch (err) {
    console.error("Gemini direction error:", err);
    res.status(500).json({ error: "Failed to generate creative direction" });
  }
});

