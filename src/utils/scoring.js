export const MATCH_POINTS = {
  win: 3,
  draw: 2,
  loss: 1,
  none: 0,
}

export const GAME_MODES = [
  {
    id: 'ten_points',
    label: '10 points joués',
    short: '10 pts',
    description: 'Cinq services chacun. Celui qui a le plus grand score gagne.',
  },
  {
    id: 'first_to_15',
    label: 'Premier à 15',
    short: 'À 15',
    description: 'Service aux gagnants. Le premier qui atteint 15 gagne.',
  },
]

export function getMode(modeId) {
  return GAME_MODES.find((m) => m.id === modeId) || GAME_MODES[0]
}

/** Résultat d'un match selon les scores (indépendant du mode pour l'attribution). */
export function resolveOutcome(score1, score2) {
  const a = Number(score1)
  const b = Number(score2)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  if (a > b) return 'p1'
  if (b > a) return 'p2'
  return 'draw'
}

export function pointsForOutcome(outcome, side) {
  if (outcome === 'draw') return MATCH_POINTS.draw
  if (outcome === side) return MATCH_POINTS.win
  return MATCH_POINTS.loss
}

export function validateScores(modeId, score1, score2) {
  const a = Number(score1)
  const b = Number(score2)
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) {
    return 'Les scores doivent être des entiers positifs.'
  }
  if (modeId === 'ten_points') {
    if (a + b !== 10) {
      return 'En mode « 10 points joués », la somme des scores doit être égale à 10.'
    }
  }
  if (modeId === 'first_to_15') {
    if (a < 15 && b < 15) {
      return 'En mode « Premier à 15 », un joueur doit atteindre au moins 15.'
    }
    if (a === b) {
      return 'En mode « Premier à 15 », un match nul n’est pas prévu : un joueur doit gagner.'
    }
  }
  return null
}

/**
 * Agrège les points d'une session pour chaque élève.
 * attendance: present | dispensed | absent
 */
export function sessionStats({ students, matches, attendance = {} }) {
  const byId = {}
  for (const s of students) {
    const status = attendance[s.id] || 'present'
    byId[s.id] = {
      studentId: s.id,
      name: s.name,
      status,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      matchesPlayed: 0,
      asReferee: 0,
    }
  }

  for (const m of matches) {
    const outcome = resolveOutcome(m.score1, m.score2)
    if (!outcome) continue

    const p1 = byId[m.player1Id]
    const p2 = byId[m.player2Id]
    if (p1 && (attendance[m.player1Id] || 'present') === 'present') {
      p1.matchesPlayed += 1
      if (outcome === 'p1') {
        p1.wins += 1
        p1.points += MATCH_POINTS.win
      } else if (outcome === 'draw') {
        p1.draws += 1
        p1.points += MATCH_POINTS.draw
      } else {
        p1.losses += 1
        p1.points += MATCH_POINTS.loss
      }
    }
    if (p2 && (attendance[m.player2Id] || 'present') === 'present') {
      p2.matchesPlayed += 1
      if (outcome === 'p2') {
        p2.wins += 1
        p2.points += MATCH_POINTS.win
      } else if (outcome === 'draw') {
        p2.draws += 1
        p2.points += MATCH_POINTS.draw
      } else {
        p2.losses += 1
        p2.points += MATCH_POINTS.loss
      }
    }
    if (m.refereeId && byId[m.refereeId]) {
      byId[m.refereeId].asReferee += 1
    }
  }

  return Object.values(byId).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.wins !== a.wins) return b.wins - a.wins
    return a.name.localeCompare(b.name, 'fr')
  })
}

export function overallRanking({ students, sessions, matches }) {
  const byId = {}
  for (const s of students) {
    byId[s.id] = {
      studentId: s.id,
      name: s.name,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      matchesPlayed: 0,
      sessionsPresent: 0,
    }
  }

  for (const session of sessions) {
    const sessionMatches = matches.filter((m) => m.sessionId === session.id)
    const stats = sessionStats({
      students,
      matches: sessionMatches,
      attendance: session.attendance || {},
    })
    for (const row of stats) {
      const target = byId[row.studentId]
      if (!target) continue
      if (row.status === 'present') {
        target.sessionsPresent += 1
        target.points += row.points
        target.wins += row.wins
        target.draws += row.draws
        target.losses += row.losses
        target.matchesPlayed += row.matchesPlayed
      }
    }
  }

  return Object.values(byId).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.wins !== a.wins) return b.wins - a.wins
    return a.name.localeCompare(b.name, 'fr')
  })
}

export function uid() {
  return crypto.randomUUID()
}
