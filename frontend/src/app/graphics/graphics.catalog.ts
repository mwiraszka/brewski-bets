import {
  AnchorIconComponent,
  AwardIconComponent,
  BatteryIconComponent,
  BellIconComponent,
  BookIconComponent,
  BookmarkIconComponent,
  BotIconComponent,
  BottleIconComponent,
  BoxIconComponent,
  BrainIconComponent,
  BriefcaseIconComponent,
  CalendarIconComponent,
  CameraIconComponent,
  CandleIconComponent,
  ClipboardIconComponent,
  ClockIconComponent,
  CoffeeIconComponent,
  CoinsIconComponent,
  CompassIconComponent,
  CreditCardIconComponent,
  DiscIconComponent,
  FilmIconComponent,
  FingerprintIconComponent,
  FlagIconComponent,
  FlameIconComponent,
  FolderIconComponent,
  GaugeIconComponent,
  GiftIconComponent,
  GlobeIconComponent,
  HeadphonesIconComponent,
  HeartIconComponent,
  HomeIconComponent,
  type IconComponentType,
  InboxIconComponent,
  KeyIconComponent,
  LampIconComponent,
  LeafIconComponent,
  LockIconComponent,
  MailIconComponent,
  MapIconComponent,
  MonitorIconComponent,
  MoonIconComponent,
  MusicIconComponent,
  PackageIconComponent,
  PaperclipIconComponent,
  PenToolIconComponent,
  PhoneIconComponent,
  PrinterIconComponent,
  QrCodeIconComponent,
  RadioIconComponent,
  ReceiptIconComponent,
  RocketIconComponent,
  ScissorsIconComponent,
  ServerIconComponent,
  ShieldIconComponent,
  ShoppingCartIconComponent,
  SmartphoneIconComponent,
  SnowflakeIconComponent,
  SoccerBallIconComponent,
  SparklesIconComponent,
  StarIconComponent,
  SunIconComponent,
  TableIconComponent,
  TagIconComponent,
  TargetIconComponent,
  ThermometerIconComponent,
  ToolIconComponent,
  TrashIconComponent,
  TrophyIconComponent,
  UmbrellaIconComponent,
  WalletIconComponent,
  WandIconComponent,
} from '@eagami/ui';

export type GraphicKind = 'icon' | 'letter' | 'digit' | 'emoji' | 'flag';

export interface GraphicEntry {
  slug: string;
  kind: GraphicKind;
  label: string;
  tags: string[];
  colorable: boolean;
  // Set for `icon` graphics, rendered through *ngComponentOutlet.
  component?: IconComponentType;
  // Set for text-based graphics (letter, digit, emoji, flag).
  glyph?: string;
  // True for letters and digits, which render in the BB brand display font.
  brandFont?: boolean;
}

const CURATED_ICONS: IconComponentType[] = [
  AnchorIconComponent,
  AwardIconComponent,
  BatteryIconComponent,
  BellIconComponent,
  BookIconComponent,
  BookmarkIconComponent,
  BotIconComponent,
  BottleIconComponent,
  BoxIconComponent,
  BrainIconComponent,
  BriefcaseIconComponent,
  CalendarIconComponent,
  CameraIconComponent,
  CandleIconComponent,
  ClipboardIconComponent,
  ClockIconComponent,
  CoffeeIconComponent,
  CoinsIconComponent,
  CompassIconComponent,
  CreditCardIconComponent,
  DiscIconComponent,
  FilmIconComponent,
  FingerprintIconComponent,
  FlagIconComponent,
  FlameIconComponent,
  FolderIconComponent,
  GaugeIconComponent,
  GiftIconComponent,
  GlobeIconComponent,
  HeadphonesIconComponent,
  HeartIconComponent,
  HomeIconComponent,
  InboxIconComponent,
  KeyIconComponent,
  LampIconComponent,
  LeafIconComponent,
  LockIconComponent,
  MailIconComponent,
  MapIconComponent,
  MonitorIconComponent,
  MoonIconComponent,
  MusicIconComponent,
  PackageIconComponent,
  PaperclipIconComponent,
  PenToolIconComponent,
  PhoneIconComponent,
  PrinterIconComponent,
  QrCodeIconComponent,
  RadioIconComponent,
  ReceiptIconComponent,
  RocketIconComponent,
  ScissorsIconComponent,
  ServerIconComponent,
  ShieldIconComponent,
  ShoppingCartIconComponent,
  SmartphoneIconComponent,
  SnowflakeIconComponent,
  SoccerBallIconComponent,
  SparklesIconComponent,
  StarIconComponent,
  SunIconComponent,
  TableIconComponent,
  TagIconComponent,
  TargetIconComponent,
  ThermometerIconComponent,
  ToolIconComponent,
  TrashIconComponent,
  TrophyIconComponent,
  UmbrellaIconComponent,
  WalletIconComponent,
  WandIconComponent,
];

const LETTERS = 'ABCDEFGHIJKL'.split('');
const DIGITS = '0123456789'.split('');

// Named emojis available alongside icons. Emojis render in their native colours,
// so they are never tinted by the colour picker.
const EMOJIS: { name: string; glyph: string }[] = [
  { name: 'beer', glyph: '\u{1F37A}' },
  { name: 'cheers', glyph: '\u{1F37B}' },
  { name: 'champagne', glyph: '\u{1F942}' },
  { name: 'party', glyph: '\u{1F389}' },
  { name: 'trophy', glyph: '\u{1F3C6}' },
  { name: 'fire', glyph: '\u{1F525}' },
  { name: 'muscle', glyph: '\u{1F4AA}' },
  { name: 'moneybag', glyph: '\u{1F4B0}' },
  { name: 'cool', glyph: '\u{1F60E}' },
  { name: 'crying', glyph: '\u{1F62D}' },
  { name: 'thumbs-up', glyph: '\u{1F44D}' },
  { name: 'thumbs-down', glyph: '\u{1F44E}' },
  { name: 'heart', glyph: '❤️' },
  { name: 'target', glyph: '\u{1F3AF}' },
  { name: 'soccer', glyph: '⚽' },
  { name: 'dice', glyph: '\u{1F3B2}' },
];

// ISO 3166-1 alpha-2 codes. Names are resolved at runtime via Intl.DisplayNames
// and the flag glyph is composed from the code's regional indicator symbols, so
// no country names or flag emoji need to be hard-coded here.
const FLAG_CODES =
  'AD AE AF AG AI AL AM AO AR AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(
    ' ',
  );

function titleCaseSlug(slug: string): string {
  return slug
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function flagGlyph(code: string): string {
  const A = 0x1f1e6;
  return String.fromCodePoint(
    A + (code.charCodeAt(0) - 65),
    A + (code.charCodeAt(1) - 65),
  );
}

let regionNames: Intl.DisplayNames | null = null;
function countryName(code: string): string {
  if (regionNames === null) {
    try {
      regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    } catch {
      regionNames = null;
    }
  }
  return regionNames?.of(code) ?? code;
}

function buildCatalog(): GraphicEntry[] {
  const icons: GraphicEntry[] = CURATED_ICONS.map(component => ({
    slug: component.slug,
    kind: 'icon' as const,
    label: titleCaseSlug(component.slug),
    tags: [component.slug, ...component.tags],
    colorable: true,
    component,
  }));

  const letters: GraphicEntry[] = LETTERS.map(letter => ({
    slug: `letter-${letter.toLowerCase()}`,
    kind: 'letter' as const,
    label: `Letter ${letter}`,
    tags: ['letter', letter.toLowerCase()],
    colorable: true,
    glyph: letter,
    brandFont: true,
  }));

  const digits: GraphicEntry[] = DIGITS.map(digit => ({
    slug: `digit-${digit}`,
    kind: 'digit' as const,
    label: `Digit ${digit}`,
    tags: ['digit', 'number', digit],
    colorable: true,
    glyph: digit,
    brandFont: true,
  }));

  const emojis: GraphicEntry[] = EMOJIS.map(({ name, glyph }) => ({
    slug: `emoji-${name}`,
    kind: 'emoji' as const,
    label: titleCaseSlug(name),
    tags: ['emoji', ...name.split('-')],
    colorable: false,
    glyph,
  }));

  const flags: GraphicEntry[] = FLAG_CODES.map(code => {
    const name = countryName(code);
    return {
      slug: `flag-${code.toLowerCase()}`,
      kind: 'flag' as const,
      label: name,
      tags: ['flag', code.toLowerCase(), ...name.toLowerCase().split(/\s+/)],
      colorable: false,
      glyph: flagGlyph(code),
    };
  });

  return [...icons, ...letters, ...digits, ...emojis, ...flags];
}

export const GRAPHICS: GraphicEntry[] = buildCatalog();

const GRAPHICS_BY_SLUG = new Map(GRAPHICS.map(entry => [entry.slug, entry]));

export function graphicBySlug(slug: string | null | undefined): GraphicEntry | undefined {
  return slug ? GRAPHICS_BY_SLUG.get(slug) : undefined;
}

export function isColorableGraphic(slug: string | null | undefined): boolean {
  return graphicBySlug(slug)?.colorable ?? false;
}
