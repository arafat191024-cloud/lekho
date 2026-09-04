// স্ক্রিনশটের ডিজাইনের মতো বিভিন্ন ক্যাটাগরির রঙিন গোল অ্যাভাটার
export const AVATAR_LIST = [
  // Animals / Origami / পশু-পাখি
  { id: 'cat', emoji: '🐱', bg: '#90CAF9', label: 'বিড়াল', tags: ['cat', 'বিড়াল', 'পশু', 'animal', 'ক্যাট'] },
  { id: 'dog', emoji: '🐕', bg: '#FFF59D', label: 'কুকুর', tags: ['dog', 'কুকুর', 'পশু', 'animal'] },
  { id: 'fox', emoji: '🦊', bg: '#FFCCBC', label: 'শেয়াল', tags: ['fox', 'শেয়াল', 'পশু', 'animal'] },
  { id: 'panda', emoji: '🐼', bg: '#E1BEE7', label: 'পান্ডা', tags: ['panda', 'পান্ডা', 'পশু', 'animal'] },
  { id: 'penguin', emoji: '🐧', bg: '#B0BEC5', label: 'পেঙ্গুইন', tags: ['penguin', 'পেঙ্গুইন', 'পাখি', 'bird'] },
  { id: 'bird', emoji: '🐦', bg: '#C5CAE9', label: 'পাখি', tags: ['bird', 'পাখি', 'রবিন', 'তিয়া'] },
  { id: 'rabbit', emoji: '🐇', bg: '#F8BBD0', label: 'খরগোশ', tags: ['rabbit', 'খরগোশ', 'পশু', 'animal'] },
  { id: 'dragon', emoji: '🐲', bg: '#C8E6C9', label: 'ড্রাগন', tags: ['dragon', 'ড্রাগন', 'origami'] },
  { id: 'elephant', emoji: '🐘', bg: '#FFCDD2', label: 'হাতি', tags: ['elephant', 'হাতি', 'পশু'] },
  { id: 'butterfly', emoji: '🦋', bg: '#64B5F6', label: 'প্রজাপতি', tags: ['butterfly', 'প্রজাপতি', 'কীটপতঙ্গ'] },
  { id: 'unicorn', emoji: '🦄', bg: '#DCEDC8', label: 'ইউনিকর্ন', tags: ['unicorn', 'ঘোড়া', 'রংধনু'] },

  // Fruits / Food / ফল-খাবার
  { id: 'watermelon', emoji: '🍉', bg: '#A5D6A7', label: 'তরমুজ', tags: ['watermelon', 'তরমুজ', 'ফল', 'fruit'] },
  { id: 'avocado', emoji: '🥑', bg: '#D1C4E9', label: 'অ্যাভোকাডো', tags: ['avocado', 'ফল', 'fruit'] },
  { id: 'cheese', emoji: '🧀', bg: '#CE93D8', label: 'পনির', tags: ['cheese', 'পনির', 'খাবার', 'food'] },
  { id: 'pizza', emoji: '🍕', bg: '#D7CCC8', label: 'পিজ্জা', tags: ['pizza', 'পিজ্জা', 'খাবার'] },
  { id: 'sushi', emoji: '🍣', bg: '#80DEEA', label: 'সুশি', tags: ['sushi', 'খাবার', 'food'] },
  { id: 'icecream', emoji: '🍦', bg: '#F48FB1', label: 'আইসক্রিম', tags: ['icecream', 'আইসক্রিম', 'মিষ্টি'] },
  { id: 'ramen', emoji: '🍜', bg: '#80CBC4', label: 'নুডুলস', tags: ['ramen', 'নুডুলস', 'স্যুপ'] },
  { id: 'sandwich', emoji: '🥪', bg: '#90CAF9', label: 'স্যান্ডউইচ', tags: ['sandwich', 'নাস্তা'] },

  // Objects & Nature / ফুল, গাছ, খেলা ও শখ
  { id: 'bicycle', emoji: '🚲', bg: '#81D4FA', label: 'সাইকেল', tags: ['bicycle', 'সাইকেল', 'cycle', 'ride'] },
  { id: 'basketball', emoji: '🏀', bg: '#B2EBF2', label: 'বাস্কেটবল', tags: ['basketball', 'খেলা', 'ball', 'sports'] },
  { id: 'football', emoji: '🏈', bg: '#FFF59D', label: 'ফুটবল', tags: ['football', 'বল', 'sports'] },
  { id: 'vinyl', emoji: '🎵', bg: '#B3E5FC', label: 'গান/রেকর্ড', tags: ['music', 'গান', 'রেকর্ড', 'vinyl'] },
  { id: 'glasses', emoji: '🕶️', bg: '#F8BBD0', label: 'চশমা', tags: ['glasses', 'চশমা', 'style'] },
  { id: 'flower', emoji: '🌸', bg: '#FFCDD2', label: 'ফুল', tags: ['flower', 'ফুল', 'গোলাপ', 'nature'] },
  { id: 'tree', emoji: '🌲', bg: '#C8E6C9', label: 'গাছ', tags: ['tree', 'গাছ', 'প্রকৃতি', 'nature'] },
  { id: 'star', emoji: '⭐', bg: '#FFE082', label: 'তারা', tags: ['star', 'তারা', 'মহাকাশ', 'sky'] },
  { id: 'moon', emoji: '🌙', bg: '#D1C4E9', label: 'চাঁদ', tags: ['moon', 'চাঁদ', 'রাত'] },
  { id: 'book', emoji: '📚', bg: '#FFE0B2', label: 'বই', tags: ['book', 'বই', 'পড়া', 'লেখা'] }
]

// অ্যাভাটারকে SVG Data URL-এ রূপান্তর করার ফাংশন
export function getAvatarUrl(emoji, bg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="${bg}" />
    <text x="50%" y="54%" font-size="48" dominant-baseline="central" text-anchor="middle">${emoji}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}