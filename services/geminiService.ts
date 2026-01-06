import { GoogleGenAI } from "@google/genai";

// --- Type Definitions for Web Speech API ---
export interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

// Helper to safely get the API key in both Vite (Vercel) and AI Studio environments
const getApiKey = () => {
  // 1. Try Vite standard env var (for Vercel deployment)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
    // ignore
  }
  
  // 2. Try Node.js process.env (safely accessed)
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // process might be undefined in some browsers, ignore error
  }

  return '';
};

// Initialize AI Client safely using the helper function
const ai = new GoogleGenAI({ apiKey: getApiKey() });

/**
 * Helper to parse the response from Gemini
 */
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

export const generateVideoFromText = async (
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
    
    // For Txt2Vid, Veo 3.1 Generate Preview supports simple text prompts
    let operation = await freshAi.models.generateVideos({
      model: modelName,
      prompt: userPrompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p', 
        aspectRatio: '16:9'
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
    console.error("Gemini Text-to-Video API Error:", error);
    throw error;
  }
};

export const generateVideoFromImage = async (
  images: ImageInput | ImageInput[],
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
    
    // Handle multiple images (up to 3 for Veo)
    const imageList = Array.isArray(images) ? images : [images];
    let request: any = {
      model: modelName,
      prompt: userPrompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p', 
        aspectRatio: '16:9'
      }
    };

    if (imageList.length === 1) {
        // Single Image Mode
        request.image = {
            imageBytes: imageList[0].base64,
            mimeType: imageList[0].mimeType,
        };
    } else {
        // Multi Image Mode (Reference Images)
        // Veo supports specific multi-image workflows. 
        // For general "generateVideos", it usually takes one `image` or `video` as primary input.
        // However, we will use the `referenceImages` config if supported or fallback to primary image.
        // Current Veo API simplified: treating first image as start frame or primary reference.
        
        // NOTE: If using veo-3.1-generate-preview, we can pass referenceImages in config.
        const refs = imageList.map(img => ({
            image: {
                imageBytes: img.base64,
                mimeType: img.mimeType
            },
            referenceType: 'ASSET' // or 'START_FRAME' etc depending on logic, keeping simple
        }));
        
        // We set the first image as the start frame/primary, and others as references if needed
        // Or strictly follow the "Multiple reference images" pattern from docs
        delete request.image;
        request.config.referenceImages = refs;
    }

    let operation = await freshAi.models.generateVideos(request);

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

export const suggestImageKeywords = async (currentPrompt: string): Promise<string[]> => {
  try {
    if (!currentPrompt.trim()) return ["電影感", "8k", "細節豐富", "大師級作品", "光影"];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze this prompt: "${currentPrompt}".
        Suggest 5 style/lighting/quality keywords in Traditional Chinese (繁體中文). 
        Return ONLY comma-separated keywords.
      `,
    });

    const text = response.text || "";
    return text.split(',').map(s => s.trim()).filter(s => s.length > 0).slice(0, 5);
  } catch (error) {
    return [];
  }
};

export const optimizeUserPrompt = async (
    currentPrompt: string, 
    mode: 'text' | 'image' | 'txt2img' | 'img2txt' | 'img2vid' | 'txt2vid' = 'txt2img'
): Promise<string> => {
    try {
        if (!currentPrompt.trim()) return "";
        let systemInstruction = "";
        switch (mode) {
            case 'text':
                systemInstruction = "Refine the user's text generation instruction to be clear, structured, and effective. Output ONLY Traditional Chinese.";
                break;
            case 'image':
                systemInstruction = "Refine the user's image editing instruction to be precise and descriptive. Output ONLY Traditional Chinese.";
                break;
            case 'img2vid':
            case 'txt2vid':
                systemInstruction = "Refine the user's video generation instruction. Focus on movement, physics, and camera angles. Output ONLY Traditional Chinese.";
                break;
            case 'img2txt':
                systemInstruction = "Refine the user's image analysis question to get the most insightful answer. Output ONLY Traditional Chinese.";
                break;
            case 'txt2img':
            default:
                systemInstruction = "Rewrite the user input into a detailed, high-quality AI image generation prompt. Include details about lighting, composition, style, and mood. Output in Traditional Chinese (繁體中文).";
                break;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${systemInstruction}\nUser Input: "${currentPrompt}"`,
            config: { temperature: 0.7 }
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

export const analyzeContentForSuggestions = async (
    mode: 'text' | 'image' | 'txt2img' | 'img2txt' | 'img2vid' | 'txt2vid',
    context: string | string[] | ImageInput[]
): Promise<SuggestionCategory[]> => {
    try {
        let contents: any[] = [];
        let systemPromptAddon = "";

        if (Array.isArray(context) && context.length > 0 && typeof context[0] !== 'string') {
            const images = context as ImageInput[];
            // Multi-image detection
            if (images.length > 1) {
                if (mode === 'image') {
                    // Editing Mode + Multi Images -> Swap/Merge suggestions
                    systemPromptAddon = `
                        IMPORTANT: The user has uploaded ${images.length} images for editing.
                        You MUST generate specific editing suggestions that involve interactions between these images.
                        
                        MANDATORY Categories to include (in Chinese):
                        1. 元素交換 (Element Swapping): e.g., "Swap the faces between image 1 and image 2".
                        2. 風格遷移 (Style Transfer): e.g., "Apply the art style of image 1 to image 2".
                        3. 背景替換 (Background Swap): e.g., "Use the background of image 1 for the subject in image 2".
                        4. 創意合成 (Creative Merge): e.g., "Blend these two images into a double exposure".
                        
                        In the "prompt" field, clearly refer to the images as "第一張圖片 (Image 1)", "第二張圖片 (Image 2)".
                        The suggestions MUST be actionable instructions for an AI image editor.
                    `;
                } else {
                    // Analysis Mode + Multi Images -> Comparison suggestions
                    systemPromptAddon = " IMPORTANT: There are multiple images. Your suggestions MUST focus on the RELATIONSHIP between them (e.g., comparing them, combining them, sequential storytelling, or finding commonalities). Do not just analyze one image.";
                }
            }
            contents = images.map(img => ({ inlineData: { mimeType: img.mimeType, data: img.base64 } }));
        } else if (Array.isArray(context) && typeof context[0] === 'string') {
            const textArray = context as string[];
             // Multi-text detection
            if (textArray.length > 1) {
                systemPromptAddon = " IMPORTANT: There are multiple text blocks. Your suggestions MUST focus on COMPARISON, SYNTHESIS, checking consistency, or merging these texts. Do not just analyze one block.";
            }
            contents = [{ text: textArray.join('\n\n--- NEXT INPUT ---\n\n') }];
        } else if (typeof context === 'string') {
            contents = [{ text: context }];
        }

        // Mode-Specific Strategy Templates (The "8 Golden Dimensions")
        let strategyInstructions = "";
        switch (mode) {
            case 'txt2img':
                strategyInstructions = `
                    Generate 8 distinct categories based on these dimensions:
                    1. 藝術風格 (Art Style): Specific movements, mediums, artists.
                    2. 構圖視角 (Composition & Angle): Lens choice, framing, angles.
                    3. 光影氛圍 (Lighting & Mood): Cinematic, studio, natural, dramatic lighting.
                    4. 材質細節 (Texture & Details): 8k, realistic, specific material properties.
                    5. 創意概念 (Creative Concept): Abstract, surreal, metaphorical interpretations.
                    6. 色彩配置 (Color Palette): Monochromatic, complementary, vibrant, pastel.
                    7. 藝術家參考 (Artist Reference): Inspired by specific famous artists or photographers.
                    8. 負面優化 (Negative Constraints): Suggestions for what to avoid/exclude for better quality.
                `;
                break;
            case 'img2vid':
            case 'txt2vid':
                strategyInstructions = `
                    Generate 8 distinct categories based on these dimensions:
                    1. 運鏡技巧 (Camera Movement): Pan, Zoom, Dolly, Drone, Handheld.
                    2. 物理動態 (Physics & Nature): Fluid dynamics, weather, particle systems.
                    3. 特效轉場 (VFX & Transitions): Time distortion, morphing, glitch, magical effects.
                    4. 情感氛圍 (Mood & Atmosphere): Emotional tone, pacing, environmental mood.
                    5. 敘事發展 (Storytelling): Plot progression, character action sequences.
                    6. 時間節奏 (Temporal Pacing): Slow motion, timelapse, hyperlapse, reverse.
                    7. 光影動態 (Lighting Dynamics): Changing light sources, flickering, sunrise/sunset.
                    8. 鏡頭焦點 (Focus & Depth): Rack focus, depth of field changes, subject tracking.
                `;
                break;
            case 'image': // Editing
                if (!systemPromptAddon) { // If not multi-image
                    strategyInstructions = `
                        Generate 8 distinct categories based on these dimensions:
                        1. 修復優化 (Fix & Enhance): Restoration, clarity, noise reduction.
                        2. 風格濾鏡 (Creative Filters): Film looks, artistic filters, color grading.
                        3. 背景置換 (Background Change): New environments, context shifting.
                        4. 元素增減 (Add/Remove Elements): Inpainting, outpainting, object manipulation.
                        5. 創意變形 (Transformation): Material change, shape shifting, stylization.
                        6. 專業調色 (Color Grading): Teal&Orange, black&white, vivid, cinematic grading.
                        7. 二次構圖 (Composition Crop): Re-framing, aspect ratio change, centering.
                        8. 精修細節 (Detailed Retouch): Skin smoothing, eye enhancement, texture fix.
                    `;
                }
                break;
            case 'img2txt': // Analysis
                strategyInstructions = `
                    Generate 8 distinct categories based on these dimensions:
                    1. 深度解讀 (Deep Meaning): Symbolism, emotion, narrative subtext.
                    2. 實用資訊 (Practical Data): OCR, translations, estimation, identification.
                    3. 創意寫作 (Creative Writing): Stories, poems, captions, scripts.
                    4. 隱藏細節 (Hidden Details): Background elements, subtle clues.
                    5. 技術分析 (Technical Analysis): Photography settings, composition rules, design principles.
                    6. 社群行銷 (Social Media): Hashtags, engagement hooks, viral angles.
                    7. 關鍵字優化 (SEO & Tags): Search terms, categorization, metadata.
                    8. 教育視角 (Educational): Scientific explanation, historical context, "Explain like I'm 5".
                `;
                break;
            case 'text':
                strategyInstructions = `
                    Generate 8 distinct categories based on these dimensions:
                    1. 語氣轉換 (Tone Shift): Professional, casual, persuasive, empathetic.
                    2. 結構優化 (Structure): Formatting, summarization, expansion, lists.
                    3. 邏輯檢查 (Logic & Clarity): Fallacy check, simplification, clarification.
                    4. 創意改寫 (Creative Spin): Storytelling, metaphors, scriptwriting.
                    5. 翻譯與擴充 (Translate & Expand): Multilingual, cultural adaptation.
                    6. 行銷視角 (SEO & Marketing): Copywriting formulas (AIDA), keywords, hooks.
                    7. 受眾適配 (Audience Adaptation): For kids, experts, seniors, beginners.
                    8. 反向思考 (Counter-Argument): Devil's advocate, critical analysis, debate.
                `;
                break;
        }

        const taskDescription = `
            You are an expert AI prompt consultant for a "${mode}" application.
            
            Task:
            1. Analyze the provided content carefully.
            2. Generate EXACTLY 8 distinct categories of prompt suggestions.
            3. For EACH category, generate EXACTLY 10 high-quality, distinct suggestions.
            4. TOTAL SUGGESTIONS MUST BE 80.
            
            STRATEGY REQUIREMENT:
            ${strategyInstructions}
            ${systemPromptAddon}

            CRITICAL LANGUAGE REQUIREMENT:
            - The "categoryName" MUST be in Traditional Chinese (繁體中文).
            - The "title" MUST be in Traditional Chinese (繁體中文).
            - The "description" MUST be in Traditional Chinese (繁體中文). It should explain the RATIONALE (Why is this a good idea based on the input?).
            - The "prompt" text MUST be an EXPERT-LEVEL prompt (detailed, specific, using weights if applicable).

            The output MUST be valid JSON with this exact schema:
            [
              {
                "categoryName": "創意寫作",
                "items": [
                   { "emoji": "🚀", "title": "短標題(中文)", "description": "洞察分析：為什麼建議這樣做？(中文)", "prompt": "Detailed expert prompt..." },
                   ... (9 more items)
                ]
              },
              ... (7 more categories)
            ]
            
            Do not wrap in markdown code blocks. Return raw JSON.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: { 
                parts: [
                    ...contents, 
                    { text: taskDescription }
                ] 
            },
            config: { 
                responseMimeType: "application/json",
                temperature: 0.8, 
            }
        });

        const text = response.text;
        if (!text) return [];
        
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanText);
        
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error("Deep analysis failed:", e);
        return [];
    }
};