
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { fileToGenerativePart, generateVideoFromImage, IWindow } from '../services/geminiService';
import { IMG2VID_PROMPTS, VIDEO_MODELS, IMG2VID_CATEGORIES } from '../constants';
import { ArrowRight, Download, Upload, Video, Settings2, Clock, Trash2, Sparkles, Filter, X, Lightbulb, Clapperboard, Loader2, Ban, Search, Mic, MicOff, Dices } from 'lucide-react';

interface ImageToVideoPlaygroundProps {
  onError: (msg: string) => void;
}

export const ImageToVideoPlayground: React.FC<ImageToVideoPlaygroundProps> = ({ onError }) => {
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('promptcraft_img2vid_model') || VIDEO_MODELS[0].id);

  useEffect(() => { localStorage.setItem('promptcraft_img2vid_model', selectedModel); }, [selectedModel]);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  // Cleanup abort controller on unmount
  useEffect(() => {
      return () => {
          if (abortControllerRef.current) {
              abortControllerRef.current.abort();
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
          onError(err.message || '影片生成失敗。');
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

  const applyTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt);
    setTimeout(() => promptInputRef.current?.focus(), 10);
  };
  
  const handleRandomPrompt = () => {
      const random = IMG2VID_PROMPTS[Math.floor(Math.random() * IMG2VID_PROMPTS.length)];
      setSelectedCategory(random.category);
      applyTemplate(random.prompt);
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
                className="text-violet-600 hover:text-white hover:bg-violet-500 px-2 py-1 rounded-lg flex items-center gap-1 transition-all text-[10px] font-medium"
              >
                <Download size={10} /> 快速下載
              </a>
            )}
          </div>
          <div className={`relative flex-grow w-full bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden flex flex-col items-center justify-center transition-all duration-300`}>
             {isProcessing ? (
               <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300 p-8 text-center">
                 <div className="relative">
                    <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 size={24} className="text-violet-400 animate-pulse"/>
                    </div>
                 </div>
                 <div>
                    <span className="text-violet-400 font-bold tracking-tight block text-lg">AI 正在製作影片...</span>
                    <span className="text-slate-400 text-xs mt-1 block">這可能需要 30-60 秒，請耐心等候</span>
                    <span className="text-slate-500 text-[10px] mt-2 block italic">{progressMessage}</span>
                 </div>
                 
                 <button 
                    onClick={handleCancel}
                    className="mt-4 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg text-xs flex items-center gap-2 transition-all"
                 >
                    <Ban size={12} /> 取消生成
                 </button>
               </div>
             ) : outputVideoUrl ? (
               <div className="w-full h-full flex flex-col">
                   <video 
                     src={outputVideoUrl} 
                     controls 
                     autoPlay 
                     loop 
                     className="flex-grow w-full h-full object-contain bg-black max-h-[320px]"
                   />
                   <div className="p-4 bg-white/5 dark:bg-slate-800/50 backdrop-blur-md border-t border-white/10 flex justify-center">
                        <a 
                            href={outputVideoUrl} 
                            download="gemini-veo.mp4"
                            target="_blank"
                            rel="noreferrer"
                            className="w-full sm:w-auto px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                        >
                            <Download size={16} /> 下載影片 (MP4)
                        </a>
                   </div>
               </div>
             ) : (
               <div className="text-slate-500 dark:text-slate-400 flex flex-col items-center text-center select-none p-6">
                 <Clapperboard size={48} className="mb-4 opacity-20" />
                 <p className="font-medium">Veo 模型將在此播放生成結果</p>
                 <p className="text-xs opacity-60 mt-1">支援高品質 720p 影片生成</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-800/80 dark:to-slate-800/40 backdrop-blur-2xl rounded-[2rem] p-6 border border-white/50 dark:border-slate-700/50 shadow-2xl shadow-violet-500/10 dark:shadow-violet-900/20 transition-transform duration-300 hover:shadow-violet-500/15">
        <div className="flex flex-col gap-5">
          {showTips && (
             <div className="flex items-start gap-3 bg-violet-50/80 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 p-3 rounded-xl animate-in slide-in-from-bottom-2">
               <div className="p-1.5 bg-violet-200 dark:bg-violet-800 rounded-full flex-shrink-0 text-violet-600 dark:text-violet-200">
                 <Lightbulb size={14} />
               </div>
               <div className="flex-grow">
                 <h4 className="text-xs font-bold text-violet-700 dark:text-violet-300 mb-1">💡 Veo 提示技巧：如何讓圖片動起來？</h4>
                 <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                   <p><span className="font-bold text-violet-600 dark:text-violet-400">🎥 描述運鏡：</span> 使用「向右平移 (Pan Right)」、「推軌鏡頭 (Dolly In)」來增加電影感。</p>
                   <p><span className="font-bold text-violet-600 dark:text-violet-400">🌊 描述動態：</span> 具體指出「頭髮在風中飄動」、「水流湍急」、「車輛行駛」。</p>
                   <p><span className="font-bold text-violet-600 dark:text-violet-400">✨ 描述氛圍：</span> 添加「下雨」、「下雪」、「霓虹閃爍」等環境特效。</p>
                 </div>
               </div>
               <button onClick={() => setShowTips(false)} className="text-slate-400 hover:text-violet-500 transition-colors">
                 <X size={14} />
               </button>
             </div>
           )}

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 border-b border-violet-50 dark:border-slate-700/50 pb-5">
             <div className="flex-grow w-full">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                      <Sparkles size={12} className="text-violet-400" /> 運鏡與特效指令 ({filteredPrompts.length})
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
                        <button key={i} onClick={() => setPrompt(h)} className="text-[10px] px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200 transition-all hover:scale-105 active:scale-95 max-w-[150px] truncate">
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
             </div>
             
             <div className="flex-shrink-0 self-start">
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

          <div className="flex gap-3 items-start">
             <div className="flex-grow relative group">
                <textarea
                  ref={promptInputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleExecute(); } }}
                  placeholder="✨ 描述影片的動態... 例如：「鏡頭緩慢向右平移，樹葉在風中飄動」"
                  className="w-full bg-white/50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-xl pl-5 pr-20 py-3.5 shadow-inner focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 outline-none resize-none min-h-[60px] leading-relaxed transition-all placeholder:text-slate-400"
                  rows={2}
                />
                 {/* Voice Input & Dice Buttons */}
                <div className="absolute right-2 top-4 flex gap-1">
                   <button 
                      onClick={handleRandomPrompt}
                      className="p-2 text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-lg transition-colors"
                      title="隨機靈感"
                   >
                       <Dices size={16} />
                   </button>
                   <button 
                      onClick={startListening}
                      className={`p-2 rounded-lg transition-all ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30'}`}
                      title={isListening ? "停止錄音" : "語音輸入"}
                   >
                       {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                   </button>
                </div>
             </div>
             <Button 
                onClick={handleExecute} 
                isLoading={isProcessing} 
                accentColor="violet"
                disabled={!selectedFile || !prompt}
                className="h-[60px] px-8 shadow-lg shadow-violet-500/20"
             >
                製作影片 <Video size={16} className="ml-2" />
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
