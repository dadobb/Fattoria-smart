
import { GoogleGenAI, Type } from "@google/genai";
import { Animal, EggLog, StockItem, DiaryNote } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getFarmInsights(
  animals: Animal[],
  eggs: EggLog,
  stock: StockItem[],
  notes: DiaryNote[]
) {
  const prompt = `
    Analizza i seguenti dati della fattoria:
    - Animali: ${JSON.stringify(animals.map(a => ({ name: a.name, type: a.type, notes: a.notes })))}
    - Produzione Uova (7gg): ${JSON.stringify(eggs)}
    - Scorte: ${JSON.stringify(stock.map(s => ({ name: s.name, current: s.currentQty, daily: s.dailyConsumption })))}
    - Diario: ${JSON.stringify(notes.slice(0, 5))}

    Identifica situazioni critiche (salute, scorte esaurite, cali produzione) e suggerimenti di ottimizzazione.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "Sei un esperto veterinario e gestore agricolo. Rispondi in formato JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            alerts: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            recommendations: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ["summary", "alerts", "recommendations"]
        }
      }
    });

    const text = response.text;
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Insights Error:", error);
    throw new Error("Errore durante l'analisi.");
  }
}
