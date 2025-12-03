
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { fileToGenerativePart, analyzeImageWithGemini, IWindow, analyzeContentForSuggestions, SuggestionCategory, optimizeUserPrompt } from '../services/geminiService';
import { IMG2TXT_PROMPTS, TEXT_MODELS, IMG2TXT_CATEGORIES } from '../constants';
import { ArrowRight, Upload, ScanSearch, Settings2, Clock, Trash2, Sparkles, Filter, Copy, Check, FileJson, FileText, Volume2, X, Lightbulb, Search, Mic, MicOff, Dices, Wand2, Waves } from 'lucide-react';

interface ImageToTextPlaygroundProps {
  onError: (msg: string) => void;
  incomingPrompt?: string;
}

// Simple markdown renderer component
const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div className="leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const codeContent = part.slice(3, -3).replace(/^.*\n/, '');
          return (
            <div key={index} className="my-4 bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs sm:text-sm overflow-x-auto border border-slate-700 shadow-inner">
              <pre>{codeContent.trim()}</pre>
            </div>
          );
        }
        const paragraphs = part.split('\n');
        return (
          <span key={index}>
            {paragraphs.map((para, pIndex) => (
              <React.Fragment key={pIndex}>
                {para.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((segment, sIndex) => {
                  if (segment.startsWith('`') && segment.endsWith('`')) {
                    return <code key={sIndex} className="bg-slate-200 dark:bg-slate-700 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-mono text-[0.9em]">{segment.slice(1, -1)}</code>;
                  }
                  if (segment.startsWith('**') && segment.endsWith('**')) {
                    return <strong key={sIndex} className="text-amber-700 dark:text-amber-300 font-bold">{segment.slice(2, -2)}</strong>;
                  }
                  return <span key={sIndex}>{segment}</span>;
                })}
                {pIndex < paragraphs.length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      })}
    </div>
  );
};

export const ImageToTextPlayground: React.FC<ImageToTextPlaygroundProps> = ({ onError, incomingPrompt }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [jsonMode, setJsonMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTips, setShowTips] = useState(true);

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
  const recognitionRef = useRef<any>(null);

  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('promptcraft_img2txt_model') || 'gemini-2.5-flash');

  useEffect(() => { localStorage.setItem('promptcraft_img2txt_model', selectedModel); }, [selectedModel]);

  useEffect(() => {
    if (incomingPrompt) applyTemplate(incomingPrompt);
  }, [incomingPrompt]);

  useEffect(() => {
    const urls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [selectedFiles]);

  // Stop speaking when component unmounts
  useEffect(() => {
    return () => {
        window.speechSynthesis.cancel();
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };
  }, []);

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
    // User requested to keep suggestions open on selection, but maybe close on execute?
    // Let's keep it open if they are experimenting. 
    // setShowSuggestions(false); 

    try {
      const imagesPayload = await Promise.all(selectedFiles.map(async (file) => {
        const base64 = await fileToGenerativePart(file);
        return { base64, mimeType: file.type };
      }));

      const result = await analyzeImageWithGemini(imagesPayload, prompt, selectedModel, jsonMode);
      setOutputText(result);
    } catch (err: any) {
      onError(err.message || '分析圖片時發生錯誤。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMagicOptimize = async () => {
      if (!prompt.trim()) return;
      setIsOptimizing(true);
      try {
          const optimized = await optimizeUserPrompt(prompt, 'img2txt');
          setPrompt(optimized);
      } catch (e) {
          onError("提示詞優化失敗");
      } finally {
          setIsOptimizing(false);
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
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const applyTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt);
    // Check if template implies extraction (OCR), if so, maybe suggest JSON mode?
    // For now, we just focus the input
    setTimeout(() => promptInputRef.current?.focus(), 10);
  };
  
  const handleRandomPrompt = () => {
      const random = IMG2TXT_PROMPTS[Math.floor(Math.random() * IMG2TXT_PROMPTS.length)];
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
          const results = await analyzeContentForSuggestions('img2txt', imagesPayload);
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
            <span>分析圖片 ({selectedFiles.length}/4)</span>
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
                 <p className="text-slate-700 dark:text-slate-200 font-bold text-lg mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">上傳圖片</p>
                 <p className="text-slate-400 text-sm">支援 JPG, PNG</p>
                 <Button variant="secondary" accentColor="amber" className="mt-6 pointer-events-none opacity-80 group-hover:opacity-100 group-hover:scale-105">選擇檔案</Button>
              </div>
            ) : (
              <div className={`grid gap-4 h-full content-start overflow-y-auto pr-1 ${selectedFiles.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-md flex items-center justify-center min-h-[150px] transition-all hover:scale-[1.02] hover:shadow-lg">
                    <img src={url} alt={`Input ${index + 1}`} className="max-w-full max-h-full object-contain" />
                    <button onClick={() => removeFile(index)} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110 shadow-lg translate-y-2 group-hover:translate-y-0">
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded-md text-[10px] text-white backdrop-blur-sm">Img #{index + 1}</div>
                  </div>
                ))}
                {selectedFiles.length < 4 && (
                  <button onClick={() => fileInputRef.current?.click()} className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all group min-h-[150px] bg-white/50 dark:bg-slate-800/50 hover:scale-[0.98]">
                    <Upload className="text-slate-300 group-hover:text-amber-500 transition-colors" size={32} />
                    <span className="text-xs text-slate-400 group-hover:text-amber-600 mt-2 font-bold transition-colors">新增</span>
                  </button>
                )}
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" multiple />
          </div>
        </div>

        {/* Output Text (Right) */}
        <div className="bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-800/90 dark:to-slate-800/50 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-5 flex flex-col shadow-2xl shadow-amber-500/10 dark:shadow-amber-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-amber-500/20">
           <div className="flex justify-between items-center text-amber-900/60 dark:text-amber-300/60 text-xs font-bold uppercase tracking-wider mb-3 px-2">
            <span>AI 分析結果</span>
            <div className="flex items-center gap-2">
                <button 
                  onClick={() => setJsonMode(!jsonMode)}
                  className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all text-[10px] font-medium border ${jsonMode ? 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  title="切換 JSON 輸出模式"
                >
                   {jsonMode ? <FileJson size={12} /> : <FileText size={12} />} 
                   {jsonMode ? 'JSON 模式' : '文字模式'}
                </button>

                {outputText && (
                  <>
                    <button 
                      onClick={handleSpeak}
                      className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all text-[10px] font-medium ${isSpeaking ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 animate-pulse' : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-500 dark:hover:bg-amber-900/20'}`}
                      title="朗讀內容"
                    >
                      <Volume2 size={12} />
                      {isSpeaking ? '朗讀中' : '朗讀'}
                    </button>
                    <button 
                        onClick={handleCopy}
                        className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all text-[10px] font-medium ${copied ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-500 dark:hover:bg-emerald-900/20'}`}
                    >
                        {copied ? <Check size={12} /> : <Copy size={12} />} 
                        {copied ? '已複製' : '複製'}
                    </button>
                  </>
                )}
            </div>
          </div>
          <div className={`flex-grow relative w-full bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-slate-700 dark:text-slate-200 overflow-y-auto transition-all duration-300 ${isProcessing ? 'border-amber-200' : ''}`}>
             {isProcessing ? (
               <div className="flex flex-col items-center justify-center h-full gap-4 animate-in fade-in zoom-in-95 duration-500">
                 <div className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-full shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-amber-200/50 dark:bg-amber-500/20 animate-ping rounded-full"></div>
                    <ScanSearch size={32} className="relative z-10 animate-pulse" />
                 </div>
                 <span className="text-amber-600 dark:text-amber-400 font-bold tracking-tight">Gemini 正在分析圖片...</span>
               </div>
             ) : (
               outputText ? (
                 jsonMode ? (
                    <pre className="font-mono text-xs bg-slate-800 text-emerald-400 p-4 rounded-xl overflow-x-auto shadow-inner">{outputText}</pre>
                 ) : (
                    <SimpleMarkdown content={outputText} />
                 )
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 select-none">
                    <Sparkles size={48} className="mb-4 opacity-20" />
                    <span className="font-medium italic">分析結果將顯示於此</span>
                 </div>
               )
             )}
          </div>
        </div>
      </div>

      {/* Suggestion Panel Overlay */}
      {showSuggestions && (
          <div className="relative w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-amber-200 dark:border-amber-800 rounded-2xl p-4 animate-in slide-in-from-top-4 mb-4 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                      <Lightbulb size={16} className="text-yellow-500" /> AI 深度分析顧問：50 種分析策略
                  </h3>
                  <button onClick={() => setShowSuggestions(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                      <X size={14} />
                  </button>
              </div>
              
              {isAnalyzing ? (
                  <div className="flex justify-center items-center py-8 gap-2 text-amber-600 dark:text-amber-400 font-medium text-xs">
                      <span className="animate-spin">⌛</span> 正在解讀圖片資訊並生成 50 種建議，請稍候...
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
                                      ? 'bg-amber-500 text-white shadow-md'
                                      : 'bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-900/30'
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
                                      // Kept open for better UX
                                  }}
                                  className="flex flex-col items-start p-3 bg-white/70 dark:bg-slate-800/70 border border-white dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 rounded-xl transition-all hover:shadow-md hover:-translate-y-1 text-left h-full group"
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
      <div className="bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-800/80 dark:to-slate-800/40 backdrop-blur-2xl rounded-[2rem] p-6 border border-white/50 dark:border-slate-700/50 shadow-2xl shadow-amber-500/10 dark:shadow-amber-900/20 transition-transform duration-300 hover:shadow-amber-500/15">
        <div className="flex flex-col gap-5">
           {showTips && (
             <div className="flex items-start gap-3 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-3 rounded-xl animate-in slide-in-from-bottom-2">
               <div className="p-1.5 bg-amber-200 dark:bg-amber-800 rounded-full flex-shrink-0 text-amber-600 dark:text-amber-200">
                 <Lightbulb size={14} />
               </div>
               <div className="flex-grow">
                 <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1">💡 分析小撇步：</h4>
                 <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                   <p><span className="font-bold text-amber-600 dark:text-amber-400">📄 文件/菜單/名片：</span> 選擇 <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-amber-200 dark:border-amber-800 rounded text-amber-600 dark:text-amber-400 font-bold">提取與識別</span> 類別，並開啟 JSON 模式，方便資料整理。</p>
                   <p><span className="font-bold text-amber-600 dark:text-amber-400">🛍️ 物品/商品：</span> 試試 <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-amber-200 dark:border-amber-800 rounded text-amber-600 dark:text-amber-400 font-bold">物品與人物</span>，詢問價格、產地或清潔方式。</p>
                   <p><span className="font-bold text-amber-600 dark:text-amber-400">🎬 故事創作：</span> 上傳多張圖片，使用 <span className="inline-block px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-amber-200 dark:border-amber-800 rounded text-amber-600 dark:text-amber-400 font-bold">創意編劇</span> 來串聯故事。</p>
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
                      className="group relative text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700/80 hover:bg-amber-500 hover:text-white text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600/60 hover:border-amber-500 transition-all duration-200 font-medium whitespace-nowrap shadow-sm hover:shadow-amber-500/25 hover:-translate-y-0.5 active:scale-95"
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

          <div className="flex flex-col gap-3">
             <div className="relative group">
                <textarea
                  ref={promptInputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleExecute(); } }}
                  placeholder="✨ 請描述您想分析的內容... 例如：「翻譯這份菜單」或「分析這個物品的用途」"
                  className="w-full bg-white/50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-xl px-5 py-4 shadow-inner focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 outline-none resize-none min-h-[80px] leading-relaxed transition-all placeholder:text-slate-400"
                  rows={2}
                />
             </div>
             
             {/* Toolbar */}
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                   <button 
                      onClick={handleMagicOptimize}
                      disabled={isOptimizing}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold border ${isOptimizing ? 'text-amber-600 bg-amber-100 border-amber-200 animate-pulse' : 'text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-amber-300 dark:hover:border-amber-700 shadow-sm'}`}
                      title="魔術棒：優化提示詞"
                   >
                       <Wand2 size={14} /> 魔法優化
                   </button>
                   <button 
                      onClick={handleAnalyzeSuggestions}
                      disabled={isAnalyzing}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold border ${isAnalyzing ? 'text-amber-600 bg-amber-100 border-amber-200 animate-pulse' : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-600 dark:hover:text-amber-400 shadow-sm'}`}
                      title="AI 深度分析顧問"
                   >
                       <Lightbulb size={14} className="text-yellow-500" /> 深度分析
                   </button>
                   <button 
                      onClick={handleRandomPrompt}
                      className="p-2 text-slate-500 hover:text-amber-600 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-amber-300 dark:hover:border-amber-700 rounded-lg transition-all shadow-sm"
                      title="隨機靈感"
                   >
                       <Dices size={16} />
                   </button>
                   <button 
                      onClick={toggleListening}
                      className={`p-2 rounded-lg transition-all border shadow-sm ${isListening ? 'text-red-500 bg-red-50 border-red-200 animate-pulse' : 'text-slate-500 hover:text-amber-600 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-amber-300 dark:hover:border-amber-700'}`}
                      title={isListening ? "停止錄音" : "語音輸入"}
                   >
                       {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                   </button>
                </div>

                <Button 
                    onClick={handleExecute} 
                    isLoading={isProcessing} 
                    disabled={selectedFiles.length === 0 || !prompt}
                    accentColor="amber"
                    className="w-full sm:w-auto px-8 py-2.5 shadow-lg shadow-amber-500/20"
                >
                    分析 <ArrowRight size={16} className="ml-2" />
                </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
