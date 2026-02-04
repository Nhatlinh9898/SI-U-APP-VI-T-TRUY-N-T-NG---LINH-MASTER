import React, { useState } from 'react';
import { Story, StoryBible, Chapter, Part, Section, VoiceSettings } from './types';
import { analyzeStoryInput, generateStoryStructure, writeSectionContent, continueSectionContent } from './geminiService';
import { MagicButton } from './components/MagicButton';
import { VoiceStudio } from './components/VoiceStudio';

const App: React.FC = () => {
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Navigation State
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [activePartId, setActivePartId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Voice State
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    gender: 'male',
    speed: 1.0,
    pitch: 1.0,
    isPlaying: false
  });

  const handleAnalyze = async () => {
    if (!inputPrompt.trim()) return;
    setLoading(true);
    try {
      const bible = await analyzeStoryInput(inputPrompt);
      setStory({
        id: crypto.randomUUID(),
        bible,
        chapters: [],
        currentInput: inputPrompt,
        status: 'ANALYZING'
      });
    } catch (error) {
      console.error(error);
      alert("Lỗi khi phân tích. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStructure = async () => {
    if (!story) return;
    setLoading(true);
    try {
      const chapters = await generateStoryStructure(story.bible);
      setStory(prev => prev ? { ...prev, chapters, status: 'STRUCTURING' } : null);
    } catch (error) {
      console.error(error);
      alert("Lỗi khi tạo cấu trúc.");
    } finally {
      setLoading(false);
    }
  };

  const handleWriteSection = async (chapter: Chapter, part: Part, section: Section) => {
    if (!story) return;
    setLoading(true);
    try {
        // Collect simple previous summary from bible synopsis as failover, or prev sections
        const prevSummary = story.bible.synopsis; 
        
        const content = await writeSectionContent(story.bible, chapter, part, section, prevSummary);
        
        const updatedChapters = story.chapters.map(ch => {
            if (ch.id !== chapter.id) return ch;
            return {
                ...ch,
                parts: ch.parts.map(p => {
                    if (p.id !== part.id) return p;
                    return {
                        ...p,
                        sections: p.sections.map(s => {
                            if (s.id !== section.id) return s;
                            return { ...s, content, isWritten: true };
                        })
                    };
                })
            };
        });

        setStory({ ...story, chapters: updatedChapters, status: 'WRITING' });
    } catch (error) {
        console.error(error);
        alert("Lỗi khi viết mục này.");
    } finally {
        setLoading(false);
    }
  };

  const handleContinueSection = async (chapter: Chapter, part: Part, section: Section) => {
    if (!story) return;
    setLoading(true);
    try {
        const addedContent = await continueSectionContent(story.bible, section.content, section.summary);
        
        const updatedChapters = story.chapters.map(ch => {
            if (ch.id !== chapter.id) return ch;
            return {
                ...ch,
                parts: ch.parts.map(p => {
                    if (p.id !== part.id) return p;
                    return {
                        ...p,
                        sections: p.sections.map(s => {
                            if (s.id !== section.id) return s;
                            return { ...s, content: s.content + "\n\n" + addedContent };
                        })
                    };
                })
            };
        });
        setStory({ ...story, chapters: updatedChapters });
    } catch (error) {
        console.error("Error continuing:", error);
    } finally {
        setLoading(false);
    }
  };

  // Helper to get active objects
  const activeChapter = story?.chapters.find(c => c.id === activeChapterId);
  const activePart = activeChapter?.parts.find(p => p.id === activePartId);
  const activeSection = activePart?.sections.find(s => s.id === activeSectionId);

  return (
    <div className="min-h-screen bg-[#050510] text-gray-200 font-sans selection:bg-violet-500 selection:text-white">
      {/* HEADER VIP PRO */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#050510]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-24 flex flex-col items-center justify-center">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 animate-pulse drop-shadow-[0_0_15px_rgba(139,92,246,0.5)] text-center tracking-tighter">
            SIÊU APP VIẾT TRUYỆN TỰ ĐỘNG
          </h1>
          <p className="text-sm md:text-base text-slate-400 font-medium tracking-[0.3em] mt-2 uppercase">
             Automated Novel Architect Engine
          </p>
        </div>
      </header>

      <main className="pt-28 pb-12 px-4 max-w-7xl mx-auto">
        
        {/* PHASE 1: INPUT */}
        {!story && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
            <div className="bg-slate-900/50 p-8 rounded-2xl border border-violet-500/30 shadow-[0_0_50px_rgba(124,58,237,0.1)]">
              <label className="block text-xl font-bold text-violet-300 mb-4">
                NHẬP Ý TƯỞNG CỐT TRUYỆN (20.000 TỪ)
              </label>
              <textarea
                className="w-full h-96 bg-black/40 border border-slate-700 rounded-xl p-6 text-lg text-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/50 outline-none transition-all resize-none"
                placeholder="Mô tả thế giới, nhân vật, sự kiện chính, cái kết mong muốn..."
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
              />
              <div className="mt-6 flex justify-center">
                <MagicButton onClick={handleAnalyze} isLoading={loading} className="w-full md:w-1/2 text-lg">
                  PHÂN TÍCH & KHỞI TẠO DỮ LIỆU
                </MagicButton>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2 & 3: WORKSPACE */}
        {story && (
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
            
            {/* LEFT: NAVIGATION & STRUCTURE */}
            <div className="col-span-12 md:col-span-3 bg-slate-900/50 rounded-xl border border-white/10 flex flex-col overflow-hidden">
               <div className="p-4 border-b border-white/10 bg-white/5">
                 <h2 className="font-bold text-violet-300">CẤU TRÚC TRUYỆN</h2>
                 {story.chapters.length === 0 && (
                    <MagicButton 
                        onClick={handleGenerateStructure} 
                        isLoading={loading} 
                        variant="secondary"
                        className="mt-2 w-full text-xs"
                    >
                        Tạo Khung Chương Hồi
                    </MagicButton>
                 )}
               </div>
               
               <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-violet-600/50">
                  {story.chapters.map(ch => (
                    <div key={ch.id} className="space-y-1">
                        <button 
                            onClick={() => { setActiveChapterId(ch.id); setActivePartId(null); setActiveSectionId(null); }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeChapterId === ch.id ? 'bg-violet-600/20 text-violet-200 border border-violet-500/30' : 'text-slate-400 hover:bg-white/5'}`}
                        >
                            Chương {ch.number}: {ch.title}
                        </button>
                        
                        {activeChapterId === ch.id && (
                            <div className="ml-4 space-y-1 border-l-2 border-violet-500/20 pl-2">
                                {ch.parts.map(p => (
                                    <div key={p.id}>
                                        <button
                                            onClick={() => { setActivePartId(p.id); setActiveSectionId(null); }}
                                            className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${activePartId === p.id ? 'text-indigo-300 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Phần {p.number}
                                        </button>
                                        
                                        {activePartId === p.id && (
                                            <div className="ml-2 space-y-1 mt-1">
                                                {p.sections.map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => setActiveSectionId(s.id)}
                                                        className={`w-full text-left px-2 py-1 rounded text-[10px] flex items-center gap-2 ${activeSectionId === s.id ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:bg-white/5'}`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${s.isWritten ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                                                        Mục {s.number}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                  ))}
               </div>
            </div>

            {/* MIDDLE: EDITOR & BIBLE */}
            <div className="col-span-12 md:col-span-6 flex flex-col gap-6">
                {/* STORY BIBLE CARD */}
                <div className="bg-slate-900/80 rounded-xl p-6 border border-violet-500/20 shadow-lg">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{story.bible.title || "Chưa có tên"}</h2>
                            <div className="flex gap-2 mt-2">
                                {story.bible.genre.map(g => (
                                    <span key={g} className="px-2 py-0.5 rounded text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30">{g}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-3 italic">
                        "{story.bible.synopsis}"
                    </p>
                </div>

                {/* MAIN EDITOR */}
                <div className="flex-1 bg-slate-900 rounded-xl border border-white/10 flex flex-col relative overflow-hidden">
                    {!activeSection ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500 flex-col gap-4">
                            <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            <p>Chọn một "Mục" từ menu bên trái để bắt đầu viết</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                                <div>
                                    <span className="text-xs font-mono text-violet-400 uppercase">Đang soạn thảo</span>
                                    <h3 className="font-bold text-white">Chương {activeChapter?.number} - Phần {activePart?.number} - Mục {activeSection.number}</h3>
                                </div>
                                <div className="flex gap-2">
                                    {activeSection.isWritten ? (
                                        <MagicButton variant="secondary" onClick={() => activeChapter && activePart && handleContinueSection(activeChapter, activePart, activeSection)} isLoading={loading} className="text-xs px-3 py-1.5">
                                            Viết tiếp
                                        </MagicButton>
                                    ) : (
                                        <MagicButton onClick={() => activeChapter && activePart && handleWriteSection(activeChapter, activePart, activeSection)} isLoading={loading} className="text-xs px-3 py-1.5">
                                            Khởi tạo nội dung
                                        </MagicButton>
                                    )}
                                </div>
                            </div>
                            <textarea 
                                className="flex-1 w-full bg-transparent p-6 outline-none text-slate-300 leading-relaxed resize-none font-serif text-lg"
                                value={activeSection.content}
                                readOnly
                                placeholder="Nội dung sẽ xuất hiện tại đây..."
                            />
                        </>
                    )}
                </div>
            </div>

            {/* RIGHT: TOOLS (VOICE STUDIO) */}
            <div className="col-span-12 md:col-span-3 space-y-6">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-1 border border-white/10 h-full flex flex-col">
                   <VoiceStudio 
                     textToRead={activeSection?.content || ""}
                     settings={voiceSettings}
                     onSettingsChange={setVoiceSettings}
                   />
                   
                   <div className="mt-6 p-4">
                      <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Thông tin chi tiết</h4>
                      <div className="space-y-3">
                         <div className="bg-black/20 p-3 rounded border border-white/5">
                            <span className="text-xs text-slate-500 block">Bối cảnh</span>
                            <span className="text-sm text-slate-300">{story.bible.setting}</span>
                         </div>
                         <div className="bg-black/20 p-3 rounded border border-white/5 max-h-60 overflow-y-auto scrollbar-none">
                            <span className="text-xs text-slate-500 block mb-2">Nhân vật</span>
                            {story.bible.characters.map((char, idx) => (
                                <div key={idx} className="mb-2 last:mb-0">
                                    <span className="text-indigo-400 font-bold text-xs">{char.name}</span>
                                    <span className="text-slate-500 text-[10px] ml-2">({char.role})</span>
                                    <p className="text-xs text-slate-400 mt-0.5">{char.description}</p>
                                </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default App;
