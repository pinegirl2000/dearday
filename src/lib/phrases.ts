/**
 * 행사별 추천 문구 모음 — 카드 만들기에서 "한 줄 문구"와 "본문"을 고를 때 보여 준다.
 *
 * 왜 직접 써 둔 모음인가: 호출 비용 없이 즉시 뜨고, 품질이 일정하다.
 * 문구는 사람들이 카드에 실제로 자주 쓰는 평범한 표현으로 — 꾸민 말, 긴 대시, 과장된 수식어를 피한다.
 * 사용자가 고른 뒤 이름·사정을 넣어 고쳐 쓰는 것을 전제로 하므로 이름 자리표시자는 넣지 않는다.
 *
 * 길이 제한(테스트로 고정): 한 줄 문구 40자, 본문 200자·3줄 이하 — 카드 만들기 입력 제한과 같다.
 */
import { PHRASES_KO } from './phrases-ko';

export interface PhraseSet {
  /** 제목 위 한 줄 문구 */
  oneLiners: string[];
  /** 본문 */
  messages: string[];
}

export const PHRASES_PER_FIELD = 6;

export const PHRASES: Record<string, PhraseSet> = {
  // ───────── 초대 ─────────
  birthday: {
    oneLiners: ['Cheers to another year!', "Let's celebrate!", "You're invited", 'Come party with us', 'Another year older', 'Save the date'],
    messages: [
      'Come celebrate with us!\nThere will be food, cake and good company.',
      'Join us for a birthday party.\nJust bring yourself, no gifts needed.',
      "It's birthday time!\nWe would love to have you there.",
      'Please join us for a small birthday dinner.\nLooking forward to seeing you.',
      "We're throwing a party and you're invited.\nCome hungry!",
      "It wouldn't be the same without you.\nHope you can make it."
    ]
  },
  'baby-full-month': {
    oneLiners: ['Our little one is one month old', "Baby's full month", 'Welcome, little one', 'One month of joy', 'Come meet our baby', 'A new addition to the family'],
    messages: [
      "Please join us to celebrate our baby's full month.\nWe would love for you to meet the little one.",
      'Our baby turns one month old!\nCome celebrate with our family.',
      "We are happy to invite you to our baby's full month celebration.\nLunch will be served.",
      'Thank you for all the love and well wishes.\nPlease join us for a full month lunch.',
      "It's been a month already!\nCome share our joy and have a meal with us.",
      'Join us for red eggs, good food and baby cuddles.\nNo need to bring anything.'
    ]
  },
  'first-birthday': {
    oneLiners: ['Our baby is turning one!', 'One year old already', 'First birthday party', 'The big ONE', 'One year of love', 'Our little one turns one'],
    messages: [
      "Please join us to celebrate our little one's first birthday.",
      'How time flies! Our baby is turning one.\nCome celebrate with us.',
      "One year of smiles, cuddles and sleepless nights.\nLet's celebrate together!",
      'Join us for cake and fun\nas our little one turns one.',
      "We can't believe it's been a year.\nPlease come and celebrate with our family.",
      'Thank you for watching our baby grow.\nJoin us for the first birthday party.'
    ]
  },
  housewarming: {
    oneLiners: ['We have moved!', 'Home sweet home', 'New home, new start', 'Come see our new place', 'Housewarming party', 'Our door is open'],
    messages: [
      'We have finally moved in!\nCome over for food and drinks.',
      'Please join us for our housewarming.\nJust bring yourself.',
      'New keys, new home.\nWe would love to show you around.',
      'Our new place is ready.\nCome by for a simple meal with us.',
      "Boxes are unpacked and the kettle is on.\nDrop by, we'd love to see you.",
      'Come see our new home and stay for dinner.\nNo gifts needed.'
    ]
  },
  engagement: {
    oneLiners: ["We're engaged!", 'She said yes!', 'He said yes!', 'Two hearts, one promise', 'Our engagement', "It's official"],
    messages: [
      "We're engaged and we would love to celebrate with you.",
      'Please join us for our engagement celebration.',
      'We said yes to forever.\nCome celebrate with our families.',
      'Together with our families,\nwe invite you to our engagement.',
      'We have some happy news to share.\nJoin us for dinner and a toast.',
      'Your presence would mean a lot to us\nas we celebrate our engagement.'
    ]
  },
  baptism: {
    oneLiners: ['A blessed day', 'Baptism celebration', 'A new life in Christ', 'With joy and thanksgiving', "Child of God", 'A day of blessing'],
    messages: [
      'Please join us as we celebrate\nthis baptism in the Lord.',
      'With joy and thanksgiving,\nwe invite you to witness this baptism.',
      'We would be honoured to have you with us\non this special day of faith.',
      'Come and share in our joy.\nA simple reception will follow the service.',
      'Please keep us in your prayers\nand join us for the baptism.',
      'Thank you for walking with us in faith.\nWe hope you can join us.'
    ]
  },
  meeting: {
    oneLiners: ["Let's catch up", "It's been too long", 'See you there', 'Gathering time', 'Come join us', 'Save the date'],
    messages: [
      "It has been too long.\nLet's gather and catch up.",
      "We're getting everyone together.\nHope you can make it!",
      'Good food, good company.\nCome join us.',
      'Please join us for a casual get-together.\nBring your family along.',
      "Let's meet up before the year runs away.\nSee you there.",
      'Mark your calendar and come hungry.\nWe have plenty to catch up on.'
    ]
  },
  opening: {
    oneLiners: ["We're open!", 'Grand opening', 'Now open', 'Come visit us', 'A new beginning', 'Opening day'],
    messages: [
      "We're excited to open our doors\nand share this moment with you.",
      'Please join us for our grand opening.\nLight refreshments will be served.',
      'After months of hard work, we are finally open.\nCome by and say hello.',
      'Thank you for your support.\nWe would love to welcome you on opening day.',
      'Come celebrate our opening with us.\nBring your friends along.',
      'We are open for business.\nDrop by, we would love to see you.'
    ]
  },
  etc: {
    oneLiners: ["You're invited", 'Save the date', 'Join us', 'A special day', 'Please come', 'See you there'],
    messages: [
      "We'd love for you to share\nthis special moment with us.",
      'Please join us.\nIt would mean a lot to have you there.',
      'We hope you can make it.\nLooking forward to seeing you.',
      'Come celebrate with us.\nFood and drinks will be served.',
      'Mark your calendar.\nWe would love to see you there.',
      'Your presence is the best gift.\nPlease join us.'
    ]
  },

  // ───────── 감사 · 축하 ─────────
  'mothers-day': {
    oneLiners: ["Happy Mother's Day", 'Thank you, Mum', 'Love you, Mum', "To the world's best mum", 'For you, Mum', 'With all my love'],
    messages: [
      'Thank you for everything you do for us.\nWe love you, Mum.',
      "Happy Mother's Day!\nThank you for always being there for me.",
      "I don't say it enough, but thank you.\nLove you always.",
      'Thank you for your love, your cooking and your patience.',
      'You have always put us first.\nToday is all about you, Mum.',
      'Thank you for raising me with so much love.\nI am who I am because of you.'
    ]
  },
  'fathers-day': {
    oneLiners: ["Happy Father's Day", 'Thank you, Dad', 'Love you, Dad', "To the world's best dad", 'For you, Dad', 'My hero'],
    messages: [
      'Thank you for working so hard for our family.\nWe love you, Dad.',
      "Happy Father's Day!\nThank you for always having my back.",
      'Thank you for everything you taught me.\nI am proud to be your child.',
      "You never say much, but I know how much you care.\nThank you, Dad.",
      'Thank you for the rides, the advice and the dad jokes.',
      'Take a break today, Dad.\nYou deserve it.'
    ]
  },
  'teachers-day': {
    oneLiners: ["Happy Teachers' Day", 'Thank you, Teacher', 'Thank you, Cher!', 'To my favourite teacher', 'With thanks', 'You made a difference'],
    messages: [
      'Thank you for your patience and for believing in us.',
      "Happy Teachers' Day!\nThank you for making lessons fun.",
      'Thank you for never giving up on me.',
      'I learned so much in your class.\nThank you for everything.',
      'Thank you for teaching us more than what is in the textbook.',
      'You are the reason I enjoy coming to school.\nThank you, Teacher.'
    ]
  },
  graduation: {
    oneLiners: ['Congratulations, graduate!', 'You did it!', 'Happy graduation', 'So proud of you', 'Well done!', 'A new chapter begins'],
    messages: [
      'Congratulations on your graduation!\nWe are so proud of you.',
      'All your hard work has paid off.\nWell done!',
      'You did it! Wishing you all the best\nfor whatever comes next.',
      'So proud of how far you have come.\nCongratulations!',
      'The late nights were worth it.\nEnjoy this moment, you earned it.',
      'Congratulations! The world is waiting for you.'
    ]
  },
  'thank-you': {
    oneLiners: ['Thank you!', 'Thanks so much', 'With thanks', 'Much appreciated', 'A big thank you', 'Thank you for everything'],
    messages: [
      'Thank you so much for your help.\nI really appreciate it.',
      'Thank you for the lovely gift.\nIt was very thoughtful of you.',
      'Thank you for being there when I needed it.',
      "I couldn't have done it without you.\nThank you!",
      'Thank you for coming.\nIt meant a lot to have you with us.',
      'Just a small note to say thank you.\nYou made my day.'
    ]
  },
  'get-well': {
    oneLiners: ['Get well soon', 'Thinking of you', 'Speedy recovery', 'Take care', 'Rest well', 'Feel better soon'],
    messages: [
      'Wishing you a speedy recovery.\nTake care and rest well.',
      'Hope you feel better soon.\nWe miss you!',
      "Thinking of you and hoping you're back on your feet soon.",
      'Take all the time you need to rest.\nWe are here if you need anything.',
      'Sending you lots of love.\nGet well soon!',
      "Rest well and don't worry about anything else.\nSee you soon."
    ]
  },
  promotion: {
    oneLiners: ['Congratulations!', 'Well deserved!', 'Congrats on the promotion', 'Onwards and upwards', 'So proud of you', 'You earned it'],
    messages: [
      'Congratulations on your promotion!\nYou really deserve it.',
      'Your hard work has paid off.\nSo happy for you!',
      'Well done on the new role.\nWishing you every success.',
      "Couldn't have happened to a better person.\nCongratulations!",
      'Congrats! Drinks are on you next time.',
      'Wishing you all the best in your new position.'
    ]
  },
  sorry: {
    oneLiners: ["I'm sorry", 'Please forgive me', 'My apologies', 'I was wrong', 'Sorry about that', 'From the heart'],
    messages: [
      "I'm sorry for what happened.\nI hope you can forgive me.",
      'I was wrong and I am truly sorry.',
      "I'm sorry I let you down.\nI will do better.",
      "I didn't mean to hurt you.\nI'm really sorry.",
      'Sorry for the trouble I caused.\nPlease let me make it up to you.',
      'I have been thinking about it and I owe you an apology.\nI am sorry.'
    ]
  },

  // ───────── 기념일 · 명절 ─────────
  'wedding-anniversary': {
    oneLiners: ['Happy anniversary', 'Another year together', 'Still in love', 'To us', 'Our anniversary', 'Years of love'],
    messages: [
      'Happy anniversary, my love.\nThank you for another wonderful year.',
      "Another year together and I'd still choose you.",
      'Thank you for being my partner in everything.\nHappy anniversary.',
      'Please join us for dinner\nas we celebrate our anniversary.',
      "Here's to many more years together.",
      'Through the good days and the hard ones, thank you for staying by my side.'
    ]
  },
  cny: {
    oneLiners: ['Happy Chinese New Year', 'Gong Xi Fa Cai', 'Huat ah!', 'Xin Nian Kuai Le', 'Wishing you prosperity', 'Happy Lunar New Year'],
    messages: [
      'Wishing you good health, happiness\nand prosperity in the new year.',
      'Gong Xi Fa Cai!\nMay the new year bring you good luck and good fortune.',
      'Please join us for reunion dinner.\nSee you there!',
      "Come over for lo hei and snacks.\nLet's huat together!",
      'Wishing you and your family a happy and prosperous new year.',
      'May everything go smoothly for you this year.\nXin Nian Kuai Le!'
    ]
  },
  'hari-raya': {
    oneLiners: ['Selamat Hari Raya', 'Selamat Hari Raya Aidilfitri', 'Maaf zahir dan batin', 'Eid Mubarak', 'Salam Aidilfitri', 'Jemput datang'],
    messages: [
      'Selamat Hari Raya Aidilfitri.\nMaaf zahir dan batin.',
      'Wishing you and your family a blessed Hari Raya.',
      'Jemput datang ke rumah kami.\nPlease join us for our open house.',
      'Come over for ketupat, rendang and kuih.\nOur door is open!',
      'May this Hari Raya bring you peace and happiness.',
      'Selamat Hari Raya from our family to yours.\nHope to see you at our open house.'
    ]
  },
  deepavali: {
    oneLiners: ['Happy Deepavali', 'Deepavali Vazhthukkal', 'Festival of lights', 'Wishing you light and joy', 'Happy Diwali', 'Come celebrate with us'],
    messages: [
      'Happy Deepavali!\nMay the festival of lights bring you joy and peace.',
      'Wishing you and your family a bright and happy Deepavali.',
      'Please join us for our Deepavali open house.\nCome hungry!',
      'May light always guide your way.\nHappy Deepavali!',
      'Come over for murukku, sweets and good company.',
      'Wishing you good health and happiness this Deepavali.'
    ]
  },
  'mid-autumn': {
    oneLiners: ['Happy Mid-Autumn Festival', 'Mooncake time', 'Under the full moon', 'Zhong Qiu Jie Kuai Le', 'Lanterns and mooncakes', 'Reunion under the moon'],
    messages: [
      'Happy Mid-Autumn Festival!\nWishing you a happy reunion with your family.',
      'Join us for mooncakes, tea and lanterns.',
      'May your life be as round and bright as the full moon.',
      'Come over for mooncakes and a lantern walk with the kids.',
      'Wishing you and your family a sweet Mid-Autumn Festival.',
      "Let's enjoy the full moon together.\nMooncakes are on us."
    ]
  },
  christmas: {
    oneLiners: ['Merry Christmas', "Season's greetings", 'Happy holidays', 'Christmas party', 'Joy to the world', "'Tis the season"],
    messages: [
      'Merry Christmas and a Happy New Year!',
      'Wishing you peace, joy and love this Christmas.',
      'Please join us for our Christmas party.\nBring a small gift for the gift exchange.',
      'Come over for Christmas dinner.\nThere will be plenty of food.',
      'May your Christmas be filled with love and laughter.',
      'Thank you for a wonderful year.\nMerry Christmas to you and your family.'
    ]
  },
  'national-day': {
    oneLiners: ['Happy National Day', 'Happy Birthday, Singapore', 'Majulah Singapura', 'Celebrating our home', 'National Day gathering', 'One people, one Singapore'],
    messages: [
      'Happy National Day!\nCome watch the parade with us.',
      "Join us for a National Day gathering.\nWear red and white!",
      'Happy Birthday, Singapore!\nProud to call this place home.',
      "Let's catch the fireworks together.\nFood and drinks will be ready.",
      'Wishing everyone a happy National Day.',
      'Come over for a potluck and watch the parade on TV with us.'
    ]
  },
  valentines: {
    oneLiners: ["Happy Valentine's Day", 'Be my Valentine', 'To my love', 'With all my heart', 'Love you always', 'You and me'],
    messages: [
      "Happy Valentine's Day, my love.",
      'Thank you for loving me the way you do.',
      'Every day with you is my favourite.',
      'Will you be my Valentine?\nDinner is on me.',
      "I'm so lucky to have you.\nLove you always.",
      'You make ordinary days feel special.\nHappy Valentine\'s Day.'
    ]
  }
};

/** 추천 문구를 보여 주는 입력칸 */
export type PhraseField = 'greeting_oneliner' | 'body';
/** 추천 문구 언어 */
export type PhraseLang = 'en' | 'ko';

/**
 * 행사·입력칸·언어에 맞는 추천 문구.
 * 모음에 없는 행사(관리자가 추가한 사용자 정의 행사 등)는 범용 문구로 대체하고,
 * 추천을 제공하지 않는 입력칸(제목·연락처)은 빈 배열을 돌려준다 — 제목은 이름이 들어가 범용 문구가 맞지 않음.
 */
export function getPhraseSuggestions(eventId: string | null | undefined, field: string, lang: PhraseLang = 'en'): string[] {
  const library = lang === 'ko' ? PHRASES_KO : PHRASES;
  const set = (eventId && library[eventId]) || library.etc;
  if (field === 'greeting_oneliner') return set.oneLiners;
  if (field === 'body') return set.messages;
  return [];
}
