import { ApiData } from '../types';

// Data provided in the prompt
const MOCK_DATA: ApiData = {
  categories: [
    { id: 0, name: "Todos" },
    { id: 8, name: "BBB 2026" },
    { id: 1, name: "Esportes" },
    { id: 2, name: "Infantil" },
    { id: 3, name: "Documentarios" },
    { id: 4, name: "Filmes e Séries" },
    { id: 5, name: "Noticias" },
    { id: 6, name: "Abertos" },
    { id: 7, name: "Variedades" }
  ],
  channels: [
    { id: "bbbmosaico", image: "https://embedtv.best/assets/images/bbb.png", name: "BBB - Mosaico", categories: [0, 8], url: "https://www1.embedtv.best/bbbmosaico" },
    { id: "bbb1", image: "https://embedtv.best/assets/images/bbb.png", name: "BBB - 1", categories: [0, 8], url: "https://www1.embedtv.best/bbb1" },
    { id: "bbb2", image: "https://embedtv.best/assets/images/bbb.png", name: "BBB - 2", categories: [0, 8], url: "https://www1.embedtv.best/bbb2" },
    { id: "bbb3", image: "https://embedtv.best/assets/images/bbb.png", name: "BBB - 3", categories: [0, 8], url: "https://www1.embedtv.best/bbb3" },
    { id: "bbb4", image: "https://embedtv.best/assets/images/bbb.png", name: "BBB - 4", categories: [0, 8], url: "https://www1.embedtv.best/bbb4" },
    { id: "bbb5", image: "https://embedtv.best/assets/images/bbb.png", name: "BBB - 5", categories: [0, 8], url: "https://www1.embedtv.best/bbb5" },
    { id: "bbb6", image: "https://embedtv.best/assets/images/bbb.png", name: "BBB - 6", categories: [0, 8], url: "https://www1.embedtv.best/bbb6" },
    { id: "bbb7", image: "https://embedtv.best/assets/images/bbb.png", name: "BBB - 7", categories: [0, 8], url: "https://www1.embedtv.best/bbb7" },
    { id: "bbb8", image: "https://embedtv.best/assets/images/bbb.png", name: "BBB - 8", categories: [0, 8], url: "https://www1.embedtv.best/bbb8" },
    // Adding some placeholder channels for other categories to demonstrate filtering
    { id: "globo_rj", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/TV_Globo_logo.svg/1024px-TV_Globo_logo.svg.png", name: "Globo RJ", categories: [0, 6, 5], url: "https://example.com/stream/globo" },
    { id: "espn", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/ESPN_wordmark.svg/1200px-ESPN_wordmark.svg.png", name: "ESPN", categories: [0, 1], url: "https://example.com/stream/espn" },
    { id: "cnn", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/CNN_International_logo.svg/1200px-CNN_International_logo.svg.png", name: "CNN Brasil", categories: [0, 5], url: "https://example.com/stream/cnn" },
    { id: "cartoon", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Cartoon_Network_2010_logo.svg/1200px-Cartoon_Network_2010_logo.svg.png", name: "Cartoon Network", categories: [0, 2], url: "https://example.com/stream/cn" },
    { id: "discovery", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Discovery_Channel_2019.svg/1200px-Discovery_Channel_2019.svg.png", name: "Discovery", categories: [0, 3], url: "https://example.com/stream/discovery" }
  ]
};

export const fetchChannels = async (): Promise<ApiData> => {
  // Simulating network delay for realistic "loader" behavior
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_DATA);
    }, 800);
  });
};