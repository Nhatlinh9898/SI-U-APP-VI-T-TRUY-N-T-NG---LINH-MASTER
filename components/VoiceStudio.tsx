import React, { useEffect, useState } from 'react';
import { VoiceSettings } from '../types';
import { MagicButton } from './MagicButton';

interface VoiceStudioProps {
  textToRead: string;
  settings: VoiceSettings;
  onSettingsChange: (newSettings: VoiceSettings) => void;
}

export const VoiceStudio: React.FC<VoiceStudioProps> = ({ textToRead, settings, onSettingsChange }) => {
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setSupported(true);
      const loadVoices = () => {
        const vs = window.speechSynthesis.getVoices();
        setVoices(vs);
      };
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }
  }, []);

  const handleTogglePlay = () => {
    if (settings.isPlaying) {
      window.speechSynthesis.cancel();
      onSettingsChange({ ...settings, isPlaying: false });
    } else {
      if (!textToRead) return;
      
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = settings.speed;
      utterance.pitch = settings.pitch;
      
      // Select voice based on gender preference (heuristic)
      const vnVoices = voices.filter(v => v.lang.includes('vi'));
      let selectedVoice = vnVoices[0]; 
      
      if (vnVoices.length > 0) {
        if (settings.gender === 'female') {
           const female = vnVoices.find(v => v.name.includes('Female') || v.name.includes('Linh') || v.name.includes('Mai'));
           if (female) selectedVoice = female;
        } else {
           const male = vnVoices.find(v => v.name.includes('Male') || v.name.includes('Nam') || v.name.includes('Minh'));
           if (male) selectedVoice = male;
        }
      }
      
      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.onend = () => onSettingsChange({ ...settings, isPlaying: false });
      window.speechSynthesis.speak(utterance);
      onSettingsChange({ ...settings, isPlaying: true });
    }
  };

  const handleDownload = () => {
    alert("Tính năng xuất file MP3 chất lượng cao đang được xử lý trên server render farm. (Demo mode only)");
  };

  if (!supported) return null;

  return (
    <div className="p-6 bg-slate-900/80 backdrop-blur-md rounded-xl border border-violet-500/20 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase tracking-widest">
          Voice Studio Pro
        </h3>
        <div className="flex gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs text-red-400 font-mono">LIVE ENGINE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Voice Selection */}
        <div className="space-y-2">
          <label className="text-slate-400 text-sm font-semibold">Giọng đọc AI</label>
          <div className="flex p-1 bg-slate-800 rounded-lg">
            <button
              onClick={() => onSettingsChange({ ...settings, gender: 'male' })}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                settings.gender === 'male' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Nam (Trầm ấm)
            </button>
            <button
              onClick={() => onSettingsChange({ ...settings, gender: 'female' })}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                settings.gender === 'female' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Nữ (Truyền cảm)
            </button>
          </div>
        </div>

        {/* Speed Control */}
        <div className="space-y-2">
          <label className="text-slate-400 text-sm font-semibold flex justify-between">
            <span>Tốc độ đọc</span>
            <span className="text-indigo-400">{settings.speed}x</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={settings.speed}
            onChange={(e) => onSettingsChange({ ...settings, speed: parseFloat(e.target.value) })}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <MagicButton 
          variant={settings.isPlaying ? "danger" : "success"} 
          onClick={handleTogglePlay}
          className="flex-1 flex justify-center items-center gap-2"
        >
            {settings.isPlaying ? (
                <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Dừng Đọc
                </>
            ) : (
                <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Đọc Ngay
                </>
            )}
        </MagicButton>
        <MagicButton variant="secondary" onClick={handleDownload} className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Tải MP3
        </MagicButton>
      </div>
    </div>
  );
};
