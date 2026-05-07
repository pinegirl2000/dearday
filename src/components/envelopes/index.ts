export { default as ClassicEnvelope } from './ClassicEnvelope';
export { default as EnvelopeBeige } from './EnvelopeBeige';
export { default as EnvelopeMint } from './EnvelopeMint';
export { default as EnvelopeCoral } from './EnvelopeCoral';
export { default as EnvelopeBlue } from './EnvelopeBlue';
export { default as EnvelopeBlackGold } from './EnvelopeBlackGold';
export { default as SwayEnvelope } from './SwayEnvelope';
export { default as NoneEnvelope } from './NoneEnvelope';
export { COLOR_PALETTES, COLOR_IDS, type EnvelopeColorId, type EnvelopePalette } from './palettes';
export type { EnvelopeProps } from './FoldEnvelope';
export { shade } from './utils';

export const ENVELOPE_ANIMS = [
  { id: 'none',       name: 'None',           desc: 'Show card directly without envelope', recommend: 'Quick & simple' },
  { id: 'envelope-1', name: 'Purple Classic', desc: 'Lavender envelope with white card', recommend: 'Wedding / Welcome' },
  { id: 'envelope-2', name: 'Beige',          desc: 'Warm cream beige, 3D look',         recommend: 'Baptism / Gathering' },
  { id: 'envelope-3', name: 'Mint',           desc: 'Soft mint green, 3D look',          recommend: 'Spring / Casual' },
  { id: 'envelope-4', name: 'Coral',          desc: 'Light coral, 3D look',              recommend: 'Birthday / Opening' },
  { id: 'envelope-5', name: 'Light Blue',     desc: 'Soft sky blue, 3D look',            recommend: 'Baby / Casual' },
  { id: 'envelope-6', name: 'Black & Gold',   desc: 'Matte black with gold foil lining', recommend: 'Wedding / Gala' }
] as const;

export type EnvelopeAnimId = (typeof ENVELOPE_ANIMS)[number]['id'];
