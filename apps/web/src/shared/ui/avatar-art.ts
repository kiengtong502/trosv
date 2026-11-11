/*
  Hand-drawn avatar art: 12 critters and things. Each one is a small SVG
  (viewBox 100) built from the same pieces as the site's illustrations: a
  thick ink outline, flat earthy fills and a gentle displacement wobble.
  The strings are static and written here, never built from user input, so
  the Avatar component can inject them as markup.
*/

export const AVATAR_KEYS = [
  "cat",
  "plant",
  "house",
  "book",
  "coffee",
  "moon",
  "robot",
  "cloud",
  "sun",
  "backpack",
  "headphones",
  "mushroom",
] as const;

export type AvatarKey = (typeof AVATAR_KEYS)[number];

export const AVATAR_NAMES: Record<AvatarKey, string> = {
  cat: "Mèo",
  plant: "Cây xanh",
  house: "Ngôi nhà",
  book: "Sách",
  coffee: "Cà phê",
  moon: "Trăng",
  robot: "Rô-bốt",
  cloud: "Mây",
  sun: "Mặt trời",
  backpack: "Ba lô",
  headphones: "Tai nghe",
  mushroom: "Nấm",
};

export function isAvatarKey(value: unknown): value is AvatarKey {
  return typeof value === "string" && (AVATAR_KEYS as readonly string[]).includes(value);
}

const INK = "#17171C";
const PAPER = "#FAF8F5";
const PURPLE = "#8B8BE0";
const OLIVE = "#7A9160";
const YEL = "#FFD23F";
const CREAM = "#E8DABB";
const TERRA = "#DC7856";
const TAN = "#D4A27F";

const st = (w = 3): string =>
  `stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const P = (d: string, fill: string, w = 3): string =>
  `<path d="${d}" fill="${fill}" ${w ? st(w) : ""}/>`;
const C = (cx: number, cy: number, r: number, fill: string, w = 3): string =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${w ? st(w) : ""}/>`;
const R = (x: number, y: number, w: number, h: number, rx: number, fill: string, sw = 3): string =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${sw ? st(sw) : ""}/>`;
const L = (d: string, w = 2.6, c = INK): string =>
  `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const eyes = (y = 47, dx = 7, r = 2.5): string =>
  C(50 - dx, y, r, INK, 0) + C(50 + dx, y, r, INK, 0);
const smile = (y = 55, w = 6): string => L(`M${50 - w} ${y} Q50 ${y + 5} ${50 + w} ${y}`, 2.4);
const cheeks = (y = 52, dx = 13): string =>
  C(50 - dx, y, 3, TERRA, 0).replace("/>", ' opacity=".6"/>') +
  C(50 + dx, y, 3, TERRA, 0).replace("/>", ' opacity=".6"/>');

/*
  The wobble filter needs an explicit user-space region: the default
  bounding-box region clips thick strokes at the edge of a shape.
*/
function wrap(key: string, bg: string, inner: string): string {
  return (
    `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    `<defs>` +
    `<clipPath id="av-clip-${key}"><circle cx="50" cy="50" r="47"/></clipPath>` +
    `<filter id="av-rough-${key}" filterUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G"/>` +
    `</filter></defs>` +
    `<circle cx="50" cy="50" r="47" fill="${bg}"/>` +
    `<g clip-path="url(#av-clip-${key})" filter="url(#av-rough-${key})">${inner}</g>` +
    `<circle cx="50" cy="50" r="47" fill="none" ${st(3.5)} filter="url(#av-rough-${key})"/></svg>`
  );
}

export const AVATAR_SVG: Record<AvatarKey, string> = {
  cat: wrap(
    "cat",
    CREAM,
    P("M30 44 L31 18 L47 32Z", TAN) +
      P("M70 44 L69 18 L53 32Z", TAN) +
      P("M33 38 L34 26 L42 33Z", TERRA, 0) +
      P("M67 38 L66 26 L58 33Z", TERRA, 0) +
      `<ellipse cx="50" cy="57" rx="25" ry="21" fill="${TAN}" ${st()}/>` +
      L("M44 38 V43 M50 36 V42 M56 38 V43", 2.4) +
      eyes(55, 9) +
      P("M47.5 60 H52.5 L50 63.5Z", TERRA, 2) +
      L("M50 63.5 Q46 68 42 65 M50 63.5 Q54 68 58 65", 2.2) +
      L("M22 58 H34 M22 64 L34 62 M78 58 H66 M78 64 L66 62", 2),
  ),
  plant: wrap(
    "plant",
    YEL,
    L("M50 64 V36", 3) +
      `<ellipse cx="50" cy="32" rx="7" ry="17" fill="${OLIVE}" ${st()}/><ellipse cx="34" cy="44" rx="6.5" ry="15" transform="rotate(-40 34 44)" fill="${OLIVE}" ${st()}/><ellipse cx="66" cy="44" rx="6.5" ry="15" transform="rotate(40 66 44)" fill="${OLIVE}" ${st()}/>` +
      P("M33 68 H67 L62 91 H38Z", TERRA) +
      R(30, 62, 40, 9, 3, TERRA) +
      C(44, 78, 2.3, INK, 0) +
      C(56, 78, 2.3, INK, 0) +
      L("M46 83 Q50 86.5 54 83", 2.2),
  ),
  house: wrap(
    "house",
    PURPLE,
    R(63, 26, 8, 16, 1, TERRA, 2.6) +
      R(28, 48, 44, 35, 2, CREAM) +
      P("M21 50 L50 22 L79 50Z", TERRA) +
      R(44, 62, 12, 21, 2, PURPLE) +
      C(53, 73, 1.4, INK, 0) +
      R(32, 56, 9, 9, 1.5, YEL, 2.4) +
      R(59, 56, 9, 9, 1.5, YEL, 2.4),
  ),
  book: wrap(
    "book",
    OLIVE,
    L("M50 30 V18", 3) +
      `<ellipse cx="45" cy="15" rx="5" ry="8" transform="rotate(-30 45 15)" fill="${YEL}" ${st(2.6)}/><ellipse cx="56" cy="17" rx="5" ry="8" transform="rotate(30 56 17)" fill="${YEL}" ${st(2.6)}/>` +
      R(30, 30, 40, 52, 4, PURPLE) +
      L("M37 30 V82", 2.6) +
      R(41, 38, 24, 12, 2.5, CREAM, 2.6) +
      eyes(63, 6) +
      smile(70, 5),
  ),
  coffee: wrap(
    "coffee",
    TERRA,
    L("M42 30 C38 26 46 24 42 18 M52 32 C48 28 56 26 52 20 M62 30 C58 26 66 24 62 18", 2.4, PAPER) +
      `<ellipse cx="50" cy="86" rx="28" ry="5" fill="${CREAM}" ${st(2.6)}/>` +
      L("M70 50 C84 50 84 70 70 70", 3) +
      P("M29 44 H71 V66 C71 78 62 85 50 85 C38 85 29 78 29 66Z", PAPER) +
      `<ellipse cx="50" cy="44" rx="21" ry="5.5" fill="#8a5a3c" ${st(2.6)}/>` +
      eyes(63, 7) +
      smile(70, 5.5) +
      cheeks(68, 13),
  ),
  moon: wrap(
    "moon",
    PURPLE,
    P("M62 20 A31 31 0 1 0 77 70 A24 24 0 1 1 62 20Z", YEL) +
      C(38, 50, 2.4, INK, 0) +
      L("M33 59 Q38 64.5 44 59", 2.4) +
      C(31, 56.5, 3, TERRA, 0).replace("/>", ' opacity=".6"/>') +
      P("M74 34 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2Z", PAPER, 2) +
      P("M30 24 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5Z", PAPER, 2),
  ),
  robot: wrap(
    "robot",
    CREAM,
    L("M50 34 V24", 3) +
      C(50, 21, 4.5, YEL) +
      R(20, 48, 8, 16, 3, TERRA, 2.8) +
      R(72, 48, 8, 16, 3, TERRA, 2.8) +
      R(28, 34, 44, 40, 11, PURPLE) +
      R(34, 42, 32, 22, 7, PAPER, 2.8) +
      eyes(52, 7) +
      smile(58.5, 5) +
      C(40, 82, 3.2, YEL, 2.4) +
      C(50, 82, 3.2, TERRA, 2.4) +
      C(60, 82, 3.2, OLIVE, 2.4),
  ),
  cloud: wrap(
    "cloud",
    PURPLE,
    P(
      "M27 68 C15 68 14 52 26 50 C26 36 46 31 53 43 C62 34 79 41 75 54 C86 56 84 70 72 70Z",
      PAPER,
    ) +
      eyes(55, 8) +
      smile(62, 6) +
      cheeks(60, 15) +
      L("M36 78 V84 M50 80 V87 M64 78 V84", 3, "#fff"),
  ),
  sun: wrap(
    "sun",
    CREAM,
    [0, 45, 90, 135, 180, 225, 270, 315]
      .map((a) => `<g transform="rotate(${a} 50 50)">${L("M50 20 V28", 4)}</g>`)
      .join("") +
      C(50, 50, 19, YEL) +
      eyes(48, 7) +
      smile(55, 5.5) +
      cheeks(53, 13),
  ),
  backpack: wrap(
    "backpack",
    YEL,
    L("M41 36 C41 22 59 22 59 36", 3.2) +
      R(30, 34, 40, 50, 15, OLIVE) +
      R(37, 59, 26, 18, 6, TERRA) +
      L("M37 66 H63", 2.4) +
      L("M44 44 H56", 2.4) +
      eyes(47, 7, 2.4) +
      smile(53, 5),
  ),
  headphones: wrap(
    "headphones",
    OLIVE,
    L("M27 56 C27 20 73 20 73 56", 11) +
      L("M27 56 C27 20 73 20 73 56", 5.5, PURPLE) +
      C(50, 58, 19, PAPER) +
      eyes(56, 7) +
      smile(63, 5.5) +
      R(20, 50, 12, 20, 6, PURPLE) +
      R(68, 50, 12, 20, 6, PURPLE),
  ),
  mushroom: wrap(
    "mushroom",
    CREAM,
    P("M40 56 H60 V77 C60 84 40 84 40 77Z", PAPER) +
      P("M22 58 C22 24 78 24 78 58Z", TERRA) +
      C(38, 42, 4.5, PAPER, 2.4) +
      C(55, 36, 5.5, PAPER, 2.4) +
      C(66, 48, 3.5, PAPER, 2.4) +
      C(46, 70, 2.2, INK, 0) +
      C(54, 70, 2.2, INK, 0) +
      L("M47 75 Q50 78 53 75", 2.2),
  ),
};
