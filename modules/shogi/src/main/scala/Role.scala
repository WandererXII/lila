package shogi

import Pos.posAt

sealed trait Role {
  val forsyth: Char
  lazy val forsythUpper: Char = forsyth.toUpper
  val forsythFull: String
  lazy val forsythFullUpper: String = forsythFull.toUpperCase
  lazy val kif: Char               = forsythUpper
  lazy val name                     = toString.toLowerCase
  val projection: Boolean
  val dirs: Directions
  val dirsOpposite: Directions
  def dir(from: Pos, to: Pos): Option[Direction]
}

case object King extends Role {
  val forsyth                  = 'k'
  val forsythFull              = forsyth.toString
  val dirs: Directions         = Rook.dirs ::: Bishop.dirs
  val dirsOpposite: Directions = dirs
  def dir(from: Pos, to: Pos)  = None
  val projection               = false
}
case object Rook extends Role {
  val forsyth                  = 'r'
  val forsythFull              = forsyth.toString
  val dirs: Directions         = List(_.up, _.down, _.left, _.right)
  val dirsOpposite: Directions = dirs
  def dir(from: Pos, to: Pos) =
    if (to ?| from)
      Some(
        if (to ?^ from) (_.up) else (_.down)
      )
    else if (to ?- from)
      Some(
        if (to ?< from) (_.left) else (_.right)
      )
    else None
  val projection = true
}
case object Bishop extends Role {
  val forsyth                  = 'b'
  val forsythFull              = forsyth.toString
  val dirs: Directions         = List(_.upLeft, _.upRight, _.downLeft, _.downRight)
  val dirsOpposite: Directions = dirs
  def dir(from: Pos, to: Pos) =
    if (to onSameDiagonal from)
      Some(
        if (to ?^ from) {
          if (to ?< from) (_.upLeft) else (_.upRight)
        } else {
          if (to ?< from) (_.downLeft) else (_.downRight)
        }
      )
    else None
  val projection = true
}
case object Knight extends Role {
  val forsyth     = 'n'
  val forsythFull = forsyth.toString
  val dirs: Directions = List(
    p => posAt(p.x - 1, p.y + 2),
    p => posAt(p.x + 1, p.y + 2)
  )
  val dirsOpposite: Directions = List(
    p => posAt(p.x - 1, p.y - 2),
    p => posAt(p.x + 1, p.y - 2)
  )
  def dir(from: Pos, to: Pos) = None
  val projection              = false
}
case object Pawn extends Role {
  val forsyth                  = 'p'
  val forsythFull              = forsyth.toString
  val dirs: Directions         = List(_.up)
  val dirsOpposite: Directions = List(_.down)
  def dir(from: Pos, to: Pos)  = None
  val projection               = false
}
case object Gold extends Role {
  val forsyth                  = 'g'
  val forsythFull              = forsyth.toString
  val dirs: Directions         = List(_.up, _.down, _.left, _.right, _.upLeft, _.upRight)
  val dirsOpposite: Directions = List(_.up, _.down, _.left, _.right, _.downLeft, _.downRight)
  def dir(from: Pos, to: Pos)  = None
  val projection               = false
}
case object Silver extends Role {
  val forsyth                  = 's'
  val forsythFull              = forsyth.toString
  val dirs: Directions         = List(_.up, _.upLeft, _.upRight, _.downLeft, _.downRight)
  val dirsOpposite: Directions = List(_.down, _.upLeft, _.upRight, _.downLeft, _.downRight)
  def dir(from: Pos, to: Pos)  = None
  val projection               = false
}
case object Lance extends Role {
  val forsyth                  = 'l'
  val forsythFull              = forsyth.toString
  val dirs: Directions         = List(_.up)
  val dirsOpposite: Directions = List(_.down)
  def dir(from: Pos, to: Pos) =
    if (to ?| from)
      Some(
        if (to ?^ from) (_.up) else (_.down)
      )
    else None

  val projection = true
}
case object Tokin extends Role {
  val forsyth                                    = 't'
  val forsythFull                                = "+p"
  val dirs: Directions                           = Gold.dirs
  val dirsOpposite: Directions                   = Gold.dirsOpposite
  def dir(from: Pos, to: Pos): Option[Direction] = None
  val projection: Boolean                        = false
}
case object PromotedSilver extends Role {
  val forsyth                                    = 'a'
  val forsythFull                                = "+s"
  val dirs: Directions                           = Gold.dirs
  val dirsOpposite: Directions                   = Gold.dirsOpposite
  def dir(from: Pos, to: Pos): Option[Direction] = None
  val projection: Boolean                        = false
}
case object PromotedKnight extends Role {
  val forsyth: Char                              = 'm'
  val forsythFull                                = "+n"
  val dirs: Directions                           = Gold.dirs
  val dirsOpposite: Directions                   = Gold.dirsOpposite
  def dir(from: Pos, to: Pos): Option[Direction] = None
  val projection: Boolean                        = false
}
case object PromotedLance extends Role {
  val forsyth: Char                              = 'u'
  val forsythFull                                = "+l"
  val dirs: Directions                           = Gold.dirs
  val dirsOpposite: Directions                   = Gold.dirsOpposite
  def dir(from: Pos, to: Pos): Option[Direction] = None
  val projection: Boolean                        = false
}
case object Horse extends Role {
  val forsyth: Char            = 'h'
  val forsythFull              = "+b"
  val dirs: Directions         = Bishop.dirs // only long range
  val dirsOpposite: Directions = Bishop.dirsOpposite
  def dir(from: Pos, to: Pos)  = Bishop.dir(from, to)
  val projection               = true
}
case object Dragon extends Role {
  val forsyth: Char                              = 'd'
  val forsythFull                                = "+r"
  val dirs: Directions                           = Rook.dirs // only long range
  val dirsOpposite: Directions                   = Rook.dirsOpposite
  def dir(from: Pos, to: Pos): Option[Direction] = Rook.dir(from, to)
  val projection: Boolean                        = true
}

object Role {

  val all: List[Role] = List(
    King,
    Rook,
    Bishop,
    Knight,
    Pawn,
    Gold,
    Silver,
    Lance,
    Tokin,
    Horse,
    PromotedSilver,
    PromotedKnight,
    PromotedLance,
    Dragon
  )

  val promotableRoles: List[Role] = List(
    Pawn,
    Lance,
    Knight,
    Silver,
    Bishop,
    Rook
  )

  // Correct order
  val handRoles: List[Role] = List(
    Rook,
    Bishop,
    Gold,
    Silver,
    Knight,
    Lance,
    Pawn
  )


  val allByForsyth: Map[Char, Role] = all map { r =>
    (r.forsyth, r)
  } toMap
  val allByKifu: Map[Char, Role] = all map { r =>
    (r.kif, r)
  } toMap
  val allByName: Map[String, Role] = all map { r =>
    (r.name, r)
  } toMap

  def forsyth(c: Char): Option[Role] = allByForsyth get c

  def promotesTo(r: Role): Option[Role] =
    r match {
      case Pawn   => Some(Tokin)
      case Lance  => Some(PromotedLance)
      case Knight => Some(PromotedKnight)
      case Silver => Some(PromotedSilver)
      case Bishop => Some(Horse)
      case Rook   => Some(Dragon)
      case _      => None
    }

  def demotesTo(r: Role): Option[Role] = {
    r match {
      case Tokin          => Some(Pawn)
      case PromotedLance  => Some(Lance)
      case PromotedSilver => Some(Silver)
      case PromotedKnight => Some(Knight)
      case Horse          => Some(Bishop)
      case Dragon         => Some(Rook)
      case _              => None
    }
  }

  def valueOf(r: Role): Option[Int] =
    r match {
      case Pawn                                                   => Some(1)
      case Lance                                                  => Some(3)
      case Knight                                                 => Some(4)
      case Silver                                                 => Some(5)
      case Gold | PromotedSilver | PromotedLance | PromotedKnight => Some(6)
      case Tokin                                                  => Some(7)
      case Bishop                                                 => Some(8)
      case Rook                                                   => Some(10)
      case Horse                                                  => Some(10)
      case Dragon                                                 => Some(12)
      case King                                                   => None
    }
}
