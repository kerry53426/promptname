
import { GoogleGenAI } from "@google/genai";

// Ensure API key is present
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Type Definitions for Web Speech API ---
export interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

/**
 * Modifies or generates text based on input text and a prompt.
 * Supports string or string[] as input.
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
        // Remove the Data URL prefix (e.g., "data:image/png;base64,") to get just the base64 string
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
 * Generates an image from text from scratch (Text-to-Image).
 * Updated to support negative prompts.
 */
export const generateImageFromText = async (
  userPrompt: string,
  modelName: string = 'gemini-2.5-flash-image',
  aspectRatio: string = '1:1',
  options?: { temperature?: number; seed?: number; negativePrompt?: string }
): Promise<{ text?: string; imageBase64?: string; mediaMimeType?: string }> => {
  try {
    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio
      }
    };

    if (options?.temperature !== undefined) config.temperature = options.temperature;
    if (options?.seed !== undefined) config.seed = options.seed;

    // Append negative prompt to the main prompt as an instruction, 
    // as standardized negative_prompt param availability varies by model version in the unified client.
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
 * Analyzes an image and returns text (Image-to-Text).
 * Now supports JSON mode.
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
 * Generates a video from an image using Veo models (Image-to-Video).
 * This is a long-running operation that requires polling.
 * Now supports progress callback and AbortSignal for cancellation.
 */
export const generateVideoFromImage = async (
  image: ImageInput,
  userPrompt: string,
  modelName: string = 'veo-3.1-generate-preview',
  onProgress?: (status: string) => void,
  signal?: AbortSignal
): Promise<string> => {
  try {
    // 1. Check for API Key selection (Required for Veo)
    if (typeof window !== 'undefined' && (window as any).aistudio) {
        const aistudio = (window as any).aistudio;
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
             await aistudio.openSelectKey();
        }
    }
    
    if (signal?.aborted) throw new Error("使用者取消了影片生成。");

    // Create a NEW instance to ensure the latest key from aistudio is used (Fix race condition)
    const freshAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 2. Start the operation
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
        // Veo supports 720p or 1080p, we default to 720p for speed in demo
        resolution: '720p', 
      }
    });

    // 3. Poll for completion
    while (!operation.done) {
      if (signal?.aborted) {
          throw new Error("使用者取消了影片生成。");
      }

      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
      operation = await freshAi.operations.getVideosOperation({ operation: operation });
      
      // Update progress
      const metadata = operation.metadata as any;
      if (metadata && onProgress) {
          // Typically metadata contains createTime, state, etc.
          // We can show a generic processing message or detailed state if available
          onProgress(`模型運算中... (狀態: ${metadata.state || 'Processing'})`);
      }
    }

    // 4. Extract video URI
    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (!videoUri) {
        throw new Error("Video generation completed but no URI returned.");
    }
    
    // 5. Fetch the video blob (to handle CORS/Auth if needed, though SDK usually gives a GCS link)
    // The guidelines say: fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const downloadUrl = `${videoUri}&key=${process.env.API_KEY}`;
    
    // Return the URL directly. The <video> tag can usually handle it if valid.
    return downloadUrl;

  } catch (error) {
    console.error("Gemini Image-to-Video API Error:", error);
    throw error;
  }
};

/**
 * Suggests keywords to enhance an image prompt.
 */
export const suggestImageKeywords = async (currentPrompt: string): Promise<string[]> => {
  try {
    if (!currentPrompt.trim()) return ["Cinematic", "8k", "Lighting", "Detailed"];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze this image generation prompt: "${currentPrompt}".
        Suggest 5 specific, high-quality, comma-separated keywords or short phrases to improve the visual style, lighting, or detail (e.g., 'Volumetric lighting', 'Cyberpunk', '85mm lens', 'Octane render').
        Return ONLY the comma-separated keywords.
      `,
    });

    const text = response.text || "";
    return text.split(',').map(s => s.trim()).filter(s => s.length > 0).slice(0, 5);
  } catch (error) {
    console.error("Keyword suggestion failed:", error);
    return [];
  }
};

/**
 * Helper function to suggest relevant prompts based on content analysis
 */
export const suggestRelevantPrompts = async (
    content: string | ImageInput,
    type: 'text' | 'image',
    promptList: {id: string, label: string, prompt: string}[]
): Promise<string[]> => {
    try {
        let contentPart;
        if (type === 'image') {
            const img = content as ImageInput;
            contentPart = { inlineData: { mimeType: img.mimeType, data: img.base64 } };
        } else {
            contentPart = { text: content as string };
        }

        const systemPrompt = `
        You are a helpful assistant for a Prompt Engineering Playground.
        Analyze the provided content (text or image) and select the 3 most relevant prompt templates from the following list.
        Return ONLY a JSON array of string IDs (e.g., ["id1", "id2", "id3"]). Do not output markdown or explanations.
        
        Available Prompts:
        ${JSON.stringify(promptList.map(p => ({id: p.id, label: p.label, prompt: p.prompt})))}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [contentPart, { text: systemPrompt }]
            },
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);
    } catch (e) {
        console.error("Suggestion failed", e);
        return [];
    }
}

// Helper to extract text and image from response
const parseResponse = (response: any) => {
  let resultText = '';
  let resultImage = '';
  let resultMimeType = '';

  if (response.candidates && response.candidates.length > 0) {
    const parts = response.candidates[0].content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.text) {
          resultText += part.text;
        }
        if (part.inlineData && part.inlineData.data) {
          resultImage = part.inlineData.data;
          resultMimeType = part.inlineData.mimeType || 'image/png';
        }
      }
    }
  }

  return {
    text: resultText,
    imageBase64: resultImage,
    mediaMimeType: resultMimeType
  };
};
