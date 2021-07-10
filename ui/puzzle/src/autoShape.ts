import { CevalCtrl, winningChances } from 'ceval';
import { DrawShape } from 'shogiground/draw';
import { Vm } from './interfaces';
import { Api as CgApi } from 'shogiground/api';
import { opposite } from 'shogiground/util';
import { assureLishogiUsi, makeChessSquare, parseLishogiUsi } from 'shogiops/compat';
import { isDrop } from 'shogiops';

interface Opts {
  vm: Vm;
  ceval: CevalCtrl;
  ground: CgApi;
  nextNodeBest?: Usi;
  threatMode: boolean;
}

function makeAutoShapesFromUsi(usi: Usi, color: Color, brush: string, modifiers?: any): DrawShape[] {
  const move = parseLishogiUsi(assureLishogiUsi(usi)!);
  if (!move) return [];
  if (isDrop(move))
    return [
      {
        orig: makeChessSquare(move.to),
        brush,
      },
      {
        orig: makeChessSquare(move.to),
        piece: {
          role: move.role,
          color: color,
        },
        brush: brush,
      },
    ];
  else
    return [
      {
        orig: makeChessSquare(move.from),
        dest: makeChessSquare(move.to),
        brush: brush,
        modifiers: modifiers,
      },
    ];
}

export default function (opts: Opts): DrawShape[] {
  const n = opts.vm.node,
    hovering = opts.ceval.hovering(),
    color = opts.ground.state.movable.color,
    turnColor = opts.ground.state.turnColor;
  let shapes: DrawShape[] = [];
  if (hovering && hovering.fen === n.fen)
    shapes = shapes.concat(makeAutoShapesFromUsi(hovering.usi, turnColor, 'paleBlue'));
  if (opts.vm.showAutoShapes() && opts.vm.showComputer()) {
    if (n.eval) shapes = shapes.concat(makeAutoShapesFromUsi(n.eval.best!, turnColor, 'paleGreen'));
    if (!hovering) {
      let nextBest: Usi | undefined = opts.nextNodeBest;
      if (!nextBest && opts.ceval.enabled() && n.ceval) nextBest = n.ceval.pvs[0].moves[0];
      if (nextBest) shapes = shapes.concat(makeAutoShapesFromUsi(nextBest, turnColor, 'paleBlue'));
      if (
        opts.ceval.enabled() &&
        n.ceval &&
        n.ceval.pvs &&
        n.ceval.pvs[1] &&
        !(opts.threatMode && n.threat && n.threat.pvs[2])
      ) {
        n.ceval.pvs.forEach(function (pv) {
          if (pv.moves[0] === nextBest) return;
          const shift = winningChances.povDiff(color as Color, n.ceval!.pvs[0], pv);
          if (shift > 0.2 || isNaN(shift) || shift < 0) return;
          shapes = shapes.concat(
            makeAutoShapesFromUsi(pv.moves[0], turnColor, 'paleGrey', {
              lineWidth: Math.round(12 - shift * 50), // 12 to 2
            })
          );
        });
      }
    }
  }
  if (opts.ceval.enabled() && opts.threatMode && n.threat) {
    if (n.threat.pvs[1]) {
      shapes = shapes.concat(makeAutoShapesFromUsi(n.threat.pvs[0].moves[0], turnColor, 'paleRed'));
      n.threat.pvs.slice(1).forEach(function (pv) {
        const shift = winningChances.povDiff(opposite(color as Color), pv, n.threat!.pvs[0]);
        if (shift > 0.2 || isNaN(shift) || shift < 0) return;
        shapes = shapes.concat(
          makeAutoShapesFromUsi(pv.moves[0], turnColor, 'paleRed', {
            lineWidth: Math.round(11 - shift * 45), // 11 to 2
          })
        );
      });
    } else shapes = shapes.concat(makeAutoShapesFromUsi(n.threat.pvs[0].moves[0], turnColor, 'red'));
  }
  return shapes;
}
