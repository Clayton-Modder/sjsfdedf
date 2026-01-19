import { GoogleGenAI, Type } from "@google/genai";
import { Channel } from '../types';

// Initialize Gemini with the API key from environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AIResponse {
  message: string;
  recommendedIds: string[];
}

export const askTvAssistant = async (
  query: string, 
  channels: Channel[]
): Promise<AIResponse> => {
  // Create a simplified inventory list to save tokens, but keep essential info
  // Mapping categories for context: 
  // 0:Todos, 1:Esportes, 2:Infantil, 3:Docs, 4:Filmes, 5:Noticias, 6:Aberta, 7:Variedades, 8:BBB
  const inventory = channels.map(c => ({
    id: c.id,
    name: c.name,
    cats: c.categories,
    desc: c.description || c.currentProgram
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User Query: "${query}"\n\nChannel Inventory: ${JSON.stringify(inventory)}`,
      config: {
        systemInstruction: `You are the AI Assistant for MegaTV. Your goal is to help users find channels to watch based on their natural language requests.
        
        1. Analyze the User Query.
        2. Search the Channel Inventory for the best matches.
        3. Return a response in JSON format containing:
           - 'message': A friendly, short, and enthusiastic response in Portuguese explaining why you chose these channels.
           - 'recommendedIds': An array of channel 'id' strings that match the query.
        
        If the user asks about something not in the inventory, apologize politely and suggest a genre we do have (Sports, Movies, Kids, etc).
        
        Category IDs for reference: 1=Sports, 2=Kids/Cartoons, 4=Movies/Series, 5=News, 8=Big Brother Brasil (BBB).`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            recommendedIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["message", "recommendedIds"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIResponse;
    }
    
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("AI Service Error:", error);
    return {
      message: "Desculpe, tive um problema ao processar sua solicitação. Tente novamente mais tarde.",
      recommendedIds: []
    };
  }
};