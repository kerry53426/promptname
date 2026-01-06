import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { fileToGenerativePart, generateVideoFromImage, IWindow, analyzeContentForSuggestions, SuggestionCategory, optimizeUserPrompt } from '../services/geminiService';
import { IMG2VID_PROMPTS, VIDEO_MODELS, IMG2VID_CATEGORIES } from '../constants';
import { ArrowRight, Download, Upload, Video, Settings2, Clock, Trash2, Sparkles, Filter, X, Lightbulb, Clapperboard, Loader2, Ban, Search, Mic, MicOff, Dices, Wand2, Waves } from 'lucide-react';

interface ImageToVideoPlaygroundProps {
  onError: (msg: string) => void;
  incomingPrompt?: string;
}

export const ImageToVideoPlayground: React.FC<ImageToVideoPlaygroundProps> = ({ onError, incomingPrompt }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [outputVideoUrl, setOutputVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showTips, setShowTips] = useState(true);
  const [progressMessage, setProgressMessage] = useState('');
  
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('promptcraft_img2vid_model') || VIDEO_MODELS[0].id);

  useEffect(() => { localStorage.setItem('promptcraft_img2vid_model', selectedModel); }, [selectedModel]);

  useEffect(() => {
    if (incomingPrompt) applyTemplate(incomingPrompt);
  }, [incomingPrompt]);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  // Cleanup abort controller and speech recognition on unmount
  useEffect(() => {
      return () => {
          if (abortControllerRef.current) {
              abortControllerRef.current.abort();
          }
          if (recognitionRef.current) {
              recognitionRef.current.stop();
          }
      };
  }, []);

  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('promptcraft_img2vid_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const addToHistory = (newPrompt: string) => {
    if (!newPrompt.trim()) return;
    setHistory(prev => {
      const filtered = prev.filter(p => p !== newPrompt);
      const newHistory = [newPrompt, ...filtered].slice(0, 10);
      localStorage.setItem('promptcraft_img2vid_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('promptcraft_img2vid_history');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) { onError("請選擇有效的圖片檔案。"); return; }
      setSelectedFile(file);
      setOutputVideoUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExecute = async () => {
    if (!selectedFile || !prompt.trim()) return;

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsProcessing(true);
    setOutputVideoUrl(null);
    setProgressMessage('正在初始化 Veo 模型...');
    addToHistory(prompt);
    // User requested to keep suggestions open on selection, but maybe close on execute?
    // Let's keep it open if they are experimenting. 
    // setShowSuggestions(false); 

    try {
      const base64 = await fileToGenerativePart(selectedFile);
      const imagePayload = { base64, mimeType: selectedFile.type };

      // Pass signal and progress callback
      const videoUrl = await generateVideoFromImage(
          imagePayload, 
          prompt, 
          selectedModel,
          (msg) => setProgressMessage(msg),
          abortControllerRef.current.signal
      );
      
      setOutputVideoUrl(videoUrl);

    } catch (err: any) {
      if (err.message && err.message.includes('取消')) {
          setProgressMessage('已取消');
      } else {
          onError(err.message || '影片生成失敗 (可能需要付費額度)。');
      }
    } finally {
      setIsProcessing(false);
      setProgressMessage('');
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
          setIsProcessing(false);
          setProgressMessage('操作已取消');
      }
  };

  const handleMagicOptimize = async () => {
      if (!prompt.trim()) return;
      setIsOptimizing(true);
      try {
          const optimized = await optimizeUserPrompt(prompt, 'img2vid');
          setPrompt(optimized);
      } catch (e) {
          onError("提示詞優化失敗");
      } finally {
          setIsOptimizing(false);
      }
  };

  const applyTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt);
    setTimeout(() => promptInputRef.current?.focus(), 10);
  };
  
  const handleRandomPrompt = () => {
      const random = IMG2VID_PROMPTS[Math.floor(Math.random() * IMG2VID_PROMPTS.length)];
      setSelectedCategory(random.category);
      applyTemplate(random.prompt);
  };

  const handleAnalyzeSuggestions = async () => {
      if (!selectedFile) {
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
          const imagePayload = [{
              base64: await fileToGenerativePart(selectedFile),
              mimeType: selectedFile.type
          }];
          const results = await analyzeContentForSuggestions('img2vid', imagePayload);
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

  const filteredPrompts = IMG2VID_PROMPTS.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
                          p.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return searchQuery !== '' ? matchesSearch : (matchesCategory && matchesSearch);
  });

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* Top Section: Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-[400px]">
        
        {/* Input Area (Left) */}
        <div className="bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-800/90 dark:to-slate-800/50 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-5 flex flex-col shadow-2xl shadow-violet-500/10 dark:shadow-violet-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-violet-500/20">
          <div className="flex justify-between items-center text-violet-900/60 dark:text-violet-300/60 text-xs font-bold uppercase tracking-wider mb-3 px-2">
            <span>參考圖片 (起始影格)</span>
            {selectedFile && (
                <button 
                  onClick={() => setSelectedFile(null)}
                  disabled={isProcessing}
                  className="text-red-500 hover:text-white hover:bg-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg transition-all text-[10px] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  清除
                </button>
            )}
          </div>
          
          <div className="flex-grow bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 relative overflow-hidden p-4 hover:border-violet-400 hover:bg-violet-50/30 dark:hover:bg-violet-900/20 transition-all duration-300 select-none flex items-center justify-center">
            {!selectedFile ? (
              <div className="flex flex-col items-center justify-center text-center p-6 group cursor-pointer" onClick={() => !isProcessing && fileInputRef.current?.click()}>
                 <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-violet-100 dark:shadow-violet-900/20 group-hover:shadow-violet-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                    <Upload className="text-violet-400 group-hover:text-violet-500 transition-colors" size={36} />
                 </div>
                 <p className="text-slate-700 dark:text-slate-200 font-bold text-lg mb-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">上傳圖片</p>
                 <p className="text-slate-400 text-sm">支援 JPG, PNG</p>
                 <Button variant="secondary" accentColor="violet" className="mt-6 pointer-events-none opacity-80 group-hover:opacity-100 group-hover:scale-105">選擇檔案</Button>
              </div>
            ) : (
              <div className="relative group w-full h-full flex items-center justify-center">
                <img src={previewUrl!} alt="Input" className="max-w-full max-h-[300px] object-contain rounded-lg shadow-md" />
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isProcessing}
                    className="absolute bottom-4 right-4 bg-white dark:bg-slate-800 text-violet-600 px-3 py-1.5 rounded-lg shadow-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                >
                    更換圖片
                </button>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" disabled={isProcessing} />
          </div>
        </div>

        {/* Video Output (Right) */}
        <div className="bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-800/90 dark:to-slate-800/50 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-5 flex flex-col shadow-2xl shadow-violet-500/10 dark:shadow-violet-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-violet-500/20">
           <div className="flex justify-between items-center text-violet-900/60 dark:text-violet-300/60 text-xs font-bold uppercase tracking-wider mb-3 px-2">
            <span>生成影片</span>
            {outputVideoUrl && (
              <a 
                href={outputVideoUrl} 
                download="gemini-veo.mp4"
                target="_blank"
                rel="noreferrer"
                className="text-violet-600 hover:text-white hover:bg-violet-500 px-2 py-1 rounded-lg flex items-center gap-1 transition-all text-[10px] font-bold shadow-sm hover:shadow hover:scale-105"
              >
                <Download size={12} /> 下載 MP4
              </a>
            )}
          </div>
          <div className={`flex-grow bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden flex items-center justify-center transition-all duration-300 ${isProcessing ? 'border-violet-200' : ''}`}>
             {isProcessing ? (
               <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
                 <div className="p-4 bg-violet-50 dark:bg-violet-900/30 text-violet-500 rounded-full shadow-inner relative">
                    <span className="absolute inset-0 rounded-full border-4 border-violet-100 dark:border-violet-800 border-t-violet-500 animate-spin"></span>
                    <Video size={40} className="relative z-10" />
                 </div>
                 <div className="text-center">
                    <span className="text-violet-600 dark:text-violet-400 font-bold tracking-tight animate-pulse block mb-1">Veo 正在生成影片...</span>
                    <span className="text-[10px] text-slate-400">{progressMessage}</span>
                 </div>
                 <button 
                    onClick={handleCancel}
                    className="mt-2 px-3 py-1 bg-red-50 text-red-500 text-xs rounded-full hover:bg-red-100 transition-colors"
                 >
                    取消生成
                 </button>
               </div>
             ) : outputVideoUrl ? (
                <div className="flex flex-col items-center gap-4 w-full h-full p-2">
                    <video 
                        src={outputVideoUrl} 
                        controls 
                        autoPlay 
                        loop 
                        className="max-w-full max-h-[350px] rounded-xl shadow-lg animate-in fade-in zoom-in duration-500"
                    />
                    <a 
                      href={outputVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5"
                    >
                       <Download size={18} /> 下載影片
                    </a>
                </div>
             ) : (
               <div className="text-slate-300 dark:text-slate-600 flex flex-col items-center select-none p-6 text-center">
                 <Clapperboard size={48} className="mb-4 opacity-20" />
                 <p className="font-medium">AI 生成的影片將顯示於此</p>
                 <p className="text-sm opacity-60 mt-1">生成過程可能需要 1~2 分鐘</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Suggestion Panel Overlay */}
      {showSuggestions && (
          <div className="relative w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-violet-200 dark:border-violet-800 rounded-2xl p-4 animate-in slide-in-from-top-4 mb-4 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-violet-700 dark:text-violet-300 flex items-center gap-2">
                      <Lightbulb size={16} className="text-yellow-500" /> AI 深度分析顧問：50 種運鏡策略
                  </h3>
                  <button onClick={() => setShowSuggestions(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                      <X size={14} />
                  </button>
              </div>
              
              {isAnalyzing ? (
                  <div className="flex justify-center items-center py-8 gap-2 text-violet-600 dark:text-violet-400 font-medium text-xs">
                      <span className="animate-spin">⌛</span> 正在分析圖片並規劃 50 種運鏡腳本，請稍候...
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
                                      ? 'bg-violet-500 text-white shadow-md'
                                      : 'bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/30'
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
                                  className="flex flex-col items-start p-3 bg-white/70 dark:bg-slate-800/70 border border-white dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 rounded-xl transition-all hover:shadow-md hover:-translate-y-1 text-left h-full group"
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
      <div className="bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-800/80 dark:to-slate-800/40 backdrop-blur-2xl rounded-[2rem] p-6 border border-white/50 dark:border-slate-700/50 shadow-2xl shadow-violet-500/10 dark:shadow-violet-900/20 transition-transform duration-300 hover:shadow-violet-500/15">
        <div className="flex flex-col gap-4">
           {showTips && (
             <div className="flex items-start gap-3 bg-violet-50/80 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 p-3 rounded-xl animate-in slide-in-from-bottom-2">
               <div className="p-1.5 bg-violet-200 dark:bg-violet-800 rounded-full flex-shrink-0 text-violet-600 dark:text-violet-200">
                 <Lightbulb size={14} />
               </div>
               <div className="flex-grow">
                 <h4 className="text-xs font-bold text-violet-700 dark:text-violet-300 mb-1">💡 影片生成小撇步：</h4>
                 <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                   <p><span className="font-bold text-violet-600 dark:text-violet-400">🎥 運鏡技巧：</span> 使用 <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-violet-200 dark:border-violet-800 rounded text-violet-600 dark:text-violet-400 font-bold">推軌</span> 或 <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-violet-200 dark:border-violet-800 rounded text-violet-600 dark:text-violet-400 font-bold">平移</span> 來增加動態感。</p>
                   <p><span className="font-bold text-violet-600 dark:text-violet-400">🔥 物理效果：</span> 嘗試 <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-violet-200 dark:border-violet-800 rounded text-violet-600 dark:text-violet-400 font-bold">物理動態</span> 類別，讓水流動或火焰燃燒。</p>
                   <p><span className="font-bold text-violet-600 dark:text-violet-400">⚠️ 注意事項：</span> 影片生成需要較長時間 (Veo 模型)，請耐心等待。免費版 API 可能無法使用此功能。</p>
                 </div>
               </div>
               <button onClick={() => setShowTips(false)} className="text-slate-400 hover:text-violet-500 transition-colors">
                 <X size={14} />
               </button>
             </div>
           )}

           <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 border-b border-violet-50 dark:border-slate-700/50 pb-5 mb-1">
             <div className="flex-grow w-full">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                      <Sparkles size={12} className="text-violet-400" /> 運鏡指令 ({filteredPrompts.length})
                    </span>

                     <div className="flex items-center gap-2">
                        {/* Search Bar */}
                        <div className="relative group/search">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-violet-500 transition-colors" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="搜尋..."
                                className="pl-6 pr-2 py-1 text-[10px] w-24 focus:w-40 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-violet-400 transition-all"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={10}/></button>
                            )}
                        </div>

                        {/* Category Tabs */}
                        {searchQuery === '' && (
                            <div className="flex gap-1 bg-white/50 dark:bg-slate-700/50 p-1 rounded-lg border border-white/50 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm transition-all">
                                <Filter size={10} className="text-violet-400 ml-1 my-auto"/>
                                <select 
                                    value={selectedCategory} 
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="bg-transparent text-[10px] text-slate-600 dark:text-slate-300 font-medium focus:outline-none cursor-pointer py-0.5 pr-1"
                                >
                                    {IMG2VID_CATEGORIES.map(c => (
                                    <option key={c.id} value={c.id} className="dark:bg-slate-800">{c.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                  {filteredPrompts.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t.prompt)}
                      className="group relative text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700/80 hover:bg-violet-500 hover:text-white text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600/60 hover:border-violet-500 transition-all duration-200 font-medium whitespace-nowrap shadow-sm hover:shadow-violet-500/25 hover:-translate-y-0.5 active:scale-95"
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
             
             <div className="flex-shrink-0 flex flex-col gap-2 self-start">
               <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-700/50 p-2 rounded-xl border border-white/50 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow">
                  <Settings2 size={14} className="text-violet-400 ml-1" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">模型:</span>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-transparent text-xs text-violet-600 dark:text-violet-400 font-bold focus:outline-none cursor-pointer pr-1"
                  >
                    {VIDEO_MODELS.map(m => (
                      <option key={m.id} value={m.id} className="text-slate-700 dark:text-slate-300 dark:bg-slate-800">{m.label}</option>
                    ))}
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
                  placeholder="✨ 請描述影片動態... 例如：「向右平移，各種花朵綻放」"
                  className="w-full bg-white/50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-xl px-5 py-4 shadow-inner focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none resize-none min-h-[80px] leading-relaxed transition-all placeholder:text-slate-400"
                  rows={2}
                />
             </div>
             
             {/* Toolbar */}
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                   <button 
                      onClick={handleMagicOptimize}
                      disabled={isOptimizing}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold border ${isOptimizing ? 'text-violet-600 bg-violet-100 border-violet-200 animate-pulse' : 'text-violet-600 dark:text-violet-400 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-violet-300 dark:hover:border-violet-700 shadow-sm'}`}
                      title="魔術棒：優化提示詞"
                   >
                       <Wand2 size={14} /> 魔法優化
                   </button>
                   <button 
                      onClick={handleAnalyzeSuggestions}
                      disabled={isAnalyzing}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold border ${isAnalyzing ? 'text-violet-600 bg-violet-100 border-violet-200 animate-pulse' : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 shadow-sm'}`}
                      title="AI 深度分析顧問"
                   >
                       <Lightbulb size={14} className="text-yellow-500" /> 深度分析
                   </button>
                   <button 
                      onClick={handleRandomPrompt}
                      className="p-2 text-slate-500 hover:text-violet-600 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-violet-300 dark:hover:border-violet-700 rounded-lg transition-all shadow-sm"
                      title="隨機靈感"
                   >
                       <Dices size={16} />
                   </button>
                   <button 
                      onClick={toggleListening}
                      className={`p-2 rounded-lg transition-all border shadow-sm ${isListening ? 'text-white bg-red-500 border-red-600 animate-pulse shadow-red-500/30' : 'text-slate-500 hover:text-violet-600 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-violet-300 dark:hover:border-violet-700'}`}
                      title={isListening ? "停止錄音" : "語音輸入"}
                   >
                       {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                   </button>
                </div>

                <Button 
                    onClick={handleExecute} 
                    isLoading={isProcessing} 
                    disabled={!selectedFile || !prompt}
                    accentColor="violet"
                    className="w-full sm:w-auto px-8 py-2.5 shadow-lg shadow-violet-500/20"
                >
                    生成影片 <ArrowRight size={16} className="ml-2" />
                </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}