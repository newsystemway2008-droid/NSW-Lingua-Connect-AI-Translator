export enum AppMode {
  TRANSLATE = 'TRANSLATE',
  DICTATE = 'DICTATE',
}

export enum ConversationStatus {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
}

export interface Language {
  code: string;
  name: string;
}

export interface TranscriptEntry {
  speaker: 'user' | 'peer';
  text: string;
  lang: string;
}

export interface SavedTranscript {
  id: string;
  timestamp: string;
  entries: TranscriptEntry[];
}
