import { h } from 'snabbdom';
import { VNode } from 'snabbdom/vnode';
import { Pieces, files } from 'shogiground/types';
import { invRanks, allKeys } from 'shogiground/util';
import { Setting, makeSetting } from './setting';

export type Style = 'usi' | 'san' | 'literate' | 'nato' | 'anna';

const nato: { [letter: string]: string } = {
  a: 'alpha',
  b: 'bravo',
  c: 'charlie',
  d: 'delta',
  e: 'echo',
  f: 'foxtrot',
  g: 'golf',
  h: 'hotel',
};
const anna: { [letter: string]: string } = {
  a: 'anna',
  b: 'bella',
  c: 'cesar',
  d: 'david',
  e: 'eva',
  f: 'felix',
  g: 'gustav',
  h: 'hector',
};
const roles: { [letter: string]: string } = {
  P: 'pawn',
  R: 'rook',
  N: 'knight',
  B: 'bishop',
  K: 'king',
  G: 'gold',
  S: 'silver',
  L: 'lance',
  T: 'tokin',
  A: 'promotedsilver',
  M: 'promotedknight',
  U: 'promotedlance',
  H: 'horse',
  D: 'dragon',
};
const letters = {
  pawn: 'p',
  rook: 'r',
  knight: 'n',
  bishop: 'b',
  king: 'k',
  gold: 'g',
  silver: 's',
  lance: 'l',
  tokin: 't',
  promotedsilver: 'a',
  promotedknight: 'm',
  promotedlance: 'u',
  horse: 'h',
  dragon: 'd',
};

export function supportedVariant(key: string) {
  return ['standard', 'fromPosition'].includes(key);
}

export function styleSetting(): Setting<Style> {
  return makeSetting<Style>({
    choices: [
      ['san', 'SAN: Nxc3'],
      ['usi', 'USI: 2133'],
      ['literate', 'Literate: knight takes c 3'],
      ['anna', 'Anna: knight takes cesar 3'],
      ['nato', 'Nato: knight takes charlie 3'],
    ],
    default: 'anna', // all the rage in OTB blind chess tournaments
    storage: window.lishogi.storage.make('nvui.moveNotation'),
  });
}

export function renderSan(san: San, usi: Usi | undefined, style: Style) {
  if (!san) return '';
  let move: string;
  if (style === 'san') move = san.replace(/[\+#]/, '');
  else if (style === 'usi') move = usi || san;
  else {
    move = san
      .replace(/[\+#]/, '')
      .split('')
      .map(c => {
        if (c == 'x') return 'takes';
        if (c == '+') return 'promotion';
        if (c == '#') return 'checkmate';
        if (c == '=') return 'unpromotion';
        const code = c.charCodeAt(0);
        if (code > 48 && code < 58) return c; // 1-9
        if (code > 96 && code < 106) return renderFile(c, style); // a-i
        return roles[c] || c;
      })
      .join(' ');
  }
  if (san.includes('+')) move += ' promotion';
  if (san.includes('#')) move += ' checkmate';
  return move;
}

export function renderPieces(pieces: Pieces, style: Style): VNode {
  return h(
    'div',
    ['sente', 'gote'].map(color => {
      const lists: any = [];
      [
        'king',
        'rook',
        'bishop',
        'knight',
        'pawn',
        'gold',
        'silver',
        'lance',
        'tokin',
        'promotedsilver',
        'promotedknight',
        'promotedlance',
        'horse',
        'dragon',
      ].forEach(role => {
        const keys = [];
        for (const [key, piece] of pieces) {
          if (piece.color === color && piece.role === role) keys.push(key);
        }
        if (keys.length) lists.push([`${role}${keys.length > 1 ? 's' : ''}`, ...keys]);
      });
      return h('div', [
        h('h3', `${color} pieces`),
        ...lists
          .map(
            (l: any) =>
              `${l[0]}: ${l
                .slice(1)
                .map((k: string) => renderKey(k, style))
                .join(', ')}`
          )
          .join(', '),
      ]);
    })
  );
}

export function renderPieceKeys(pieces: Pieces, p: string, style: Style): string {
  const name = `${p === p.toUpperCase() ? 'sente' : 'gote'} ${roles[p.toUpperCase()]}`;
  const res: Key[] = [];
  for (const [k, piece] of pieces) {
    if (piece && `${piece.color} ${piece.role}` === name) res.push(k as Key);
  }
  return `${name}: ${res.length ? res.map(k => renderKey(k, style)).join(', ') : 'none'}`;
}

export function renderPiecesOn(pieces: Pieces, rankOrFile: string, style: Style): string {
  const res: string[] = [];
  for (const k of allKeys) {
    if (k.includes(rankOrFile)) {
      const piece = pieces.get(k);
      if (piece) res.push(`${renderKey(k, style)} ${piece.color} ${piece.role}`);
    }
  }
  return res.length ? res.join(', ') : 'blank';
}

export function renderBoard(pieces: Pieces, pov: Color): string {
  const board = [[' ', ...files, ' ']];
  for (let rank of invRanks) {
    let line = [];
    for (let file of files) {
      let key = (file + rank) as Key;
      const piece = pieces.get(key);
      if (piece) {
        const letter = letters[piece.role];
        line.push(piece.color === 'sente' ? letter.toUpperCase() : letter);
      } else line.push((key.charCodeAt(0) + key.charCodeAt(1)) % 2 ? '-' : '+');
    }
    board.push(['' + rank, ...line, '' + rank]);
  }
  board.push([' ', ...files, ' ']);
  if (pov === 'gote') {
    board.reverse();
    board.forEach(r => r.reverse());
  }
  return board.map(line => line.join(' ')).join('\n');
}

export function renderFile(f: string, style: Style): string {
  return style === 'nato' ? nato[f] : style === 'anna' ? anna[f] : f;
}

export function renderKey(key: string, style: Style): string {
  return `${renderFile(key[0], style)} ${key[1]}`;
}

export function castlingFlavours(input: string): string {
  switch (input.toLowerCase().replace(/[-\s]+/g, '')) {
    case 'oo':
    case '00':
      return 'o-o';
    case 'ooo':
    case '000':
      return 'o-o-o';
  }
  return input;
}
