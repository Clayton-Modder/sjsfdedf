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