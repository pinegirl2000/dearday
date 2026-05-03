export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  publishedAt: string; // ISO date
  author: string;
  tags: string[];
  /** Markdown-style body. Rendered with simple formatter on the page. */
  body: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'digital-wedding-invitation-singapore-2026',
    title: 'How to send a digital wedding invitation in Singapore (2026 guide)',
    description: 'A practical guide to choosing, designing, and sending digital wedding invitations in Singapore — from etiquette to RSVP tracking.',
    publishedAt: '2026-05-03',
    author: 'DearDay team',
    tags: ['wedding', 'singapore', 'guide'],
    body: `
Planning a wedding in Singapore in 2026? Digital invitations have become the default — they're faster, eco-friendly, and they make RSVP tracking effortless. Here's everything you need to know.

## Why digital invitations are now the standard

Paper invitations are beautiful, but for most Singapore weddings the practical advantages of digital cards are too strong to ignore:

- **Instant delivery** — share via WhatsApp, email, or SMS in seconds
- **RSVP tracking** — see who's attending and how many guests they're bringing
- **Personalization** — each recipient can get a card with their own name
- **Cost-effective** — most digital tools are free or cost a fraction of printed cards
- **Eco-friendly** — no paper, no postage, no waste

## Etiquette: when to send

Send your digital wedding invitation **6 to 8 weeks** before the wedding date. For destination weddings or guests traveling from overseas, send 3 months ahead. A "Save the Date" can go out as early as 6 months in advance.

## What to include

A complete digital wedding invitation should have:

1. **Couple's names** — front and center
2. **Date and time** — full date with day of week (e.g., May 2, 2026 (SAT) at 11:00 AM)
3. **Venue** — full address with map link
4. **Dress code** — formal, smart casual, themed?
5. **RSVP method** — link with deadline
6. **Special notes** — parking, no children, gift preferences

## Designing your card

For Singapore weddings, three styles tend to work well:

- **Classic Lavender** — soft purple, hydrangea-themed, traditional and elegant
- **Beige Pearl** — warm cream tones with gold accents, ideal for daytime ceremonies
- **Mint or Coral** — fresh, modern, perfect for garden or beach weddings

Whatever style you choose, keep the typography clean and the message warm.

## Managing RSVPs

This is where digital really shines. With a tool like DearDay, you can:

- Generate a unique link for each guest (e.g., \`/i/your-card/001\`)
- Pre-fill the recipient's name on the envelope
- Collect not just yes/no but exact attendee counts and names
- See live statistics — attending, declined, and no-response

Set your RSVP deadline 2 weeks before the wedding. Send a gentle reminder to non-responders one week before.

## Common mistakes to avoid

- **Vague timing** — "around 11" leaves guests uncertain. Always specify exact times.
- **Single shared link** — sending the same link to everyone makes it hard to track responses. Use personalized links.
- **No reminder** — busy guests often forget. A polite reminder 7 days before deadline doubles your response rate.
- **Forgetting the map** — even locals appreciate a one-tap navigation link.

## Final thoughts

A wedding invitation is the first impression of your big day. Digital doesn't mean impersonal — when designed thoughtfully, a digital invitation can feel just as warm as paper, with the added bonus of being practical. Take an hour to do it right, and you'll save many hours later in chasing RSVPs.

Ready to create yours? [Start a free invitation](/cards/new) and explore the templates.
`.trim()
  },
  {
    slug: 'rsvp-etiquette-when-to-reply',
    title: 'RSVP etiquette: when to reply, what to write',
    description: 'A short guide to RSVP etiquette — when to respond, how to phrase your reply, and what to do when plans change.',
    publishedAt: '2026-05-03',
    author: 'DearDay team',
    tags: ['rsvp', 'etiquette', 'guide'],
    body: `
RSVP comes from the French *Répondez s'il vous plaît* — "please respond." Whether you're attending a wedding, birthday party, or formal gathering, how you reply says a lot about you.

## The golden rule: respond promptly

The single most important rule of RSVP etiquette: **reply by the deadline, even if you're unsure.** Hosts need to plan catering, seating, and budget. A late or no response is harder than a polite decline.

If the invitation says "RSVP by August 1st," respond by July 31st at the latest. If you genuinely don't know yet, send a brief note: "Thank you so much for the invitation. I'm waiting on a few things and will confirm by [date]."

## How fast is fast enough?

- **Within 1–3 days** for casual gatherings (dinner, birthday party)
- **Within a week** for formal events (weddings, anniversaries)
- **Always before the deadline** the host specifies

## What to write in your reply

If you're attending:

> "Thank you so much for the invitation! I'd be delighted to attend. Looking forward to celebrating with you."

If you're declining:

> "Thank you for thinking of me. Unfortunately I won't be able to make it on [date], but I'm wishing you a wonderful day."

If you're attending with a +1:

> "Thank you for the invitation! [Partner's name] and I would love to attend."

Avoid asking about details that aren't your business — guest list, menu, dress code. If something is unclear (e.g., "Can I bring my child?"), ask discreetly with a single question.

## Special situations

**You're invited but your partner isn't.** This is intentional. Don't ask to bring them.

**You're invited but can't bring your kids.** Many hosts now specify "adults only." Respect it.

**You said yes but plans changed.** Tell the host as soon as you know — ideally a week or more before. A genuine apology and a small gesture (a card, flowers) goes a long way.

**You forgot to reply.** Reach out anyway, with a sincere apology. Don't just show up without responding.

## Digital RSVPs

When the invitation comes via a digital card with an RSVP link, the same etiquette applies. The link makes it easier — usually one tap for "Attending" or "Declining" and a few seconds to fill in attendee count.

If you have a meaningful message, most digital RSVP forms have a "leave a note" field. Keep it warm but brief:

> "Wishing you both all the happiness in the world. Can't wait to celebrate!"

## What hosts appreciate

- **Specifying exact attendee count.** "Two attending" is much more useful than "Yes."
- **Replying once and not changing.** Last-minute changes affect catering numbers.
- **Following dietary or dress instructions.** If the host asks, they need it.
- **Saying thank you.** Even a one-line note means a lot.

## Final thought

RSVP isn't just a formality. It's a small act of consideration that helps the host feel respected and prepared. When you reply with care, you've already started celebrating with them.
`.trim()
  },
  {
    slug: 'free-wedding-invitation-wording-examples',
    title: '5 free wedding invitation wording examples',
    description: 'Five ready-to-use wedding invitation wording examples — from traditional to modern, casual to elegant.',
    publishedAt: '2026-05-03',
    author: 'DearDay team',
    tags: ['wedding', 'wording', 'templates'],
    body: `
Stuck on what to write on your wedding invitation? Here are five tested wording examples you can use as-is or adapt to your style. All are free to use — copy, edit, send.

## 1. Traditional & formal

> Together with our families,
> [Bride's full name]
> and
> [Groom's full name]
> request the honour of your presence
> at the celebration of their marriage
> on [date] at [time]
> [Venue name]
> [City]
>
> Reception to follow.

Best for: traditional ceremonies, religious weddings, formal venues.

## 2. Warm & personal

> Two hearts. One promise.
>
> [Bride] & [Groom]
> are getting married
> and would love your blessing.
>
> [Date] · [Time]
> [Venue]
>
> Please RSVP by [deadline].

Best for: most modern weddings, friend-and-family-focused gatherings.

## 3. Modern & minimal

> [Bride] & [Groom]
> [Date]
> [Venue]
>
> You're invited.

Best for: clean design lovers, civil ceremonies, intimate weddings.

## 4. Light-hearted & casual

> Save the date! [Bride] said yes, and we're throwing a party.
>
> Join us as we say "I do" and then dance till our feet hurt.
>
> [Date] · [Time]
> [Venue]
>
> Come hungry, leave happy.

Best for: casual outdoor weddings, second weddings, garden parties.

## 5. Religious / spiritual

> Through God's grace, we have found each other.
>
> [Bride] & [Groom]
> joyfully invite you to share in the blessing
> of their marriage ceremony
>
> [Date] · [Time]
> [Church / Venue]
>
> Reception immediately following.

Best for: church weddings, religious families.

## How to personalize

Add small details that tell your story:

- **A meaningful quote** (a song lyric, a verse, a shared joke)
- **The story of how you met** ("Five years after that train ride...")
- **Specific dress code** ("Garden cocktail attire — light colors encouraged")
- **A handwritten-style font** for your names

## What to avoid

- **Overloading with information.** Keep the main card short. Put logistics (parking, accommodation) on a separate page or in the digital invitation's "More info" section.
- **Inside jokes that exclude.** Save those for the speech.
- **Misspelled names.** Triple-check everyone, including your own families.

## Digital invitation note

If you're sending a digital invitation, you have flexibility — you can include a one-line subtitle ("Save the Date") plus a longer body message, plus a separate RSVP form. Use the structure to your advantage instead of cramming everything onto one screen.

Ready to create yours? [Start a free invitation](/cards/new).
`.trim()
  },
  {
    slug: 'korean-wedding-invitation-wording-best-10',
    title: '한국 결혼식 청첩장 문구 베스트 10',
    description: '한국 결혼식 청첩장에 자주 쓰이는 따뜻하고 우아한 문구 10가지 — 전통적인 표현부터 모던한 감성까지.',
    publishedAt: '2026-05-03',
    author: 'DearDay 팀',
    tags: ['wedding', 'korean', 'templates'],
    body: `
청첩장 문구 하나에도 마음이 담깁니다. 한국 결혼식에 어울리는 청첩장 문구 10가지를 정리했습니다. 그대로 쓰셔도 좋고, 두 분의 이야기를 담아 살짝 다듬으셔도 좋습니다.

## 1. 클래식 정중

> 같은 곳을 바라보며 걸어온 두 사람이
> 이제 한 길을 함께 걷고자 합니다.
> 귀한 발걸음으로 축복해 주시면
> 더없는 기쁨이 되겠습니다.

## 2. 따뜻한 감성

> 사랑으로 함께한 시간이 모여
> 평생을 약속하는 자리에 서고자 합니다.
> 두 사람의 시작을 따뜻한 마음으로
> 지켜봐 주시면 감사하겠습니다.

## 3. 모던 미니멀

> 저희 두 사람,
> 함께하는 첫걸음에
> 당신을 초대합니다.

## 4. 인용구 활용

> "사랑은 두 사람이 마주 보는 것이 아니라
> 같은 곳을 바라보는 것이다." — 생텍쥐페리
>
> 같은 곳을 바라보기로 약속한 두 사람이
> 이제 함께 걸어가려 합니다.

## 5. 짧고 강렬

> 두 사람이 하나가 되는 날.
> 함께해 주세요.

## 6. 가족 중심

> 저희 두 사람이
> 한 가정을 이루는 자리에
> 가까운 분들을 모시고 인사드립니다.

## 7. 봄·여름 결혼식

> 꽃 피는 계절,
> 두 사람이 새로운 봄을 맞이합니다.
> 따뜻한 햇살 같은 마음으로
> 자리를 빛내 주시면 감사하겠습니다.

## 8. 가을·겨울 결혼식

> 마음을 다해 준비한 자리에
> 귀한 발걸음 부탁드립니다.
> 두 사람의 약속이
> 오래도록 기억될 수 있도록
> 따뜻한 마음을 함께해 주세요.

## 9. 친근한 톤

> 안녕하세요. 저희 두 사람이 결혼합니다.
> 가까운 분들을 모시고
> 작은 결혼식을 올리려 합니다.
> 함께해 주시면 정말 감사하겠습니다.

## 10. 짧은 인사 + 본문 분리

> **앞면**: ○○○ ♥ ○○○ · 결혼합니다
>
> **본문**:
> 평생을 함께할 한 사람을 만났습니다.
> 두 사람의 약속에 귀한 시간을 내어 주시면
> 감사한 마음으로 모시겠습니다.

## 디지털 청첩장 활용 팁

종이 청첩장과 달리 디지털 청첩장은 다음 요소를 따로 둘 수 있어 더 자연스럽습니다:

- **부제 (Subtitle)**: "Save the Date" 같은 짧은 문구
- **메인 타이틀**: 신랑 ♥ 신부 이름
- **본문 메시지**: 위 10가지 중 하나
- **일시 / 장소 / 연락처**: 별도 카드로 정리
- **RSVP 링크**: 참석 여부 확인용

각 영역을 분리하면 짧고 우아한 메인과, 충분히 따뜻한 본문이 양립할 수 있습니다.

## 마무리

문구가 길든 짧든, 핵심은 **두 사람의 진심이 느껴지는지**입니다. 위 예시를 그대로 쓰셔도 좋고, 두 분만의 이야기를 한 줄 더하셔도 좋습니다.

[지금 무료로 청첩장 만들기](/cards/new)
`.trim()
  },
  {
    slug: 'birthday-party-invitation-ideas',
    title: 'Birthday party invitation ideas for adults & kids',
    description: 'Birthday invitation ideas, wording examples, and design tips — for milestone birthdays, kids parties, and casual gatherings.',
    publishedAt: '2026-05-03',
    author: 'DearDay team',
    tags: ['birthday', 'invitation', 'ideas'],
    body: `
Birthdays are the most personal of celebrations. Whether you're throwing a sweet sixteen, a fortieth, a first-birthday for your child, or a casual dinner with friends, the invitation sets the tone. Here's how to get it right.

## Adult birthday wording examples

### Casual & fun

> Cheers to [Age] years!
>
> Join us for a night of drinks, dancing, and celebration in honor of [Name].
>
> [Date] · [Time]
> [Venue]
>
> No gifts, please. Your presence is the only present we need!

### Milestone (40, 50, 60+)

> Half a century of [Name] — let's celebrate it right.
>
> Saturday, [Date]
> Cocktails at 7, dinner at 8
> [Venue]
>
> Dress code: smart casual.

### Intimate gathering

> A small dinner for [Name]'s [Age]rd birthday.
>
> [Date] · [Time]
> [Restaurant / Home address]
>
> RSVP appreciated by [Date].

### Surprise party

> Shhh — it's a surprise!
>
> We're throwing [Name] a surprise birthday party.
> Please arrive by [time] sharp. The birthday person arrives at [later time].
>
> [Venue]
>
> Don't tell [Name]!

## Kids' birthday party wording

### Toddler / first birthday

> Our little one is turning ONE!
>
> Come celebrate [Name]'s first birthday with cake, balloons, and lots of giggles.
>
> [Date] · [Time]
> [Venue / Home]
>
> Please RSVP by [Date] so we can prepare.

### Themed party (5–10 years)

> [Name] is turning [Age]!
> Join us for a [Theme — e.g., dinosaur / princess / superhero] adventure.
>
> [Date] · [Time]
> [Venue]
>
> Please come dressed up — the wilder the better!

### Teenagers

> Sweet sixteen!
>
> [Name] would love your company on their birthday.
>
> [Date] · [Time]
> [Venue]
>
> Music, food, photo booth. Come ready to dance.

## Tips for a great birthday invitation

### 1. Match the tone to the celebration

A first-birthday invitation should feel sweet and joyful. A 50th can be elegant or cheeky. A teenage birthday can be vibrant. Pick design and wording that match the mood.

### 2. Be clear about logistics

Always include:
- **Date and time** (start and ideally end time)
- **Venue with address** and map link
- **Dress code** if relevant
- **Gift preferences** ("no gifts" / "books only" / "donations to X charity")
- **Dietary or allergy notes** (especially for kids' parties)

### 3. Make it easy to RSVP

A digital invitation with a one-tap RSVP link gives you accurate guest counts. For kids' parties especially, knowing exactly how many children are coming helps with food, party favors, and seating.

### 4. Personalize the recipient name

Modern digital invitations can pre-fill each recipient's name on the envelope (e.g., "Dear Sarah"). It's a small detail that makes the invitation feel warm and personal.

### 5. Set an RSVP deadline

For most parties, **two weeks before** is standard. For kids' parties with tight catering, ten days. Set a gentle reminder one week before.

## Common mistakes

- **Vague start time.** "From 6" is OK; "around 6" leaves guests confused. Be specific.
- **Forgetting end time.** Especially important for kids' parties — parents need to plan pickup.
- **No map link.** Even close friends appreciate one tap to navigate.
- **Too many decorations on the invitation itself.** Keep the design clean; let the venue and event speak for themselves.

## Going digital

Digital birthday invitations are now the default for most adult parties. They're shareable, trackable, and free. Some specific advantages:

- Send via WhatsApp/Telegram with one link
- See attendance live as guests respond
- Easily resend or remind non-responders
- Save the design as a memory of the year

Ready to create yours? [Start a free birthday invitation](/cards/new) — pick a template, customize, send.
`.trim()
  }
];

export function getAllPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
