// BART OATMEAL island — Baron Davis's alter-ego world.
// Landmark story content is Baron's real arc (players/baron_davis.json, evidence-backed);
// sponsor slots and raffle prizes come from the real Oatmeal ecosystem:
// Oatmeal Radio Café (W Jefferson Blvd LA — coffee/streaming/venue, prison & foster care
// reform), SLIC Studios, the STEELCUT albums, Business Inside the Game.

export const LANDMARKS = [
  {
    id: 'south-central',
    name: 'South Central LA',
    short: 'FIRST COURT',
    era: 'Childhood · the first hoop dream',
    chip: 'Moment 1',
    x: 92, z: 72, ground: 4,
    color: 0xff7a4d,
    feel: 'Blue LA sky over a chain-link court. Before Bart Oatmeal, before the league — a kid dribbling toward everything.',
    missionName: 'First Shot',
    storyPrompt: 'Who first made you believe your game could take you beyond the block, and what did that belief cost them?',
    minigame: 'shot',
    goal: 'Time the meter and sink 3 shots on the first court. The sweet spot shrinks every make.',
    sponsor: { name: 'OATMEAL RADIO CAFÉ', color: '#2f4f4a' },
  },
  {
    id: 'crossroads-ucla',
    name: 'Crossroads → UCLA',
    short: 'WESTSIDE JUMP',
    era: 'High school stardom · college pressure · the injury',
    chip: 'Moment 2',
    x: -104, z: 30, ground: 8,
    color: 0x4d7dff,
    feel: 'Westside mornings and blue-and-gold afternoons. A local star goes national — then learns who he is when the body says wait.',
    missionName: 'Fix the Tape',
    storyPrompt: 'When the injury happened, what did you learn about who you were when explosiveness was temporarily taken away?',
    minigame: 'tape',
    goal: 'The highlight reel is scattered. Match the three pairs of tapes to rebuild the rise, the fall, and the recovery.',
    sponsor: { name: 'SLIC STUDIOS', color: '#7a4bff' },
  },
  {
    id: 'oakland',
    name: 'Oakland Harbor',
    short: 'WE BELIEVE',
    era: '2007 · the loudest building in basketball',
    chip: 'Moment 3',
    x: 66, z: -78, ground: 3,
    color: 0xffc83d,
    feel: 'A No. 8 seed, a yellow-out crowd, and a city that decided to believe before the rest of the country caught up.',
    missionName: 'Drop the Beat',
    storyPrompt: 'What did Oracle sound like from inside your body before the rest of the country understood that series was real?',
    minigame: 'roar',
    goal: 'The crowd is the drum. Tap on the beat as the pulse hits the record — five clean hits and the arena erupts.',
    sponsor: { name: 'STEELCUT RECORDS', color: '#1d2430' },
  },
  {
    id: 'downtown-la',
    name: 'Downtown LA',
    short: 'HOMECOMING',
    era: 'The hometown return · arena lights',
    chip: 'Moment 4',
    x: -6, z: 118, ground: 5,
    color: 0xe0483e,
    feel: 'Back home as a pro. The plaza is full of kids who look like he did — every one of them wants the board signed.',
    missionName: 'Sign the Board',
    storyPrompt: 'What changed when you came home as Baron Davis the NBA player instead of Baron Davis the LA kid?',
    minigame: 'sign',
    goal: 'Kids pop up around the plaza with the home-court board. Catch 8 signatures before the tunnel walk.',
    sponsor: { name: 'BUSINESS INSIDE THE GAME', color: '#3f8f6a' },
  },
  {
    id: 'investor-tower',
    name: 'Oatmeal HQ',
    short: 'THE ECOSYSTEM',
    era: 'Founder · rapper · café owner · reformer',
    chip: 'Moment 5',
    x: -34, z: -58, ground: 20,
    color: 0x9a6bff,
    feel: 'A rooftop court above the whole operation — music, coffee, media, and second chances, all athlete-owned.',
    missionName: 'The Oatmeal Board',
    storyPrompt: 'What kind of business can only happen when athletes own the archive, the interview, the fan space, and the technology layer?',
    minigame: 'big',
    goal: 'Connect the Oatmeal ecosystem: match each person to what they bring to the world.',
    sponsor: { name: 'OATMEAL FOUNDATION', color: '#c96a1f' },
  },
];

// raffle economy — tickets fund entries; raffles support the real reform mission
export const TICKETS_PER_WIN = 5;
export const TICKETS_PER_REPLAY = 2;
export const TICKETS_PER_BALLOON = 1;

export const PRIZES = [
  { id: 'jersey', icon: '🏀', name: 'Game-worn signed jersey', cost: 20, note: 'one of Baron’s own' },
  { id: 'vinyl', icon: '💿', name: 'STEELCUT vinyl, signed', cost: 12, note: 'first pressing' },
  { id: 'merch', icon: '☕', name: 'Radio Café merch box', cost: 8, note: 'hoodie + beans + sticker sheet' },
  { id: 'session', icon: '🎙', name: 'Studio session at SLIC', cost: 30, note: 'sit in on a Bart Oatmeal session' },
];

export const RAFFLE_NOTE = 'raffle proceeds support prison reform & foster care reform — the Oatmeal Radio Café mission';

export const FINALE_LINE =
  'Bart Oatmeal Island is a place, not a page — fly a life, play its moments, win raffle entries for real merch, and every ticket feeds the mission: creators uplifted, second chances funded, all of it athlete-owned.';

export const SPONSOR_NOTE = 'sponsor slot — real Oatmeal ecosystem brands, placeholder inventory';
