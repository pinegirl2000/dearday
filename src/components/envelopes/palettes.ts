// 12가지 envelope 색상 팔레트 — Sway/Flip 두 애니메이션 타입 모두 공유.
// 각 팔레트는 외피(body) + 안감 메탈릭 그라데이션(gold*) 5단계로 구성.

export type EnvelopeColorId =
  | 'lavender'
  | 'champagne'
  | 'sage'
  | 'blush'
  | 'rose'
  | 'powder'
  | 'midnight'
  | 'cobalt'
  | 'aubergine'
  | 'pearl'
  | 'onyx';

export interface EnvelopePalette {
  id: EnvelopeColorId;
  label: string;
  flap: string;
  flapShadow: string;
  body: string;
  bodyDark: string;
  bodyMid: string;
  bodyTint: string;
  inner: string;
  paper: string;
  accent: string;
  ink: string;
  petals: string[];
  // 안감 메탈릭 그라데이션 (highlight→light→base→deep→shadow)
  goldHighlight: string;
  goldLight: string;
  gold: string;
  goldDeep: string;
  goldShadow: string;
}

// 메탈릭 골드 포일 — 첨부 이미지 기준 (밝은 yellow-cream highlight + 채도 높은 foil gold + 따뜻한 deep)
// 실제 금박의 reflective sheen을 재현하기 위해 highlight를 매우 밝게, base gold를 saturated yellow로
const goldFoil = {
  goldHighlight: '#FBEFA8',  // 빛 반사 highlight (밝은 yellow-cream)
  goldLight:     '#F0DC78',  // 밝은 yellow gold
  gold:          '#DCB748',  // saturated foil gold (메인 톤)
  goldDeep:      '#A8862E',  // deep warm gold
  goldShadow:    '#5A4017'   // 깊은 그림자
};

export const COLOR_PALETTES: Record<EnvelopeColorId, EnvelopePalette> = {
  pearl: {
    id: 'pearl', label: 'Gold Cream',
    flap:'#E8CC68', flapShadow:'#A8862E',
    body:'#DCB748', bodyDark:'#A8862E', bodyMid:'#E8CC68', bodyTint:'#F5E29A',
    inner:'#FBF7EC', paper:'#FFFFFF', accent:'#F5F0E2', ink:'#3A2810',
    petals:['#FBEFA8','#F0DC78','#DCB748','#F5F0E2','#F5E29A','#E8CC68'],
    // 골드 외피 + 연한 크림(거의 ivory white) 안감 — gold + cream 클래식 럭셔리 콤비
    goldHighlight:'#FFFFFF', goldLight:'#FBF8F0', gold:'#F5F0E2', goldDeep:'#DDD4BC', goldShadow:'#A89D80'
  },
  lavender: {
    id: 'lavender', label: 'Lavender Silver',
    flap:'#D2B8E5', flapShadow:'#B89AD2',
    body:'#C8B0E2', bodyDark:'#9C82BE', bodyMid:'#D2B8E5', bodyTint:'#E8DCF3',
    inner:'#F8F6FB', paper:'#FFFFFF', accent:'#7B5EA7', ink:'#3A2E55',
    petals:['#C9A0DC','#D9B6E5','#E8CFEF','#A990CC','#B89AD2','#E0C8EE'],
    // 연보라와 어울리는 시원한 펄/실버 톤 — cool-on-cool 모노크로매틱 (한 단계 밝게)
    goldHighlight:'#F8F5FA', goldLight:'#E8E2EE', gold:'#CABFCF', goldDeep:'#9C90A6', goldShadow:'#6B6173'
  },
  champagne: {
    id: 'champagne', label: 'Beige Cream',
    flap:'#E2D6BC', flapShadow:'#C5BBA0',
    body:'#DACFB6', bodyDark:'#A89A78', bodyMid:'#E2D6BC', bodyTint:'#EFE7D2',
    inner:'#FBF7EC', paper:'#FFFFFF', accent:'#9C8B6E', ink:'#3D3520',
    petals:['#F4DDB8','#F8E5C5','#FFE9CC','#E8C798','#FCE4C2','#FFF1DC'],
    // 베이지와 어울리는 거의 흰색 톤 — soft ivory white
    goldHighlight:'#FFFFFF', goldLight:'#FBF8F0', gold:'#F5F0E2', goldDeep:'#DDD4BC', goldShadow:'#A89D80'
  },
  sage: {
    id: 'sage', label: 'Sage Pearl',
    flap:'#A6BDA1', flapShadow:'#6F8569',
    body:'#B0C5AC', bodyDark:'#7E9279', bodyMid:'#C5D6C2', bodyTint:'#DCE8DA',
    inner:'#FBFAF5', paper:'#FFFFFF', accent:'#7E9279', ink:'#2E3D2C',
    petals:['#C5D6C2','#DCE8DA','#E8EDDC','#A6BDA1','#D4DEC8','#EBEFD8'],
    goldHighlight:'#FBFAF2', goldLight:'#F0ECDF', gold:'#E8E4D8', goldDeep:'#C2BCAA', goldShadow:'#8E8775'
  },
  blush: {
    id: 'blush', label: 'Blush Rose Gold',
    flap:'#EDB5A4', flapShadow:'#B5806F',
    body:'#F2C0B3', bodyDark:'#C48E80', bodyMid:'#F5C8B8', bodyTint:'#FAD9CE',
    inner:'#FBF3EE', paper:'#FFFFFF', accent:'#C9907A', ink:'#5A2E22',
    petals:['#FBC4B0','#FDD0BF','#FFDDD0','#F5B098','#FFE7DE','#FFF1EB'],
    goldHighlight:'#F0CABA', goldLight:'#DDA48F', gold:'#C9907A', goldDeep:'#9C6A55', goldShadow:'#6B4536'
  },
  rose: {
    id: 'rose', label: 'Rose Petal',
    flap:'#F0BAC8', flapShadow:'#D993A5',
    body:'#F4C5D2', bodyDark:'#C982A0', bodyMid:'#F0BAC8', bodyTint:'#FAD8E1',
    inner:'#FFF6F8', paper:'#FFFFFF', accent:'#C97796', ink:'#5A2840',
    petals:['#FAD8E1','#F4C5D2','#F0BAC8','#E5A5BA','#FFE4EC','#FFCCD8'],
    // 핑크와 어울리는 밝은 크림 톤 — 거의 흰색에 가까운 ivory cream
    goldHighlight:'#FFFCF6', goldLight:'#FBF6EC', gold:'#F5EBD8', goldDeep:'#DDD0B8', goldShadow:'#A89880'
  },
  powder: {
    id: 'powder', label: 'Powder Silver',
    flap:'#A8C3D8', flapShadow:'#7592A8',
    body:'#BFD7EA', bodyDark:'#88A4BA', bodyMid:'#CADCE9', bodyTint:'#DDE9F2',
    inner:'#F8FAFB', paper:'#FFFFFF', accent:'#8FB5D0', ink:'#1F3548',
    petals:['#BFD9F0','#D5E5F2','#A8C8E0','#C7DCEE','#E5EFF7','#9CC0DD'],
    goldHighlight:'#EFF2F5', goldLight:'#D9DEE3', gold:'#C4CDD4', goldDeep:'#9AA4AC', goldShadow:'#6B7378'
  },
  midnight: {
    id: 'midnight', label: 'Midnight Gold',
    flap:'#384858', flapShadow:'#0E1822',
    body:'#2D3D50', bodyDark:'#16202C', bodyMid:'#3D4E62', bodyTint:'#5A6B7E',
    inner:'#1F2E40', paper:'#FFFFFF', accent:'#D4AF37', ink:'#F5EDD2',
    petals:['#D4AF37','#F2D98A','#B08820','#FFFFFF','#1A1A1A','#7A5C12'],
    ...goldFoil
  },
  onyx: {
    id: 'onyx', label: 'Onyx Gold',
    flap:'#353535', flapShadow:'#1A1A1A',
    body:'#2A2A2A', bodyDark:'#0F0F0F', bodyMid:'#3A3A3A', bodyTint:'#4D4D4D',
    inner:'#2A2418', paper:'#FFFFFF', accent:'#DCB748', ink:'#F0DC78',
    petals:['#DCB748','#F0DC78','#FBEFA8','#1A1A1A','#3A3A3A','#A8862E'],
    // 매트 차콜 블랙과 어울리는 luxe 메탈릭 골드 포일 — 격조 높은 black-tie 룩
    ...goldFoil
  },
  aubergine: {
    id: 'aubergine', label: 'Aubergine Pearl',
    flap:'#523A60', flapShadow:'#251628',
    body:'#3F2A4A', bodyDark:'#251628', bodyMid:'#523A60', bodyTint:'#75587E',
    inner:'#251628', paper:'#FFFFFF', accent:'#C0B6CC', ink:'#F0E6F2',
    petals:['#C0B6CC','#E0DAE6','#75587E','#F5F2F8','#523A60','#8E8298'],
    // 깊은 가지(eggplant) 보라와 어울리는 cool pearl/silver — 보라 위 부드러운 metallic 광택
    goldHighlight:'#F5F2F8', goldLight:'#E0DAE6', gold:'#C0B6CC', goldDeep:'#8E8298', goldShadow:'#5A4F66'
  },
  cobalt: {
    id: 'cobalt', label: 'Cobalt Cream',
    flap:'#3D5A9C', flapShadow:'#1F3878',
    body:'#2E4A8C', bodyDark:'#16306A', bodyMid:'#3D5A9C', bodyTint:'#5872B0',
    inner:'#FBF7EC', paper:'#FFFFFF', accent:'#E8DBB8', ink:'#FBF7EC',
    petals:['#FBF7EC','#F5EBD8','#5872B0','#FFFFFF','#3D5A9C','#DDD0B8'],
    // 진한 코발트와 어울리는 연한 크림 톤 — 깊은 블루 위 부드러운 ivory 콘트라스트
    goldHighlight:'#FFFFFF', goldLight:'#FBF8F0', gold:'#F5F0E2', goldDeep:'#DDD4BC', goldShadow:'#A89D80'
  },
};

export const COLOR_IDS: EnvelopeColorId[] = [
  'pearl','lavender','champagne','sage','blush','rose','powder','midnight','cobalt','aubergine','onyx'
];

// 구버전 색상 id → 신규 매핑 (저장된 카드 호환성)
const LEGACY_COLOR_ALIAS: Record<string, EnvelopeColorId> = {
  beige: 'champagne',
  mint: 'sage',
  coral: 'blush',
  lightblue: 'powder',
  blackgold: 'midnight'
};

export function resolveColorId(id: string | undefined | null): EnvelopeColorId {
  if (!id) return 'lavender';
  if (id in COLOR_PALETTES) return id as EnvelopeColorId;
  if (id in LEGACY_COLOR_ALIAS) return LEGACY_COLOR_ALIAS[id];
  return 'lavender';
}
