<template>
  <main class="min-h-screen">
    <div class="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
      <section
        class="overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-panel backdrop-blur"
      >
        <div class="grid gap-8 p-8 lg:grid-cols-[1.3fr_0.9fr] lg:p-10">
          <div class="space-y-6">
            <div class="space-y-3">
              <p class="font-code text-xs uppercase tracking-[0.35em] text-sea">
                Griffins Scout Viewer
              </p>
              <h1 class="max-w-3xl font-display text-4xl font-bold leading-tight text-ink md:text-5xl">
                One place to launch tools now and inspect scouting data as the web viewer grows.
              </h1>
              <p class="max-w-2xl text-sm leading-7 text-slate-700 md:text-base">
                This viewer is the new web entrypoint. It can launch the scanner immediately,
                check controller health, and surface recent objective, pit, and match data from
                the backend.
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <a
                class="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-sea"
                :href="scannerUrl"
                target="_blank"
                rel="noreferrer"
              >
                Open Scanner
              </a>
              <a
                class="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-sea hover:text-sea"
                href="/trpc-playground"
                target="_blank"
                rel="noreferrer"
              >
                Open API Playground
              </a>
              <button
                class="rounded-full border border-gold/70 bg-gold/20 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-gold/30"
                type="button"
                @click="refreshDashboard"
              >
                Refresh Data
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
          </div>

          <div class="space-y-4 rounded-[1.5rem] bg-ink p-6 text-white">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="font-code text-xs uppercase tracking-[0.3em] text-gold/80">
                  Live Status
                </p>
                <h2 class="mt-2 font-display text-2xl font-semibold">
                  Viewer Mission Board
                </h2>
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
                Objective records loaded:
                <span class="font-code text-gold">{{ objectiveRecords.length }}</span>
              </p>
              <p>
                Pit records loaded:
                <span class="font-code text-gold">{{ pitRecords.length }}</span>
              </p>
              <p>
                TBA matches loaded:
                <span class="font-code text-gold">{{ matches.length }}</span>
              </p>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                Next Viewer Areas
              </p>
              <ul class="mt-3 space-y-2 text-sm text-slate-200">
                <li>Team drill-down pages with averages and trends</li>
                <li>Match planning and alliance comparison views</li>
                <li>Pit + objective merged summaries</li>
                <li>Export and sync controls for operators</li>
              </ul>
            </div>

            <p v-if="errorMessage" class="text-sm text-rose-200">
              {{ errorMessage }}
            </p>
          </div>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article class="rounded-[1.75rem] border border-white/80 bg-white/80 p-6 shadow-panel">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="font-code text-xs uppercase tracking-[0.3em] text-sea">
                Recent Matches
              </p>
              <h2 class="mt-2 font-display text-2xl font-semibold text-ink">
                Match queue snapshot
              </h2>
            </div>
            <p class="text-sm text-slate-500">
              {{ matches.length }} total matches
            </p>
          </div>

          <div class="mt-5 overflow-hidden rounded-3xl border border-slate-200">
            <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead class="bg-mist">
                <tr>
                  <th class="px-4 py-3 font-semibold text-slate-600">Match</th>
                  <th class="px-4 py-3 font-semibold text-slate-600">Type</th>
                  <th class="px-4 py-3 font-semibold text-slate-600">Set</th>
                  <th class="px-4 py-3 font-semibold text-slate-600">Key</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 bg-white">
                <tr v-for="match in recentMatches" :key="match.key">
                  <td class="px-4 py-3 font-semibold text-ink">
                    {{ match.match_number }}
                  </td>
                  <td class="px-4 py-3 text-slate-600">
                    {{ match.comp_level }}
                  </td>
                  <td class="px-4 py-3 text-slate-600">
                    {{ match.set_number }}
                  </td>
                  <td class="px-4 py-3 font-code text-xs text-slate-500">
                    {{ match.key }}
                  </td>
                </tr>
                <tr v-if="recentMatches.length === 0">
                  <td class="px-4 py-6 text-slate-500" colspan="4">
                    No match data loaded yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <div class="grid gap-6">
          <article class="rounded-[1.75rem] border border-white/80 bg-white/80 p-6 shadow-panel">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="font-code text-xs uppercase tracking-[0.3em] text-sea">
                  Objective Teams
                </p>
                <h2 class="mt-2 font-display text-2xl font-semibold text-ink">
                  Most recent objective entries
                </h2>
              </div>
              <p class="text-sm text-slate-500">
                {{ uniqueObjectiveTeams.length }} unique teams
              </p>
            </div>

            <div class="mt-5 flex flex-wrap gap-2">
              <span
                v-for="team in uniqueObjectiveTeams"
                :key="team"
                class="rounded-full border border-sea/20 bg-sea/10 px-3 py-1 text-sm font-semibold text-sea"
              >
                {{ team }}
              </span>
              <p v-if="uniqueObjectiveTeams.length === 0" class="text-sm text-slate-500">
                No objective records yet.
              </p>
            </div>
          </article>

          <article class="rounded-[1.75rem] border border-white/80 bg-white/80 p-6 shadow-panel">
            <div class="flex items-center justify-between gap-4">
              <div>
                <p class="font-code text-xs uppercase tracking-[0.3em] text-sea">
                  Pit Teams
                </p>
                <h2 class="mt-2 font-display text-2xl font-semibold text-ink">
                  Most recent pit entries
                </h2>
              </div>
              <p class="text-sm text-slate-500">
                {{ uniquePitTeams.length }} unique teams
              </p>
            </div>

            <div class="mt-5 flex flex-wrap gap-2">
              <span
                v-for="team in uniquePitTeams"
                :key="team"
                class="rounded-full border border-ember/20 bg-ember/10 px-3 py-1 text-sm font-semibold text-ember"
              >
                {{ team }}
              </span>
              <p v-if="uniquePitTeams.length === 0" class="text-sm text-slate-500">
                No pit records yet.
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { client, type RouterOutput } from './api';

type ObjectiveRecord = RouterOutput['objective']['findAll'][number];
type PitRecord = RouterOutput['pit']['findAll'][number];
type MatchRecord = RouterOutput['blueAlliance']['findAllClean'][number];

const objectiveRecords = ref<ObjectiveRecord[]>([]);
const pitRecords = ref<PitRecord[]>([]);
const matches = ref<MatchRecord[]>([]);
const controllerOk = ref(false);
const errorMessage = ref<string | null>(null);

const scannerUrl = computed(() => {
  const configured = import.meta.env.VITE_SCANNER_URL;
  if (configured) return configured;

  return new URL('http://127.0.0.1:3001').toString();
});

const uniqueObjectiveTeams = computed(() => {
  return [...new Set(objectiveRecords.value.map((record) => record.content.info.teamNumber))]
    .slice(-12)
    .reverse();
});

const uniquePitTeams = computed(() => {
  return [...new Set(pitRecords.value.map((record) => record.content.info.teamNumber))]
    .slice(-12)
    .reverse();
});

const recentMatches = computed(() => {
  return [...matches.value]
    .sort((a, b) => {
      if (a.comp_level === b.comp_level) {
        if (a.match_number === b.match_number) {
          return b.set_number - a.set_number;
        }

        return b.match_number - a.match_number;
      }

      return a.comp_level.localeCompare(b.comp_level);
    })
    .slice(0, 8);
});

const stats = computed(() => [
  {
    label: 'Objective Records',
    value: objectiveRecords.value.length,
    caption: 'Quantitative match scouting submissions',
  },
  {
    label: 'Pit Records',
    value: pitRecords.value.length,
    caption: 'Pit interviews and robot snapshots',
  },
  {
    label: 'Match Entries',
    value: matches.value.length,
    caption: 'Match schedule data synced to the controller',
  },
  {
    label: 'Tracked Teams',
    value: new Set([
      ...objectiveRecords.value.map((record) => record.content.info.teamNumber),
      ...pitRecords.value.map((record) => record.content.info.teamNumber),
    ]).size,
    caption: 'Unique teams seen in scouting data',
  },
]);

async function refreshDashboard() {
  errorMessage.value = null;

  try {
    const [objective, pit, matchList] = await Promise.all([
      client.objective.findAll.query(),
      client.pit.findAll.query(),
      client.blueAlliance.findAllClean.query(),
    ]);

    objectiveRecords.value = objective;
    pitRecords.value = pit;
    matches.value = matchList;
    controllerOk.value = true;
  } catch (error) {
    controllerOk.value = false;
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Unable to reach the controller. Check the backend and try again.';
  }
}

onMounted(async () => {
  await refreshDashboard();
});
</script>
