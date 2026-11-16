<template>
  <div v-if="!cls" class="card p-8 text-center space-y-3">
    <p>Classe introuvable.</p>
    <router-link to="/" class="btn-primary inline-flex">Accueil</router-link>
  </div>
  <div v-else class="space-y-6">
    <div class="flex flex-wrap items-center gap-3">
      <router-link :to="`/class/${classId}`" class="btn-secondary">
        <ArrowLeft :size="16" /> Retour
      </router-link>
      <div>
        <h1 class="font-display text-2xl font-bold text-ink-900">Classement général</h1>
        <p class="text-sm text-slate-500">{{ cls.name }} · cumul de toutes les séances</p>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-4 py-3">#</th>
              <th class="px-4 py-3">Élève</th>
              <th class="px-4 py-3 text-center">Pts</th>
              <th class="px-4 py-3 text-center hidden sm:table-cell">V</th>
              <th class="px-4 py-3 text-center hidden sm:table-cell">N</th>
              <th class="px-4 py-3 text-center hidden sm:table-cell">D</th>
              <th class="px-4 py-3 text-center">Matchs</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in ranking"
              :key="row.studentId"
              class="border-t border-slate-100"
              :class="i < 3 ? 'bg-court-50/40' : ''"
            >
              <td class="px-4 py-3 font-bold text-court-800">{{ i + 1 }}</td>
              <td class="px-4 py-3 font-semibold">{{ row.name }}</td>
              <td class="px-4 py-3 text-center font-bold text-court-700">{{ row.points }}</td>
              <td class="px-4 py-3 text-center hidden sm:table-cell">{{ row.wins }}</td>
              <td class="px-4 py-3 text-center hidden sm:table-cell">{{ row.draws }}</td>
              <td class="px-4 py-3 text-center hidden sm:table-cell">{{ row.losses }}</td>
              <td class="px-4 py-3 text-center">{{ row.matchesPlayed }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="ranking.length === 0" class="p-8 text-center text-slate-500 text-sm">
        Aucun élève dans cette classe.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { useAppStore } from '../stores/app'
import { overallRanking } from '../utils/scoring'

const route = useRoute()
const store = useAppStore()
const classId = computed(() => route.params.classId)
const cls = computed(() => store.classes.find((c) => c.id === classId.value))

const ranking = computed(() =>
  overallRanking({
    students: store.studentsOf(classId.value),
    sessions: store.sessionsOf(classId.value),
    matches: store.matches,
  })
)
</script>
