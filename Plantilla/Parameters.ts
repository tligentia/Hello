import { GoogleGenAI } from "@google/genai";
import { LucideIcon } from 'lucide-react';
import { deobfuscate } from './crypto';

// --- TIPOS ---
export type CurrencyCode = 'USD' | 'EUR' | 'JPY' | 'BTC' | 'ETH';

export interface StageConfig {
  id: number;
  name: string;
  action: string;
  color: string;
  bg: string;
  icon: LucideIcon;
}

// Clave interna fija para los secretos del sistema
const SYSTEM_CRYPTO_KEY = "TLIGENT_CORE_v25";

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

// --- CONFIGURACIÓN DE SEGURIDAD DINÁMICA ---
// IPs autorizadas por defecto (Sustituidas por los valores solicitados)
const DEFAULT_IPS = [
  '179.112.85.173',
  '137.223.15.63'
];

export const getAllowedIps = (): string[] => {
  const stored = localStorage.getItem('app_allowed_ips');
  return stored ? JSON.parse(stored) : DEFAULT_IPS;
};

export const saveAllowedIps = (ips: string[]) => {
  localStorage.setItem('app_allowed_ips', JSON.stringify(ips));
};

// --- LÓGICA DE CLAVES (NUEVO ALGORITMO XOR) ---
export const getShortcutKey = (shortcut: string): string | null => {
  const code = shortcut.toLowerCase().trim();
  // Claves ofuscadas con XOR y clave de sistema
  if (code === 'ok') return deobfuscate('FR8eHh8fAxceEBcaGhIeABseHxcAABsDHB8AARofGBIeGg==', SYSTEM_CRYPTO_KEY);
  if (code === 'cv') return deobfuscate('FR8eHh8fAxceAxsXFx0CAB8fGBsaHBoDGBoaFhcaGgYcHR8XFh0=', SYSTEM_CRYPTO_KEY);
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
