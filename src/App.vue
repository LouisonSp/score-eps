<template>
  <div class="min-h-dvh flex flex-col">
    <header class="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div class="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between gap-3">
        <router-link to="/" class="flex items-center gap-2 min-w-0">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-court-700 text-white shadow-md shadow-court-700/30">
            <Trophy :size="18" />
          </span>
          <span class="font-display font-bold text-ink-900 tracking-tight truncate">Score EPS</span>
        </router-link>
        <p class="hidden sm:block text-xs text-slate-500">
          Données stockées sur cet appareil
        </p>
      </div>
    </header>
    <main class="flex-1 mx-auto w-full max-w-5xl px-4 py-6 pb-24">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { Trophy } from '@lucide/vue'
</script>
