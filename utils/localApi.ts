import { SavedTranscript, TranscriptEntry } from '../types';

const LOCAL_STORAGE_KEY = 'linguaConnectHistory';

// Simulate network delay
const apiDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const saveTranscript = async (entries: TranscriptEntry[]): Promise<SavedTranscript> => {
  await apiDelay(500);
  
  if (entries.length === 0) {
    return Promise.reject(new Error("Cannot save an empty transcript."));
  }

  try {
    const existingTranscripts = await getTranscripts();
    const newTranscript: SavedTranscript = {
      id: `transcript_${Date.now()}`,
      timestamp: new Date().toISOString(),
      entries,
    };
    const updatedTranscripts = [newTranscript, ...existingTranscripts];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTranscripts));
    return newTranscript;
  } catch (error) {
    console.error("Failed to save transcript to local storage", error);
    throw new Error("Could not save transcript.");
  }
};

export const getTranscripts = async (): Promise<SavedTranscript[]> => {
  await apiDelay(500);
  try {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : [];
  } catch (error) {
    console.error("Failed to retrieve transcripts from local storage", error);
    return [];
  }
};

export const deleteTranscript = async (id: string): Promise<void> => {
    await apiDelay(300);
    try {
        const allTranscripts = await getTranscripts();
        const updatedTranscripts = allTranscripts.filter(t => t.id !== id);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedTranscripts));
    } catch (error) {
        console.error("Failed to delete transcript from local storage", error);
        throw new Error("Could not delete transcript.");
    }
};
