
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { fileToGenerativePart, analyzeImageWithGemini, IWindow } from '../services/geminiService';
import { IMG2TXT_PROMPTS, TEXT_MODELS, IMG2TXT_CATEGORIES } from '../constants';
import { ArrowRight, Copy, Upload, Wand2, Settings2, Clock, Trash2, Sparkles, Filter, X, Plus, ScanSearch, Lightbulb, FileJson, Volume2, Check, Search, Mic, MicOff, Dices } from 'lucide-react';

interface ImageToTextPlaygroundProps {
  onError: (msg: string) => void;
}

export const ImageToTextPlayground: React.FC<ImageToTextPlaygroundProps> = ({ onError }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showTips, setShowTips] = useState(true);
  const [isJsonMode, setIsJsonMode] = useState(false); // New: JSON Mode
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // New features
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('promptcraft_img2txt_model') || TEXT_MODELS[0].id);

  useEffect(() => { localStorage.setItem('promptcraft_img2txt_model', selectedModel); }, [selectedModel]);

  useEffect(() => {
    const urls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [selectedFiles]);

  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('promptcraft_img2txt_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const addToHistory = (newPrompt: string) => {
    if (!newPrompt.trim()) return;
    setHistory(prev => {
      const filtered = prev.filter(p => p !== newPrompt);
      const newHistory = [newPrompt, ...filtered].slice(0, 10);
      localStorage.setItem('promptcraft_img2txt_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('promptcraft_img2txt_history');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).filter((file: File) => file.type.startsWith('image/'));
      if (newFiles.length === 0) { onError("請選擇有效的圖片檔案。"); return; }
      if (selectedFiles.length + newFiles.length > 4) { onError("最多只能同時上傳 4 張圖片。"); return; }
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setOutputText('');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleExecute = async () => {
    if (selectedFiles.length === 0 || !prompt.trim()) return;

    setIsProcessing(true);
    setOutputText('');
    addToHistory(prompt);

    try {
      const imagesPayload = await Promise.all(selectedFiles.map(async (file) => {
        const base64 = await fileToGenerativePart(file);
        return { base64, mimeType: file.type };
      }));

      // Pass jsonMode param
      const result = await analyzeImageWithGemini(imagesPayload, prompt, selectedModel, isJsonMode);
      setOutputText(result);
    } catch (err: any) {
      onError(err.message || '分析圖片失敗。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
      if (outputText) {
          navigator.clipboard.writeText(outputText);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  const handleSpeak = () => {
      if (!outputText) return;
      if (isSpeaking) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
          return;
      }

      const utterance = new SpeechSynthesisUtterance(outputText);
      utterance.lang = 'zh-TW';
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
  };
  
  // Clean up speech on unmount
  useEffect(() => {
      return () => { window.speechSynthesis.cancel(); };
  }, []);

  const applyTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt);
    setTimeout(() => promptInputRef.current?.focus(), 10);
  };
  
  const handleRandomPrompt = () => {
      const random = IMG2TXT_PROMPTS[Math.floor(Math.random() * IMG2TXT_PROMPTS.length)];
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

  // Filter Logic: Combine Category + Search Query
  const filteredPrompts = IMG2TXT_PROMPTS.filter(p => {
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
        <div className="bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-800/90 dark:to-slate-800/50 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-5 flex flex-col shadow-2xl shadow-amber-500/10 dark:shadow-amber-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-amber-500/20">
          <div className="flex justify-between items-center text-amber-900/60 dark:text-amber-300/60 text-xs font-bold uppercase tracking-wider mb-3 px-2">
            <span>上傳圖片 ({selectedFiles.length}/4)</span>
            {selectedFiles.length > 0 && (
                <button 
                  onClick={() => setSelectedFiles([])}
                  className="text-red-500 hover:text-white hover:bg-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg transition-all text-[10px] hover:shadow-md"
                >
                  清除
                </button>
            )}
          </div>
          
          <div className="flex-grow bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 relative overflow-hidden p-4 hover:border-amber-400 hover:bg-amber-50/30 dark:hover:bg-amber-900/20 transition-all duration-300 select-none">
            {selectedFiles.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-amber-100 dark:shadow-amber-900/20 group-hover:shadow-amber-500/20 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                    <Upload className="text-amber-400 group-hover:text-amber-500 transition-colors" size={36} />
                 </div>
                 <p className="text-slate-700 dark:text-slate-200 font-bold text-lg mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">拖放或點擊上傳</p>
                 <p className="text-slate-400 text-sm">支援 JPG, PNG, WEBP</p>
                 <Button variant="secondary" accentColor="amber" className="mt-6 pointer-events-none opacity-80 group-hover:opacity-100 group-hover:scale-105">選擇檔案</Button>
              </div>
            ) : (
              <div className={`grid gap-4 h-full content-start overflow-y-auto pr-1 ${selectedFiles.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {previewUrls.map((url, index) => (
                  <div 
                    key={index} 
                    className="relative group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-md flex items-center justify-center min-h-[150px] transition-all hover:scale-[1.02] hover:shadow-lg"
                  >
                    <img src={url} alt={`Input ${index + 1}`} className="max-w-full max-h-full object-contain" />
                    <button onClick={(e) => { e.stopPropagation(); removeFile(index); }} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110 shadow-lg translate-y-2 group-hover:translate-y-0">
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded-md text-[10px] text-white backdrop-blur-sm z-10">Img #{index + 1}</div>
                  </div>
                ))}
                {selectedFiles.length < 4 && (
                  <button onClick={() => fileInputRef.current?.click()} className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group min-h-[150px] bg-white/50 dark:bg-slate-800/50 hover:scale-[0.98]">
                    <Plus className="text-slate-300 group-hover:text-amber-500 transition-colors" size={32} />
                    <span className="text-xs text-slate-400 group-hover:text-amber-600 mt-2 font-bold transition-colors">新增</span>
                  </button>
                )}
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" multiple />
          </div>
        </div>

        {/* Text Output (Right) */}
        <div className="bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-800/90 dark:to-slate-800/50 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-5 flex flex-col shadow-2xl shadow-amber-500/10 dark:shadow-amber-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-amber-500/20">
           <div className="flex justify-between items-center text-amber-900/60 dark:text-amber-300/60 text-xs font-bold uppercase tracking-wider mb-3 px-2">
            <span>分析結果</span>
            {outputText && (
                <div className="flex gap-2">
                    <button 
                      onClick={handleSpeak}
                      className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all text-[10px] font-medium ${isSpeaking ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse' : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-500 dark:hover:bg-amber-900/20'}`}
                      title="朗讀內容"
                    >
                      <Volume2 size={10} />
                      {isSpeaking ? '朗讀中' : '朗讀'}
                    </button>
                    <button 
                        onClick={handleCopy}
                        className={`text-amber-600 hover:text-white hover:bg-amber-500 px-2 py-1 rounded-lg flex items-center gap-1 transition-all text-[10px] font-medium ${copied ? 'bg-emerald-100 text-emerald-600' : ''}`}
                    >
                        {copied ? <Check size={10} /> : <Copy size={10} />}
                        {copied ? '已複製' : '複製'}
                    </button>
                </div>
            )}
          </div>
          <div className={`relative flex-grow w-full bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-slate-700 dark:text-slate-200 shadow-inner overflow-y-auto whitespace-pre-wrap leading-relaxed transition-all duration-300 font-mono text-sm ${!outputText ? 'flex items-center justify-center' : ''}`}>
             {isProcessing ? (
               <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
                 <div className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-full shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-amber-200/50 dark:bg-amber-500/20 animate-ping rounded-full"></div>
                    <ScanSearch size={32} className="relative z-10 animate-pulse" />
                 </div>
                 <span className="text-amber-600 dark:text-amber-400 font-bold tracking-tight">Gemini 正在分析圖片...</span>
               </div>
             ) : (
               outputText || <span className="text-slate-300 dark:text-slate-500 font-medium italic select-none text-center font-sans">上傳圖片並輸入提示詞<br/>Gemini 將在此為您解析內容。</span>
             )}
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-800/80 dark:to-slate-800/40 backdrop-blur-2xl rounded-[2rem] p-6 border border-white/50 dark:border-slate-700/50 shadow-2xl shadow-amber-500/10 dark:shadow-amber-900/20 transition-transform duration-300 hover:shadow-amber-500/15">
        <div className="flex flex-col gap-5">
          {showTips && (
             <div className="flex items-start gap-3 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-3 rounded-xl animate-in slide-in-from-bottom-2">
               <div className="p-1.5 bg-amber-200 dark:bg-amber-800 rounded-full flex-shrink-0 text-amber-600 dark:text-amber-200">
                 <Lightbulb size={14} />
               </div>
               <div className="flex-grow">
                 <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1">💡 使用小撇步：上傳什麼圖片？</h4>
                 <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                   <p><span className="font-bold text-amber-600 dark:text-amber-400">📦 如果您上傳物品照片：</span> 選擇 <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-amber-200 dark:border-amber-800 rounded text-amber-600 dark:text-amber-400 font-bold">物品分析</span> 分類，可以詢問「使用說明」或「清潔保養」。</p>
                   <p><span className="font-bold text-amber-600 dark:text-amber-400">📄 如果您上傳文件/菜單：</span> 選擇 <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-amber-200 dark:border-amber-800 rounded text-amber-600 dark:text-amber-400 font-bold">提取與識別</span> 來進行翻譯或 OCR。</p>
                   <p><span className="font-bold text-amber-600 dark:text-amber-400">📊 如果您上傳圖表：</span> 試試 <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-amber-200 dark:border-amber-800 rounded text-amber-600 dark:text-amber-400 font-bold">轉換與解題</span> 裡的「圖表分析」。</p>
                 </div>
               </div>
               <button onClick={() => setShowTips(false)} className="text-slate-400 hover:text-amber-500 transition-colors">
                 <X size={14} />
               </button>
             </div>
           )}

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 border-b border-amber-50 dark:border-slate-700/50 pb-5">
             <div className="flex-grow w-full">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                      <Sparkles size={12} className="text-amber-400" /> 分析指令 ({filteredPrompts.length})
                    </span>

                    <div className="flex items-center gap-2">
                        {/* Search Bar */}
                        <div className="relative group/search">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-amber-500 transition-colors" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="搜尋..."
                                className="pl-6 pr-2 py-1 text-[10px] w-24 focus:w-40 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-amber-400 transition-all"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={10}/></button>
                            )}
                        </div>

                        {/* Category Tabs */}
                        {searchQuery === '' && (
                            <div className="flex gap-1 bg-white/50 dark:bg-slate-700/50 p-1 rounded-lg border border-white/50 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm transition-all">
                            <Filter size={10} className="text-amber-400 ml-1 my-auto"/>
                            <select 
                                value={selectedCategory} 
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="bg-transparent text-[10px] text-slate-600 dark:text-slate-300 font-medium focus:outline-none cursor-pointer py-0.5 pr-1"
                            >
                                {IMG2TXT_CATEGORIES.map(c => (
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
                      className="group relative text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-amber-500 hover:text-white text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600 hover:border-amber-500 transition-all duration-200 font-medium whitespace-nowrap shadow-sm hover:shadow-amber-500/25 hover:-translate-y-0.5 active:scale-95"
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
             
             <div className="flex-shrink-0 flex flex-col gap-3 self-start">
               {/* JSON Mode Toggle */}
               <div 
                    onClick={() => setIsJsonMode(!isJsonMode)}
                    className={`flex items-center gap-2 p-2 rounded-xl border shadow-sm cursor-pointer transition-all select-none group ${isJsonMode ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700' : 'bg-white/50 dark:bg-slate-700/50 border-white/50 dark:border-slate-600 hover:shadow-md'}`}
               >
                   <div className={`p-1 rounded-lg ${isJsonMode ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400'}`}>
                      <FileJson size={14} />
                   </div>
                   <div className="flex flex-col">
                      <span className={`text-xs font-bold ${isJsonMode ? 'text-amber-800 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>JSON 模式</span>
                      <span className="text-[9px] text-slate-400 leading-none">強制輸出結構化資料</span>
                   </div>
               </div>

               {/* Model Selector */}
               <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-700/50 p-2 rounded-xl border border-white/50 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow">
                  <Settings2 size={14} className="text-amber-400 ml-1" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">模型:</span>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-transparent text-xs text-amber-600 dark:text-amber-400 font-bold focus:outline-none cursor-pointer pr-1"
                  >
                    {TEXT_MODELS.map(m => (
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
                  placeholder="✨ 請問這張圖片有什麼內容？或是需要提取文字？"
                  className="w-full bg-white/50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-xl pl-5 pr-20 py-3.5 shadow-inner focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 outline-none resize-none min-h-[60px] leading-relaxed transition-all placeholder:text-slate-400"
                  rows={2}
                />
                 {/* Voice Input & Dice Buttons */}
                <div className="absolute right-2 top-4 flex gap-1">
                   <button 
                      onClick={handleRandomPrompt}
                      className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                      title="隨機靈感"
                   >
                       <Dices size={16} />
                   </button>
                   <button 
                      onClick={startListening}
                      className={`p-2 rounded-lg transition-all ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30'}`}
                      title={isListening ? "停止錄音" : "語音輸入"}
                   >
                       {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                   </button>
                </div>
             </div>
             <Button 
                onClick={handleExecute} 
                isLoading={isProcessing} 
                accentColor="amber"
                disabled={selectedFiles.length === 0 || !prompt}
                className="h-[60px] px-8 shadow-lg shadow-amber-500/20"
             >
                分析 <ArrowRight size={16} className="ml-2" />
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
