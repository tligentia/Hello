import { GoogleGenAI } from "@google/genai";

// --- DOMAIN LOGIC ---
const getSystemSLD = (): string => {
  if (typeof window === 'undefined') return "localhost";
  const hostname = window.location.hostname;
  if (!hostname || hostname === 'localhost' || !hostname.includes('.')) return 'localhost';
  const parts = hostname.split('.');
  return parts[parts.length - 2];
};

const MASTER_KEY = getSystemSLD();

/**
 * UI Theme configuration
 * Following requirements: Fondo blanco, contenidos en Negro, rojo y gris
 */
// Added COLORS export to fix missing member error in Shell.tsx and Cookies.tsx
export const COLORS = {
  bg: 'bg-white',
  primary: 'text-red-700',
  secondary: 'text-gray-400',
  accent: 'text-gray-900',
};

// --- CRYPTO TOOL LOGIC ---
export const crypto = {
  obfuscate: (text: string, key: string = MASTER_KEY): string => {
    if (!text) return "";
    const charData = text.split('').map((c, i) => 
      c.charCodeAt(0) ^ key.charCodeAt(i % key.length)
    );
    // Usamos btoa para asegurar que el resultado sea un string transportable
    return btoa(String.fromCharCode(...charData));
  },
  deobfuscate: (encoded: string, key: string = MASTER_KEY): string => {
    if (!encoded) return "";
    try {
      const decoded = atob(encoded);
      const charData = decoded.split('').map((c, i) => 
        c.charCodeAt(0) ^ key.charCodeAt(i % key.length)
      );
      return String.fromCharCode(...charData);
    } catch (e) {
      return "Error: Decoding Failed";
    }
  }
};

// --- API & MODELS ---
const getActiveApiKey = () => {
  return localStorage.getItem('app_apikey_v2') || process.env.API_KEY;
};

export const listAvailableModels = async (): Promise<string[]> => {
  const apiKey = getActiveApiKey();
  if (!apiKey) return ['gemini-3-flash-preview', 'gemini-3-pro-preview'];
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Attempting to list models using the correct SDK approach
    const result = await ai.models.list();
    const models: string[] = [];
    for await (const m of result) {
      const shortName = m.name.replace('models/', '');
      // Filter out older models for better UX
      if (!shortName.includes('1.5') && !shortName.includes('pro-vision')) {
        models.push(shortName);
      }
    }
    return models.length > 0 ? models : ['gemini-3-flash-preview', 'gemini-3-pro-preview'];
  } catch {
    return ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-flash-lite-latest', 'gemini-2.5-flash-image'];
  }
};

export const validateKey = async (keyInput?: string): Promise<boolean> => {
  const key = keyInput || getActiveApiKey();
  if (!key) return false;
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'ping' });
    return true;
  } catch {
    return false;
  }
};

export const askGemini = async (prompt: string, modelOverride?: string): Promise<string> => {
  const apiKey = getActiveApiKey();
  if (!apiKey) throw new Error("API_KEY_REQUIRED");
  const ai = new GoogleGenAI({ apiKey });
  const model = modelOverride || localStorage.getItem('app_selected_model') || 'gemini-3-flash-preview';
  
  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
  });
  return response.text || "No response received.";
};

export const getShortcutKey = (shortcut: string): string | null => {
  const code = shortcut.toLowerCase().trim();
  const DEV_KEY = "tligent";
  if (code === 'ok') return crypto.deobfuscate('NSUTBjYXNicpJlE3BxYWXhhSCFhFPzNQVyYZOBI5PR8ECg41Lw4i', DEV_KEY);
  if (code === 'cv') return crypto.deobfuscate('NSUTBjYXNRczGh8LBEwaBzEuFSpDIFUkOEgKIy5fOi0pHTYgIygi', DEV_KEY);
  return null;
};