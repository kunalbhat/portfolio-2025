import { person, Look, Pose } from '../src/art/people';
const c = document.getElementById('c') as HTMLCanvasElement;
const S = 6;
c.width = 1400; c.height = 900;
const ctx = c.getContext('2d')!;
ctx.imageSmoothingEnabled = false;
const looks: Look[] = [
  { skin: 'brown', hair: 'black', style: 'swoop', top: 'mustard', bottom: 'denim', shoes: 'white', item: 'cup' },
  { skin: 'fair', hair: 'blonde', style: 'long', top: 'teal', topKind: 'dress', bottom: 'teal', shoes: 'brown' },
  { skin: 'deep', hair: 'black', style: 'curly', top: 'coral', bottom: 'khaki', item: 'bag', extra: 'tan' },
  { skin: 'light', hair: 'grey', style: 'bald', top: 'green', bottom: 'grey', beard: true, glasses: true, item: 'paper' },
  { skin: 'olive', hair: 'brown', style: 'bun', top: 'purple', bottom: 'black', bottomKind: 'skirt', item: 'phone' },
  { skin: 'light', hair: 'auburn', style: 'cap', hat: 'red', top: 'white', topKind: 'tee', bottom: 'navy', bottomKind: 'shorts', item: 'racket' },
  { skin: 'brown', hair: 'black', style: 'scarf', hat: 'plum', top: 'olive', topKind: 'coat', bottom: 'brown' },
  { skin: 'fair', hair: 'dark', style: 'beanie', hat: 'orange', top: 'navy', topKind: 'coat', bottom: 'denim', item: 'icecream' },
  { skin: 'brown', hair: 'black', style: 'short', top: 'sky', bottom: 'denim', kid: true },
  { skin: 'brown', hair: 'black', style: 'swoop', top: 'red', bottom: 'navy', kid: true, item: 'balloon' },
  { skin: 'olive', hair: 'brown', style: 'ponytail', top: 'pink', bottom: 'denim' },
];
const poses: Pose[] = ['stand', 'walk0', 'walk1', 'walk2', 'side', 'back', 'sit', 'sitBack', 'wave0', 'wave1', 'cheer', 'sitSide', 'crouch', 'swing0'];
looks.forEach((l, j) => poses.forEach((p, i) => {
  const s = person(l, p);
  ctx.drawImage(s.canvas, 10 + i * 12 * S, 10 + j * 19 * S * 0.75, s.w * S * 0.75, s.h * S * 0.75);
}));
