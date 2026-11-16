<template>
  <div v-if="!cls" class="card p-8 text-center space-y-3">
    <p>Classe introuvable.</p>
    <router-link to="/" class="btn-primary inline-flex">Accueil</router-link>
  </div>
  <div v-else class="space-y-8">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="space-y-2">
        <router-link to="/" class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-court-700">
          <ArrowLeft :size="14" /> Classes
        </router-link>
        <h1 class="font-display text-2xl sm:text-3xl font-bold text-ink-900">{{ cls.name }}</h1>
        <p class="text-sm text-slate-500">
          {{ students.length }} élève(s) · {{ sessions.length }} séance(s)
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <router-link :to="`/class/${classId}/ranking`" class="btn-secondary">
          <Trophy :size="16" /> Classement
        </router-link>
        <button type="button" class="btn-danger" @click="confirmDeleteClass">
          <Trash2 :size="16" /> Supprimer
        </button>
      </div>
    </div>

    <!-- Élèves -->
    <section class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-display text-lg font-bold">Élèves</h2>
        <button type="button" class="btn-secondary" @click="showAddStudent = true">
          <UserPlus :size="16" /> Ajouter
        </button>
      </div>

      <div v-if="students.length === 0" class="card p-8 text-center text-sm text-slate-500">
        Aucun élève. Ajoutez au moins deux élèves pour créer une séance.
      </div>

      <ul v-else class="card divide-y divide-slate-100">
        <li
          v-for="s in students"
          :key="s.id"
          class="flex items-center justify-between gap-3 px-4 py-3"
        >
          <span class="font-medium">{{ s.name }}</span>
          <button
            type="button"
            class="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
            title="Retirer"
            @click="removeStudent(s)"
          >
            <Trash2 :size="16" />
          </button>
        </li>
      </ul>
    </section>

    <!-- Séances -->
    <section class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-display text-lg font-bold">Séances</h2>
        <button type="button" class="btn-primary" @click="openSessionModal">
          <Plus :size="16" /> Nouvelle séance
        </button>
      </div>

      <div v-if="sessions.length === 0" class="card p-8 text-center text-sm text-slate-500">
        Pas encore de séance. Choisissez un mode de jeu puis lancez.
      </div>

      <div v-else class="grid gap-3">
        <router-link
          v-for="session in sessions"
          :key="session.id"
          :to="`/session/${session.id}`"
          class="card p-4 hover:border-court-500/40 hover:shadow-md transition"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-semibold text-ink-900">{{ session.name }}</p>
              <p class="text-xs text-slate-500 mt-1">
                {{ modeLabel(session.mode) }}
                · {{ session.status === 'open' ? 'Ouverte' : 'Clôturée' }}
                · {{ formatDate(session.createdAt) }}
              </p>
            </div>
            <ChevronRight :size="18" class="text-slate-300" />
          </div>
        </router-link>
      </div>
    </section>

    <!-- Modal élève -->
    <div v-if="showAddStudent" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/40 p-4" @click.self="showAddStudent = false">
      <form class="card w-full max-w-md p-6 space-y-4" @submit.prevent="addStudent">
        <h3 class="font-display text-lg font-bold">Ajouter un élève</h3>
        <div>
          <label class="label" for="student-name">Prénom (ou prénom + initiale)</label>
          <input id="student-name" v-model="studentName" class="input" placeholder="Ex. Léa" autofocus />
          <p class="text-xs text-slate-400 mt-1">Évitez nom + prénom complets si possible (minimisation RGPD).</p>
        </div>
        <p v-if="studentError" class="text-sm text-red-600">{{ studentError }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary" @click="showAddStudent = false">Annuler</button>
          <button type="submit" class="btn-primary">Ajouter</button>
        </div>
      </form>
    </div>

    <!-- Modal séance -->
    <div v-if="showSession" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/40 p-4" @click.self="showSession = false">
      <form class="card w-full max-w-md p-6 space-y-4" @submit.prevent="createSession">
        <h3 class="font-display text-lg font-bold">Nouvelle séance</h3>
        <div>
          <label class="label" for="session-name">Nom</label>
          <input id="session-name" v-model="sessionName" class="input" placeholder="Ex. Séance 1" />
        </div>
        <div>
          <p class="label">Mode de jeu</p>
          <div class="space-y-2">
            <label
              v-for="mode in GAME_MODES"
              :key="mode.id"
              class="flex gap-3 rounded-xl border p-3 cursor-pointer transition"
              :class="sessionMode === mode.id ? 'border-court-600 bg-court-50' : 'border-slate-200'"
            >
              <input v-model="sessionMode" type="radio" :value="mode.id" class="mt-1" />
              <span>
                <span class="block font-semibold text-sm">{{ mode.label }}</span>
                <span class="block text-xs text-slate-500 mt-0.5">{{ mode.description }}</span>
              </span>
            </label>
          </div>
        </div>
        <p class="text-xs text-slate-500">
          Tous les élèves de la classe sont inclus. Vous pourrez marquer dispensé / absent dans la séance.
        </p>
        <p v-if="sessionError" class="text-sm text-red-600">{{ sessionError }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary" @click="showSession = false">Annuler</button>
          <button type="submit" class="btn-primary">Lancer</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, UserPlus, Plus, Trash2, Trophy, ChevronRight } from '@lucide/vue'
import { useAppStore } from '../stores/app'
import { GAME_MODES, getMode } from '../utils/scoring'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const classId = computed(() => route.params.classId)
const cls = computed(() => store.classes.find((c) => c.id === classId.value))
const students = computed(() => store.studentsOf(classId.value))
const sessions = computed(() => store.sessionsOf(classId.value))

const showAddStudent = ref(false)
const studentName = ref('')
const studentError = ref('')

const showSession = ref(false)
const sessionName = ref('')
const sessionMode = ref('ten_points')
const sessionError = ref('')

function modeLabel(id) {
  return getMode(id).label
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function addStudent() {
  studentError.value = ''
  try {
    store.addStudent(classId.value, studentName.value)
    studentName.value = ''
    showAddStudent.value = false
  } catch (e) {
    studentError.value = e.message
  }
}

function removeStudent(s) {
  if (!confirm(`Retirer ${s.name} de la classe ? Ses matchs seront aussi retirés.`)) return
  store.removeStudent(s.id)
}

function openSessionModal() {
  sessionError.value = ''
  sessionName.value = `Séance ${sessions.value.length + 1}`
  sessionMode.value = 'ten_points'
  showSession.value = true
}

function createSession() {
  sessionError.value = ''
  try {
    const session = store.createSession(classId.value, {
      name: sessionName.value,
      mode: sessionMode.value,
    })
    showSession.value = false
    router.push(`/session/${session.id}`)
  } catch (e) {
    sessionError.value = e.message
  }
}

function confirmDeleteClass() {
  if (!confirm(`Supprimer la classe « ${cls.value.name} » et toutes ses données ?`)) return
  store.deleteClass(classId.value)
  router.push('/')
}
</script>
