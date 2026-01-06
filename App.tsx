

import React, { useState, useEffect } from 'react';
import { TextPlayground } from './components/TextPlayground';
import { ImagePlayground } from './components/ImagePlayground';
import { TextToImagePlayground } from './components/TextToImagePlayground';
import { ImageToTextPlayground } from './components/ImageToTextPlayground';
import { ImageToVideoPlayground } from './components/ImageToVideoPlayground';
import { Mode } from './types';
import { Sparkles, Type, Image as ImageIcon, AlertCircle, Wand2, ScanSearch, Moon, Sun, Video } from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState<Mode>('text');
  const [error, setError] = useState<string | null>(null);
  
  // Dark mode state
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('promptcraft_theme') === 'dark' || 
             (!localStorage.getItem('promptcraft_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('promptcraft_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('promptcraft_theme', 'light');
    }
  }, [isDark]);

  const handleError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 5000);
  };

  const renderContent = () => {
    switch (mode) {
      case 'text':
        return (
          <div key="text" className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-forwards">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-indigo-500 dark:from-indigo-400 dark:to-indigo-200 mb-3 tracking-tight flex items-center gap-3 justify-center lg:justify-start">
                <span className="bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/10 border border-indigo-100 dark:border-indigo-900 transition-transform hover:scale-110 duration-300"><Type size={28}/></span>
                文字修改遊樂場
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl leading-relaxed font-medium">
                學習如何通過修改指令來控制 LLM 的輸出。在左側貼上任何文字，看看 Gemini 如何巧妙改寫它。
              </p>
            </div>
            <TextPlayground onError={handleError} />
          </div>
        );
      case 'image':
        return (
          <div key="image" className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-forwards">
            <div className="mb-8 text-center lg:text-left">
               <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-rose-500 dark:from-rose-400 dark:to-rose-200 mb-3 tracking-tight flex items-center gap-3 justify-center lg:justify-start">
                  <span className="bg-white dark:bg-slate-800 text-rose-500 dark:text-rose-400 p-2.5 rounded-2xl shadow-lg shadow-rose-500/10 border border-rose-100 dark:border-rose-900 transition-transform hover:scale-110 duration-300"><ImageIcon size={28}/></span>
                  圖片修改工作室
               </h2>
               <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl leading-relaxed font-medium">
                上傳圖片或 GIF 動畫並使用自然語言進行轉換。利用 Gemini Vision 功能嘗試風格轉換、物件添加或視覺分析。
              </p>
            </div>
            <ImagePlayground onError={handleError} />
          </div>
        );
      case 'txt2img':
        return (
          <div key="txt2img" className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-forwards">
            <div className="mb-8 text-center lg:text-left">
               <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-400 dark:to-emerald-200 mb-3 tracking-tight flex items-center gap-3 justify-center lg:justify-start">
                  <span className="bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-2xl shadow-lg shadow-emerald-500/10 border border-emerald-100 dark:border-emerald-900 transition-transform hover:scale-110 duration-300"><Wand2 size={28}/></span>
                  文字轉圖片創作
               </h2>
               <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl leading-relaxed font-medium">
                從零開始創造！輸入詳細的描述，讓 Gemini 為您繪製出心中所想的畫面，無論是寫實攝影還是 3D 設計。
              </p>
            </div>
            <TextToImagePlayground onError={handleError} />
          </div>
        );
      case 'img2txt':
        return (
          <div key="img2txt" className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-forwards">
            <div className="mb-8 text-center lg:text-left">
               <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-400 dark:to-amber-200 mb-3 tracking-tight flex items-center gap-3 justify-center lg:justify-start">
                  <span className="bg-white dark:bg-slate-800 text-amber-500 dark:text-amber-400 p-2.5 rounded-2xl shadow-lg shadow-amber-500/10 border border-amber-100 dark:border-amber-900 transition-transform hover:scale-110 duration-300"><ScanSearch size={28}/></span>
                  圖片轉文字分析
               </h2>
               <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl leading-relaxed font-medium">
                讓 AI 成為您的眼睛！上傳圖片，Gemini 可以為您撰寫文案、提取文字 (OCR)、解數學題或分析圖表數據。
              </p>
            </div>
            <ImageToTextPlayground onError={handleError} />
          </div>
        );
      case 'img2vid':
        return (
          <div key="img2vid" className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-forwards">
            <div className="mb-8 text-center lg:text-left">
               <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-violet-500 dark:from-violet-400 dark:to-violet-200 mb-3 tracking-tight flex items-center gap-3 justify-center lg:justify-start">
                  <span className="bg-white dark:bg-slate-800 text-violet-500 dark:text-violet-400 p-2.5 rounded-2xl shadow-lg shadow-violet-500/10 border border-violet-100 dark:border-violet-900 transition-transform hover:scale-110 duration-300"><Video size={28}/></span>
                  圖生影片實驗室
               </h2>
               <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl leading-relaxed font-medium">
                使用 Google Veo 模型讓靜態圖片動起來！添加運鏡、特效與物理動態，製作高品質的 AI 短片。
              </p>
            </div>
            <ImageToVideoPlayground onError={handleError} />
          </div>
        );
    }
  };

  const getBackgroundClass = () => {
    switch(mode) {
      case 'text': return 'from-blue-100 via-indigo-100 to-violet-100 dark:from-slate-950 dark:via-indigo-950/40 dark:to-slate-950';
      case 'image': return 'from-orange-100 via-rose-100 to-pink-100 dark:from-slate-950 dark:via-rose-950/40 dark:to-slate-950';
      case 'txt2img': return 'from-teal-100 via-emerald-100 to-green-100 dark:from-slate-950 dark:via-emerald-950/40 dark:to-slate-950';
      case 'img2txt': return 'from-yellow-100 via-amber-100 to-orange-100 dark:from-slate-950 dark:via-amber-950/40 dark:to-slate-950';
      case 'img2vid': return 'from-fuchsia-100 via-violet-100 to-purple-100 dark:from-slate-950 dark:via-violet-950/40 dark:to-slate-950';
      default: return 'from-slate-100 via-gray-100 to-zinc-100 dark:from-slate-950 dark:to-slate-900';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${getBackgroundClass()} transition-all duration-700 text-slate-800 dark:text-slate-200`}>
      
      {/* Header */}
      <header className="border-b border-white/20 dark:border-white/5 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 group-hover:scale-105 transition-all duration-300">
              <Sparkles className="text-white group-hover:rotate-12 transition-transform duration-300" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight hidden sm:block group-hover:from-indigo-600 group-hover:to-purple-600 dark:group-hover:from-indigo-400 dark:group-hover:to-purple-400 transition-all duration-300">
                提示詞工坊
              </h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase hidden sm:block group-hover:text-indigo-400 transition-colors">PromptCraft AI</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Navigation Tabs */}
             <div className="flex items-center p-1.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/40 dark:border-slate-700/50 backdrop-blur-md shadow-sm gap-1 overflow-x-auto scrollbar-none max-w-[200px] sm:max-w-none">
              <button onClick={() => setMode('text')} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${mode === 'text' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 shadow-sm border border-indigo-100 dark:border-indigo-800' : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>
                <Type size={16} /> <span className="hidden sm:inline">文字</span>
              </button>
              <button onClick={() => setMode('image')} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${mode === 'image' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-300 shadow-sm border border-rose-100 dark:border-rose-800' : 'text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>
                <ImageIcon size={16} /> <span className="hidden sm:inline">修圖</span>
              </button>
              <button onClick={() => setMode('txt2img')} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${mode === 'txt2img' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 shadow-sm border border-emerald-100 dark:border-emerald-800' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>
                <Wand2 size={16} /> <span className="hidden sm:inline">文生圖</span>
              </button>
              <button onClick={() => setMode('img2txt')} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${mode === 'img2txt' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-300 shadow-sm border border-amber-100 dark:border-amber-800' : 'text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>
                <ScanSearch size={16} /> <span className="hidden sm:inline">圖轉文</span>
              </button>
              <button onClick={() => setMode('img2vid')} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${mode === 'img2vid' ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-500 dark:text-violet-300 shadow-sm border border-violet-100 dark:border-violet-800' : 'text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>
                <Video size={16} /> <span className="hidden sm:inline">影片</span>
              </button>
            </div>
            
            {/* Theme Toggle */}
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
            >
               {isDark ? <Moon size={18}/> : <Sun size={18}/>}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 lg:p-8 relative z-0">
        
        {/* Error Notification */}
        {error && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 p-4 bg-red-50/90 dark:bg-red-900/90 backdrop-blur-xl border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-200 shadow-xl shadow-red-500/10 animate-in slide-in-from-top-5 z-50">
            <div className="bg-red-100 dark:bg-red-800 p-2 rounded-full">
              <AlertCircle size={20} className="text-red-500 dark:text-red-300" />
            </div>
            <p className="text-sm font-bold pr-2">{error}</p>
          </div>
        )}

        <div className="h-full relative">
          {renderContent()}
        </div>
      </main>

      <footer className="py-10 text-center text-slate-400 text-sm font-medium border-t border-white/20 dark:border-white/5 mt-8">
        <p className="flex items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
           Powered by <span className="font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Google Gemini API</span>
        </p>
      </footer>
    </div>
  );
}
