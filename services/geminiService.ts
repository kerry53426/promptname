import { GoogleGenAI } from "@google/genai";

// --- Type Definitions for Web Speech API ---
export interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

// Helper to safely get the API key
const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env?.API_KEY) {
    return process.env.API_KEY;
  }
  return '';
};

// Initialize AI Client safely
const ai = new GoogleGenAI({ apiKey: getApiKey() });

/**
 * Modifies or generates text based on input text and a prompt.
 */
export const modifyTextWithGemini = async (
  inputText: string | string[], 
  userPrompt: string,
  modelName: string = 'gemini-2.5-flash'
): Promise<string> => {
  try {
    let combinedInput = '';
    
    if (Array.isArray(inputText)) {
       combinedInput = inputText.map((text, index) => `[文本 ${index + 1}]:\n"${text}"`).join('\n\n----------------\n\n');
    } else {
       combinedInput = `Original Text:\n"${inputText}"`;
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: `${combinedInput}\n\nInstruction:\n${userPrompt}`,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "No text response generated.";
  } catch (error) {
    console.error("Gemini Text API Error:", error);
    throw error;
  }
};

/**
 * Helper to convert file to base64
 */
export const fileToGenerativePart = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export interface ImageInput {
  base64: string;
  mimeType: string;
}

/**
 * Modifies an image based on a prompt.
 */
export const modifyImageWithGemini = async (
  images: ImageInput[], 
  userPrompt: string,
  modelName: string = 'gemini-2.5-flash-image',
  aspectRatio: string = '1:1'
): Promise<{ text?: string; imageBase64?: string; mediaMimeType?: string }> => {
  try {
    const imageParts = images.map(img => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64
      }
    }));

    const response = await ai.models.generateContent({
      model: modelName, 
      contents: {
        parts: [
          ...imageParts,
          {
            text: userPrompt
          }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio
        }
      }
    });

    return parseResponse(response);
  } catch (error) {
    console.error("Gemini Image Modify API Error:", error);
    throw error;
  }
};

/**
 * Generates an image from text.
 */
export const generateImageFromText = async (
  userPrompt: string,
  modelName: string = 'gemini-2.5-flash-image',
  aspectRatio: string = '1:1',
  options?: { temperature?: number; seed?: number; negativePrompt?: string }
): Promise<{ text?: string; imageBase64?: string; mediaMimeType?: string }> => {
  try {
    if (modelName.toLowerCase().includes('imagen')) {
        const response = await ai.models.generateImages({
            model: modelName,
            prompt: userPrompt,
            config: {
                numberOfImages: 1,
                aspectRatio: aspectRatio,
                outputMimeType: 'image/jpeg',
            }
        });
        
        const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
        if (imageBytes) {
            return { imageBase64: imageBytes, mediaMimeType: 'image/jpeg' };
        }
        return {};
    }

    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    };

    if (options?.temperature !== undefined) config.temperature = options.temperature;
    if (options?.seed !== undefined) config.seed = options.seed;

    let finalPrompt = userPrompt;
    if (options?.negativePrompt && options.negativePrompt.trim()) {
        finalPrompt += `\n\n(Negative prompt / Exclude elements: ${options.negativePrompt})`;
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [{ text: finalPrompt }]
      },
      config: config
    });

    return parseResponse(response);
  } catch (error) {
    console.error("Gemini Text-to-Image API Error:", error);
    throw error;
  }
};

/**
 * Analyzes an image (Image-to-Text).
 */
export const analyzeImageWithGemini = async (
  images: ImageInput[],
  userPrompt: string,
  modelName: string = 'gemini-2.5-flash',
  jsonMode: boolean = false
): Promise<string> => {
  try {
    const imageParts = images.map(img => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64
      }
    }));

    const config: any = {};
    if (jsonMode) {
        config.responseMimeType = "application/json";
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          ...imageParts,
          { text: userPrompt }
        ]
      },
      config: config
    });

    return response.text || "無法識別圖片內容。";
  } catch (error) {
    console.error("Gemini Image Analysis API Error:", error);
    throw error;
  }
};

/**
 * Generates video from image (Veo).
 */
export const generateVideoFromImage = async (
  image: ImageInput,
  userPrompt: string,
  modelName: string = 'veo-3.1-generate-preview',
  onProgress?: (status: string) => void,
  signal?: AbortSignal
): Promise<string> => {
  try {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
        const aistudio = (window as any).aistudio;
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
             await aistudio.openSelectKey();
        }
    }
    
    if (signal?.aborted) throw new Error("使用者取消了影片生成。");

    const freshAi = new GoogleGenAI({ apiKey: getApiKey() });

    if (onProgress) onProgress('正在初始化 Veo 模型...');
    
    let operation = await freshAi.models.generateVideos({
      model: modelName,
      prompt: userPrompt,
      image: {
        imageBytes: image.base64,
        mimeType: image.mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p', 
      }
    });

    while (!operation.done) {
      if (signal?.aborted) {
          throw new Error("使用者取消了影片生成。");
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await freshAi.operations.getVideosOperation({ operation: operation });
      
      const metadata = operation.metadata as any;
      if (metadata && onProgress) {
          onProgress(`模型運算中... (狀態: ${metadata.state || 'Processing'})`);
      }
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation completed but no URI returned.");
    
    const downloadUrl = `${videoUri}&key=${getApiKey()}`;
    return downloadUrl;

  } catch (error) {
    console.error("Gemini Image-to-Video API Error:", error);
    throw error;
  }
};

/**
 * Suggests keywords.
 */
export const suggestImageKeywords = async (currentPrompt: string): Promise<string[]> => {
  try {
    if (!currentPrompt.trim()) return ["Cinematic", "8k", "Lighting", "Detailed"];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze this prompt: "${currentPrompt}".
        Suggest 5 keywords. Return ONLY comma-separated keywords.
      `,
    });

    const text = response.text || "";
    return text.split(',').map(s => s.trim()).filter(s => s.length > 0).slice(0, 5);
  } catch (error) {
    return [];
  }
};

/**
 * Optimizes a user's prompt (Omni-Magic Enhancer).
 * Adapts optimization logic based on the active mode.
 */
export const optimizeUserPrompt = async (
    currentPrompt: string, 
    mode: 'text' | 'image' | 'txt2img' | 'img2txt' | 'img2vid' = 'txt2img'
): Promise<string> => {
    try {
        if (!currentPrompt.trim()) return "";

        let systemInstruction = "";

        switch (mode) {
            case 'text':
                systemInstruction = `
                Act as an expert editor and prompt engineer.
                Your task is to refine the user's instruction for modifying/generating text.
                User Input: "${currentPrompt}"
                Instructions:
                1. Make the instruction clear, specific, and professional.
                2. If the input is vague (e.g., "make it shorter"), expand it with specific constraints (e.g., "Summarize the text concisely, retaining key data points, bullet points").
                3. Maintain the user's original intent but elevate the quality of the request.
                4. Output ONLY the optimized instruction string in Traditional Chinese.
                `;
                break;
            case 'image': // Image Editing
                systemInstruction = `
                Act as a professional photo editor.
                Your task is to refine the user's instruction for editing an image using AI.
                User Input: "${currentPrompt}"
                Instructions:
                1. Use precise terminology (e.g., "remove background", "color grading", "exposure", "texture").
                2. Add details about how the edit should look (natural, seamless blending, high contrast).
                3. If adding objects, specify lighting and perspective matching.
                4. Output ONLY the optimized instruction string in Traditional Chinese.
                `;
                break;
            case 'img2vid':
                systemInstruction = `
                Act as a cinematogropher and AI video generation expert (Veo/Sora).
                Your task is to refine the user's instruction for animating an image.
                User Input: "${currentPrompt}"
                Instructions:
                1. Focus on camera movement (pan, dolly, zoom, truck) and physical motion (flow, wind, gravity).
                2. Describe the motion vividly (slow-motion, cinematic, smooth transition).
                3. Keep it under 200 words but highly descriptive.
                4. Output ONLY the optimized instruction string in Traditional Chinese.
                `;
                break;
            case 'img2txt':
                systemInstruction = `
                Act as an analytical expert.
                Your task is to refine the user's question or instruction for analyzing an image.
                User Input: "${currentPrompt}"
                Instructions:
                1. Make the question more specific and deep.
                2. If asking for description, ask for specific details (lighting, mood, objects).
                3. If OCR, specify format (JSON, markdown).
                4. Output ONLY the optimized instruction string in Traditional Chinese.
                `;
                break;
            case 'txt2img':
            default:
                systemInstruction = `
                Act as a professional prompt engineer for AI image generation (Midjourney/Stable Diffusion style).
                Your task is to rewrite and enhance the following user input into a high-quality, detailed prompt.
                User Input: "${currentPrompt}"
                Instructions:
                1. Keep the original intent and subject.
                2. Add details about lighting, style, composition, texture, and mood.
                3. Use high-quality keywords (e.g., 8k, cinematic, photorealistic, octane render).
                4. If the input is in Chinese, use Traditional Chinese for the description part, but include English technical terms if helpful.
                5. Output ONLY the optimized prompt text.
                `;
                break;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: systemInstruction,
            config: {
                temperature: 0.7,
            }
        });

        return response.text?.trim() || currentPrompt;
    } catch (error) {
        console.error("Prompt optimization failed:", error);
        return currentPrompt;
    }
};

export interface PromptSuggestion {
    emoji: string;
    title: string;
    description: string;
    prompt: string;
}

export interface SuggestionCategory {
    categoryName: string;
    items: PromptSuggestion[];
}

/**
 * Analyzes content and suggests 30 diverse directions (5 categories * 6 suggestions).
 * Reduced count to prevent JSON truncation.
 */
export const analyzeContentForSuggestions = async (
    mode: 'text' | 'image' | 'txt2img' | 'img2txt' | 'img2vid',
    context: string | string[] | ImageInput[]
): Promise<SuggestionCategory[]> => {
    try {
        let contents: any[] = [];
        
        // Build context
        if (Array.isArray(context) && context.length > 0 && typeof context[0] !== 'string') {
            const images = context as ImageInput[];
            contents = images.map(img => ({ inlineData: { mimeType: img.mimeType, data: img.base64 } }));
        } else if (Array.isArray(context) && typeof context[0] === 'string') {
            contents = [{ text: (context as string[]).join('\n') }];
        } else if (typeof context === 'string') {
            contents = [{ text: context }];
        }

        let taskDescription = "";
        switch (mode) {
            case 'text':
                taskDescription = "Analyze this text. Provide 5 distinct categories of analysis/rewriting directions (e.g., Creative, Professional, Critical, Fun, Academic). Under EACH category, provide 6 specific suggestions.";
                break;
            case 'image':
                taskDescription = "Analyze this image. Provide 5 distinct categories of editing/modification ideas (e.g., Filters, Object Changes, Art Styles, Lighting, Background). Under EACH category, provide 6 specific suggestions.";
                break;
            case 'txt2img':
                taskDescription = "Based on this text input (or idea), provide 5 distinct artistic categories (e.g., Photorealism, 3D, Illustration, Anime, Abstract). Under EACH category, provide 6 specific image generation prompts.";
                break;
            case 'img2txt':
                taskDescription = "Analyze this image. Provide 5 distinct categories of analysis tasks (e.g., Detailed Description, OCR/Data, Storytelling, Marketing, Technical Analysis). Under EACH category, provide 6 specific prompts.";
                break;
            case 'img2vid':
                taskDescription = "Analyze this image. Provide 5 distinct categories of video motion ideas (e.g., Camera Movements, Physics/Elements, VFX, Atmosphere, Narrative). Under EACH category, provide 6 specific prompts.";
                break;
        }

        const systemPrompt = `
        You are a world-class AI Prompt Engineer.
        Task: ${taskDescription}
        Constraint: Return a JSON array of exactly 5 objects (Categories).
        Each Category object must have a 'categoryName' and an 'items' array.
        The 'items' array must contain exactly 6 Suggestion objects.
        Schema: 
        [
          { 
            "categoryName": "string", 
            "items": [
              { "emoji": "string", "title": "string", "description": "string (keep under 20 words)", "prompt": "string" },
              ... (6 items)
            ]
          },
          ... (5 categories)
        ]
        Language: Traditional Chinese (zh-TW).
        The 'prompt' field should be the actual command the user sends to the AI.
        Ensure diversity and high quality. Keep output concise to ensure valid JSON.
        `;

        contents.push({ text: systemPrompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: contents },
            config: { 
                responseMimeType: "application/json",
                temperature: 1.0, 
                maxOutputTokens: 8192 
            }
        });

        const text = response.text;
        if (!text) return [];
        
        // Clean up markdown code blocks if present
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("Analysis failed:", e);
        return [];
    }
};

const parseResponse = (response: any) => {
  let resultText = '';
  let resultImage = '';
  let resultMimeType = '';

  if (response.candidates && response.candidates.length > 0) {
    const parts = response.candidates[0].content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.text) resultText += part.text;
        if (part.inlineData && part.inlineData.data) {
          resultImage = part.inlineData.data;
          resultMimeType = part.inlineData.mimeType || 'image/png';
        }
      }
    }
  }

  return { text: resultText, imageBase64: resultImage, mediaMimeType: resultMimeType };
};
