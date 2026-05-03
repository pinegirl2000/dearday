import type { EventType, BackgroundId } from '@/types/card';

export interface EventTypeMeta {
  id: EventType;
  emoji: string;
  label: string;
  defaultTitle: string;
  recommendTheme: string;
  recommendEnvelope: string;
  recommendBackgrounds: BackgroundId[];
  fields: {
    titleLabel: string;
    titlePlaceholder: string;
    subtitlePlaceholder: string;
    placePlaceholder: string;
    bodyPlaceholder: string;
    memoPlaceholder: string;
  };
}

export const EVENT_TYPES: EventTypeMeta[] = [
  {
    id: 'wedding',
    emoji: '💒',
    label: 'Wedding',
    defaultTitle: '○○ ♥ ○○',
    recommendTheme: 'hydrangea',
    recommendEnvelope: 'envelope-1',
    recommendBackgrounds: ['bg-2', 'bg-3', 'bg-4', 'bg-1', 'bg-none'],
    fields: {
      titleLabel: 'Main title',
      titlePlaceholder: 'e.g. Together with our families, we invite you to celebrate our union.',
      subtitlePlaceholder: 'e.g. The Wedding of [Name] & [Name]',
      placePlaceholder: 'e.g. The Grand Ballroom at St. Regis, 2 East 55th St, New York, NY',
      bodyPlaceholder: 'e.g. Together with our families, we invite you to celebrate our union.',
      memoPlaceholder: 'e.g. Kindly RSVP by August 1st. Formal attire requested.'
    }
  },
  {
    id: 'birthday',
    emoji: '🎂',
    label: 'Birthday',
    defaultTitle: '○○ Birthday',
    recommendTheme: 'modern',
    recommendEnvelope: 'envelope-1',
    recommendBackgrounds: ['bg-1', 'bg-2', 'bg-none', 'bg-3', 'bg-4'],
    fields: {
      titleLabel: 'Main title',
      titlePlaceholder: 'e.g. Join us for a night of drinks, dancing, and celebration in honor of [Name].',
      subtitlePlaceholder: 'e.g. Cheers to [Age] Years!',
      placePlaceholder: 'e.g. Skyline Rooftop Lounge, 123 Sunset Blvd, Los Angeles, CA',
      bodyPlaceholder: 'e.g. Join us for a night of drinks, dancing, and celebration in honor of [Name].',
      memoPlaceholder: 'e.g. No gifts, please. Your presence is the only present we need!'
    }
  },
  {
    id: 'opening',
    emoji: '🎉',
    label: 'Opening',
    defaultTitle: 'Grand Opening',
    recommendTheme: 'modern',
    recommendEnvelope: 'envelope-1',
    recommendBackgrounds: ['bg-4', 'bg-none', 'bg-1', 'bg-3', 'bg-2'],
    fields: {
      titleLabel: 'Main title',
      titlePlaceholder: 'e.g. We\'re opening our doors! Come see our new space and enjoy some light refreshments.',
      subtitlePlaceholder: 'e.g. Grand Opening Celebration',
      placePlaceholder: 'e.g. [Business Name], 456 Innovation Way, Suite 200, Austin, TX',
      bodyPlaceholder: 'e.g. We\'re opening our doors! Come see our new space and enjoy some light refreshments.',
      memoPlaceholder: 'e.g. Ribbon cutting ceremony starts promptly at 10:00 AM.'
    }
  },
  {
    id: 'baptism',
    emoji: '🕊️',
    label: 'Baptism',
    defaultTitle: 'Holy Baptism',
    recommendTheme: 'hydrangea',
    recommendEnvelope: 'envelope-2',
    recommendBackgrounds: ['bg-none', 'bg-3', 'bg-1', 'bg-4', 'bg-2'],
    fields: {
      titleLabel: 'Main title',
      titlePlaceholder: 'e.g. Please join us as our child is welcomed into the faith.',
      subtitlePlaceholder: 'e.g. The Holy Baptism of [Name]',
      placePlaceholder: 'e.g. Grace Community Church, 789 Maple Avenue, Chicago, IL',
      bodyPlaceholder: 'e.g. Please join us as our child is welcomed into the faith.',
      memoPlaceholder: 'e.g. A small luncheon will follow the ceremony at the family residence.'
    }
  },
  {
    id: 'meeting',
    emoji: '🤝',
    label: 'Gathering',
    defaultTitle: 'Gathering',
    recommendTheme: 'minimal',
    recommendEnvelope: 'envelope-2',
    recommendBackgrounds: ['bg-none', 'bg-1', 'bg-2', 'bg-3', 'bg-4'],
    fields: {
      titleLabel: 'Main title',
      titlePlaceholder: 'e.g. You\'re invited to a backyard BBQ to kick off the summer season!',
      subtitlePlaceholder: 'e.g. Eat, Drink, and Be Merry',
      placePlaceholder: 'e.g. The Miller Residence, 321 Oak Drive, Miami, FL',
      bodyPlaceholder: 'e.g. You\'re invited to a backyard BBQ to kick off the summer season!',
      memoPlaceholder: 'e.g. Please let us know if you have any dietary restrictions (Vegan/GF).'
    }
  },
  {
    id: 'etc',
    emoji: '✉️',
    label: 'Other',
    defaultTitle: 'Invitation',
    recommendTheme: 'minimal',
    recommendEnvelope: 'envelope-1',
    recommendBackgrounds: ['bg-none', 'bg-1', 'bg-2', 'bg-3', 'bg-4'],
    fields: {
      titleLabel: 'Main title',
      titlePlaceholder: 'e.g. We\'re getting together and would love to see you there.',
      subtitlePlaceholder: 'e.g. Save the Date',
      placePlaceholder: 'e.g. Central Park North Meadow (Entrance at 102nd St), New York, NY',
      bodyPlaceholder: 'e.g. We\'re getting together and would love to see you there.',
      memoPlaceholder: "e.g. Dress comfortably and don't forget to bring your sunglasses!"
    }
  }
];

export function getEventTypeMeta(id: EventType): EventTypeMeta {
  return EVENT_TYPES.find((e) => e.id === id) || EVENT_TYPES[5];
}
