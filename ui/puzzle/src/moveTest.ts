import { lishogiCharToRole, parseLishogiUsi } from 'shogiops/compat';
import { path as pathOps } from 'tree';
import { Vm, Puzzle, MoveTest } from './interfaces';
import { isDrop, Role, Shogi, SquareSet } from 'shogiops';
import { parseFen } from 'shogiops/fen';
import { opposite } from 'shogiground/util';
import { plyColor } from './util';

type MoveTestReturn = undefined | 'fail' | 'win' | MoveTest;

function isForcedPromotion(u1: string, u2: string, turn: Color, role?: Role): boolean {
  const m1 = parseLishogiUsi(u1);
  const m2 = parseLishogiUsi(u2);
  if (!role || !m1 || !m2 || isDrop(m1) || isDrop(m2) || m1.from != m2.from || m1.to != m2.to) return false;
  return (
    (role === 'knight' && SquareSet.backrank2(turn).has(m1.to)) ||
    ((role === 'pawn' || role === 'lance') && SquareSet.backrank(turn).has(m1.to))
  );
}

export default function moveTest(vm: Vm, puzzle: Puzzle): MoveTestReturn {
  if (vm.mode === 'view') return;
  if (!pathOps.contains(vm.path, vm.initialPath)) return;

  const playedByColor = opposite(plyColor(vm.node.ply));
  if (playedByColor !== vm.pov) return;

  const nodes = vm.nodeList.slice(pathOps.size(vm.initialPath) + 1).map(node => ({
    usi: node.usi,
    san: node.san!,
    fen: node.fen!,
  }));

  for (const i in nodes) {
    const b: boolean = parseFen(nodes[i].fen).unwrap(
      s =>
        Shogi.fromSetup(s, false).unwrap(
          sh => sh.isCheckmate(),
          () => false
        ),
      () => false
    );
    if (b) return (vm.node.puzzle = 'win');
    const usi = nodes[i].usi!,
      solUsi = puzzle.solution[i];
    const role = nodes[i].san[0] as Role;
    if (usi != solUsi && !isForcedPromotion(usi, solUsi, opposite(playedByColor), lishogiCharToRole(role)))
      return (vm.node.puzzle = 'fail');
  }

  const nextUsi = puzzle.solution[nodes.length];
  if (!nextUsi) return (vm.node.puzzle = 'win');

  // from here we have a next move
  vm.node.puzzle = 'good';

  return {
    move: parseLishogiUsi(nextUsi)!,
    fen: vm.node.fen,
    path: vm.path,
  };
}
