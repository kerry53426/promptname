import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { modifyTextWithGemini, IWindow, analyzeContentForSuggestions, SuggestionCategory, optimizeUserPrompt } from '../services/geminiService';
import { TEXT_PROMPTS, SAMPLE_TEXT, TEXT_MODELS, TEXT_CATEGORIES, TEXT_TONES } from '../constants';
import { ArrowRight, Copy, RefreshCw, Wand2, Settings2, Clock, Trash2, Sparkles, MessageSquareQuote, Plus, X, AlignLeft, Check, Volume2, Download, Search, Mic, MicOff, Dices, Lightbulb, SplitSquareHorizontal, Waves } from 'lucide-react';

interface TextPlaygroundProps {
  onError: (msg: string) => void;
  incomingPrompt?: string;
}

// Simple markdown renderer component
const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  // Split by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="leading-relaxed">
      {parts.map((part, index) => {
        // Handle Code Blocks
        if (part.startsWith('```') && part.endsWith('```')) {
          const codeContent = part.slice(3, -3).replace(/^.*\n/, ''); // Try to remove language identifier line
          return (
            <div key={index} className="my-4 bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs sm:text-sm overflow-x-auto border border-slate-700 shadow-inner">
              <pre>{codeContent.trim()}</pre>
            </div>
          );
        }

        // Handle Inline formatting (Bold and Inline Code)
        // We split by newlines first to preserve paragraph structure roughly
        const paragraphs = part.split('\n');
        return (
          <span key={index}>
            {paragraphs.map((para, pIndex) => (
              <React.Fragment key={pIndex}>
                {para.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((segment, sIndex) => {
                  if (segment.startsWith('`') && segment.endsWith('`')) {
                    return <code key={sIndex} className="bg-slate-200 dark:bg-slate-700 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded font-mono text-[0.9em]">{segment.slice(1, -1)}</code>;
                  }
                  if (segment.startsWith('**') && segment.endsWith('**')) {
                    return <strong key={sIndex} className="text-indigo-700 dark:text-indigo-300 font-bold">{segment.slice(2, -2)}</strong>;
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

export const TextPlayground: React.FC<TextPlaygroundProps> = ({ onError, incomingPrompt }) => {
  // Now supports multiple text inputs
  const [inputTexts, setInputTexts] = useState<string[]>([SAMPLE_TEXT]);
  const [prompt, setPrompt] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showDiff, setShowDiff] = useState(false); // Toggle for Diff View
  
  // New features state
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  // AI Suggestions
  const [suggestionCategories, setSuggestionCategories] = useState<SuggestionCategory[]>([]);
  const [activeSuggestionCategory, setActiveSuggestionCategory] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const promptInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('promptcraft_text_model') || TEXT_MODELS[0].id;
  });

  const [selectedTone, setSelectedTone] = useState(() => {
    return localStorage.getItem('promptcraft_text_tone') || TEXT_TONES[0].id;
  });

  useEffect(() => {
    localStorage.setItem('promptcraft_text_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem('promptcraft_text_tone', selectedTone);
  }, [selectedTone]);

  useEffect(() => {
    if (incomingPrompt) {
        applyTemplate(incomingPrompt);
    }
  }, [incomingPrompt]);
  
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
      const saved = localStorage.getItem('promptcraft_text_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const addToHistory = (newPrompt: string) => {
    if (!newPrompt.trim()) return;
    setHistory(prev => {
      const filtered = prev.filter(p => p !== newPrompt);
      const newHistory = [newPrompt, ...filtered].slice(0, 10);
      localStorage.setItem('promptcraft_text_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('promptcraft_text_history');
  };

  const downloadHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompt_history.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const addTextBlock = () => {
    if (inputTexts.length >= 4) {
        onError("最多支援同時比較 4 段文字。");
        return;
    }
    setInputTexts([...inputTexts, '']);
  };

  const removeTextBlock = (index: number) => {
    if (inputTexts.length <= 1) return;
    const newTexts = inputTexts.filter((_, i) => i !== index);
    setInputTexts(newTexts);
  };

  const updateTextBlock = (index: number, value: string) => {
    const newTexts = [...inputTexts];
    newTexts[index] = value;
    setInputTexts(newTexts);
  };

  const handleExecute = async () => {
    // Filter out empty texts
    const validTexts = inputTexts.filter(t => t.trim() !== '');
    if (validTexts.length === 0 || !prompt.trim()) return;
    
    setIsProcessing(true);
    setOutputText('');
    addToHistory(prompt);
    
    // User requested to keep suggestions open on selection, but maybe close on execute?
    // Let's keep it open if they are experimenting. 
    // setShowSuggestions(false); 

    let finalPrompt = prompt;
    if (selectedTone !== 'default') {
      const toneLabel = TEXT_TONES.find(t => t.id === selectedTone)?.label;
      if (toneLabel) {
        finalPrompt = `${prompt}\n\n(請使用「${toneLabel}」的語氣或風格來執行此任務，確保符合該風格的特徵。)`;
      }
    }

    try {
      // Pass the array if multiple texts, or single string if just one
      const inputPayload = validTexts.length === 1 ? validTexts[0] : validTexts;
      const result = await modifyTextWithGemini(inputPayload, finalPrompt, selectedModel);
      setOutputText(result);
    } catch (err: any) {
      onError(err.message || '處理文字時發生錯誤。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMagicOptimize = async () => {
      if (!prompt.trim()) return;
      setIsOptimizing(true);
      try {
          const optimized = await optimizeUserPrompt(prompt, 'text');
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
      utterance.lang = 'zh-TW'; // Default to Traditional Chinese, can be auto-detected ideally
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
  };

  // Stop speaking when component unmounts
  useEffect(() => {
      return () => {
          window.speechSynthesis.cancel();
      };
  }, []);

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
      const random = TEXT_PROMPTS[Math.floor(Math.random() * TEXT_PROMPTS.length)];
      setSelectedCategory(random.category); // Switch to that category
      applyTemplate(random.prompt);
  };

  const handleAnalyzeSuggestions = async () => {
      const validTexts = inputTexts.filter(t => t.trim() !== '');
      if (validTexts.length === 0) {
          onError("請先輸入文字內容，才能進行分析。");
          return;
      }

      // UX Improvement: If we already have suggestions and the panel is closed, just open it.
      // This allows reopening without regeneration.
      if (suggestionCategories.length > 0 && !showSuggestions) {
          setShowSuggestions(true);
          return;
      }

      setIsAnalyzing(true);
      setShowSuggestions(true);
      setSuggestionCategories([]);
      setActiveSuggestionCategory(0);
      try {
          const results = await analyzeContentForSuggestions('text', validTexts);
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

  // Stats Logic
  const totalInputLength = inputTexts.reduce((acc, curr) => acc + curr.length, 0);
  const outputLength = outputText.length;
  const lengthDiff = outputLength - totalInputLength;
  const percentChange = totalInputLength > 0 ? ((lengthDiff / totalInputLength) * 100).toFixed(1) : 0;

  // Filter Logic: Combine Category + Search Query
  const filteredPrompts = TEXT_PROMPTS.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
                          p.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    
    // If searching, ignore category tab (search globally), otherwise respect category
    return searchQuery !== '' ? matchesSearch : (matchesCategory && matchesSearch);
  });

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Top Section: Split View */}
      <div className={`grid grid-cols-1 ${showDiff && inputTexts.length === 1 && outputText ? 'lg:grid-cols-2' : 'lg:grid-cols-2'} gap-6 flex-grow`}>
        
        {/* Input Column */}
        <div className={`flex flex-col gap-2 group/col h-full ${showDiff && outputText ? 'lg:block' : ''}`}>
          <div className="flex justify-between items-center text-indigo-900/60 dark:text-indigo-300/60 text-xs font-bold uppercase tracking-wider px-2">
            <span>輸入文字 ({inputTexts.length})</span>
            <div className="flex gap-2">
                {inputTexts.length === 1 && (
                     <button 
                        onClick={() => updateTextBlock(0, SAMPLE_TEXT)}
                        className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2 py-1 rounded-lg flex items-center gap-1 transition-all text-[10px] font-medium"
                    >
                        <RefreshCw size={10} /> 重置範例
                    </button>
                )}
                {inputTexts.length < 4 && !showDiff && (
                     <button 
                        onClick={addTextBlock}
                        className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-800/50 px-2 py-1 rounded-lg flex items-center gap-1 transition-all text-[10px] font-bold"
                    >
                        <Plus size={10} /> 新增文本
                    </button>
                )}
            </div>
          </div>
          
          <div className="flex-grow flex flex-col gap-4 overflow-y-auto pr-1">
             {inputTexts.map((text, index) => (
                <div key={index} className="relative group/input flex-grow min-h-[200px] transition-transform duration-300 hover:-translate-y-1">
                    <textarea
                    value={text}
                    onChange={(e) => updateTextBlock(index, e.target.value)}
                    className={`w-full h-full bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-800/90 dark:to-slate-800/50 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 text-slate-700 dark:text-slate-200 shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-900/20 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none resize-none transition-all placeholder-slate-400 text-base leading-relaxed ${showDiff && outputText ? 'border-r-0 rounded-r-none' : ''}`}
                    placeholder={`[文本 ${index + 1}] 請在此貼上文字...`}
                    />
                    <div className="absolute bottom-2 right-4 text-[10px] text-slate-400 font-mono">
                         {text.length} 字
                    </div>
                    {inputTexts.length > 1 && !showDiff && (
                        <div className="absolute top-2 right-2 flex gap-2">
                            <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold px-2 py-1 rounded-md">
                                文本 {index + 1}
                            </span>
                            <button 
                                onClick={() => removeTextBlock(index)}
                                className="bg-red-50 dark:bg-red-900/20 text-red-400 hover:text-red-600 hover:bg-red-100 p-1 rounded-md transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    )}
                </div>
             ))}
             {inputTexts.length < 4 && inputTexts.length > 1 && !showDiff && (
                 <button onClick={addTextBlock} className="w-full py-3 border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-xl text-indigo-400 dark:text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all text-sm font-bold flex items-center justify-center gap-2">
                     <Plus size={16} /> 點擊新增下一段文字
                 </button>
             )}
          </div>
        </div>

        {/* Output Column */}
        <div className={`flex flex-col gap-2 h-full ${showDiff && outputText ? 'lg:pl-0' : ''}`}>
           <div className="flex justify-between items-center text-indigo-900/60 dark:text-indigo-300/60 text-xs font-bold uppercase tracking-wider px-2">
            <span>AI 產出</span>
            <div className="flex items-center gap-2">
                {outputText && inputTexts.length === 1 && (
                    <button
                        onClick={() => setShowDiff(!showDiff)}
                        className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all text-[10px] font-medium border ${showDiff ? 'bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="開啟比對模式 (左右對照)"
                    >
                        <SplitSquareHorizontal size={10} />
                        {showDiff ? '比對模式: 開' : '比對模式: 關'}
                    </button>
                )}
                {outputText && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[10px] font-mono text-slate-500 dark:text-slate-400 mr-2">
                        <AlignLeft size={10} />
                        <span>{outputLength} 字</span>
                        {totalInputLength > 0 && (
                            <span className={lengthDiff > 0 ? 'text-emerald-500' : 'text-red-500'}>
                                ({lengthDiff > 0 ? '+' : ''}{lengthDiff}, {lengthDiff > 0 ? '+' : ''}{percentChange}%)
                            </span>
                        )}
                    </div>
                )}
                {outputText && (
                  <>
                    <button 
                      onClick={handleSpeak}
                      className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all text-[10px] font-medium ${isSpeaking ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 animate-pulse' : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-500 dark:hover:bg-indigo-900/20'}`}
                      title="朗讀內容"
                    >
                      <Volume2 size={10} />
                      {isSpeaking ? '朗讀中' : '朗讀'}
                    </button>

                    <button 
                        onClick={handleCopy}
                        className={`px-2 py-1 rounded-lg flex items-center gap-1 transition-all text-[10px] font-medium ${copied ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-500 dark:hover:bg-emerald-900/20'}`}
                    >
                        {copied ? <Check size={10} /> : <Copy size={10} />} 
                        {copied ? '已複製' : '複製'}
                    </button>
                  </>
                )}
            </div>
          </div>
          <div className={`relative flex-grow w-full bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-800/90 dark:to-slate-800/50 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 rounded-3xl p-6 text-slate-700 dark:text-slate-200 shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-900/20 overflow-y-auto transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/20 ${!outputText ? 'flex items-center justify-center' : ''} ${showDiff && outputText ? 'border-l-0 rounded-l-none' : ''}`}>
             {isProcessing ? (
               <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
                 <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-200/50 dark:bg-indigo-500/20 animate-ping rounded-full"></div>
                    <Wand2 size={32} className="relative z-10 animate-pulse" />
                 </div>
                 <span className="text-indigo-600 dark:text-indigo-400 font-bold tracking-tight">Gemini 正在思考中...</span>
               </div>
             ) : (
               outputText ? (
                 <SimpleMarkdown content={outputText} />
               ) : (
                 <span className="text-slate-300 dark:text-slate-500 font-medium italic select-none">修改後的文字將顯示於此。</span>
               )
             )}
          </div>
        </div>
      </div>

      {/* Suggestion Panel Overlay */}
      {showSuggestions && (
          <div className="relative w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 animate-in slide-in-from-top-4 mb-4 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                      <Lightbulb size={16} className="text-yellow-500" /> AI 深度分析顧問：30 種優化策略
                  </h3>
                  <button onClick={() => setShowSuggestions(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                      <X size={14} />
                  </button>
              </div>
              
              {isAnalyzing ? (
                  <div className="flex justify-center items-center py-8 gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-xs">
                      <span className="animate-spin">⌛</span> 正在為您生成深度分析與改寫策略，請稍候...
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
                                      ? 'bg-indigo-500 text-white shadow-md'
                                      : 'bg-white/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
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
                                  className="flex flex-col items-start p-3 bg-white/70 dark:bg-slate-800/70 border border-white dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl transition-all hover:shadow-md hover:-translate-y-1 text-left h-full group"
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

      {/* Bottom Section: Controls */}
      <div className="bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-800/80 dark:to-slate-800/40 backdrop-blur-2xl rounded-[2rem] p-6 border border-white/50 dark:border-slate-700/50 shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-900/20 transition-transform duration-300 hover:shadow-indigo-500/15">
        <div className="flex flex-col gap-5">
          
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 border-b border-indigo-50 dark:border-slate-700/50 pb-5">
             {/* Prompt Templates */}
             <div className="flex-grow w-full">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                      <Sparkles size={12} className="text-indigo-400" /> 靈感提示詞 ({filteredPrompts.length})
                    </span>

                    <div className="flex items-center gap-2">
                        {/* Search Bar */}
                        <div className="relative group/search">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="搜尋..."
                                className="pl-6 pr-2 py-1 text-[10px] w-24 focus:w-40 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-indigo-400 transition-all"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={10}/></button>
                            )}
                        </div>

                        {/* Category Tabs (Hide when searching) */}
                        {searchQuery === '' && (
                            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none max-w-[40%] lg:max-w-none">
                                {TEXT_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`text-[10px] px-3 py-1 rounded-full whitespace-nowrap transition-all duration-300 ${
                                            selectedCategory === cat.id 
                                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold shadow-sm scale-105' 
                                            : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm'
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
                      className="group relative text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700/80 hover:bg-indigo-500 hover:text-white text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600/60 hover:border-indigo-500 transition-all duration-200 font-medium whitespace-nowrap shadow-sm hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:scale-95"
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

                {/* History Section */}
                {history.length > 0 && (
                  <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/50 animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={12} className="text-slate-400"/>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">歷史紀錄</span>
                      <div className="ml-auto flex gap-2">
                         <button onClick={downloadHistory} className="text-[10px] text-slate-400 hover:text-indigo-500 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                            <Download size={10}/> 下載
                         </button>
                         <button onClick={clearHistory} className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-0.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 size={10}/> 清除
                         </button>
                      </div>
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
             
             {/* Configuration Group */}
             <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 self-start">
               {/* Tone Selector */}
               <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-700/50 p-2 rounded-xl border border-white/50 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow">
                  <MessageSquareQuote size={14} className="text-indigo-400 ml-1" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">語氣:</span>
                  <select
                    value={selectedTone}
                    onChange={(e) => setSelectedTone(e.target.value)}
                    className="bg-transparent text-xs text-indigo-600 dark:text-indigo-400 font-bold focus:outline-none cursor-pointer pr-1"
                  >
                    {TEXT_TONES.map(t => (
                      <option key={t.id} value={t.id} className="text-slate-700 dark:text-slate-300 dark:bg-slate-800">{t.label}</option>
                    ))}
                  </select>
               </div>

               {/* Model Selector */}
               <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-700/50 p-2 rounded-xl border border-white/50 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow">
                  <Settings2 size={14} className="text-indigo-400 ml-1" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">模型:</span>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-transparent text-xs text-indigo-600 dark:text-indigo-400 font-bold focus:outline-none cursor-pointer pr-1"
                  >
                    {TEXT_MODELS.map(m => (
                      <option key={m.id} value={m.id} className="text-slate-700 dark:text-slate-300 dark:bg-slate-800">{m.label}</option>
                    ))}
                  </select>
               </div>
             </div>
          </div>

          {/* Prompt Input Area - Refactored Layout */}
          <div className="flex flex-col gap-3">
             <div className="relative group">
                <input
                  type="text"
                  ref={promptInputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
                  placeholder={inputTexts.length > 1 ? "✨ 描述如何比較或融合這些文字... (例如：比較兩者的差異)" : "✨ 希望 AI 如何修改文字？"}
                  className="w-full bg-white/50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-xl px-5 py-4 shadow-inner focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400"
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
             
             {/* New Toolbar */}
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                   <button 
                      onClick={handleMagicOptimize}
                      disabled={isOptimizing}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold border ${isOptimizing ? 'text-indigo-600 bg-indigo-100 border-indigo-200 animate-pulse' : 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm'}`}
                      title="魔術棒：優化提示詞"
                   >
                       <Wand2 size={14} /> 魔法優化
                   </button>
                   <button 
                      onClick={handleAnalyzeSuggestions}
                      disabled={isAnalyzing}
                      className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold border ${isAnalyzing ? 'text-indigo-600 bg-indigo-100 border-indigo-200 animate-pulse' : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm'}`}
                      title="AI 深度分析顧問"
                   >
                       <Lightbulb size={14} className="text-yellow-500" /> 深度分析
                   </button>
                   <button 
                      onClick={handleRandomPrompt}
                      className="p-2 text-slate-500 hover:text-indigo-600 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-lg transition-all shadow-sm"
                      title="隨機靈感"
                   >
                       <Dices size={16} />
                   </button>
                   <button 
                      onClick={toggleListening}
                      className={`p-2 rounded-lg transition-all border shadow-sm ${isListening ? 'text-white bg-red-500 border-red-600 animate-pulse shadow-red-500/30' : 'text-slate-500 hover:text-indigo-600 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-700'}`}
                      title={isListening ? "停止錄音" : "語音輸入"}
                   >
                       {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                   </button>
                </div>

                <Button 
                    onClick={handleExecute} 
                    isLoading={isProcessing} 
                    accentColor="indigo"
                    disabled={inputTexts.every(t => !t.trim()) || !prompt}
                    className="w-full sm:w-auto px-8 py-2.5 shadow-lg shadow-indigo-500/20"
                >
                    執行 <ArrowRight size={16} className="ml-2" />
                </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}