<template>
  <div v-if="!session || !cls" class="card p-8 text-center space-y-3">
    <p>Séance introuvable.</p>
    <router-link to="/" class="btn-primary inline-flex">Accueil</router-link>
  </div>
  <div v-else class="space-y-6">
    <div class="space-y-3">
      <router-link :to="`/class/${session.classId}`" class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-court-700">
        <ArrowLeft :size="14" /> {{ cls.name }}
      </router-link>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-ink-900">{{ session.name }}</h1>
          <p class="text-sm text-slate-500 mt-1">
            {{ mode.label }}
            ·
            <span :class="session.status === 'open' ? 'text-court-700' : 'text-slate-500'">
              {{ session.status === 'open' ? 'Ouverte' : 'Clôturée' }}
            </span>
          </p>
          <p class="text-xs text-slate-400 mt-1">{{ mode.description }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-if="session.status === 'open'"
            type="button"
            class="btn-primary"
            @click="activeTab = 'match'"
          >
            <Swords :size="16" /> Nouveau match
          </button>
          <button
            v-if="session.status === 'open'"
            type="button"
            class="btn-secondary"
            @click="store.closeSession(session.id)"
          >
            Clôturer
          </button>
          <button
            v-else
            type="button"
            class="btn-secondary"
            @click="store.reopenSession(session.id)"
          >
            Rouvrir
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl w-full sm:w-fit overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition"
        :class="activeTab === tab.id ? 'bg-court-700 text-white shadow' : 'text-slate-500 hover:bg-slate-50'"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Classement séance -->
    <section v-show="activeTab === 'board'" class="space-y-3">
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-3 py-3">#</th>
                <th class="px-3 py-3">Élève</th>
                <th class="px-3 py-3 text-center">Pts</th>
                <th class="px-3 py-3 text-center">Matchs</th>
                <th class="px-3 py-3 text-center hidden sm:table-cell">V/N/D</th>
                <th class="px-3 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in board"
                :key="row.studentId"
                class="border-t border-slate-100"
                :class="{
                  'opacity-60': row.status !== 'present',
                  'bg-amber-50/50': row.status === 'present' && row.matchesPlayed < 3,
                }"
              >
                <td class="px-3 py-3 font-bold text-court-800">{{ i + 1 }}</td>
                <td class="px-3 py-3 font-semibold">{{ row.name }}</td>
                <td class="px-3 py-3 text-center font-bold">{{ row.points }}</td>
                <td class="px-3 py-3 text-center">
                  <span
                    class="inline-flex min-w-[2.5rem] justify-center rounded-full px-2 py-0.5 text-xs font-bold"
                    :class="row.matchesPlayed >= 3 ? 'bg-court-100 text-court-800' : 'bg-amber-100 text-amber-800'"
                  >
                    {{ row.matchesPlayed }}/3
                  </span>
                </td>
                <td class="px-3 py-3 text-center hidden sm:table-cell text-slate-500">
                  {{ row.wins }}/{{ row.draws }}/{{ row.losses }}
                </td>
                <td class="px-3 py-3">
                  <select
                    class="input py-1.5 text-xs max-w-[9rem]"
                    :value="row.status"
                    :disabled="session.status !== 'open'"
                    @change="onAttendance(row.studentId, $event.target.value)"
                  >
                    <option value="present">Présent</option>
                    <option value="dispensed">Dispensé</option>
                    <option value="absent">Absent</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p class="text-xs text-slate-500">
        Objectif : 3 matchs par élève présent. Victoire = 3 pts, nul = 2, défaite = 1. Dispensé / absent = 0, sans pénalité.
      </p>
    </section>

    <!-- Nouveau match -->
    <section v-show="activeTab === 'match'" class="space-y-4">
      <form v-if="session.status === 'open'" class="card p-5 space-y-4" @submit.prevent="submitMatch">
        <h2 class="font-display font-bold text-lg">Nouveau match</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label" for="p1">Élève A</label>
            <select id="p1" v-model="form.player1Id" class="input" required>
              <option value="">Choisir…</option>
              <option v-for="s in presentStudents" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="label" for="p2">Élève B</label>
            <select id="p2" v-model="form.player2Id" class="input" required>
              <option value="">Choisir…</option>
              <option v-for="s in presentStudents" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
        </div>
        <div>
          <label class="label" for="ref">Arbitre (optionnel)</label>
          <select id="ref" v-model="form.refereeId" class="input">
            <option value="">Aucun</option>
            <option v-for="s in presentStudents" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label" for="s1">Score A</label>
            <input id="s1" v-model.number="form.score1" type="number" min="0" class="input" required />
          </div>
          <div>
            <label class="label" for="s2">Score B</label>
            <input id="s2" v-model.number="form.score2" type="number" min="0" class="input" required />
          </div>
        </div>
        <p class="text-xs text-slate-500">
          <template v-if="session.mode === 'ten_points'">Somme des scores = 10 (ex. 6–4, 7–3, 5–5).</template>
          <template v-else>Un joueur doit atteindre au moins 15 (pas de match nul).</template>
        </p>
        <p v-if="matchError" class="text-sm text-red-600">{{ matchError }}</p>
        <p v-if="matchOk" class="text-sm text-court-700">{{ matchOk }}</p>
        <button type="submit" class="btn-primary w-full sm:w-auto">
          <Check :size="16" /> Enregistrer le match
        </button>
      </form>
      <div v-else class="card p-6 text-sm text-slate-500">
        Séance clôturée — rouvrez-la pour saisir un match.
      </div>
    </section>

    <!-- Historique matchs -->
    <section v-show="activeTab === 'history'" class="space-y-3">
      <div v-if="sessionMatches.length === 0" class="card p-8 text-center text-sm text-slate-500">
        Aucun match enregistré.
      </div>
      <ul v-else class="space-y-2">
        <li
          v-for="m in sessionMatches"
          :key="m.id"
          class="card px-4 py-3 flex flex-wrap items-center justify-between gap-3"
        >
          <div class="text-sm">
            <span class="font-semibold">{{ nameOf(m.player1Id) }}</span>
            <span class="mx-2 font-mono font-bold text-court-800">{{ m.score1 }} – {{ m.score2 }}</span>
            <span class="font-semibold">{{ nameOf(m.player2Id) }}</span>
            <span v-if="m.refereeId" class="block text-xs text-slate-400 mt-1">
              Arbitre : {{ nameOf(m.refereeId) }}
            </span>
          </div>
          <button
            v-if="session.status === 'open'"
            type="button"
            class="btn-danger py-1.5 px-3 text-xs"
            @click="removeMatch(m.id)"
          >
            Supprimer
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Swords, Check } from '@lucide/vue'
import { useAppStore } from '../stores/app'
import { getMode, sessionStats, pointsForOutcome, resolveOutcome } from '../utils/scoring'

const route = useRoute()
const store = useAppStore()

const sessionId = computed(() => route.params.sessionId)
const session = computed(() => store.sessions.find((s) => s.id === sessionId.value))
const cls = computed(() => store.classes.find((c) => c.id === session.value?.classId))
const students = computed(() => (session.value ? store.studentsOf(session.value.classId) : []))
const sessionMatches = computed(() => store.matchesOf(sessionId.value))
const mode = computed(() => getMode(session.value?.mode))

const presentStudents = computed(() =>
  students.value.filter((s) => (session.value?.attendance?.[s.id] || 'present') === 'present')
)

const board = computed(() =>
  sessionStats({
    students: students.value,
    matches: sessionMatches.value,
    attendance: session.value?.attendance || {},
  })
)

const tabs = [
  { id: 'board', label: 'Classement' },
  { id: 'match', label: 'Nouveau match' },
  { id: 'history', label: 'Matchs' },
]
const activeTab = ref('board')

const form = reactive({
  player1Id: '',
  player2Id: '',
  refereeId: '',
  score1: null,
  score2: null,
})
const matchError = ref('')
const matchOk = ref('')

function nameOf(id) {
  return students.value.find((s) => s.id === id)?.name || '?'
}

function onAttendance(studentId, status) {
  store.setAttendance(sessionId.value, studentId, status)
}

function submitMatch() {
  matchError.value = ''
  matchOk.value = ''
  try {
    const match = store.addMatch(sessionId.value, { ...form })
    const outcome = resolveOutcome(match.score1, match.score2)
    const p1 = pointsForOutcome(outcome, 'p1')
    const p2 = pointsForOutcome(outcome, 'p2')
    matchOk.value = `${nameOf(match.player1Id)} +${p1} pt · ${nameOf(match.player2Id)} +${p2} pt`
    form.player1Id = ''
    form.player2Id = ''
    form.refereeId = ''
    form.score1 = null
    form.score2 = null
    activeTab.value = 'board'
  } catch (e) {
    matchError.value = e.message
  }
}

function removeMatch(id) {
  if (!confirm('Supprimer ce match ?')) return
  store.deleteMatch(id)
}
</script>
