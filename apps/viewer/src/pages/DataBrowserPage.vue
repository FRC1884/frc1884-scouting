<template>
  <section class="rounded-[1.75rem] border border-white/80 bg-white/80 p-6 shadow-panel">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="font-code text-xs uppercase tracking-[0.3em] text-sea">Data Browser</p>
        <h2 class="mt-2 font-display text-2xl font-semibold text-ink">
          View and edit scouting data
        </h2>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          This page is dedicated to database inspection. Choose a match or a team, load the
          stored records, and save corrections back to the controller.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          class="rounded-full border border-gold/70 bg-gold/20 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold/30"
          type="button"
          :disabled="isRefreshing"
          @click="$emit('refresh')"
        >
          {{ isRefreshing ? 'Refreshing…' : 'Refresh Data' }}
        </button>

        <div class="flex flex-wrap gap-2 rounded-full bg-mist p-1">
          <button
            v-for="mode in viewModes"
            :key="mode.value"
            class="rounded-full px-4 py-2 text-sm font-semibold transition"
            :class="
              selectedMode === mode.value
                ? 'bg-ink text-white shadow-sm'
                : 'text-slate-600 hover:bg-white hover:text-ink'
            "
            type="button"
            @click="$emit('update:selectedMode', mode.value)"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="selectedMode === 'match'" class="mt-6 space-y-6">
      <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label class="space-y-2">
          <span class="text-sm font-semibold text-slate-700">Match type</span>
          <select
            :value="selectedMatchType"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
            @change="$emit('update:selectedMatchType', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="type in matchTypeOptions" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </label>

        <label class="space-y-2">
          <span class="text-sm font-semibold text-slate-700">Match number</span>
          <select
            :value="selectedMatchNumber"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
            @change="$emit('update:selectedMatchNumber', Number(($event.target as HTMLSelectElement).value))"
          >
            <option v-for="matchNumber in matchNumberOptions" :key="matchNumber" :value="matchNumber">
              Match {{ matchNumber }}
            </option>
          </select>
        </label>

        <div class="flex items-end">
          <button
            class="w-full rounded-2xl border border-sea/20 bg-sea/10 px-4 py-3 text-sm font-semibold text-sea transition hover:bg-sea/20"
            type="button"
            :disabled="loadingMatchView"
            @click="$emit('load-match')"
          >
            {{ loadingMatchView ? 'Loading…' : 'Load Match' }}
          </button>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <article class="rounded-3xl border border-slate-200 bg-mist/60 p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Selected match</p>
          <p class="mt-3 text-xl font-semibold text-ink">
            {{ selectedMatchType }} {{ selectedMatchNumber }}
          </p>
        </article>
        <article class="rounded-3xl border border-slate-200 bg-mist/60 p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Objective records</p>
          <p class="mt-3 text-xl font-semibold text-ink">{{ matchObjectiveRecords.length }}</p>
        </article>
        <article class="rounded-3xl border border-slate-200 bg-mist/60 p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Teams in view</p>
          <p class="mt-3 text-xl font-semibold text-ink">{{ matchTeamsLabel }}</p>
        </article>
      </div>

      <div class="space-y-4">
        <RecordEditorCard
          v-for="record in matchObjectiveRecords"
          :key="record.id"
          kind="objective"
          :record-id="record.id"
          :title="`Team ${record.content.info.teamNumber} • ${record.content.info.scoutId}`"
          :subtitle="`Match ${record.content.info.matchType} ${record.content.info.matchNumber}`"
          :value="recordDrafts[record.id] ?? formatJson(record.content)"
          :saving="savingRecordIds.has(record.id)"
          @update:value="$emit('update-record-draft', record.id, $event)"
          @save="$emit('save-objective-record', record.id)"
        />
        <p
          v-if="matchObjectiveRecords.length === 0"
          class="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-slate-500"
        >
          No objective records were found for this match.
        </p>
      </div>
    </div>

    <div v-else class="mt-6 space-y-6">
      <div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <label class="space-y-2">
          <span class="text-sm font-semibold text-slate-700">Team number</span>
          <select
            :value="selectedTeamNumber"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
            @change="$emit('update:selectedTeamNumber', Number(($event.target as HTMLSelectElement).value))"
          >
            <option v-for="teamNumber in teamNumberOptions" :key="teamNumber" :value="teamNumber">
              Team {{ teamNumber }}
            </option>
          </select>
        </label>

        <div class="flex items-end">
          <button
            class="w-full rounded-2xl border border-sea/20 bg-sea/10 px-4 py-3 text-sm font-semibold text-sea transition hover:bg-sea/20"
            type="button"
            :disabled="loadingTeamView"
            @click="$emit('load-team')"
          >
            {{ loadingTeamView ? 'Loading…' : 'Load Team' }}
          </button>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <article class="rounded-3xl border border-slate-200 bg-mist/60 p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Selected team</p>
          <p class="mt-3 text-xl font-semibold text-ink">{{ selectedTeamNumber }}</p>
        </article>
        <article class="rounded-3xl border border-slate-200 bg-mist/60 p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Objective records</p>
          <p class="mt-3 text-xl font-semibold text-ink">{{ teamObjectiveRecords.length }}</p>
        </article>
        <article class="rounded-3xl border border-slate-200 bg-mist/60 p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Pit records</p>
          <p class="mt-3 text-xl font-semibold text-ink">{{ teamPitRecords.length }}</p>
        </article>
      </div>

      <div class="grid gap-6 xl:grid-cols-2">
        <section class="space-y-4">
          <div>
            <p class="font-code text-xs uppercase tracking-[0.3em] text-sea">Objective History</p>
            <h3 class="mt-2 font-display text-xl font-semibold text-ink">Match scouting entries</h3>
          </div>
          <RecordEditorCard
            v-for="record in teamObjectiveRecords"
            :key="record.id"
            kind="objective"
            :record-id="record.id"
            :title="`Match ${record.content.info.matchType} ${record.content.info.matchNumber}`"
            :subtitle="record.content.info.scoutId"
            :value="recordDrafts[record.id] ?? formatJson(record.content)"
            :saving="savingRecordIds.has(record.id)"
            @update:value="$emit('update-record-draft', record.id, $event)"
            @save="$emit('save-objective-record', record.id)"
          />
          <p
            v-if="teamObjectiveRecords.length === 0"
            class="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-slate-500"
          >
            No objective records were found for this team.
          </p>
        </section>

        <section class="space-y-4">
          <div>
            <p class="font-code text-xs uppercase tracking-[0.3em] text-ember">Pit History</p>
            <h3 class="mt-2 font-display text-xl font-semibold text-ink">Pit scouting entries</h3>
          </div>
          <RecordEditorCard
            v-for="record in teamPitRecords"
            :key="record.id"
            kind="pit"
            :record-id="record.id"
            :title="`Team ${record.content.info.teamNumber}`"
            subtitle="Pit record"
            :value="recordDrafts[record.id] ?? formatJson(record.content)"
            :saving="savingRecordIds.has(record.id)"
            @update:value="$emit('update-record-draft', record.id, $event)"
            @save="$emit('save-pit-record', record.id)"
          />
          <p
            v-if="teamPitRecords.length === 0"
            class="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-slate-500"
          >
            No pit records were found for this team.
          </p>
        </section>
      </div>
    </div>

    <p v-if="errorMessage" class="mt-6 text-sm text-rose-600">
      {{ errorMessage }}
    </p>
  </section>
</template>

<script setup lang="ts">
import RecordEditorCard from '../components/RecordEditorCard.vue';
import type { MatchType, ObjectiveRecord, PitRecord } from '../types/viewer';

defineProps<{
  isRefreshing: boolean;
  loadingMatchView: boolean;
  loadingTeamView: boolean;
  errorMessage: string | null;
  selectedMode: 'match' | 'team';
  selectedMatchType: MatchType;
  selectedMatchNumber: number;
  selectedTeamNumber: number;
  matchTypeOptions: MatchType[];
  matchNumberOptions: number[];
  teamNumberOptions: number[];
  matchObjectiveRecords: ObjectiveRecord[];
  teamObjectiveRecords: ObjectiveRecord[];
  teamPitRecords: PitRecord[];
  matchTeamsLabel: string;
  recordDrafts: Record<string, string>;
  savingRecordIds: Set<string>;
}>();

defineEmits<{
  (event: 'refresh'): void;
  (event: 'update:selectedMode', value: 'match' | 'team'): void;
  (event: 'update:selectedMatchType', value: MatchType): void;
  (event: 'update:selectedMatchNumber', value: number): void;
  (event: 'update:selectedTeamNumber', value: number): void;
  (event: 'load-match'): void;
  (event: 'load-team'): void;
  (event: 'update-record-draft', recordId: string, value: string): void;
  (event: 'save-objective-record', recordId: string): void;
  (event: 'save-pit-record', recordId: string): void;
}>();

const viewModes = [
  { label: 'By Match', value: 'match' as const },
  { label: 'By Team', value: 'team' as const },
];

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}
</script>
