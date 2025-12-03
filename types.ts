
export type Mode = 'text' | 'image' | 'txt2img' | 'img2txt' | 'img2vid';

export type PromptCategory = 
  | 'refine' | 'creative' | 'technical' | 'fun' // Original Text
  | 'business' | 'coding' | 'education' | 'analysis' | 'synthesis' | 'life' // New Text (synthesis + life added)
  | 'art' | 'photography' | 'design' | 'fantasy' | 'illustration' | 'art_illustration' | 'fashion' // Txt2Img (fashion added)
  | 'editing' | 'filter' | 'infographic' // Image Edit
  | 'caption' | 'extract' | 'convert' | 'object' // Img2Txt
  | 'camera_movement' | 'physics' | 'atmosphere' | 'vfx'; // Img2Vid

export interface PromptTemplate {
  id: string;
  label: string;
  prompt: string;
  description: string;
  category: PromptCategory;
  subcategory?: string;
}

export interface MessageState {
  type: 'success' | 'error' | 'info';
  content: string;
}

export interface LoadingState {
  isLoading: boolean;
  step?: string;
}