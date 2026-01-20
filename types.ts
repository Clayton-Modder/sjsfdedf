
export interface Category {
  id: number;
  name: string;
}

export interface Channel {
  id: string;
  name: string;
  image: string;
  categories: number[];
  url: string;
  description?: string;
  currentProgram?: string;
}

export interface Team {
  name: string;
  image: string;
}

export interface GameData {
  league: string;
  timer: {
    start: number;
    end: number;
  };
  teams: {
    home: Team;
    away: Team;
  };
}

export interface Game {
  title: string;
  image: string;
  data: GameData;
  players: string[];
}

export interface Radio {
  id: string;
  name: string;
  image: string;
  url: string;
  city: string;
  category: string;
}

export interface ApiData {
  categories: Category[];
  channels: Channel[];
}

// Novos tipos para EPG
export interface EPGProgram {
  title: string;
  description: string;
  start: Date;
  end: Date;
  channelId: string; // ID interno do XMLTV
}

export interface EPGChannel {
  id: string; // ID interno do XMLTV
  displayName: string;
  programs: EPGProgram[];
}

export interface CurrentProgramData {
  title: string;
  description: string;
  since: string;
  until: string;
  percentage: number; // 0 a 100 para barra de progresso
}
