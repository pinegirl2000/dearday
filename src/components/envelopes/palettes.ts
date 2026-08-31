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
  | 'onyx'
  | 'ivory';

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
    goldHighlight:'#FFFFFF', goldLight:'#FBF8F0', gold:'#F5F0E2', goldDeep:'#DDD4BC', goldShadow:'#A89D80'
  },
  lavender: {
    id: 'lavender', label: 'Lavender Cream',
    flap:'#D2B8E5', flapShadow:'#B89AD2',
    body:'#C8B0E2', bodyDark:'#9C82BE', bodyMid:'#D2B8E5', bodyTint:'#E8DCF3',
    inner:'#F8F6FB', paper:'#FFFFFF', accent:'#F5EBD8', ink:'#5A3D7A',
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
    id: 'blush', label: 'Blush Cream',
    flap:'#EDB5A4', flapShadow:'#B5806F',
    body:'#F2C0B3', bodyDark:'#C48E80', bodyMid:'#F5C8B8', bodyTint:'#FAD9CE',
    inner:'#FBF3EE', paper:'#FFFFFF', accent:'#F5EBD8', ink:'#7A4F2E',
    petals:['#FBC4B0','#FDD0BF','#FFDDD0','#F5EBD8','#FFE7DE','#FFF1EB'],
    goldHighlight:'#FFFFFF', goldLight:'#FBF3E8', gold:'#F5EBD8', goldDeep:'#D8C8A8', goldShadow:'#A89880'
  },
  rose: {
    id: 'rose', label: 'Rose Petal',
    flap:'#F0BAC8', flapShadow:'#D993A5',
    body:'#F4C5D2', bodyDark:'#C982A0', bodyMid:'#F0BAC8', bodyTint:'#FAD8E1',
    inner:'#FFF6F8', paper:'#FFFFFF', accent:'#C97796', ink:'#8B6075',
    petals:['#FAD8E1','#F4C5D2','#F0BAC8','#E5A5BA','#FFE4EC','#FFCCD8'],
    // 핑크와 어울리는 밝은 크림 톤 — 거의 흰색에 가까운 ivory cream
    goldHighlight:'#FFFCF6', goldLight:'#FBF6EC', gold:'#F5EBD8', goldDeep:'#DDD0B8', goldShadow:'#A89880'
  },
  powder: {
    id: 'powder', label: 'Powder Pink',
    flap:'#A8C3D8', flapShadow:'#7592A8',
    body:'#BFD7EA', bodyDark:'#88A4BA', bodyMid:'#CADCE9', bodyTint:'#DDE9F2',
    inner:'#FBF0F4', paper:'#FFFFFF', accent:'#F5C8D2', ink:'#9C4E62',
    petals:['#F5C8D2','#FBE0E8','#A8C8E0','#FFFFFF','#E5EFF7','#F0B5C2'],
    goldHighlight:'#FFFFFF', goldLight:'#FBE0E8', gold:'#F5C8D2', goldDeep:'#C898A4', goldShadow:'#8E6A74'
  },
  midnight: {
    id: 'midnight', label: 'Midnight Gold',
    flap:'#384858', flapShadow:'#0E1822',
    body:'#2D3D50', bodyDark:'#16202C', bodyMid:'#3D4E62', bodyTint:'#5A6B7E',
    inner:'#1F2E40', paper:'#FFFFFF', accent:'#F0CB58', ink:'#F5EDD2',
    petals:['#F0CB58','#F8E08A','#D4AF37','#FFFFFF','#1A1A1A','#9E7E1F'],
    ...goldFoil
  },
  onyx: {
    id: 'onyx', label: 'Tiffany Cream',
    flap:'#B8E2DE', flapShadow:'#88C5C0',
    body:'#A8DDD9', bodyDark:'#7FBEB9', bodyMid:'#B8E2DE', bodyTint:'#D2EEEC',
    inner:'#F0FAF9', paper:'#FFFFFF', accent:'#F5EBD8', ink:'#3A6C68',
    petals:['#F5EBD8','#FFFFFF','#FBF3E8','#D2EEEC','#B8E2DE','#A8DDD9'],
    // 파스텔 티파니 블루 + 크림 — 부드럽고 우아한 페어
    goldHighlight:'#FFFFFF', goldLight:'#FBF3E8', gold:'#F5EBD8', goldDeep:'#D9CCB0', goldShadow:'#A89E84'
  },
  aubergine: {
    id: 'aubergine', label: 'Aubergine HotPink',
    flap:'#523A60', flapShadow:'#251628',
    body:'#3F2A4A', bodyDark:'#251628', bodyMid:'#523A60', bodyTint:'#75587E',
    inner:'#251628', paper:'#FFFFFF', accent:'#FF9CC9', ink:'#FFCFE3',
    petals:['#FF9CC9','#FFB8DA','#75587E','#FFCFE3','#523A60','#FF85BD'],
    // 깊은 aubergine 위 연한 hot pink — 부드러우면서 임팩트 있는 콘트라스트
    goldHighlight:'#FFCFE3', goldLight:'#FFB8DA', gold:'#FF9CC9', goldDeep:'#D47AA8', goldShadow:'#A0588A'
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
  ivory: {
    id: 'ivory', label: 'Ivory White',
    flap:'#FBF6E8', flapShadow:'#E5DCC4',
    body:'#F8F1DE', bodyDark:'#D9CFB4', bodyMid:'#FBF6E8', bodyTint:'#FFFCF2',
    inner:'#FFFCF2', paper:'#FFFFFF', accent:'#F5C2D0', ink:'#A85572',
    petals:['#FBF6E8','#F8F1DE','#FBE0E8','#FFFCF2','#F5C2D0','#FFFFFF'],
    // 아이보리 화이트 + 파스텔 핑크 — 부드럽고 사랑스러운 페어
    goldHighlight:'#FFFFFF', goldLight:'#FBE0E8', gold:'#F5C2D0', goldDeep:'#C28DA0', goldShadow:'#8A5870'
  },
};

export const COLOR_IDS: EnvelopeColorId[] = [
  'ivory','pearl','lavender','champagne','sage','blush','rose','powder','midnight','cobalt','aubergine','onyx'
];

// 구버전 색상 id → 신규 매핑 (저장된 카드 호환성)
const LEGACY_COLOR_ALIAS: Record<string, EnvelopeColorId> = {
  beige: 'champagne',
  mint: 'sage',
  coral: 'blush',
  lightblue: 'powder',
  blackgold: 'midnight',
  gold: 'pearl'
};

export function resolveColorId(id: string | undefined | null): EnvelopeColorId {
  if (!id) return 'lavender';
  if (id in COLOR_PALETTES) return id as EnvelopeColorId;
  if (id in LEGACY_COLOR_ALIAS) return LEGACY_COLOR_ALIAS[id];
  return 'lavender';
}
