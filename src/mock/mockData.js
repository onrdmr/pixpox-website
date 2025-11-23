// Mock data for PixPox – Watch. Play. Earn.

export const translations = {
  tr: {
    nav: {
      home: 'Ana Sayfa',
      videos: 'Videolar',
      console: 'Pixie',
      projects: 'Projeler',
      myVideos: 'Koleksiyonum'
    },
    hero: {
      title: 'PIXPOX',
      subtitle: 'Video izlerken oyun oyna, kazan, sat!',
      description:
        'PixPox, izlediğin videoları oyun haline getiren ve her videonun alınıp satılabildiği yenilikçi bir eğlence platformudur. Oynadıkça kazan, videoların değerini artır, koleksiyonunu büyüt!',
      downloadApp: 'Uygulamayı İndir',
      watchVideo: 'Nasıl Çalışır?',
      offerForm: 'Talep Formu'
    },
    videoGallery: {
      title: 'EN POPÜLER VİDEOLAR',
      subtitle: 'En çok oynanan ve değer kazanan videolar',
      viewAll: 'Tüm Videoları Gör',
      duration: 'Süre',
      views: 'İzlenme',
      pix: 'Pix (Beğeni)',
      pox: 'Pox (Beğenmeme)'
    },
    allVideos: {
      title: 'TÜM VİDEOLAR',
      subtitle: 'Oynayabileceğin ve yatırım yapabileceğin tüm videolar',
      showing: 'Gösterilen',
      of: '/',
      video: 'video'
    },
    console: {
      title: 'PIXIE ROBOT',
      description:
        'Projeksiyon, mini oyun konsolu ve bir yapay zeka asistanını bir araya getiren çok işlevli bir hibrit cihaz — PixPox deneyimini en üst seviyeye taşımak için tasarlandı.'
    },
    projects: {
      title: 'YAKINDA GELECEK PROJELER',
      subtitle:
        'PixPox ekosistemini büyütmek için geliştirdiğimiz projeler'
    },
    footer: {
      rights: '© 2025 PixPox. Tüm hakları saklıdır.',
      contact: 'İletişim',
      brand: 'PixPox'
    }
  },
  en: {
    nav: {
      home: 'Home',
      videos: 'Videos',
      console: 'Pixie',
      projects: 'Projects',
      myVideos: 'My Collection'
    },
    hero: {
      title: 'PIXPOX',
      subtitle: 'Watch. Play. Earn. Trade!',
      description:
        'PixPox is a revolutionary entertainment platform where every video can be played like a game — and traded like an asset. Play to earn, boost its value, and expand your digital collection!',
      downloadApp: 'Download App',
      watchVideo: 'See How It Works',
      offerForm: 'Request Form'
    },
    videoGallery: {
      title: 'TOP TRENDING VIDEOS',
      subtitle: 'The most played and valuable videos on PixPox',
      viewAll: 'View All Videos',
      duration: 'Duration',
      views: 'Views',
      pix: 'Pix (Likes)',
      pox: 'Pox (Dislikes)'
    },
    allVideos: {
      title: 'ALL VIDEOS',
      subtitle: 'Play, invest, and trade unique videos',
      showing: 'Showing',
      of: 'of',
      video: 'videos'
    },
    console: {
      title: 'PIXIE ROBOT',
      description:
        'A multifunctional hybrid device combining projection, a mini-game console, and an AI assistant — built to deliver the ultimate PixPox experience.'
    },
    projects: {
      title: 'UPCOMING PROJECTS',
      subtitle:
        'Projects we developed to grow the PixPox ecosystem'
    },
    footer: {
      rights: '© 2025 PixPox. All rights reserved.',
      contact: 'Contact',
      brand: 'PixPox'
    }
  }
};

export const mockVideos = [
  {
    id: 1,
    title: 'Aurora',
    thumbnail:
      'https://video.pixpox.tech/Images/7309894150344707361.jpg',
    duration: '5:24',
    views: 8250,
    pix: 3100,
    pox: 128,
    username: 'siegfriedcroes',
    date: '2025-10-12',
    value: '$122.45',
    description: 'I turned Cure for Me by @AURORA into a pixel art animation 😁 What song should I do next? 🤔 #auroramusic #cureformeaurora #cureforme #cureformechallenge #auroraaksnes #chiptune #pixelanimation!'
  },
  {
    id: 2,
    title: 'berserk',
    thumbnail:
      'https://video.pixpox.tech/Images/7263521659779370246.jpg',
    duration: '4:40',
    views: 12400,
    pix: 5400,
    pox: 211,
    username: 'siilence4',
    date: '2025-10-10',
    value: '$245.90',
    description:
      '#berserk #berserkmanga #berserkedit #berserkanime #pixelart #pixelartvideogame #animaciones #gamepixel'
  },
  {
    id: 3,
    title: 'KATSEYE',
    thumbnail:
      'https://video.pixpox.tech/Images/7560319441796369675.jpg',
    duration: '5:55',
    views: 7800,
    pix: 2670,
    pox: 98,
    username: 'podanymar',
    date: '2025-10-05',
    value: '$89.10',
    description: 'KATSEYE dancing desliza / @katseyeworld @leosantana #katseye #leosantana #desliza #animation'
  },
  {
    id: 4,
    title: 'Evangelion',
    thumbnail:
      'https://video.pixpox.tech/Images/7127406326505884933.jpg',
    duration: '7:50',
    views: 9600,
    pix: 3980,
    pox: 156,
    username: 'solrolon',
    date: '2025-09-29',
    value: '$174.20',
    description:
      'No sé quienes lo hayan creado pero esta genial 🤯 #evangelion #pixelart #neongenesisevangelion #anime'
  }
  // {
  //   id: 5,
  //   title: 'Battle Royale – Last Token Standing',
  //   thumbnail:
  //     'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&h=450&fit=crop',
  //   duration: '9:20',
  //   views: 15400,
  //   pix: 6120,
  //   pox: 410,
  //   username: 'CryptoKing',
  //   date: '2025-09-25',
  //   value: '$301.70',
  //   description:
  //     'Her galibiyet bir NFT kartı kazandırır. Kartlarını koleksiyona ekle veya sat!'
  // },
  // {
  //   id: 5,
  //   title: 'Battle Royale – Last Token Standing',
  //   thumbnail:
  //     'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&h=450&fit=crop',
  //   duration: '9:20',
  //   views: 15400,
  //   pix: 6120,
  //   pox: 410,
  //   username: 'CryptoKing',
  //   date: '2025-09-25',
  //   value: '$301.70',
  //   description:
  //     'Her galibiyet bir NFT kartı kazandırır. Kartlarını koleksiyona ekle veya sat!'
  // },
  // {
  //   id: 5,
  //   title: 'Battle Royale – Last Token Standing',
  //   thumbnail:
  //     'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&h=450&fit=crop',
  //   duration: '9:20',
  //   views: 15400,
  //   pix: 6120,
  //   pox: 410,
  //   username: 'CryptoKing',
  //   date: '2025-09-25',
  //   value: '$301.70',
  //   description:
  //     'Her galibiyet bir NFT kartı kazandırır. Kartlarını koleksiyona ekle veya sat!'
  // },
  // {
  //   id: 5,
  //   title: 'Battle Royale – Last Token Standing',
  //   thumbnail:
  //     'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&h=450&fit=crop',
  //   duration: '9:20',
  //   views: 15400,
  //   pix: 6120,
  //   pox: 410,
  //   username: 'CryptoKing',
  //   date: '2025-09-25',
  //   value: '$301.70',
  //   description:
  //     'Her galibiyet bir NFT kartı kazandırır. Kartlarını koleksiyona ekle veya sat!'
  // },
  // {
  //   id: 5,
  //   title: 'Battle Royale – Last Token Standing',
  //   thumbnail:
  //     'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&h=450&fit=crop',
  //   duration: '9:20',
  //   views: 15400,
  //   pix: 6120,
  //   pox: 410,
  //   username: 'CryptoKing',
  //   date: '2025-09-25',
  //   value: '$301.70',
  //   description:
  //     'Her galibiyet bir NFT kartı kazandırır. Kartlarını koleksiyona ekle veya sat!'
  // }
];

export const mockProjects = [
  {
    id: 1,
    title: 'Pixpox Game',
    description:
      'PixPox videolarını oynatmak ve etkileşimli mini oyunları çalıştırmak için özel olarak tasarlandı. Blockchain bağlantılı skor sistemiyle gelir paylaşımı sağlar.',
    image:
      'https://video.pixpox.tech/Thumbnail/pixpox-intro.png?w=800&h=600&fit=crop',
    tags: ['Gaming', 'NFT', 'System']
  },
  {
    id: 2,
    title: 'Pixie',
    description:
      'Projeksiyon, mini oyun konsolu ve bir yapay zeka asistanını bir araya getiren çok işlevli bir hibrit cihaz — PixPox deneyimini en üst seviyeye taşımak için tasarlandı.',
    image:
      'https://video.pixpox.tech/Thumbnail/bodypark.png?w=800&h=600&fit=crop',
    tags: ['Robotic', 'AI', 'Asistant', 'Gaming']
  }
];
