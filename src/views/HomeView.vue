<template>
  <div class="space-y-8">
    <section class="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-court-800 via-court-700 to-ink-900 text-white p-6 sm:p-8 shadow-xl">
      <div class="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div class="relative space-y-3 max-w-xl">
        <p class="text-sm font-medium text-emerald-100/90">Suivi de matchs · EPS</p>
        <h1 class="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          Classes, sessions, scores
        </h1>
        <p class="text-emerald-50/85 text-sm sm:text-base leading-relaxed">
          Créez vos classes, lancez une séance (10 points joués ou premier à 15),
          saisissez les matchs : les points (3 / 2 / 1) et le classement se mettent à jour seuls.
        </p>
      </div>
    </section>

    <section class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 class="font-display text-xl font-bold text-ink-900">Mes classes</h2>
          <p class="text-sm text-slate-500">Cliquez sur une classe pour gérer élèves et séances.</p>
        </div>
        <button type="button" class="btn-primary" @click="showCreate = true">
          <Plus :size="18" />
          Nouvelle classe
        </button>
      </div>

      <div v-if="store.classes.length === 0" class="card p-10 text-center space-y-3">
        <Users :size="36" class="mx-auto text-slate-300" />
        <p class="font-semibold text-ink-800">Aucune classe pour l’instant</p>
        <p class="text-sm text-slate-500">Commencez par créer une classe, puis ajoutez vos élèves.</p>
      </div>

      <div v-else class="grid gap-3 sm:grid-cols-2">
        <router-link
          v-for="c in store.classes"
          :key="c.id"
          :to="`/class/${c.id}`"
          class="card p-5 hover:border-court-500/50 hover:shadow-md transition group"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="font-display font-bold text-lg text-ink-900 group-hover:text-court-700">
                {{ c.name }}
              </h3>
              <p class="text-sm text-slate-500 mt-1">
                {{ store.studentsOf(c.id).length }} élève(s)
                · {{ store.sessionsOf(c.id).length }} séance(s)
              </p>
            </div>
            <ChevronRight :size="20" class="text-slate-300 group-hover:text-court-600 mt-1" />
          </div>
        </router-link>
      </div>
    </section>

    <section class="card p-5 space-y-3">
      <h2 class="font-display font-bold text-ink-900">Sauvegarde</h2>
      <p class="text-sm text-slate-500">
        Les données restent dans le navigateur de cet appareil (pas de cloud).
        Exportez un fichier JSON pour sauvegarder ou changer d’appareil.
      </p>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn-secondary" @click="exportJson">
          <Download :size="16" /> Exporter
        </button>
        <label class="btn-secondary cursor-pointer">
          <Upload :size="16" /> Importer
          <input type="file" accept="application/json,.json" class="hidden" @change="importJson" />
        </label>
      </div>
      <p v-if="backupMsg" class="text-xs text-court-700">{{ backupMsg }}</p>
    </section>

    <!-- Modal création -->
    <div v-if="showCreate" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/40 p-4" @click.self="showCreate = false">
      <form class="card w-full max-w-md p-6 space-y-4" @submit.prevent="create">
        <h3 class="font-display text-lg font-bold">Nouvelle classe</h3>
        <div>
          <label class="label" for="class-name">Nom</label>
          <input id="class-name" v-model="newName" class="input" placeholder="Ex. 3ème A" autofocus />
        </div>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn-secondary" @click="showCreate = false">Annuler</button>
          <button type="submit" class="btn-primary">Créer</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Users, ChevronRight, Download, Upload } from '@lucide/vue'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const router = useRouter()
const showCreate = ref(false)
const newName = ref('')
const error = ref('')
const backupMsg = ref('')

function create() {
  error.value = ''
  try {
    const c = store.createClass(newName.value)
    showCreate.value = false
    newName.value = ''
    router.push(`/class/${c.id}`)
  } catch (e) {
    error.value = e.message
  }
}

function exportJson() {
  const blob = new Blob([store.exportData()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `score-eps-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  backupMsg.value = 'Export téléchargé.'
}

async function importJson(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    store.importData(text)
    backupMsg.value = 'Import réussi.'
  } catch (e) {
    backupMsg.value = e.message || 'Import impossible.'
  }
  event.target.value = ''
}
</script>
