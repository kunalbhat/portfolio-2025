import { hex } from './color';

// The town's palette. Late afternoon, the first week of November in Chicago:
// warm low sun from the upper left, cool violet shadows, the trees half
// turned. Every surface is drawn from one of these ramps (darkest first).

const ramp = (...h: string[]) => h.map(hex);

export const P = {
  ink: hex('#221a2c'),
  inkSoft: hex('#3a2e44'),
  white: hex('#f6f1e6'),
  cream: hex('#efe3c8'),
  paper: hex('#e6d6b4'),

  grass: ramp('#3d6b3a', '#4f8541', '#649b49', '#7fb157', '#9fc56a'),
  grassDry: ramp('#7b7a3c', '#9a9345', '#b5aa55'),
  leafGreen: ramp('#24452f', '#2f5d38', '#467a40', '#62994a', '#86b55c'),
  leafOrange: ramp('#6e2a1f', '#9a3e22', '#c55f2a', '#e3893a', '#f4b45a'),
  leafGold: ramp('#7a5418', '#a8781e', '#d1a12c', '#ecc94c', '#f8e486'),
  leafRed: ramp('#521c26', '#7c2a2c', '#a63c34', '#c95b40', '#e3825a'),
  trunk: ramp('#2e211f', '#463025', '#614231', '#7d5a40'),

  path: ramp('#8e7356', '#a88b68', '#c2a67e', '#d6be96', '#e7d4ae'),
  concrete: ramp('#6f6a74', '#8a8590', '#a4a0a6', '#bdb8b8', '#d3cfca'),
  asphalt: ramp('#2f2c38', '#3a3743', '#45424e', '#524f5a'),
  lane: hex('#e6c24f'),
  paint: hex('#e9e5da'),

  brick: ramp('#5a2723', '#7a3429', '#994534', '#b65a41', '#cf7a58'),
  brickTan: ramp('#6c4a33', '#8c623f', '#ab7d4f', '#c79b66', '#dcb985'),
  greystone: ramp('#6b6660', '#878177', '#a39c8e', '#bdb6a5', '#d4ceba'),
  charcoal: ramp('#24232c', '#302f3a', '#3f3d4a', '#55525f', '#6f6b78'),
  stucco: ramp('#a58e70', '#c2aa86', '#d9c4a0', '#ebdbbb'),
  roof: ramp('#3b3842', '#4a4651', '#5a5661', '#6c6873', '#7f7b84'),
  roofTar: ramp('#5e5866', '#6c6674', '#7a7482', '#8a8490'),
  wood: ramp('#4a2e22', '#66402c', '#865838', '#a87448', '#c6935e'),
  steel: ramp('#3a2a2a', '#5c3a30', '#7a4c38', '#94603f'),
  metal: ramp('#3d4048', '#5a5e68', '#7b808a', '#a2a7ae', '#cfd3d6'),

  glass: ramp('#27324d', '#34466a', '#4a6590', '#7398ba', '#b4d0e0'),
  glow: ramp('#b5662a', '#e09a3e', '#f6c860', '#fde9a4'),

  water: ramp('#1f4466', '#285a82', '#33709c', '#4a8cb6', '#73afd0', '#b6dbe8'),
  pond: ramp('#2c5552', '#356660', '#437a6f', '#5a937f', '#86b59c'),
  sand: ramp('#b49866', '#cdb27c', '#e0c993', '#efdcae'),

  court: ramp('#2a5c58', '#336e66', '#3f8274', '#4f977f'),
  courtSurround: ramp('#6a3e32', '#86503c', '#a06348'),
  rubber: ramp('#7a3a2c', '#9a4b36', '#b4603f'),

  // fabrics: picked to be distinct in a crowd, all a little dusty
  cloth: {
    red: ramp('#7a2028', '#a8323a', '#cc4a48'),
    coral: ramp('#a8443a', '#d0624a', '#ec8a66'),
    orange: ramp('#9c4a1c', '#cc6a26', '#ea8e3c'),
    mustard: ramp('#9a6a12', '#c99222', '#e8b83a'),
    lemon: ramp('#b49a22', '#dcc23a', '#f2e070'),
    olive: ramp('#4a5224', '#636c30', '#7e8840'),
    green: ramp('#245236', '#2f6c44', '#3f8a56'),
    teal: ramp('#1c5258', '#24707a', '#33929a'),
    sky: ramp('#3a6c9c', '#4f8cc0', '#76b0dc'),
    blue: ramp('#22305c', '#2e4482', '#3d5ca8'),
    navy: ramp('#1a1f36', '#242b4a', '#333c62'),
    denim: ramp('#26365a', '#334a76', '#46608e'),
    purple: ramp('#3e2a5a', '#57397a', '#73509a'),
    pink: ramp('#9c3e66', '#c45a86', '#e286a6'),
    plum: ramp('#4c2238', '#6a3050', '#8a4468'),
    brown: ramp('#4a2e20', '#664030', '#845640'),
    tan: ramp('#8a6a44', '#a88656', '#c4a26c'),
    khaki: ramp('#6e6440', '#8c8052', '#a89c68'),
    grey: ramp('#4a4850', '#66646c', '#86848a'),
    charcoal: ramp('#22222a', '#30303a', '#42424e'),
    white: ramp('#a8a49c', '#d6d2c8', '#f2eee4'),
    black: ramp('#141218', '#1e1c24', '#2c2a34'),
  },
  skin: {
    fair: ramp('#c48a6c', '#eab896', '#f8d4b4'),
    light: ramp('#b47852', '#dca07a', '#f0bf98'),
    olive: ramp('#9c6a44', '#c48c5c', '#d8a674'),
    brown: ramp('#6e4228', '#93603c', '#ad7a50'),
    deep: ramp('#4a2a1c', '#66402a', '#7e5436'),
  },
  hair: {
    black: hex('#1e1618'),
    dark: hex('#2e2020'),
    brown: hex('#5a3a26'),
    auburn: hex('#8a3e24'),
    blonde: hex('#d6b060'),
    grey: hex('#b0aaa6'),
    white: hex('#e2ded8'),
    pink: hex('#d87aa0'),
  },
};

export type Ramp = number[];
export type ClothName = keyof typeof P.cloth;
export type SkinName = keyof typeof P.skin;
export type HairName = keyof typeof P.hair;
