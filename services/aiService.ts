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
  // AI Integration removed as requested.
  // Returning null will cause the UI to fallback to the default channel description.
  return Promise.resolve(null);
};