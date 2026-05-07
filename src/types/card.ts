export type EventType = 'wedding' | 'birthday' | 'opening' | 'baptism' | 'meeting' | 'etc';
export type ThemeId = 'hydrangea' | 'modern' | 'vintage' | 'minimal';
export type BackgroundId = 'bg-none' | 'bg-1' | 'bg-2' | 'bg-3' | 'bg-4' | 'bg-cream' | 'bg-img-1' | 'bg-img-2' | 'bg-img-3' | 'bg-img-4' | 'bg-img-6' | 'bg-img-7' | 'bg-img-8' | 'bg-img-9' | 'bg-img-10' | 'bg-img-11' | 'bg-img-12' | 'bg-img-13' | 'bg-img-14' | 'bg-img-15' | 'bg-img-16' | 'bg-img-17' | 'bg-img-18' | 'bg-img-19';
export type LayoutId = 'layout-classic' | 'layout-3' | 'layout-4' | 'layout-5' | 'layout-6' | 'layout-7' | 'layout-topcenter' | 'layout-rightbottom' | 'layout-center';
// envelope_anim: 기존 enum + 새 형식 'type:color' (예: 'sway:lavender', 'flip:beige')
export type EnvelopeAnimId =
  | 'envelope-1' | 'envelope-2' | 'envelope-3' | 'envelope-4' | 'envelope-5' | 'envelope-6' | 'none'
  | string; // 새 (type, color) 조합 — 'sway:lavender' 등
export type Plan = 'free' | 'paid';

export interface CardImage {
  id: string;
  card_id: string;
  url: string;
  position: number;
}

export interface BaseCard {
  id: string;
  slug: string;
  owner_token: string | null;
  event_type: EventType;
  title: string;
  theme: ThemeId;
  bg_id: BackgroundId;
  layout_id: LayoutId;
  envelope_anim: EnvelopeAnimId;
  custom_bg_url: string | null;
  font_family: string;
  body: string | null;
  event_date: string | null;
  event_place: string | null;
  map_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  extra_info: string | null;
  greeting_oneliner: string | null;
  /** 받는 분 인사말 템플릿. "$NAME"이 받는 사람 이름으로 치환됨 (예: "$NAME님" → "홍길동님") */
  recipient_template: string | null;
  /** 카드 상단 이벤트 라벨 override (예: "YOU'RE INVITED" 대신 사용자 지정 텍스트). null이면 event_type 기본값 사용 */
  event_label: string | null;
  rsvp_enabled: boolean;
  rsvp_deadline: string | null;
  rsvp_max_per_card: 1 | 2 | 3 | 4 | 5;
  rsvp_collect_names: boolean;
  rsvp_allow_oneliner: boolean;
  expiry_date: string | null;
  plan: Plan;
  created_at: string;
  updated_at: string;
}

export interface CardDraft extends Partial<BaseCard> {
  pendingImages?: { url: string; position: number }[];
  pendingBg?: string;
}

export interface Rsvp {
  id: string;
  card_id: string;
  recipient_id: string | null;
  attend: boolean;
  count: number;
  attendee_names: string[];
  oneliner: string | null;
  created_at: string;
}
