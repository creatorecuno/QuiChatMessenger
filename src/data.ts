import type { Contact, Conversation, UserProfile, AppSettings } from './types';

export const contacts: Contact[] = [
  {
    id: 'c1',
    name: 'Aria Sterling',
    avatar: 'AS',
    status: 'online',
    lastSeen: 'Active now',
    unread: 3,
    isTyping: true,
    isFavorite: true,
    bio: 'Product Designer · San Francisco',
  },
  {
    id: 'c2',
    name: 'Kai Nakamura',
    avatar: 'KN',
    status: 'online',
    lastSeen: 'Active now',
    unread: 0,
    isTyping: false,
    isFavorite: true,
    bio: 'Software Engineer · Tokyo',
  },
  {
    id: 'c3',
    name: 'Luna Reyes',
    avatar: 'LR',
    status: 'away',
    lastSeen: '15 min ago',
    unread: 2,
    isTyping: false,
    isFavorite: false,
    bio: 'Photographer · Barcelona',
  },
  {
    id: 'c4',
    name: 'Marcus Chen',
    avatar: 'MC',
    status: 'offline',
    lastSeen: '2 hours ago',
    unread: 0,
    isTyping: false,
    isFavorite: false,
    bio: 'Music Producer · Berlin',
  },
  {
    id: 'c5',
    name: 'Sofia Volkov',
    avatar: 'SV',
    status: 'online',
    lastSeen: 'Active now',
    unread: 5,
    isTyping: true,
    isFavorite: true,
    bio: 'UX Researcher · London',
  },
  {
    id: 'c6',
    name: 'Eli Okafor',
    avatar: 'EO',
    status: 'offline',
    lastSeen: '1 day ago',
    unread: 0,
    isTyping: false,
    isFavorite: false,
    bio: 'Startup Founder · Lagos',
  },
  {
    id: 'c7',
    name: 'Nina Santos',
    avatar: 'NS',
    status: 'away',
    lastSeen: '30 min ago',
    unread: 0,
    isTyping: false,
    isFavorite: false,
    bio: 'Illustrator · Lisbon',
  },
  {
    id: 'c8',
    name: 'Theo Williams',
    avatar: 'TW',
    status: 'online',
    lastSeen: 'Active now',
    unread: 1,
    isTyping: false,
    isFavorite: false,
    bio: 'Architect · New York',
  },
];

const now = Date.now();
const ts = (minsAgo: number) => {
  const d = new Date(now - minsAgo * 60000);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};
const dateStr = (minsAgo: number) => {
  const d = new Date(now - minsAgo * 60000);
  const today = new Date(now);
  const yesterday = new Date(now - 86400000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const conversations: Conversation[] = [
  {
    contactId: 'c1',
    messages: [
      { id: 'm1', senderId: 'c1', content: 'Hey! Did you get a chance to review the latest mockups?', timestamp: ts(180), type: 'text', status: 'read', date: dateStr(180) },
      { id: 'm2', senderId: 'me', content: 'Yes! The new color system looks incredible. Really loving the glassmorphism direction.', timestamp: ts(178), type: 'text', status: 'read', date: dateStr(178) },
      { id: 'm3', senderId: 'c1', content: "I knew you'd like it. The depth and layering really elevate the whole experience.", timestamp: ts(176), type: 'text', status: 'read', date: dateStr(176) },
      { id: 'm4', senderId: 'me', content: 'Absolutely. Can we sync on the animation specs tomorrow?', timestamp: ts(175), type: 'text', status: 'read', date: dateStr(175) },
      { id: 'm5', senderId: 'c1', content: "Sure! I have a slot at 10am. I'll send a calendar invite.", timestamp: ts(20), type: 'text', status: 'delivered', date: dateStr(20) },
      { id: 'm6', senderId: 'c1', content: 'Also — should we add micro-interactions to the message bubbles?', timestamp: ts(18), type: 'text', status: 'delivered', date: dateStr(18) },
      { id: 'm7', senderId: 'c1', content: 'The spring physics would make it feel so premium', timestamp: ts(17), type: 'text', status: 'delivered', date: dateStr(17) },
    ],
  },
  {
    contactId: 'c2',
    messages: [
      { id: 'm1', senderId: 'c2', content: 'Pushed the latest changes to the repo. Check the animation branch.', timestamp: ts(90), type: 'text', status: 'read', date: dateStr(90) },
      { id: 'm2', senderId: 'me', content: 'On it. Testing the message transitions now.', timestamp: ts(88), type: 'text', status: 'read', date: dateStr(88) },
      { id: 'm3', senderId: 'c2', content: 'The spring config is at the top of the file. Tweak the stiffness if it feels too snappy.', timestamp: ts(85), type: 'text', status: 'read', date: dateStr(85) },
      { id: 'm4', senderId: 'me', content: 'Stiffness 300, damping 30 — feels buttery smooth. Nice work.', timestamp: ts(82), type: 'text', status: 'read', date: dateStr(82) },
      { id: 'm5', senderId: 'c2', content: 'Perfect. Merging to main then.', timestamp: ts(80), type: 'text', status: 'read', date: dateStr(80) },
    ],
  },
  {
    contactId: 'c3',
    messages: [
      { id: 'm1', senderId: 'c3', content: 'I just uploaded the photoshoot batch to the shared drive.', timestamp: ts(300), type: 'text', status: 'read', date: dateStr(300) },
      { id: 'm2', senderId: 'me', content: 'The lighting in those shots is unreal. Which lens did you use?', timestamp: ts(295), type: 'text', status: 'read', date: dateStr(295) },
      { id: 'm3', senderId: 'c3', content: '35mm f/1.4 — golden hour is basically magic.', timestamp: ts(290), type: 'text', status: 'read', date: dateStr(290) },
      { id: 'm4', senderId: 'c3', content: 'I think these would look amazing in the app landing page.', timestamp: ts(45), type: 'text', status: 'delivered', date: dateStr(45) },
      { id: 'm5', senderId: 'c3', content: "Let me know which ones you want and I'll send full-res.", timestamp: ts(44), type: 'text', status: 'delivered', date: dateStr(44) },
    ],
  },
  {
    contactId: 'c4',
    messages: [
      { id: 'm1', senderId: 'me', content: 'That new track you sent is fire. The bass line is insane.', timestamp: ts(600), type: 'text', status: 'read', date: dateStr(600) },
      { id: 'm2', senderId: 'c4', content: 'Thanks man! Still mixing the vocals but the instrumental is done.', timestamp: ts(595), type: 'text', status: 'read', date: dateStr(595) },
      { id: 'm3', senderId: 'me', content: 'When can I hear the full version?', timestamp: ts(590), type: 'text', status: 'read', date: dateStr(590) },
      { id: 'm4', senderId: 'c4', content: "Probably next week. I'll send you a private link.", timestamp: ts(585), type: 'text', status: 'read', date: dateStr(585) },
    ],
  },
  {
    contactId: 'c5',
    messages: [
      { id: 'm1', senderId: 'c5', content: 'I finished the user research report. The findings are fascinating.', timestamp: ts(60), type: 'text', status: 'delivered', date: dateStr(60) },
      { id: 'm2', senderId: 'c5', content: '82% of users prefer dark mode with subtle accent colors.', timestamp: ts(59), type: 'text', status: 'delivered', date: dateStr(59) },
      { id: 'm3', senderId: 'c5', content: 'And 91% said smooth animations make the app feel more premium.', timestamp: ts(58), type: 'text', status: 'delivered', date: dateStr(58) },
      { id: 'm4', senderId: 'c5', content: 'We should present this to the team. Thursday work?', timestamp: ts(57), type: 'text', status: 'delivered', date: dateStr(57) },
      { id: 'm5', senderId: 'c5', content: 'Also — can you review the persona slides? I need fresh eyes.', timestamp: ts(55), type: 'text', status: 'delivered', date: dateStr(55) },
    ],
  },
  {
    contactId: 'c6',
    messages: [
      { id: 'm1', senderId: 'c6', content: 'We closed the seed round! Excited to build the team.', timestamp: ts(1440), type: 'text', status: 'read', date: dateStr(1440) },
      { id: 'm2', senderId: 'me', content: "Congrats! That's huge news. What's the timeline for launch?", timestamp: ts(1438), type: 'text', status: 'read', date: dateStr(1438) },
      { id: 'm3', senderId: 'c6', content: "Q1 next year. I'll keep you posted on the beta.", timestamp: ts(1435), type: 'text', status: 'read', date: dateStr(1435) },
    ],
  },
  {
    contactId: 'c7',
    messages: [
      { id: 'm1', senderId: 'me', content: 'Love your latest illustration series on Instagram.', timestamp: ts(200), type: 'text', status: 'read', date: dateStr(200) },
      { id: 'm2', senderId: 'c7', content: "Thank you! I'm exploring a new style with more gradient work.", timestamp: ts(195), type: 'text', status: 'read', date: dateStr(195) },
      { id: 'm3', senderId: 'me', content: 'Would you be open to a commission for our app icons?', timestamp: ts(190), type: 'text', status: 'read', date: dateStr(190) },
      { id: 'm4', senderId: 'c7', content: "I'd love that! Send me the brief whenever you're ready.", timestamp: ts(185), type: 'text', status: 'read', date: dateStr(185) },
    ],
  },
  {
    contactId: 'c8',
    messages: [
      { id: 'm1', senderId: 'c8', content: 'The renders for the pavilion project are done.', timestamp: ts(40), type: 'text', status: 'delivered', date: dateStr(40) },
      { id: 'm2', senderId: 'me', content: "Can't wait to see them. Sending feedback tonight.", timestamp: ts(38), type: 'text', status: 'delivered', date: dateStr(38) },
    ],
  },
];

export const defaultProfile: UserProfile = {
  name: 'You',
  avatar: 'ME',
  statusMessage: 'Available',
  status: 'online',
};

export const defaultSettings: AppSettings = {
  notifications: true,
  messageSound: true,
  readReceipts: true,
  typingIndicators: true,
  theme: 'midnight',
};

export const emojiCategories: { name: string; emojis: string[] }[] = [
  {
    name: 'Smileys',
    emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','😮‍💨','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'],
  },
  {
    name: 'Gestures',
    emojis: ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🦷','🦴','👀','👁️','👅','👄','💋','🩸'],
  },
  {
    name: 'Objects',
    emojis: ['⌨️','🖥️','🖨️','🖱️','💾','💿','📀','📷','📸','📹','🎥','🎬','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡','🔋','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷','💰','💳','💎','🔧','🔨','⚒️','🛠️','⛏️','🔩','⚙️','🧱','⛓️','🧲','🔫','💣','🧨','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','⚱️','🏺'],
  },
  {
    name: 'Hearts',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','♥️','💌','💋','💍','💍','💎','🌹','🌷','🌸','🌺','🌻','🌼',' blossoms','🏵️','🌶️','🍄','🥀','🌺','🌻','🌼','🏵️'],
  },
];
