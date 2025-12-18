
import React, { useState, useCallback, useRef, useEffect } from 'react';
import ThreeScene from './components/ThreeScene';
import HandTracker from './components/HandTracker';
import { HandData } from './types';
import { Brush, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { PAINTING_STYLES, GENERATION_TIME } from './constants';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const App: React.FC = () => {
  const [handData, setHandData] = useState<HandData>({ left: null, right: null });
  const [showInstructions, setShowInstructions] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTextureUrl, setCurrentTextureUrl] = useState('');
  const [statusText, setStatusText] = useState('');
  
  // Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout to avoid namespace errors in browser environment
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generatePainting = async () => {
    setIsGenerating(true);
    setStatusText('研墨构思中...');
    
    try {
      const style = PAINTING_STYLES[Math.floor(Math.random() * PAINTING_STYLES.length)];
      const prompt = `A high-quality traditional Chinese painting, style: ${style}. 
      Panoramic aspect ratio, highly detailed brushstrokes, authentic rice paper texture background, elegant and poetic composition. No modern elements.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });

      let foundImageUrl = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          foundImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (foundImageUrl) {
        setCurrentTextureUrl(foundImageUrl);
        setStatusText('丹青已就，请开卷');
        setTimeout(() => {
          setIsGenerating(false);
          setStatusText('');
        }, 1500);
      } else {
        throw new Error('No image generated');
      }
    } catch (error) {
      console.error('Generation failed:', error);
      setIsGenerating(false);
      setStatusText('意境受阻，请重试');
      setTimeout(() => setStatusText(''), 3000);
    }
  };

  const handleHandUpdate = useCallback((data: HandData) => {
    setHandData(data);
  }, []);

  const handleScrollStateChange = useCallback((isClosed: boolean) => {
    if (isClosed && !isGenerating) {
      // 只有在没有生成时才启动计时
      if (!closeTimerRef.current) {
        closeTimerRef.current = setTimeout(() => {
          generatePainting();
          closeTimerRef.current = null;
        }, GENERATION_TIME);
      }
    } else {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    }
  }, [isGenerating]);

  return (
    <div className="relative w-screen h-screen bg-[#d9d6c3] overflow-hidden font-serif">
      <div className="absolute inset-0 z-0">
        <ThreeScene 
          handData={handData} 
          isGenerating={isGenerating} 
          currentTextureUrl={currentTextureUrl}
          onScrollStateChange={handleScrollStateChange}
        />
      </div>

      {/* UI Overlay */}
      <div className="absolute top-12 left-0 right-0 z-10 pointer-events-none flex flex-col items-center">
        <div className="flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl text-[#1A1A1A] font-calligraphy tracking-[0.2em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.15)] mb-2">
            开卷有画
          </h1>
          <div className="h-[1px] w-64 bg-gradient-to-r from-transparent via-[#374151]/20 to-transparent mt-6" />
        </div>
      </div>

      {/* Status Feedback */}
      {statusText && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-4">
          <div className="bg-white/80 backdrop-blur-md px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 border border-amber-200">
            {isGenerating ? (
              <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            )}
            <span className="text-stone-800 font-bold tracking-[0.5em] text-lg font-calligraphy">
              {statusText}
            </span>
          </div>
        </div>
      )}

      {/* Indicators */}
      <div className="absolute top-12 left-12 space-y-6 z-20">
        <div className={`flex items-center gap-4 transition-all duration-700 ${handData.left ? 'opacity-100' : 'opacity-20'}`}>
          <div className={`w-2 h-2 rounded-full ${handData.left ? 'bg-[#eab308] shadow-[0_0_15px_#eab308]' : 'bg-stone-300'}`} />
          <span className="text-[10px] tracking-[0.3em] text-[#374151] font-bold">左轴联调</span>
        </div>
        <div className={`flex items-center gap-4 transition-all duration-700 ${handData.right ? 'opacity-100' : 'opacity-20'}`}>
          <div className={`w-2 h-2 rounded-full ${handData.right ? 'bg-[#eab308] shadow-[0_0_15px_#eab308]' : 'bg-stone-300'}`} />
          <span className="text-[10px] tracking-[0.3em] text-[#374151] font-bold">右轴联调</span>
        </div>
      </div>

      {/* Instructions */}
      {showInstructions && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-6 text-center">
          <div className="max-w-2xl bg-[#fcfaf2] border-[12px] border-[#374151] p-12 rounded-sm shadow-[0_0_80px_rgba(0,0,0,0.15)] relative">
            <div className="absolute -top-4 -left-4 w-12 h-12 border-t-4 border-l-4 border-[#eab308]" />
            <div className="absolute -bottom-4 -right-4 w-12 h-12 border-b-4 border-r-4 border-[#eab308]" />

            <Brush className="w-16 h-16 text-[#374151] mx-auto mb-6 opacity-90" />
            <h2 className="text-4xl text-[#374151] mb-8 tracking-[0.2em] font-black uppercase">素雅 · 卷轴</h2>
            <p className="text-stone-800 mb-12 leading-loose text-lg font-bold">
              静候五秒，画意自生。<br/>
              将轴杆完全合拢，待研墨声起，<br/>
              即是笔墨交融、万象更新之时。
            </p>
            
            <button 
              onClick={() => setShowInstructions(false)}
              className="px-16 py-4 bg-[#374151] hover:bg-[#1f2937] text-[#fcfaf2] rounded-none font-bold tracking-[0.8em] transition-all shadow-xl active:scale-95 border-b-4 border-[#eab308]"
            >
              入画
            </button>
          </div>
        </div>
      )}

      <HandTracker onHandUpdate={handleHandUpdate} />
    </div>
  );
};

export default App;
