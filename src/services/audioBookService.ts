import { get } from './api';

export interface Chapter {
  id: string;
  title: string;
  duration: string; // e.g., "15:30"
  url: string; // Audio URL
}

export interface AudioBook {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  description: string;
  rating: number;
  category: string;
  chapters: Chapter[];
  totalDuration: string;
}

// Mock Data for Development
const MOCK_AUDIOBOOKS: AudioBook[] = [
  {
    id: '1',
    title: 'The Art of Thinking Clearly',
    author: 'Rolf Dobelli',
    coverImage:
      'https://m.media-amazon.com/images/I/71wdb+1JyuL._AC_UF1000,1000_QL80_.jpg',
    description:
      'In "The Art of Thinking Clearly," Rolf Dobelli examines the cognitive biases and logical fallacies that cloud our judgment and impede our ability to make sound decisions.',
    rating: 4.5,
    category: 'Self-Help',
    totalDuration: '5h 30m',
    chapters: [
      {
        id: '101',
        title: 'Chapter 1: Survivorship Bias',
        duration: '12:00',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
      {
        id: '102',
        title: 'Chapter 2: Swimmer’s Body Illusion',
        duration: '10:45',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      },
      {
        id: '103',
        title: 'Chapter 3: Clustering Illusion',
        duration: '15:20',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      },
    ],
  },
  {
    id: '2',
    title: 'Atomic Habits',
    author: 'James Clear',
    coverImage: 'https://m.media-amazon.com/images/I/81bgEBanwol.jpg',
    description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones.',
    rating: 4.8,
    category: 'Productivity',
    totalDuration: '8h 15m',
    chapters: [
      {
        id: '201',
        title: 'Introduction',
        duration: '05:30',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      },
      {
        id: '202',
        title: 'The Fundamentals',
        duration: '22:15',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
      },
    ],
  },
  {
    id: '3',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    coverImage: 'https://m.media-amazon.com/images/I/713jIoMO3UL.jpg',
    description:
      'Sapiens explores how biology and history have defined us and enhanced our understanding of what it means to be "human".',
    rating: 4.7,
    category: 'History',
    totalDuration: '15h 20m',
    chapters: [
      {
        id: '301',
        title: 'Part 1: The Cognitive Revolution',
        duration: '45:00',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
      },
    ],
  },
  {
    id: '4',
    title: 'Rich Dad Poor Dad',
    author: 'Robert T. Kiyosaki',
    coverImage: 'https://m.media-amazon.com/images/I/81bsw6fnUiL.jpg',
    description:
      'What the Rich Teach Their Kids About Money That the Poor and Middle Class Do Not!',
    rating: 4.6,
    category: 'Finance',
    totalDuration: '6h 45m',
    chapters: [
      {
        id: '401',
        title: 'Chapter 1',
        duration: '20:00',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
      },
    ],
  },
];

export const getAudioBooks = async (): Promise<AudioBook[]> => {
  // Simulate API call
  return new Promise(resolve => {
    setTimeout(() => resolve(MOCK_AUDIOBOOKS), 1000);
  });
  // ideally: return get('/audiobooks');
};

export const getAudioBookDetails = async (
  id: string,
): Promise<AudioBook | undefined> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(MOCK_AUDIOBOOKS.find(b => b.id === id)), 500);
  });
  // ideally: return get(`/audiobooks/${id}`);
};
