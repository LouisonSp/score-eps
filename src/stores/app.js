import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { uid, validateScores } from '../utils/scoring'

const STORAGE_KEY = 'score-eps-v1'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function emptyState() {
  return {
    classes: [],
    students: [],
    sessions: [],
    matches: [],
  }
}

export const useAppStore = defineStore('app', () => {
  const saved = loadState()
  const classes = ref(saved?.classes || [])
  const students = ref(saved?.students || [])
  const sessions = ref(saved?.sessions || [])
  const matches = ref(saved?.matches || [])

  watch(
    [classes, students, sessions, matches],
    () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          classes: classes.value,
          students: students.value,
          sessions: sessions.value,
          matches: matches.value,
        })
      )
    },
    { deep: true }
  )

  const classById = computed(() => Object.fromEntries(classes.value.map((c) => [c.id, c])))

  function studentsOf(classId) {
    return students.value
      .filter((s) => s.classId === classId)
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }

  function sessionsOf(classId) {
    return sessions.value
      .filter((s) => s.classId === classId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  function matchesOf(sessionId) {
    return matches.value
      .filter((m) => m.sessionId === sessionId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  function createClass(name) {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Nom de classe requis.')
    const row = { id: uid(), name: trimmed, createdAt: new Date().toISOString() }
    classes.value.unshift(row)
    return row
  }

  function renameClass(id, name) {
    const c = classes.value.find((x) => x.id === id)
    if (!c) return
    c.name = name.trim()
  }

  function deleteClass(id) {
    const studentIds = students.value.filter((s) => s.classId === id).map((s) => s.id)
    const sessionIds = sessions.value.filter((s) => s.classId === id).map((s) => s.id)
    matches.value = matches.value.filter((m) => !sessionIds.includes(m.sessionId))
    sessions.value = sessions.value.filter((s) => s.classId !== id)
    students.value = students.value.filter((s) => s.classId !== id)
    classes.value = classes.value.filter((c) => c.id !== id)
    return studentIds.length
  }

  function addStudent(classId, name) {
    const trimmed = name.trim()
    if (!trimmed) throw new Error('Prénom requis.')
    const exists = students.value.some(
      (s) => s.classId === classId && s.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (exists) throw new Error('Cet élève est déjà dans la classe.')
    const row = { id: uid(), classId, name: trimmed, createdAt: new Date().toISOString() }
    students.value.push(row)

    // Ajouter l'élève aux sessions ouvertes comme présent
    for (const session of sessions.value.filter((s) => s.classId === classId && s.status === 'open')) {
      session.attendance = { ...(session.attendance || {}), [row.id]: 'present' }
    }
    return row
  }

  function renameStudent(id, name) {
    const s = students.value.find((x) => x.id === id)
    if (!s) return
    s.name = name.trim()
  }

  function removeStudent(id) {
    matches.value = matches.value.filter(
      (m) => m.player1Id !== id && m.player2Id !== id && m.refereeId !== id
    )
    for (const session of sessions.value) {
      if (session.attendance?.[id]) {
        const next = { ...session.attendance }
        delete next[id]
        session.attendance = next
      }
    }
    students.value = students.value.filter((s) => s.id !== id)
  }

  function createSession(classId, { name, mode }) {
    const classStudents = studentsOf(classId)
    if (classStudents.length < 2) {
      throw new Error('Ajoutez au moins 2 élèves avant de créer une session.')
    }
    const attendance = {}
    for (const s of classStudents) attendance[s.id] = 'present'

    const row = {
      id: uid(),
      classId,
      name: (name || `Séance ${sessionsOf(classId).length + 1}`).trim(),
      mode: mode || 'ten_points',
      status: 'open',
      attendance,
      createdAt: new Date().toISOString(),
    }
    sessions.value.unshift(row)
    return row
  }

  function setAttendance(sessionId, studentId, status) {
    const session = sessions.value.find((s) => s.id === sessionId)
    if (!session) return
    session.attendance = { ...(session.attendance || {}), [studentId]: status }
  }

  function closeSession(sessionId) {
    const session = sessions.value.find((s) => s.id === sessionId)
    if (session) session.status = 'closed'
  }

  function reopenSession(sessionId) {
    const session = sessions.value.find((s) => s.id === sessionId)
    if (session) session.status = 'open'
  }

  function deleteSession(sessionId) {
    matches.value = matches.value.filter((m) => m.sessionId !== sessionId)
    sessions.value = sessions.value.filter((s) => s.id !== sessionId)
  }

  function addMatch(sessionId, payload) {
    const session = sessions.value.find((s) => s.id === sessionId)
    if (!session) throw new Error('Session introuvable.')
    if (session.status !== 'open') throw new Error('Cette session est clôturée.')

    const { player1Id, player2Id, refereeId, score1, score2 } = payload
    if (!player1Id || !player2Id) throw new Error('Sélectionnez deux élèves.')
    if (player1Id === player2Id) throw new Error('Les deux joueurs doivent être différents.')
    if (refereeId && (refereeId === player1Id || refereeId === player2Id)) {
      throw new Error('L’arbitre ne peut pas être un des joueurs.')
    }

    for (const id of [player1Id, player2Id]) {
      const status = session.attendance?.[id] || 'present'
      if (status !== 'present') {
        throw new Error('Un joueur dispensé ou absent ne peut pas jouer.')
      }
    }

    const err = validateScores(session.mode, score1, score2)
    if (err) throw new Error(err)

    const row = {
      id: uid(),
      sessionId,
      player1Id,
      player2Id,
      refereeId: refereeId || null,
      score1: Number(score1),
      score2: Number(score2),
      createdAt: new Date().toISOString(),
    }
    matches.value.unshift(row)
    return row
  }

  function deleteMatch(matchId) {
    matches.value = matches.value.filter((m) => m.id !== matchId)
  }

  function exportData() {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        classes: classes.value,
        students: students.value,
        sessions: sessions.value,
        matches: matches.value,
      },
      null,
      2
    )
  }

  function importData(json) {
    const data = typeof json === 'string' ? JSON.parse(json) : json
    if (!data?.classes || !data?.students) throw new Error('Fichier invalide.')
    classes.value = data.classes
    students.value = data.students
    sessions.value = data.sessions || []
    matches.value = data.matches || []
  }

  function resetAll() {
    const empty = emptyState()
    classes.value = empty.classes
    students.value = empty.students
    sessions.value = empty.sessions
    matches.value = empty.matches
  }

  return {
    classes,
    students,
    sessions,
    matches,
    classById,
    studentsOf,
    sessionsOf,
    matchesOf,
    createClass,
    renameClass,
    deleteClass,
    addStudent,
    renameStudent,
    removeStudent,
    createSession,
    setAttendance,
    closeSession,
    reopenSession,
    deleteSession,
    addMatch,
    deleteMatch,
    exportData,
    importData,
    resetAll,
  }
})
