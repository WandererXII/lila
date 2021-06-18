package lila.game

import com.github.blemale.scaffeine.Cache
import scala.concurrent.duration._

import shogi.Division
import shogi.variant.Variant
import shogi.format.FEN

final class Divider {

  private val cache: Cache[Game.ID, Division] = lila.memo.CacheApi.scaffeineNoScheduler
    .expireAfterAccess(5 minutes)
    .build[Game.ID, Division]()

  def apply(game: Game, initialFen: Option[FEN]): Division =
    apply(game.id, game.kifMoves, game.variant, initialFen)

  def apply(id: Game.ID, kifMoves: => KifMoves, variant: Variant, initialFen: Option[FEN]) =
    if (!Variant.divisionSensibleVariants(variant)) Division.empty
    else
      cache.get(
        id,
        _ =>
          shogi.Replay
            .boards(
              moveStrs = kifMoves,
              initialFen = initialFen,
              variant = variant
            )
            .toOption
            .fold(Division.empty)(shogi.Divider.apply)
      )
}
