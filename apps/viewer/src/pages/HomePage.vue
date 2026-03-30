<template>
  <section
    class="overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-panel backdrop-blur"
  >
    <div class="grid items-start gap-8 p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
      <div class="space-y-6">
        <div class="space-y-3">
          <p class="font-code text-xs uppercase tracking-[0.35em] text-sea">Landing Page</p>
          <h2 class="max-w-3xl font-display text-4xl font-bold leading-tight text-ink md:text-5xl">
            Launch into 1884&apos;s scouting operation
          </h2>
          <p class="max-w-2xl text-sm leading-7 text-slate-700 md:text-base">
            This page stays focused on navigation and live status. Use it as the front door for
            the viewer, then move into a dedicated page when you need a specific workflow.
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <a
            v-if="canOpenScanner"
            class="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-sea"
            :href="scannerUrl"
            target="_blank"
            rel="noreferrer"
          >
            Open Scanner
          </a>
          <button
            v-else
            class="rounded-full border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-400"
            type="button"
            disabled
          >
            Scanner Requires Editor/Admin
          </button>
          <button
            class="rounded-full border border-gold/70 bg-gold/20 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-gold/30"
            type="button"
            :disabled="isRefreshing"
            @click="$emit('refresh')"
          >
            {{ isRefreshing ? 'Refreshing…' : 'Refresh Data' }}
          </button>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="stat in stats"
            :key="stat.label"
            class="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm"
          >
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              {{ stat.label }}
            </p>
            <p class="mt-4 font-display text-3xl font-bold text-ink">
              {{ stat.value }}
            </p>
            <p class="mt-2 text-sm text-slate-600">
              {{ stat.caption }}
            </p>
          </article>
        </div>

        <div class="grid gap-4 lg:grid-cols-3">
          <article
            v-for="entry in pageCards"
            :key="`${entry.value}-${entry.label}`"
            class="flex h-full flex-col justify-between rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div>
              <p class="font-code text-xs uppercase tracking-[0.25em] text-sea">{{ entry.kicker }}</p>
              <h3 class="mt-3 font-display text-2xl font-semibold text-ink">{{ entry.label }}</h3>
              <p class="mt-3 text-sm leading-6 text-slate-600">{{ entry.description }}</p>
            </div>
            <button
              class="mt-6 rounded-full border border-sea/20 bg-sea/10 px-4 py-3 text-sm font-semibold text-sea transition hover:bg-sea/20 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
              type="button"
              :disabled="entry.disabled"
              @click="$emit('open-page', entry.value)"
            >
              {{ entry.disabled ? 'Unavailable' : `Open ${entry.label}` }}
            </button>
          </article>
        </div>
      </div>

      <div class="self-start space-y-4 rounded-[1.5rem] bg-ink p-6 text-white">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="font-code text-xs uppercase tracking-[0.3em] text-gold/80">Live Status</p>
            <h2 class="mt-2 font-display text-2xl font-semibold">Current state of data</h2>
          </div>
          <span
            class="rounded-full px-3 py-1 text-xs font-semibold"
            :class="controllerOk ? 'bg-emerald-400/20 text-emerald-200' : 'bg-rose-400/20 text-rose-200'"
          >
            {{ controllerOk ? 'Controller reachable' : 'Controller unavailable' }}
          </span>
        </div>

        <div class="space-y-3 text-sm text-slate-200">
          <p>
            Scanner target:
            <span class="font-code text-gold">{{ scannerUrl }}</span>
          </p>
          <p>
            Scanner access:
            <span class="text-slate-300">editor and admin roles only</span>
          </p>
          <p>
            First admin:
            <span class="text-slate-300">must be created manually, no default account exists</span>
          </p>
          <p>
            User management:
            <span class="text-slate-300">admin-only page for assigning roles</span>
          </p>
        </div>

        <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            Upcoming Slots
          </p>
          <ul class="mt-3 space-y-2 text-sm text-slate-200">
            <li>Scout performance dashboard</li>
            <li>Fix workflow</li>
            <li>Exports and reports</li>
          </ul>
        </div>

        <p v-if="errorMessage" class="text-sm text-rose-200">
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { PageCard, ViewerPage, ViewerStat } from '../types/viewer';

defineProps<{
  scannerUrl: string;
  canOpenScanner: boolean;
  isRefreshing: boolean;
  controllerOk: boolean;
  errorMessage: string | null;
  pageCards: PageCard[];
  stats: ViewerStat[];
}>();

defineEmits(['refresh', 'open-page']);
</script>
