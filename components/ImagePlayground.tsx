import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { fileToGenerativePart, modifyImageWithGemini, IWindow, analyzeContentForSuggestions, SuggestionCategory, optimizeUserPrompt } from '../services/geminiService';
import { IMAGE_PROMPTS, IMAGE_MODELS, ASPECT_RATIOS, IMAGE_CATEGORIES } from '../constants';
import { ArrowRight, Image as ImageIcon, Upload, Download, Wand2, Settings2, Crop, Clock, Trash2, Plus, X, Sparkles, Eye, Palette, CheckCircle2, Zap, Lightbulb, SplitSquareHorizontal, Search, Mic, MicOff, Dices, Waves, Sliders } from 'lucide-react';

interface ImagePlaygroundProps {
  onError: (msg: string) => void;
  incomingPrompt?: string;
}

// Filter Presets
const FILTER_PRESETS = [
  { 
    id: 'original', 
    label: '原圖', 
    prompt: '', 
    filters: { grayscale: 0, sepia: 0, contrast: 100, brightness: 100, saturate: 100, blur: 0, hueRotate: 0, invert: 0, sharpen: 0 } 
  },
  { 
    id: 'bnw', 
    label: '黑白', 
    prompt: '將這張圖片轉換為高對比的黑白攝影風格，強調光影層次。', 
    filters: { grayscale: 100, sepia: 0, contrast: 120, brightness: 100, saturate: 0, blur: 0, hueRotate: 0, invert: 0, sharpen: 20 } 
  },
  { 
    id: 'vintage', 
    label: '復古', 
    prompt: '為圖片添加 1970 年代的復古濾鏡，帶有泛黃的懷舊色調和顆粒感。', 
    filters: { grayscale: 0, sepia: 60, contrast: 90, brightness: 105, saturate: 80, blur: 0, hueRotate: 0, invert: 0, sharpen: 0 } 
  },
  { 
    id: 'vivid', 
    label: '鮮豔', 
    prompt: '增強圖片的色彩飽和度與活力，讓顏色看起來更加鮮明流行。', 
    filters: { grayscale: 0, sepia: 0, contrast: 110, brightness: 105, saturate: 150, blur: 0, hueRotate: 0, invert: 0, sharpen: 10 } 
  },
  { 
    id: 'cyberpunk', 
    label: '賽博', 
    prompt: '應用賽博龐克 (Cyberpunk) 風格，強調高對比度、霓虹光感與冷冽氛圍。', 
    filters: { grayscale: 0, sepia: 0, contrast: 130, brightness: 110, saturate: 130, blur: 0, hueRotate: 15, invert: 0, sharpen: 30 } 
  },
  { 
    id: 'dreamy', 
    label: '夢幻', 
    prompt: '增加柔焦和模糊效果，營造夢幻般的氛圍。', 
    filters: { grayscale: 0, sepia: 10, contrast: 90, brightness: 110, saturate: 90, blur: 4, hueRotate: 0, invert: 0, sharpen: 0 } 
  },
  { 
    id: 'alien', 
    label: '異色', 
    prompt: '反轉顏色並調整色相，創造外星般的奇異視覺效果。', 
    filters: { grayscale: 0, sepia: 0, contrast: 120, brightness: 100, saturate: 150, blur: 0, hueRotate: 180, invert: 0, sharpen: 0 } 
  },
  { 
    id: 'faded', 
    label: '褪色', 
    prompt: '營造一種低飽和度、略帶憂鬱的褪色電影質感 (Matte look)。', 
    filters: { grayscale: 20, sepia: 10, contrast: 90, brightness: 110, saturate: 70, blur: 0, hueRotate: 0, invert: 0, sharpen: 0 } 
  },
  { 
    id: 'warm', 
    label: '暖陽', 
    prompt: '模擬「黃金時刻」的溫暖光線，增加畫面中的暖色調與柔和感。', 
    filters: { grayscale: 0, sepia: 30, contrast: 100, brightness: 105, saturate: 110, blur: 0, hueRotate: 0, invert: 0, sharpen: 0 } 
  }
];

export const ImagePlayground: React.FC<ImagePlaygroundProps> = ({ onError, incomingPrompt }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [outputText, setOutputText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showTips, setShowTips] = useState(true);
  const [isComparing, setIsComparing] = useState(false); // State for compare button
  
  // New features
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);

  // AI Suggestions
  const [suggestionCategories, setSuggestionCategories] = useState<SuggestionCategory[]>([]);
  const [activeSuggestionCategory, setActiveSuggestionCategory] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Preview / Editor State
  const [showPreviewEditor, setShowPreviewEditor] = useState(false);
  const [previewFilters, setPreviewFilters] = useState({ 
    grayscale: 0, 
    sepia: 0, 
    contrast: 100, 
    brightness: 100, 
    saturate: 100,
    blur: 0,
    hueRotate: 0,
    invert: 0,
    sharpen: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('promptcraft_image_model') || IMAGE_MODELS[0].id);
  const [selectedRatio, setSelectedRatio] = useState(() => localStorage.getItem('promptcraft_image_ratio') || ASPECT_RATIOS[0].id);

  useEffect(() => { localStorage.setItem('promptcraft_image_model', selectedModel); }, [selectedModel]);
  useEffect(() => { localStorage.setItem('promptcraft_image_ratio', selectedRatio); }, [selectedRatio]);

  useEffect(() => {
    if (incomingPrompt) applyTemplate(incomingPrompt);
  }, [incomingPrompt]);

  useEffect(() => {
    const urls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [selectedFiles]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('promptcraft_image_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const addToHistory = (newPrompt: string) => {
    if (!newPrompt.trim()) return;
    setHistory(prev => {
      const filtered = prev.filter(p => p !== newPrompt);
      const newHistory = [newPrompt, ...filtered].slice(0, 10);
      localStorage.setItem('promptcraft_image_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('promptcraft_image_history');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).filter((file: File) => file.type.startsWith('image/'));
      if (newFiles.length === 0) { onError("請選擇有效的圖片檔案。"); return; }
      if (selectedFiles.length + newFiles.length > 4) { onError("最多只能同時上傳 4 張圖片。"); return; }
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setOutputImage(null);
      setOutputText(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length <= 1) setShowPreviewEditor(false);
  };

  const handleExecute = async () => {
    if (selectedFiles.length === 0 || !prompt.trim()) return;

    setIsProcessing(true);
    setOutputImage(null);
    setOutputText(null);
    addToHistory(prompt);
    
    // User requested to keep suggestions open on selection, but maybe close on execute?
    // Let's keep it open if they are experimenting. 
    // setShowSuggestions(false); 

    try {
      const imagesPayload = await Promise.all(selectedFiles.map(async (file) => {
        const base64 = await fileToGenerativePart(file);
        return { base64, mimeType: file.type };
      }));

      const result = await modifyImageWithGemini(imagesPayload, prompt, selectedModel, selectedRatio);
      
      if (result.imageBase64) {
        const mimeType = result.mediaMimeType || 'image/png';
        setOutputImage(`data:${mimeType};base64,${result.imageBase64}`);
      }
      if (result.text) setOutputText(result.text);
      if (!result.imageBase64 && !result.text) onError("模型已處理請求，但未返回視覺或文字內容。請嘗試不同的提示詞。");
    } catch (err: any) {
      onError(err.message || '圖片處理失敗。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMagicOptimize = async () => {
      if (!prompt.trim()) return;
      setIsOptimizing(true);
      try {
          const optimized = await optimizeUserPrompt(prompt, 'image');
          setPrompt(optimized);
      } catch (e) {
          onError("提示詞優化失敗");
      } finally {
          setIsOptimizing(false);
      }
  };

  const applyTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt);
    const match = templatePrompt.match(/\[(.*?)\]/);
    if (match && promptInputRef.current) {
      const start = match.index!;
      const end = start + match[0].length;
      setTimeout(() => {
        if (promptInputRef.current) {
          promptInputRef.current.focus();
          promptInputRef.current.setSelectionRange(start, end);
        }
      }, 10);
    } else {
      setTimeout(() => promptInputRef.current?.focus(), 10);
    }
  };

  const applyPresetFilter = (preset: typeof FILTER_PRESETS[0]) => {
    setPreviewFilters(preset.filters);
    if (preset.prompt) setPrompt(preset.prompt);
  };

  const getFileExtension = (dataUrl: string) => {
    if (dataUrl.startsWith('data:image/gif')) return 'gif';
    if (dataUrl.startsWith('data:image/jpeg')) return 'jpg';
    if (dataUrl.startsWith('data:image/webp')) return 'webp';
    return 'png';
  };

  const generatePromptFromPreview = () => {
    let generatedPrompt = "任務：修改圖片\n";
    const changes: string[] = [];

    // Basic
    if (previewFilters.brightness !== 100) changes.push(`調整亮度為 ${previewFilters.brightness}%。`);
    if (previewFilters.contrast !== 100) changes.push(`調整對比度為 ${previewFilters.contrast}%。`);
    if (previewFilters.saturate !== 100) changes.push(`調整飽和度為 ${previewFilters.saturate}%。`);
    
    // Color & Effects
    if (previewFilters.grayscale > 50) changes.push("將圖片轉換為黑白/灰階模式 (Black and White)。");
    if (previewFilters.sepia > 50) changes.push("應用復古懷舊的棕褐色濾鏡 (Sepia filter)。");
    if (previewFilters.hueRotate !== 0) changes.push(`調整色相 (Hue Rotate) ${previewFilters.hueRotate} 度。`);
    if (previewFilters.invert > 0) changes.push("反轉顏色 (Invert Colors)。");
    
    // Details
    if (previewFilters.blur > 0) changes.push(`增加模糊效果 (Blur ${previewFilters.blur}px)，使畫面柔和。`);
    if (previewFilters.sharpen > 0) changes.push(`銳化圖片 (Sharpen)，增強細節與邊緣清晰度。`);

    if (changes.length === 0) { onError("預覽設定與原圖一致，未包含明顯變化。"); return; }

    generatedPrompt += "指令：\n" + changes.join("\n");
    setPrompt(generatedPrompt);
    setTimeout(() => promptInputRef.current?.focus(), 100);
  };

  const handleRandomPrompt = () => {
      const random = IMAGE_PROMPTS[Math.floor(Math.random() * IMAGE_PROMPTS.length)];
      setSelectedCategory(random.category);
      applyTemplate(random.prompt);
  };

  const handleAnalyzeSuggestions = async () => {
      if (selectedFiles.length === 0) {
          onError("請先上傳圖片，才能進行分析。");
          return;
      }

      // UX Improvement: Instant reopen if already loaded
      if (suggestionCategories.length > 0 && !showSuggestions) {
          setShowSuggestions(true);
          return;
      }

      setIsAnalyzing(true);
      setShowSuggestions(true);
      setSuggestionCategories([]);
      setActiveSuggestionCategory(0);
      try {
          const imagesPayload = await Promise.all(selectedFiles.map(async (file) => {
              const base64 = await fileToGenerativePart(file);
              return { base64, mimeType: file.type };
          }));
          const results = await analyzeContentForSuggestions('image', imagesPayload);
          setSuggestionCategories(results);
      } catch(e) {
          onError("分析失敗，請稍後再試。");
          setShowSuggestions(false);
      } finally {
          setIsAnalyzing(false);
      }
  };

  const toggleListening = () => {
      if (isListening) {
          if (recognitionRef.current) {
              recognitionRef.current.stop();
          }
          setIsListening(false);
          setInterimTranscript('');
          return;
      }

      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          onError("您的瀏覽器不支援語音輸入功能。");
          return;
      }

      const SpeechRecognition = (window as unknown as IWindow).webkitSpeechRecognition || (window as unknown as IWindow).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = 'zh-TW';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
          setIsListening(true);
          setInterimTranscript('');
      };

      recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
      };

      recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
      };

      recognition.onresult = (event: any) => {
          let finalTranscript = '';
          let interim = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                  finalTranscript += event.results[i][0].transcript;
              } else {
                  interim += event.results[i][0].transcript;
              }
          }

          if (finalTranscript) {
              setPrompt(prev => prev + (prev ? ' ' : '') + finalTranscript);
          }
          setInterimTranscript(interim);
      };

      recognition.start();
  };

  const filteredPrompts = IMAGE_PROMPTS.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
                          p.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return searchQuery !== '' ? matchesSearch : (matchesCategory && matchesSearch);
  });
  
  // Slider config for clean render
  const sliders = [
      { label: '亮度', key: 'brightness', min: 0, max: 200, unit: '%' },
      { label: '對比', key: 'contrast', min: 0, max: 200, unit: '%' },
      { label: '飽和', key: 'saturate', min: 0, max: 200, unit: '%' },
      { label: '模糊', key: 'blur', min: 0, max: 20, unit: 'px' },
      { label: '色相', key: 'hueRotate', min: 0, max: 360, unit: '°' },
      { label: '銳化', key: 'sharpen', min: 0, max: 100, unit: '', noPreview: true },
      { label: '懷舊', key: 'sepia', min: 0, max: 100, unit: '%' },
      { label: '黑白', key: 'grayscale', min: 0, max: 100, unit: '%' },
      { label: '反轉', key: 'invert', min: 0, max: 100, unit: '%' },
  ];

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Main Visual Area (unchanged layout, see previous component) */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
        {/* Input Area (Left) */}
        <div className="bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-800/90 dark:to-slate-800/50 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-5 flex flex-col shadow-2xl shadow-rose-500/10 dark:shadow-rose-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-rose-500/20">
          <div className="flex justify-between items-center text-rose-900/60 dark:text-rose-300/60 text-xs font-bold uppercase tracking-wider mb-3 px-2">
            <span>原始圖片 ({selectedFiles.length}/4)</span>
            <div className="flex gap-2">
              {selectedFiles.length > 0 && (
                <button
                  onClick={() => setShowPreviewEditor(!showPreviewEditor)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold transition-all duration-300 ${showPreviewEditor ? 'bg-rose-500 text-white shadow-md scale-105' : 'bg-white dark:bg-slate-700 text-slate-500 hover:text-rose-500 hover:bg-rose-50'}`}
                >
                  <Eye size={12} /> {showPreviewEditor ? '關閉預覽' : '編輯預覽'}
                </button>
              )}
              {selectedFiles.length > 0 && (
                <button 
                  onClick={() => setSelectedFiles([])}
                  className="text-red-500 hover:text-white hover:bg-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg transition-all text-[10px] hover:shadow-md"
                >
                  清除
                </button>
              )}
            </div>
          </div>
          
          {/* Preview Controls Panel */}
          {showPreviewEditor && selectedFiles.length > 0 && (
            <div className="mb-4 p-4 bg-white/60 dark:bg-slate-700/60 backdrop-blur-md border border-rose-100 dark:border-rose-900 rounded-2xl animate-in slide-in-from-top-2 shadow-inner">
               <div className="flex flex-col gap-4">
                 {/* Quick Filter Presets */}
                 <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mb-2"><Zap size={10}/> 快速濾鏡</h4>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                      {FILTER_PRESETS.map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => applyPresetFilter(preset)}
                          className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-xs font-medium text-slate-600 dark:text-slate-300 transition-all shadow-sm active:scale-95 hover:-translate-y-0.5"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 pt-2 border-t border-slate-100 dark:border-slate-600">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Sliders size={10}/> 手動調整</h4>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {sliders.map(s => (
                            <div key={s.key} className="flex items-center gap-2">
                                <span className="text-[10px] w-8 text-slate-500 dark:text-slate-400 truncate text-right">{s.label}</span>
                                <input 
                                    type="range" 
                                    min={s.min} 
                                    max={s.max} 
                                    value={(previewFilters as any)[s.key]} 
                                    onChange={(e) => setPreviewFilters(p => ({...p, [s.key]: Number(e.target.value)}))} 
                                    className="flex-grow h-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                    title={s.noPreview ? "僅影響生成提示詞，無即時預覽" : ""}
                                />
                                <span className="text-[9px] w-6 text-slate-400 font-mono text-right">
                                    {(previewFilters as any)[s.key]}{s.unit}
                                </span>
                            </div>
                        ))}
                      </div>
                      <div className="text-[9px] text-slate-400 text-center mt-1">* 部分效果 (如銳化) 僅在生成時生效，無即時預覽。</div>
                    </div>
                 </div>
                 <button onClick={generatePromptFromPreview} className="mt-2 w-full py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/30 hover:-translate-y-0.5 active:scale-95">
                   <CheckCircle2 size={14} /> 將預覽設定轉換為提示詞
                 </button>
               </div>
            </div>
          )}
          
          <div className="flex-grow bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 relative overflow-hidden p-4 hover:border-rose-400 hover:bg-rose-50/30 dark:hover:bg-rose-900/20 transition-all duration-300 select-none">
            {selectedFiles.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-rose-100 dark:shadow-rose-900/20 group-hover:shadow-rose-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                    <Upload className="text-rose-400 group-hover:text-rose-500 transition-colors" size={36} />
                 </div>
                 <p className="text-slate-700 dark:text-slate-200 font-bold text-lg mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">點擊上傳圖片</p>
                 <p className="text-slate-400 text-sm">支援 JPG, PNG, GIF</p>
                 <Button variant="secondary" accentColor="rose" className="mt-6 pointer-events-none opacity-80 group-hover:opacity-100 group-hover:scale-105">選擇檔案</Button>
              </div>
            ) : (
              <div className={`grid gap-4 h-full content-start overflow-y-auto pr-1 ${selectedFiles.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {previewUrls.map((url, index) => (
                  <div 
                    key={index} 
                    className="relative group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-md flex items-center justify-center min-h-[150px] transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer"
                  >
                    <img 
                      src={url} 
                      alt={`Input ${index + 1}`} 
                      className="max-w-full max-h-full object-contain"
                      style={showPreviewEditor ? {
                        filter: `grayscale(${previewFilters.grayscale}%) sepia(${previewFilters.sepia}%) contrast(${previewFilters.contrast}%) brightness(${previewFilters.brightness}%) saturate(${previewFilters.saturate}%) blur(${previewFilters.blur}px) hue-rotate(${previewFilters.hueRotate}deg) invert(${previewFilters.invert}%)`
                      } : {}}
                    />
                    <button onClick={(e) => { e.stopPropagation(); removeFile(index); }} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110 shadow-lg translate-y-2 group-hover:translate-y-0">
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded-md text-[10px] text-white backdrop-blur-sm z-10">Img #{index + 1}</div>
                  </div>
                ))}
                {selectedFiles.length < 4 && (
                  <button onClick={() => fileInputRef.current?.click()} className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all group min-h-[150px] bg-white/50 dark:bg-slate-800/50 hover:scale-[0.98]">
                    <Plus className="text-slate-300 group-hover:text-rose-500 transition-colors" size={32} />
                    <span className="text-xs text-slate-400 group-hover:text-rose-600 mt-2 font-bold transition-colors">新增</span>
                  </button>
                )}
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" multiple />
          </div>
        </div>

        {/* Output Area */}
        <div className="bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-800/90 dark:to-slate-800/50 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-5 flex flex-col shadow-2xl shadow-rose-500/10 dark:shadow-rose-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-rose-500/20">
          <div className="flex justify-between items-center text-rose-900/60 dark:text-rose-300/60 text-xs font-bold uppercase tracking-wider mb-3 px-2">
            <span>AI 結果</span>
            <div className="flex gap-2">
                 {/* Compare Button */}
                 {outputImage && selectedFiles.length > 0 && (
                    <button 
                        onMouseDown={() => setIsComparing(true)}
                        onMouseUp={() => setIsComparing(false)}
                        onMouseLeave={() => setIsComparing(false)}
                        onTouchStart={() => setIsComparing(true)}
                        onTouchEnd={() => setIsComparing(false)}
                        className="text-slate-500 hover:text-rose-500 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all text-[10px] font-bold shadow-sm hover:shadow hover:scale-105 select-none active:bg-rose-50"
                        title="按住此按鈕以查看原圖"
                    >
                        <SplitSquareHorizontal size={12} /> <span className="hidden sm:inline">長按比對</span>
                    </button>
                 )}
                 {outputImage && (
                    <a href={outputImage} download={`gemini-edit.${getFileExtension(outputImage)}`} className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all text-[10px] font-bold shadow-sm hover:shadow hover:scale-105">
                        <Download size={12} /> 儲存
                    </a>
                 )}
            </div>
          </div>
          <div className={`flex-grow flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden ${isProcessing ? 'border-rose-200' : ''}`}>
            {isProcessing ? (
               <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
                 <div className="p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full shadow-inner relative">
                    <span className="absolute inset-0 rounded-full border-4 border-rose-100 dark:border-rose-800 border-t-rose-500 animate-spin"></span>
                    <Wand2 size={40} className="relative z-10" />
                 </div>
                 <span className="text-rose-600 dark:text-rose-400 font-bold tracking-tight animate-pulse">AI 正在創作中...</span>
               </div>
            ) : outputImage ? (
              <div className="relative w-full h-full flex items-center justify-center p-2 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-in fade-in zoom-in duration-500">
                <img 
                    src={isComparing && previewUrls.length > 0 ? previewUrls[0] : outputImage} 
                    alt="AI Generated" 
                    className="max-w-full max-h-[400px] object-contain shadow-2xl rounded-lg transition-all duration-100" 
                />
                {isComparing && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-3 py-1 rounded-full pointer-events-none backdrop-blur-sm">
                        原始圖片
                    </div>
                )}
              </div>
            ) : outputText ? (
                <div className="p-8 text-slate-700 dark:text-slate-200 text-center bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 max-w-md mx-4 animate-in slide-in-from-bottom-4">
                    <p className="whitespace-pre-wrap leading-relaxed">{outputText}</p>
                    <span className="text-xs text-slate-400 mt-4 block border-t border-slate-100 dark:border-slate-700 pt-2">(未返回圖片，僅有文字描述)</span>
                </div>
            ) : (
              <div className="text-slate-300 dark:text-slate-600 flex flex-col items-center select-none">
                <ImageIcon size={64} className="mb-4 opacity-20" />
                <p className="font-medium">修改後的圖片將顯示於此</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggestion Panel Overlay */}
      {showSuggestions && (
          <div className="relative w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-rose-200 dark:border-rose-800 rounded-2xl p-4 animate-in slide-in-from-top-4 mb-4 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                      <Lightbulb size={16} className="text-yellow-500" /> AI 深度分析顧問：50 種修圖策略
                  </h3>
                  <button onClick={() => setShowSuggestions(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                      <X size={14} />
                  </button>
              </div>
              
              {isAnalyzing ? (
                  <div className="flex justify-center items-center py-8 gap-2 text-rose-600 dark:text-rose-400 font-medium text-xs">
                      <span className="animate-spin">⌛</span> 正在深入分析圖片並生成 50 種建議，請稍候...
                  </div>
              ) : (
                  <div className="flex flex-col gap-4">
                      {/* Category Tabs */}
                      <div className="flex flex-wrap gap-2">
                          {suggestionCategories.map((cat, index) => (
                              <button
                                  key={index}
                                  onClick={() => setActiveSuggestionCategory(index)}
                                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                                      activeSuggestionCategory === index
                                      ? 'bg-rose-500 text-white shadow-md'
                                      : 'bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-900/30'
                                  }`}
                              >
                                  {cat.categoryName}
                              </button>
                          ))}
                      </div>

                      {/* Suggestions Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                          {suggestionCategories[activeSuggestionCategory]?.items?.map((s, i) => (
                              <button
                                  key={i}
                                  onClick={() => {
                                      applyTemplate(s.prompt);
                                      // Kept open for better UX
                                  }}
                                  className="flex flex-col items-start p-3 bg-white/70 dark:bg-slate-800/70 border border-white dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-500 rounded-xl transition-all hover:shadow-md hover:-translate-y-1 text-left h-full group"
                              >
                                  <span className="text-xl mb-1 group-hover:scale-110 transition-transform duration-300">{s.emoji}</span>
                                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight mb-1">{s.title}</span>
                                  <span className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-2">{s.description}</span>
                              </button>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* Controls */}
      <div className="bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-800/80 dark:to-slate-800/40 backdrop-blur-2xl rounded-[2rem] p-6 border border-white/50 dark:border-slate-700/50 shadow-2xl shadow-rose-500/10 dark:shadow-rose-900/20 transition-transform duration-300 hover:shadow-rose-500/15">
        <div className="flex flex-col gap-4">
           {showTips && (
             <div className="flex items-start gap-3 bg-rose-50/80 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 p-3 rounded-xl animate-in slide-in-from-bottom-2">
               {/* Tips Content Omitted */}
               <div className="p-1.5 bg-rose-200 dark:bg-rose-800 rounded-full flex-shrink-0 text-rose-600 dark:text-rose-200">
                 <Lightbulb size={14} />
               </div>
               <div className="flex-grow">
                 <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-1">💡 使用小撇步：不知道該選哪個提示詞？</h4>
                 <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                   <p><span className="font-bold text-rose-600 dark:text-rose-400">📂 如果您上傳的是文件/文字圖：</span> 請嘗試選擇 <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-rose-200 dark:border-rose-800 rounded text-rose-600 dark:text-rose-400 font-bold">資訊圖表</span> 分類，將枯燥的文字轉為吸睛的視覺圖。</p>
                   <p><span className="font-bold text-rose-600 dark:text-rose-400">📷 如果您上傳的是照片：</span> 試試 <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-rose-200 dark:border-rose-800 rounded text-rose-600 dark:text-rose-400 font-bold">濾鏡特效</span> 或 <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-rose-200 dark:border-rose-800 rounded text-rose-600 dark:text-rose-400 font-bold">藝術風格</span> 來改變氛圍。</p>
                   <p><span className="font-bold text-rose-600 dark:text-rose-400">📦 如果您想修改物件：</span> 使用 <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-rose-200 dark:border-rose-800 rounded text-rose-600 dark:text-rose-400 font-bold">修圖改圖</span> 裡的「局部重繪」或「添加元素」。</p>
                 </div>
               </div>
               <button onClick={() => setShowTips(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                 <X size={14} />
               </button>
             </div>
           )}

           <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 border-b border-rose-50 dark:border-slate-700/50 pb-5 mb-1">
              <div className="flex-grow w-full">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Sparkles size={12} className="text-rose-400" /> 創意濾鏡 ({filteredPrompts.length})
                    </span>

                    <div className="flex items-center gap-2">
                        {/* Search Bar */}
                        <div className="relative group/search">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-rose-500 transition-colors" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="搜尋..."
                                className="pl-6 pr-2 py-1 text-[10px] w-24 focus:w-40 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-rose-400 transition-all"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={10}/></button>
                            )}
                        </div>

                        {/* Category Tabs */}
                        {searchQuery === '' && (
                            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none max-w-[40%] lg:max-w-none">
                                {IMAGE_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`text-[10px] px-3 py-1 rounded-full whitespace-nowrap transition-all duration-300 ${
                                            selectedCategory === cat.id 
                                            ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-bold shadow-sm scale-105' 
                                            : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-rose-600 dark:hover:text-rose-400 hover:shadow-sm'
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                  {filteredPrompts.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t.prompt)}
                      className="group relative text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700/80 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600/60 hover:border-rose-500 transition-all duration-200 font-medium text-left truncate shadow-sm hover:shadow-rose-500/30 hover:-translate-y-0.5 active:scale-95"
                      title={t.description}
                    >
                      {t.label}
                    </button>
                  ))}
                  {filteredPrompts.length === 0 && (
                      <div className="w-full text-center py-4 text-slate-400 text-xs italic">
                          沒有找到符合「{searchQuery}」的提示詞
                      </div>
                  )}
                </div>

                {history.length > 0 && (
                  <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/50 animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={12} className="text-slate-400"/>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">歷史紀錄</span>
                      <button onClick={clearHistory} className="ml-auto text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 size={10}/> 清除
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {history.map((h, i) => (
                        <button key={i} onClick={() => setPrompt(h)} className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-100 dark:border-slate-600 transition-all hover:scale-105 active:scale-95 max-w-[150px] truncate">
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

               <div className="flex-shrink-0 flex flex-wrap items-center gap-3 self-start">
                 <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-700/50 p-2 rounded-xl border border-white/50 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow">
                    <Settings2 size={14} className="text-rose-400 ml-1" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">模型:</span>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="bg-transparent text-xs text-rose-600 dark:text-rose-400 font-bold focus:outline-none cursor-pointer pr-1"
                    >
                      {IMAGE_MODELS.map(m => <option key={m.id} value={m.id} className="text-slate-700 dark:text-slate-300 dark:bg-slate-800">{m.label}</option>)}
                    </select>
                 </div>
                 <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-700/50 p-2 rounded-xl border border-white/50 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow">
                    <Crop size={14} className="text-rose-400 ml-1" />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">比例:</span>
                    <select
                      value={selectedRatio}
                      onChange={(e) => setSelectedRatio(e.target.value)}
                      className="bg-transparent text-xs text-rose-600 dark:text-rose-400 font-bold focus:outline-none cursor-pointer pr-1"
                    >
                      {ASPECT_RATIOS.map(r => <option key={r.id} value={r.id} className="text-slate-700 dark:text-slate-300 dark:bg-slate-800">{r.label}</option>)}
                    </select>
                 </div>
               </div>
           </div>

          <div className="flex flex-col gap-3">
             <div className="relative group">
                <textarea
                  ref={promptInputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleExecute(); } }}
                  placeholder="✨ 描述如何修改圖片... 例如：「將文字轉為資訊圖表」"
                  className="w-full bg-white/50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-xl px-5 py-4 shadow-inner focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none resize-none min-h-[80px] leading-relaxed transition-all placeholder:text-slate-400"
                  rows={2}
                />
                
                {/* Real-time Voice Transcription Overlay */}
                {isListening && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-red-200 dark:border-red-900 rounded-xl p-3 shadow-lg animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="relative flex items-center justify-center w-4 h-4">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </div>
                            <span className="text-xs font-bold text-red-500">正在聆聽...</span>
                            <div className="ml-auto">
                                <Waves size={16} className="text-red-400 animate-pulse" />
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic min-h-[1.5em]">
                            {interimTranscript || "請說話..."}
                        </p>
                    </div>
                )}
             </div>
             
             {/* Toolbar */}
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                   <button 
                      onClick={handleMagicOptimize}
                      disabled={isOptimizing}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold border ${isOptimizing ? 'text-rose-600 bg-rose-100 border-rose-200 animate-pulse' : 'text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-rose-300 dark:hover:border-rose-700 shadow-sm'}`}
                      title="魔術棒：優化提示詞"
                   >
                       <Wand2 size={14} /> 魔法優化
                   </button>
                   <button 
                      onClick={handleAnalyzeSuggestions}
                      disabled={isAnalyzing}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold border ${isAnalyzing ? 'text-rose-600 bg-rose-100 border-rose-200 animate-pulse' : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-600 dark:hover:text-rose-400 shadow-sm'}`}
                      title="AI 深度分析顧問"
                   >
                       <Lightbulb size={14} className="text-yellow-500" /> 深度分析
                   </button>
                   <button 
                      onClick={handleRandomPrompt}
                      className="p-2 text-slate-500 hover:text-rose-600 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-rose-300 dark:hover:border-rose-700 rounded-lg transition-all shadow-sm"
                      title="隨機靈感"
                   >
                       <Dices size={16} />
                   </button>
                   <button 
                      onClick={toggleListening}
                      className={`p-2 rounded-lg transition-all border shadow-sm ${isListening ? 'text-white bg-red-500 border-red-600 animate-pulse shadow-red-500/30' : 'text-slate-500 hover:text-rose-600 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-rose-300 dark:hover:border-rose-700'}`}
                      title={isListening ? "停止錄音" : "語音輸入"}
                   >
                       {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                   </button>
                </div>

                <Button 
                    onClick={handleExecute} 
                    isLoading={isProcessing} 
                    accentColor="rose"
                    disabled={selectedFiles.length === 0 || !prompt} 
                    className="w-full sm:w-auto px-8 py-2.5 shadow-lg shadow-rose-500/20"
                >
                    生成 <ArrowRight size={16} className="ml-2" />
                </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}