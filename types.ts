export interface Section {
  id: string;
  number: number;
  summary: string; // Tóm tắt mục
  content: string; // Nội dung chi tiết (~20k từ)
  shortSummary: string; // Tóm tắt ngắn để context cho phần sau
  isWritten: boolean;
}

export interface Part {
  id: string;
  number: number;
  summary: string;
  sections: Section[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  summary: string;
  parts: Part[];
}

export interface Character {
  name: string;
  role: string;
  description: string;
}

export interface StoryBible {
  title: string;
  genre: string[];
  setting: string;
  characters: Character[];
  theme: string[];
  synopsis: string; // Cốt truyện tổng quát
}

export interface Story {
  id: string;
  bible: StoryBible;
  chapters: Chapter[];
  currentInput: string;
  status: 'INPUT' | 'ANALYZING' | 'STRUCTURING' | 'WRITING';
}

export type VoiceGender = 'male' | 'female';

export interface VoiceSettings {
  gender: VoiceGender;
  speed: number;
  pitch: number;
  isPlaying: boolean;
}