import { GoogleGenAI } from "@google/genai";

// --- LÓGICA DE IDENTIDAD DE ENTORNO (SLD) ---
export const getSystemSLD = (): string => {
  if (typeof window === 'undefined') return "localhost";
  const hostname = window.location.hostname;
  if (!hostname || hostname === 'localhost' || !hostname.includes('.')) return 'localhost';
  const parts = hostname.split('.');
  return parts[parts.length - 2];
};

const MASTER_KEY = getSystemSLD();

// --- MOTOR DE CIFRADO SIMÉTRICO (XOR + BASE64) ---
export const crypto = {
  obfuscate: (text: string, key: string = MASTER_KEY): string => {
    if (!text) return "";
    const charData = text.split('').map((c, i) => 
      c.charCodeAt(0) ^ key.charCodeAt(i % key.length)
    );
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
      return "Error: Formato inválido";
    }
  }
};

// --- CONSTANTES DE ESTILO ---
export const COLORS = {
  bg: 'bg-white',
  card: 'bg-white',
  textMain: 'text-gray-900',
  textSub: 'text-gray-500',
  accentRed: 'text-red-700',
  border: 'border-gray-200',
  btnPrimary: 'bg-gray-900 hover:bg-black text-white',
  aiBg: 'bg-gray-50',
  aiText: 'text-gray-900',
  aiBorder: 'border-gray-200'
};

// --- RESOLUCIÓN DE SHORTCUTS ---
export const getShortcutKey = (shortcut: string): string | null => {
  const code = shortcut.toLowerCase().trim();
  if (code === 'ok') return crypto.deobfuscate('NSUTBjYXNicpJlE3BxYWXhhSCFhFPzNQVyYZOBI5PR8ECg41Lw4i', MASTER_KEY);
  if (code === 'cv') return crypto.deobfuscate('NSUTBjYXNRczGh8LBEwaBzEuFSpDIFUkOEgKIy5fOi0pHTYgIygi', MASTER_KEY);
  return null;
};

// --- SERVICIO DE CONSULTA GEMINI ---
// Updated to use process.env.API_KEY exclusively as per guidelines.
export const askGemini = async (prompt: string, modelOverride?: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_REQUIRED");
  const ai = new GoogleGenAI({ apiKey });
  const modelName = modelOverride || localStorage.getItem('app_selected_model') || 'gemini-3-flash-preview';
  
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
  });
  // Use .text property directly as per guidelines.
  return response.text || "Sin respuesta.";
};

// Updated to use process.env.API_KEY exclusively as per guidelines.
export const validateKey = async (): Promise<boolean> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return false;
  try {
    const ai = new GoogleGenAI({ apiKey });
    await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: 'ping' });
    return true;
  } catch {
    return false;
  }
};

// --- LISTAR MODELOS DISPONIBLES ---
// Fixed Pager property error by using for-await iteration and updated to use process.env.API_KEY.
export const listAvailableModels = async (): Promise<string[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return [];
  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.list();
    const models: string[] = [];
    const forbidden = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    
    // The list() method returns a Pager which is an AsyncIterable. 
    // Property 'models' doesn't exist on Pager, so we iterate through it.
    for await (const m of result) {
      const name = m.name.replace('models/', '');
      if (!forbidden.some(f => name.includes(f))) {
        models.push(name);
      }
    }
    return models;
  } catch (e) {
    console.warn("No se pudieron listar modelos dinámicamente, usando fallback.", e);
    return [
      'gemini-3-flash-preview',
      'gemini-3-pro-preview',
      'gemini-flash-lite-latest',
      'gemini-2.5-flash-image'
    ];
  }
};