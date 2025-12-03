import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { generateImageFromText, suggestImageKeywords, IWindow, analyzeContentForSuggestions, SuggestionCategory, optimizeUserPrompt } from '../services/geminiService';
import { TXT2IMG_PROMPTS, IMAGE_MODELS, ASPECT_RATIOS, TXT2IMG_CATEGORIES } from '../constants';
import { PromptTemplate } from '../types';
import { ArrowRight, Download, Wand2, Settings2, Crop, Clock, Trash2, Sparkles, Filter, ChevronDown, ChevronUp, Plus, BarChart3, Zap, Ban, Search, Mic, MicOff, Dices, X, Lightbulb, Image as ImageIcon } from 'lucide-react';

interface TextToImagePlaygroundProps {
  onError: (msg: string) => void;
  incomingPrompt?: string;
}

export const TextToImagePlayground: React.FC<TextToImagePlaygroundProps> = ({ onError, incomingPrompt }) => {
  const [prompt, setPrompt] = useState('');
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false); // Magic wand state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openSubcategories, setOpenSubcategories] = useState<{[key: string]: boolean}>({});
  const [sessionHistory, setSessionHistory] = useState<string[]>([]); // New session gallery state
  
  // New features
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  // AI Suggestions
  const [suggestionCategories, setSuggestionCategories] = useState<SuggestionCategory[]>([]);
  const [activeSuggestionCategory, setActiveSuggestionCategory] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Advanced Settings
  const [temperature, setTemperature] = useState(1);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('none');
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('promptcraft_txt2img_model') || IMAGE_MODELS[0].id);
  const [selectedRatio, setSelectedRatio] = useState(() => localStorage.getItem('promptcraft_txt2img_ratio') || ASPECT_RATIOS[0].id);

  useEffect(() => { localStorage.setItem('promptcraft_txt2img_model', selectedModel); }, [selectedModel]);
  useEffect(() => { localStorage.setItem('promptcraft_txt2img_ratio', selectedRatio); }, [selectedRatio]);

  useEffect(() => {
    if (incomingPrompt) {
        applyTemplate(incomingPrompt);
    }
  }, [incomingPrompt]);

  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('promptcraft_txt2img_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const addToHistory = (newPrompt: string) => {
    if (!newPrompt.trim()) return;
    setHistory(prev => {
      const filtered = prev.filter(p => p !== newPrompt);
      const newHistory = [newPrompt, ...filtered].slice(0, 10);
      localStorage.setItem('promptcraft_txt2img_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('promptcraft_txt2img_history');
  };

  const handleExecute = async () => {
    if (!prompt.trim()) return;

    setIsProcessing(true);
    // Do NOT clear outputImage immediately to avoid flicker, let loading spinner overlay it
    // setOutputImage(null); 
    addToHistory(prompt);
    setShowSuggestions(false); // Hide suggestions

    // Merge style into prompt if selected
    let finalPrompt = prompt;
    if (selectedStyle !== 'none') {
        const styleText = {
            'cinematic': 'cinematic lighting, movie scene, high detailed, 8k',
            'anime': 'anime style, studio ghibli inspired, vibrant colors',
            'watercolor': 'watercolor painting, soft artistic strokes, pastel colors',
            '3d': '3D render, octane render, unreal engine 5, ray tracing',
            'pixel': 'pixel art, 16-bit, retro game style'
        }[selectedStyle] || '';
        if (styleText) finalPrompt += `, ${styleText}`;
    }

    try {
      const result = await generateImageFromText(finalPrompt, selectedModel, selectedRatio, {
          temperature,
          seed,
          negativePrompt // Pass negative prompt to service
      });
      
      if (result.imageBase64) {
        const mimeType = result.mediaMimeType || 'image/png';
        const newImage = `data:${mimeType};base64,${result.imageBase64}`;
        setOutputImage(newImage);
        // Add to session gallery (newest first)
        setSessionHistory(prev => [newImage, ...prev]);
      } else {
        onError("未生成圖片，可能因為安全過濾或模型限制。請嘗試不同的提示詞。");
      }
    } catch (err: any) {
      onError(err.message || '圖片生成失敗。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestKeywords = async () => {
    if (!prompt.trim()) return;
    setIsSuggesting(true);
    try {
        const keywords = await suggestImageKeywords(prompt);
        setSuggestedKeywords(keywords);
    } catch (e) {
        console.error(e);
    } finally {
        setIsSuggesting(false);
    }
  };

  const handleMagicOptimize = async () => {
      if (!prompt.trim()) return;
      setIsOptimizing(true);
      try {
          // Pass 'txt2img' as mode
          const optimized = await optimizeUserPrompt(prompt, 'txt2img');
          setPrompt(optimized);
      } catch (e) {
          onError("提示詞優化失敗");
      } finally {
          setIsOptimizing(false);
      }
  };

  const addKeyword = (keyword: string) => {
      const newPrompt = prompt.trim() + (prompt.trim() ? ', ' : '') + keyword;
      setPrompt(newPrompt);
      setSuggestedKeywords(prev => prev.filter(k => k !== keyword));
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
  
  const handleRandomPrompt = () => {
      const random = TXT2IMG_PROMPTS[Math.floor(Math.random() * TXT2IMG_PROMPTS.length)];
      setSelectedCategory(random.category);
      if (random.subcategory) setOpenSubcategories({[random.subcategory]: true});
      applyTemplate(random.prompt);
  };

  const handleAnalyzeSuggestions = async () => {
      // For Text-to-Image, we can analyze the user's current (partial) prompt
      // If empty, the analysis service handles it by suggesting random ideas
      setIsAnalyzing(true);
      setShowSuggestions(true);
      setSuggestionCategories([]);
      setActiveSuggestionCategory(0);
      try {
          const results = await analyzeContentForSuggestions('txt2img', prompt || "Please suggest creative image ideas");
          setSuggestionCategories(results);
      } catch(e) {
          onError("分析失敗，請稍後再試。");
          setShowSuggestions(false);
      } finally {
          setIsAnalyzing(false);
      }
  };

  const startListening = () => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          onError("您的瀏覽器不支援語音輸入功能。");
          return;
      }

      const SpeechRecognition = (window as unknown as IWindow).webkitSpeechRecognition || (window as unknown as IWindow).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-TW';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
      };
      recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setPrompt(prev => prev + (prev ? ' ' : '') + transcript);
      };

      recognition.start();
  };

  // Calculate Prompt Complexity Score
  const getPromptStrength = () => {
      const lengthScore = Math.min(prompt.length / 100, 1) * 40; // up to 40 pts for length
      
      // Keywords that add detail
      const technicalTerms = ['lighting', 'shadow', 'render', '8k', '4k', 'style', 'view', 'shot', 'lens', 'texture', 'detailed'];
      const foundTerms = technicalTerms.filter(term => prompt.toLowerCase().includes(term));
      const keywordScore = Math.min(foundTerms.length * 5, 40); // up to 40 pts for keywords

      // Structure check (commas often imply descriptive clauses)
      const structureScore = (prompt.split(',').length - 1) * 5; // up to 20 pts

      const total = Math.min(lengthScore + keywordScore + structureScore, 100);
      return Math.floor(total);
  };
  
  const strength = getPromptStrength();
  const getStrengthColor = (s: number) => {
      if (s < 30) return 'bg-red-500';
      if (s < 70) return 'bg-amber-500';
      return 'bg-emerald-500';
  };
  const getStrengthLabel = (s: number) => {
      if (s < 30) return '簡單 (Basic)';
      if (s < 70) return '不錯 (Good)';
      return '豐富 (Rich)';
  };

  // Filter Logic: Combine Category + Search Query
  const filteredPrompts = TXT2IMG_PROMPTS.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
                          p.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.subcategory && p.subcategory.toLowerCase().includes(searchQuery.toLowerCase()));
    return searchQuery !== '' ? matchesSearch : (matchesCategory && matchesSearch);
  });
  
  // Group prompts by subcategory
  const groupedPrompts = filteredPrompts.reduce((acc, p) => {
      const sub = p.subcategory || '其他 (Others)';
      if (!acc[sub]) acc[sub] = [];
      acc[sub].push(p);
      return acc;
  }, {} as {[key: string]: PromptTemplate[]});
  
  // If searching, auto-expand all subcategories
  useEffect(() => {
      if (searchQuery) {
          const allSubs = Object.keys(groupedPrompts).reduce((acc, key) => {
              acc[key] = true;
              return acc;
          }, {} as any);
          setOpenSubcategories(allSubs);
      }
  }, [searchQuery, filteredPrompts.length]); // Dependency on filtered length to update when results change

  const toggleSubcategory = (sub: string) => {
      setOpenSubcategories(prev => ({...prev, [sub]: !prev[sub]}));
  };

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* Top Section: Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-[400px]">
        
        {/* Output Area */}
        <div className="order-2 lg:order-1 bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-800/90 dark:to-slate-800/50 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-5 flex flex-col shadow-2xl shadow-emerald-500/10 dark:shadow-emerald-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-emerald-500/20">
          <div className="flex justify-between items-center text-emerald-900/60 dark:text-emerald-300/60 text-xs font-bold uppercase tracking-wider mb-3 px-2">
            <span>生成結果</span>
             {outputImage && (
               <a 
                 href={outputImage} 
                 download="gemini-generated.png"
                 className="text-emerald-600 hover:text-white hover:bg-emerald-600 border border-emerald-100 dark:border-emerald-800 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all text-[10px] font-bold shadow-sm hover:shadow hover:scale-105"
               >
                 <Download size={12} /> 下載
               </a>
             )}
          </div>

          <div className={`flex-grow flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden transition-all duration-300 ${isProcessing ? 'border-emerald-200' : ''}`}>
            {isProcessing ? (
               <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
                 <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-full shadow-inner relative">
                    <span className="absolute inset-0 rounded-full border-4 border-emerald-100 dark:border-emerald-800 border-t-emerald-500 animate-spin"></span>
                    <Wand2 size={40} className="relative z-10" />
                 </div>
                 <span className="text-emerald-600 dark:text-emerald-400 font-bold tracking-tight animate-pulse">AI 正在繪圖中...</span>
               </div>
            ) : outputImage ? (
              <div className="relative w-full h-full flex items-center justify-center p-2 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-in fade-in zoom-in duration-700">
                <img 
                  src={outputImage} 
                  alt="AI Generated" 
                  className="max-w-full max-h-[400px] object-contain shadow-2xl rounded-lg"
                />
              </div>
            ) : (
              <div className="text-slate-300 dark:text-slate-600 flex flex-col items-center text-center p-6 select-none">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-4 transform rotate-3 hover:rotate-12 transition-transform duration-500 shadow-inner">
                    <Sparkles size={36} className="opacity-30" />
                </div>
                <p className="font-medium">輸入提示詞，讓 AI 為您作畫</p>
                <p className="text-sm opacity-60 mt-1">支援各類風格、寫實攝影與 3D 設計</p>
              </div>
            )}
          </div>

          {/* Session Gallery */}
          {sessionHistory.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 animate-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <ImageIcon size={10} /> 創作歷程膠卷 ({sessionHistory.length})
                      </span>
                      <button 
                        onClick={() => setSessionHistory([])} 
                        className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                      >
                          <Trash2 size={10} /> 清除
                      </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {sessionHistory.map((img, index) => (
                          <button
                              key={index}
                              onClick={() => setOutputImage(img)}
                              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${outputImage === img ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/30' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600 opacity-70 hover:opacity-100'}`}
                          >
                              <img src={img} alt={`History ${index}`} className="w-full h-full object-cover" />
                          </button>
                      ))}
                  </div>
              </div>
          )}
        </div>

        {/* Input & Controls */}
        <div className="order-1 lg:order-2 bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-800/80 dark:to-slate-800/40 backdrop-blur-2xl rounded-[2rem] p-6 border border-white/50 dark:border-slate-700/50 shadow-2xl shadow-emerald-500/10 dark:shadow-emerald-900/20 transition-transform duration-300 hover:shadow-emerald-500/15">
          
           {/* Settings Row */}
           <div className="flex flex-wrap gap-3 mb-6">
             <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-700/50 p-2 rounded-xl border border-white/50 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow">
                <Settings2 size={14} className="text-emerald-400 ml-1" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">模型:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-transparent text-xs text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none cursor-pointer pr-1"
                >
                  {IMAGE_MODELS.map(m => (
                    <option key={m.id} value={m.id} className="text-slate-700 dark:text-slate-300 dark:bg-slate-800">{m.label}</option>
                  ))}
                </select>
             </div>

             <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-700/50 p-2 rounded-xl border border-white/50 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow">
                <Crop size={14} className="text-emerald-400 ml-1" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">比例:</span>
                <select
                  value={selectedRatio}
                  onChange={(e) => setSelectedRatio(e.target.value)}
                  className="bg-transparent text-xs text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none cursor-pointer pr-1"
                >
                  {ASPECT_RATIOS.map(r => (
                    <option key={r.id} value={r.id} className="text-slate-700 dark:text-slate-300 dark:bg-slate-800">{r.label}</option>
                  ))}
                </select>
             </div>
             
             {/* Advanced: Style */}
             <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-700/50 p-2 rounded-xl border border-white/50 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow">
                <Sparkles size={14} className="text-emerald-400 ml-1" />
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">風格:</span>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="bg-transparent text-xs text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="none" className="dark:bg-slate-800">預設 (None)</option>
                  <option value="cinematic" className="dark:bg-slate-800">電影質感 (Cinematic)</option>
                  <option value="anime" className="dark:bg-slate-800">動漫 (Anime)</option>
                  <option value="watercolor" className="dark:bg-slate-800">水彩 (Watercolor)</option>
                  <option value="3d" className="dark:bg-slate-800">3D 渲染 (3D)</option>
                  <option value="pixel" className="dark:bg-slate-800">像素 (Pixel)</option>
                </select>
             </div>
           </div>

           {/* Advanced: Slider & Seed & Negative Prompt */}
           <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl p-3 mb-4">
             <div className="grid grid-cols-2 gap-4 mb-3">
               <div className="flex flex-col gap-1">
                   <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                      <span>創意度 (Temperature)</span>
                      <span>{temperature}</span>
                   </div>
                   <input 
                      type="range" min="0" max="2" step="0.1" 
                      value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                   />
               </div>
               <div className="flex flex-col gap-1">
                   <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                      <span>種子 (Seed)</span>
                   </div>
                   <input 
                      type="number" 
                      placeholder="隨機 (-1)"
                      value={seed || ''} 
                      onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="bg-white/50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-0.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500"
                   />
               </div>
             </div>
             
             {/* Negative Prompt */}
             <div className="flex flex-col gap-1 mt-2">
                 <div className="flex items-center gap-1 text-[10px] text-red-500/80 dark:text-red-400/80 font-bold uppercase">
                    <Ban size={10} />
                    <span>負面提示詞 (Negative Prompt) - 排除元素</span>
                 </div>
                 <input 
                    type="text"
                    placeholder="例如：模糊、變形、多餘的手指、低畫質..."
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="w-full bg-white/50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/30"
                 />
             </div>
           </div>

           {/* Input Box */}
           <div className="flex flex-col gap-3 mb-6">
             <div className="flex justify-between items-center text-emerald-900/60 dark:text-emerald-300/60 text-xs font-bold uppercase tracking-wider mb-2 px-1">
               <span>圖片描述</span>
               <div className="flex items-center gap-2">
                 {/* Strength Meter */}
                 <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/50 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                    <BarChart3 size={10} className="text-slate-400"/>
                    <div className="flex gap-0.5">
                        <div className={`w-3 h-1 rounded-full ${strength > 10 ? getStrengthColor(strength) : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                        <div className={`w-3 h-1 rounded-full ${strength > 40 ? getStrengthColor(strength) : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                        <div className={`w-3 h-1 rounded-full ${strength > 80 ? getStrengthColor(strength) : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                    </div>
                    <span className={`text-[9px] font-bold ${strength > 70 ? 'text-emerald-600' : 'text-slate-500'}`}>{getStrengthLabel(strength)}</span>
                 </div>
                 <button 
                   onClick={handleSuggestKeywords}
                   disabled={isSuggesting || !prompt}
                   className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${isSuggesting ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100'}`}
                 >
                   {isSuggesting ? <span className="animate-spin">⌛</span> : <Zap size={10} />}
                   AI 靈感
                 </button>
               </div>
             </div>
             
             <div className="relative group">
                <textarea
                  ref={promptInputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleExecute(); } }}
                  placeholder="✨ 描述您想看到的畫面... 例如：「一隻穿著太空裝的貓，在月球上喝咖啡，賽博龐克風格」"
                  className="w-full bg-white/50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-xl px-5 py-4 shadow-inner focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none resize-none min-h-[120px] leading-relaxed transition-all placeholder:text-slate-400"
                />
             </div>

             {/* Suggested Keywords Area */}
             {suggestedKeywords.length > 0 && (
                 <div className="flex flex-wrap gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center">✨ 建議加入:</span>
                    {suggestedKeywords.map((kw, i) => (
                        <button 
                            key={i} 
                            onClick={() => addKeyword(kw)}
                            className="text-[10px] px-2 py-1 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:scale-105 hover:shadow-sm transition-all flex items-center gap-1"
                        >
                            <Plus size={8} /> {kw}
                        </button>
                    ))}
                 </div>
             )}

             {/* New Toolbar */}
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                   <button 
                      onClick={handleMagicOptimize}
                      disabled={isOptimizing}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold border ${isOptimizing ? 'text-purple-600 bg-purple-100 border-purple-200 animate-pulse' : 'text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-purple-300 dark:hover:border-purple-700 shadow-sm'}`}
                      title="魔術棒：優化提示詞"
                   >
                       <Wand2 size={14} /> 魔法優化
                   </button>
                   <button 
                      onClick={handleAnalyzeSuggestions}
                      disabled={isAnalyzing}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold border ${isAnalyzing ? 'text-emerald-600 bg-emerald-100 border-emerald-200 animate-pulse' : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm'}`}
                      title="AI 深度分析顧問"
                   >
                       <Lightbulb size={14} className="text-yellow-500" /> 深度分析
                   </button>
                   <button 
                      onClick={handleRandomPrompt}
                      className="p-2 text-slate-500 hover:text-emerald-600 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-lg transition-all shadow-sm"
                      title="隨機靈感"
                   >
                       <Dices size={16} />
                   </button>
                   <button 
                      onClick={startListening}
                      className={`p-2 rounded-lg transition-all border shadow-sm ${isListening ? 'text-red-500 bg-red-50 border-red-200 animate-pulse' : 'text-slate-500 hover:text-emerald-600 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-700'}`}
                      title={isListening ? "停止錄音" : "語音輸入"}
                   >
                       {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                   </button>
                </div>

                <Button 
                    onClick={handleExecute} 
                    isLoading={isProcessing} 
                    disabled={!prompt}
                    accentColor="emerald"
                    className="w-full sm:w-auto px-8 py-2.5 shadow-lg shadow-emerald-500/20"
                >
                    開始繪圖 <ArrowRight size={16} className="ml-2" />
                </Button>
             </div>
           </div>
        </div>
      </div>

      {/* Suggestion Panel Overlay */}
      {showSuggestions && (
          <div className="relative w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 animate-in slide-in-from-top-4 mb-4 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                      <Lightbulb size={16} className="text-yellow-500" /> AI 深度分析顧問：50 種創作策略
                  </h3>
                  <button onClick={() => setShowSuggestions(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                      <X size={14} />
                  </button>
              </div>
              
              {isAnalyzing ? (
                  <div className="flex justify-center items-center py-8 gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                      <span className="animate-spin">⌛</span> 正在分析輸入內容並構思 50 種畫面，請稍候...
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
                                      ? 'bg-emerald-500 text-white shadow-md'
                                      : 'bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                                  }`}
                              >
                                  {cat.categoryName}
                              </button>
                          ))}
                      </div>

                      {/* Suggestions Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                          {suggestionCategories[activeSuggestionCategory]?.items.map((s, i) => (
                              <button
                                  key={i}
                                  onClick={() => {
                                      applyTemplate(s.prompt);
                                      setShowSuggestions(false);
                                  }}
                                  className="flex flex-col items-start p-3 bg-white/70 dark:bg-slate-800/70 border border-white dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 rounded-xl transition-all hover:shadow-md hover:-translate-y-1 text-left h-full group"
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
      
      {/* Bottom Section: Accordion Categories */}
      <div className="bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-800/80 dark:to-slate-800/40 backdrop-blur-2xl rounded-[2rem] p-6 border border-white/50 dark:border-slate-700/50 shadow-2xl shadow-emerald-500/10 dark:shadow-emerald-900/20 transition-transform duration-300 hover:shadow-emerald-500/15">
         
         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-emerald-50 dark:border-slate-700/50 pb-4 mb-4">
            <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                    <Sparkles size={12} className="text-emerald-400" /> 靈感畫廊 ({filteredPrompts.length})
                </span>
                
                {/* Search Bar */}
                <div className="relative group/search">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-emerald-500 transition-colors" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜尋風格..."
                        className="pl-6 pr-2 py-1 text-[10px] w-24 focus:w-40 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-emerald-400 transition-all"
                    />
                     {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={10}/></button>
                    )}
                </div>
            </div>

            {/* Category Filter */}
            {searchQuery === '' && (
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                    {TXT2IMG_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`text-[10px] px-3 py-1 rounded-full whitespace-nowrap transition-all duration-300 ${
                                selectedCategory === cat.id 
                                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm scale-105' 
                                : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-emerald-600 dark:hover:text-emerald-400 hover:shadow-sm'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            )}
         </div>

         {/* Accordion Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Object.entries(groupedPrompts).map(([subcategory, prompts]) => (
                <div key={subcategory} className="bg-white/40 dark:bg-slate-700/30 rounded-xl border border-white/60 dark:border-slate-600/50 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800">
                    <button 
                        onClick={() => toggleSubcategory(subcategory)}
                        className="w-full flex items-center justify-between p-3 bg-white/60 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                    >
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{subcategory}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-slate-100 dark:bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-md">{prompts.length}</span>
                            {openSubcategories[subcategory] ? <ChevronUp size={14} className="text-emerald-500"/> : <ChevronDown size={14} className="text-slate-400"/>}
                        </div>
                    </button>
                    
                    {openSubcategories[subcategory] && (
                        <div className="p-3 grid gap-2 animate-in slide-in-from-top-2 duration-200">
                            {prompts.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => applyTemplate(t.prompt)}
                                    className="text-left group flex flex-col gap-1 p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-800/50 transition-all active:scale-[0.98]"
                                >
                                    <div className="flex justify-between items-start w-full">
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{t.label.split('|')[1]?.trim() || t.label}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{t.description}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ))}
             {Object.keys(groupedPrompts).length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-400 italic text-xs">
                    沒有找到符合的風格類別
                </div>
            )}
         </div>

         {history.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
                <Clock size={12} className="text-slate-400"/>
                <span className="text-[10px] font-bold text-slate-400 uppercase">歷史紀錄</span>
                <button onClick={clearHistory} className="ml-auto text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                <Trash2 size={10}/> 清除
                </button>
            </div>
            <div className="flex flex-wrap gap-2">
                {history.map((h, i) => (
                <button key={i} onClick={() => setPrompt(h)} className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-100 dark:border-slate-600 transition-all hover:scale-105 active:scale-95 max-w-[200px] truncate">
                    {h}
                </button>
                ))}
            </div>
            </div>
        )}
      </div>
    </div>
  );
}