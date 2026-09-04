export default function Logo({ size = 46 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <defs>
        {/* অ্যাপ আইকন সফট ড্রপ শ্যাডো */}
        <filter id="badgeShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="4.5" floodColor="#000000" floodOpacity="0.18" />
        </filter>

        {/* শ্যাম্পেন মেটালিক গোল্ড রিং গ্রেডিয়েন্ট */}
        <linearGradient id="champagneRing1" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f3ede2" />
          <stop offset="25%" stopColor="#d3c7b5" />
          <stop offset="50%" stopColor="#b5a48e" />
          <stop offset="75%" stopColor="#8c7c67" />
          <stop offset="100%" stopColor="#cdc2b0" />
        </linearGradient>

        <linearGradient id="champagneRing2" x1="140" y1="20" x2="20" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="35%" stopColor="#b8a892" />
          <stop offset="75%" stopColor="#6e604f" />
          <stop offset="100%" stopColor="#d8cdbc" />
        </linearGradient>

        {/* স্টিল/স্লেট ব্লু ফাউন্টেন পেন গ্রেডিয়েন্ট */}
        <linearGradient id="steelBluePen" x1="45" y1="40" x2="115" y2="115" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3d6380" />
          <stop offset="45%" stopColor="#2c4b64" />
          <stop offset="100%" stopColor="#1a3245" />
        </linearGradient>

        {/* পালকের ডাইনামিক লাইট ও শ্যাডো */}
        <linearGradient id="featherSoft" x1="75" y1="105" x2="128" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#335673" />
          <stop offset="50%" stopColor="#4a7394" />
          <stop offset="100%" stopColor="#6d94b5" />
        </linearGradient>

        <linearGradient id="featherDark" x1="128" y1="26" x2="85" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#25425a" />
          <stop offset="60%" stopColor="#2f516d" />
          <stop offset="100%" stopColor="#1d3549" />
        </linearGradient>
      </defs>

      {/* ১. হোয়াইট স্কোয়ার্কল ৩ডি ব্যাজ (দিন/রাত উভয় মোডেই নিখুঁত দৃশ্যমানতা দেয়) */}
      <rect
        x="6"
        y="6"
        width="148"
        height="148"
        rx="36"
        fill="#fcfcfd"
        stroke="#e5e7eb"
        strokeWidth="1.5"
        filter="url(#badgeShadow)"
      />

      {/* ভেতরের হালকা রাউন্ড ব্যাকগ্রাউন্ড প্লেট */}
      <circle cx="80" cy="80" r="62" fill="#f4f5f7" opacity="0.6" />

      {/* ২. শ্যাম্পেন মেটালিক টুইস্টেড স্পাইরাল রিং (ছবি অনুযায়ী নিখুঁত বেভেল) */}
      <path
        d="M 80,18 A 62,62 0 0,1 142,80 C 142,108 120,138 88,143 C 118,133 133,105 133,80 A 53,53 0 0,0 80,27 Z"
        fill="url(#champagneRing1)"
      />
      <path
        d="M 80,142 A 62,62 0 0,1 18,80 C 18,52 40,22 72,17 C 42,27 27,55 27,80 A 53,53 0 0,0 80,133 Z"
        fill="url(#champagneRing2)"
      />
      
      {/* ইনার মেটালিক হাইলাইট কার্ভ */}
      <circle cx="80" cy="80" r="51" stroke="url(#champagneRing1)" strokeWidth="1.8" fill="none" opacity="0.85" />
      <circle cx="80" cy="80" r="46" fill="#f8fafc" />

      {/* ৩. 'L' শেপের ফাউন্টেন পেন (বাম পাশের ভার্টিকাল পেন) */}
      {/* ক্যাপ */}
      <path d="M 50,42 C 50,33 66,33 66,42 L 66,66 L 50,66 Z" fill="url(#steelBluePen)" />
      
      {/* মেটালিক ক্লিপ (বাম পাশে) */}
      <path
        d="M 50,40 C 43,40 43,48 43,55 C 43,61 47,64 50,64"
        stroke="url(#champagneRing1)"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="44.2" cy="63.5" r="1.8" fill="url(#champagneRing1)" />

      {/* ক্যাপের মেটালিক জয়েন্ট রিং */}
      <rect x="48" y="66" width="20" height="3.5" rx="1.2" fill="url(#champagneRing1)" />

      {/* কলমের চকচকে লম্বালম্বি লাইট রিফ্লেকশন */}
      <rect x="54" y="37" width="2" height="26" rx="1" fill="#ffffff" opacity="0.45" />

      {/* কলমের নিচের ব্যারেল ও 'L'-এর নিচের মসৃণ বাঁক */}
      <path
        d="M 50,69.5 L 50,88 C 50,105 60,118 78,118 C 92,118 104,112 112,105 L 108,98 C 101,104 91,109 78,109 C 66,109 59,100 59,88 L 59,69.5 Z"
        fill="url(#steelBluePen)"
      />
      <rect x="54" y="73" width="2" height="18" rx="1" fill="#ffffff" opacity="0.4" />

      {/* ৪. ফাউন্টেন পেন নিব (ডান দিকে শোয়ানো নিব) */}
      <path
        d="M 108,98 L 123,102.5 C 126,103.5 126,106.5 123,107.5 L 109,112 L 111,105 Z"
        fill="url(#steelBluePen)"
      />
      <circle cx="115" cy="105" r="1.3" fill="#ffffff" />
      <line x1="114" y1="105" x2="123" y2="105" stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" />

      {/* ৫. ডান পাশের ডানা মেলা পালকের কলম (Feather Quill) */}
      {/* বাম পাশের হালকা অংশ */}
      <path
        d="M 74,106 C 77,90 87,66 104,46 C 112,37 120,29 128,26 C 125,35 120,44 117,50 C 115,46 113,42 110,40 C 106,50 99,65 94,74 C 92,71 90,68 88,66 C 83,81 79,94 74,106 Z"
        fill="url(#featherSoft)"
      />

      {/* ডান পাশের খাঁজকাটা অংশ */}
      <path
        d="M 128,26 C 131,37 126,53 117,68 C 118,65 120,60 121,57 C 115,70 108,84 97,96 C 99,93 100,88 102,86 C 94,97 84,104 76,108 C 87,100 101,83 112,62 C 119,48 124,35 128,26 Z"
        fill="url(#featherDark)"
      />

      {/* পালকের মাঝের উজ্জ্বল সাদা মেরুদণ্ড (Spine) */}
      <path
        d="M 74,106 Q 98,68 128,26"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.95"
      />

      {/* ৬. পালকের নিচে থাকা ক্যালিগ্রাফিক কার্ল / সিগনেচার লুপ */}
      <path
        d="M 78,114 C 84,114 90,121 84,126 C 80,129 76,126 79,122 C 82,119 87,118 92,120 C 100,123 108,122 113,117"
        stroke="url(#steelBluePen)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}