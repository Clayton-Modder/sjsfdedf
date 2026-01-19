import { GoogleGenAI } from "@google/genai";

// Simple in-memory cache to store descriptions during the session
// This prevents excessive API calls if the user switches back and forth between channels
const descriptionCache: Record<string, { text: string; sources: Source[] }> = {};

export interface Source {
  title: string;
  uri: string;
}

export interface ChannelDescriptionResult {
  text: string;
  sources: Source[];
}

export const generateChannelDescription = async (channelName: string): Promise<ChannelDescriptionResult | null> => {
  // 1. Check Cache
  if (descriptionCache[channelName]) {
    return descriptionCache[channelName];
  }

  // 2. Validate API Key
  if (!process.env.API_KEY) {
    console.warn("API_KEY not found in environment variables. AI features disabled.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // 3. Generate Content with Google Search Tool
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Crie uma descrição de marketing curta, envolvente e persuasiva para o canal de TV "${channelName}".
      
      Diretrizes:
      - O texto deve vender o canal para o telespectador.
      - Mencione os principais programas, gênero e público-alvo.
      - Use um tom profissional mas entusiasmado.
      - Máximo de 3 frases curtas.
      - Se o canal for de esportes, mencione as competições que costuma transmitir.
      - Português do Brasil.`,
      config: {
        tools: [{ googleSearch: {} }], // Enable Search Grounding
        temperature: 0.7,
      },
    });

    // 4. Extract Text
    const text = response.text || `Assista ${channelName} ao vivo com a melhor qualidade.`;

    // 5. Extract Grounding Metadata (Sources)
    const sources: Source[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri,
          });
        }
      });
    }

    // 6. Save to Cache
    const result = { text, sources };
    descriptionCache[channelName] = result;

    return result;

  } catch (error) {
    console.error("Error generating channel description:", error);
    return null;
  }
};