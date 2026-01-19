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
}

export interface ApiData {
  categories: Category[];
  channels: Channel[];
}