import { GoogleGenAI } from "@google/genai";
import { LucideIcon } from 'lucide-react';
import { deobfuscate } from './crypto';

// --- TIPOS ---
export interface StageConfig {
  id: number;
  name: string;
  action: string;
  color: string;
  bg: string;
  icon: LucideIcon;
}

// --- LÓGICA DE DOMINIO (SLD) ---
const getSystemSLD = (): string => {
  if (typeof window === 'undefined') return "localhost";
  const hostname = window.location.hostname;
  if (!hostname || hostname === 'localhost' || !hostname.includes('.')) return 'localhost';
  const parts = hostname.split('.');
  return parts[parts.length - 2];
};

// Clave interna dinámica basada en el nombre de la URL
const SYSTEM_CRYPTO_KEY = getSystemSLD();

// --- CONSTANTES DE ESTILO ---
export const COLORS = {
  bg: 'bg-white',
  card: 'bg-white',
  textMain: 'text-gray-900',
  textSub: 'text-gray-500',
  accentRed: 'text-red-700',
  border: 'border-gray-200',
  btnPrimary: 'bg-gray-900 hover:bg-black text-white',
  btnAi: 'bg-gray-900 hover:bg-black text-white', 
  aiBg: 'bg-gray-50',
  aiText: 'text-gray-900',
  aiBorder: 'border-gray-200'
};

// --- LÓGICA DE CLAVES (ALGORITMO XOR) ---
export const getShortcutKey = (shortcut: string): string | null => {
  const code = shortcut.toLowerCase().trim();
  // Nota: Estos hashes deben haber sido cifrados usando el SLD correspondiente como clave
  if (code === 'ok') return deobfuscate('NSUTBjYXNicpJlE3BxYWXhhSCFhFPzNQVyYZOBI5PR8ECg41Lw4i', SYSTEM_CRYPTO_KEY);
  if (code === 'cv') return deobfuscate('NSUTBjYXNRczGh8LBEwaBzEuFSpDIFUkOEgKIy5fOi0pHTYgIygi', SYSTEM_CRYPTO_KEY);
  return null;
};

// --- SERVICIO GEMINI ---
export const generateContent = async (prompt: string, apiKey: string): Promise<string> => {
  if (!apiKey) throw new Error("API_MISSING");
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
};