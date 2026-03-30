<template>
  <main class="min-h-screen">
    <div class="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10">
      <header
        class="rounded-[2rem] border border-white/70 bg-white/70 px-6 py-5 shadow-panel backdrop-blur"
      >
        <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="font-code text-xs uppercase tracking-[0.35em] text-sea">Griffins Scout Viewer</p>
            <h1 class="mt-2 font-display text-3xl font-bold text-ink md:text-4xl">
              Scouting operations workspace
            </h1>
            <p class="mt-2 max-w-2xl text-sm leading-7 text-slate-700 md:text-base">
              Keep each tool on its own page. The landing page is the hub, the data browser is a
              dedicated workspace, and future viewer pages can plug into the same navigation.
            </p>
          </div>

          <nav class="flex flex-wrap gap-2">
            <button
              v-for="page in pages"
              :key="page.value"
              class="rounded-full px-4 py-2 text-sm font-semibold transition"
              :class="
                currentPage === page.value
                  ? 'bg-ink text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-sea/30 hover:text-ink'
              "
              type="button"
              @click="goToPage(page.value)"
            >
              {{ page.label }}
            </button>
          </nav>
        </div>
      </header>

      <HomePage
        v-if="currentPage === 'home'"
        :scanner-url="scannerUrl"
        :is-refreshing="isRefreshing"
        :controller-ok="controllerOk"
        :error-message="errorMessage"
        :page-cards="pageCards"
        :stats="stats"
        @refresh="refreshDashboard"
        @open-page="goToPage"
      />

      <DataBrowserPage
        v-else-if="currentPage === 'browser'"
        :is-refreshing="isRefreshing"
        :loading-match-view="loadingMatchView"
        :loading-team-view="loadingTeamView"
        :error-message="errorMessage"
        :selected-mode="selectedMode"
        :selected-match-type="selectedMatchType"
        :selected-match-number="selectedMatchNumber"
        :selected-team-number="selectedTeamNumber"
        :match-type-options="matchTypeOptions"
        :match-number-options="matchNumberOptions"
        :team-number-options="teamNumberOptions"
        :match-objective-records="matchObjectiveRecords"
        :team-objective-records="teamObjectiveRecords"
        :team-pit-records="teamPitRecords"
        :match-teams-label="matchTeamsLabel"
        :record-drafts="recordDrafts"
        :saving-record-ids="savingRecordIds"
        @refresh="refreshDashboard"
        @update:selected-mode="selectedMode = $event"
        @update:selected-match-type="selectedMatchType = $event"
        @update:selected-match-number="selectedMatchNumber = $event"
        @update:selected-team-number="selectedTeamNumber = $event"
        @load-match="loadMatchView"
        @load-team="loadTeamView"
        @update-record-draft="setRecordDraft"
        @save-objective-record="saveObjectiveRecord"
        @save-pit-record="savePitRecord"
      />

      <PlaceholderPage v-else />
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import HomePage from './pages/HomePage.vue';
import DataBrowserPage from './pages/DataBrowserPage.vue';
import PlaceholderPage from './pages/PlaceholderPage.vue';
import { useViewerData } from './composables/useViewerData';
import type { PageCard, ViewerPage } from './types/viewer';

const pages = [
  { label: 'Home', value: 'home' as const },
  { label: 'Data Browser', value: 'browser' as const },
  { label: 'Performance', value: 'performance' as const },
];

const pageCards: PageCard[] = [
  {
    kicker: 'Ready Now',
    label: 'Data Browser',
    value: 'browser' as const,
    description: 'Inspect database records by match or team, then edit and save corrected JSON.',
    disabled: false,
  },
  {
    kicker: 'Coming Next',
    label: 'Performance',
    value: 'performance' as const,
    description: 'Reserve a dedicated page for scout performance and quality metrics.',
    disabled: true,
  },
  {
    kicker: 'Future Slot',
    label: 'Reports',
    value: 'performance' as const,
    description: 'Keep room for exports, reports, and workflow-specific tools without crowding the hub.',
    disabled: true,
  },
];

const currentPage = ref<ViewerPage>('home');
const {
  controllerOk,
  errorMessage,
  isRefreshing,
  loadingMatchView,
  loadingTeamView,
  selectedMode,
  selectedMatchType,
  selectedMatchNumber,
  selectedTeamNumber,
  recordDrafts,
  savingRecordIds,
  matchTypeOptions,
  matchNumberOptions,
  teamNumberOptions,
  matchObjectiveRecords,
  teamObjectiveRecords,
  teamPitRecords,
  matchTeamsLabel,
  stats,
  refreshDashboard,
  loadMatchView,
  loadTeamView,
  setRecordDraft,
  saveObjectiveRecord,
  savePitRecord,
} = useViewerData();

const scannerUrl = computed(() => {
  const configured = import.meta.env.VITE_SCANNER_URL;
  if (configured) return configured;

  return new URL('http://localhost:3001').toString();
});

function normalizePage(hash: string): ViewerPage {
  if (hash === '#browser') return 'browser';
  if (hash === '#performance') return 'performance';
  return 'home';
}

function syncPageFromHash() {
  currentPage.value = normalizePage(window.location.hash);
}

function goToPage(page: ViewerPage) {
  const targetHash = page === 'home' ? '#home' : `#${page}`;
  if (window.location.hash === targetHash) {
    currentPage.value = page;
    return;
  }

  window.location.hash = targetHash;
}

onMounted(async () => {
  syncPageFromHash();
  window.addEventListener('hashchange', syncPageFromHash);
  await refreshDashboard();
});

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncPageFromHash);
});
</script>
