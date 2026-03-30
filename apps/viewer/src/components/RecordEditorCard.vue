<template>
  <article class="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div class="space-y-1">
        <p class="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
          {{ kind === 'objective' ? 'Objective record' : 'Pit record' }}
        </p>
        <h4 class="text-lg font-semibold text-ink">{{ title }}</h4>
        <p class="text-sm text-slate-500">{{ subtitle }}</p>
      </div>
      <span class="rounded-full bg-mist px-3 py-1 font-code text-xs text-slate-500">
        {{ recordId }}
      </span>
    </div>

    <textarea
      class="mt-4 min-h-[18rem] w-full rounded-3xl border border-slate-200 bg-slate-950 px-4 py-4 font-mono text-sm leading-6 text-slate-100 outline-none transition focus:border-gold"
      :value="value"
      @input="handleInput"
    ></textarea>

    <div class="mt-4 flex justify-end">
      <button
        class="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-sea disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        :disabled="saving"
        @click="$emit('save')"
      >
        {{ saving ? 'Saving…' : 'Save Changes' }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  kind: 'objective' | 'pit';
  recordId: string;
  title: string;
  subtitle: string;
  value: string;
  saving: boolean;
}>();

const emit = defineEmits<{
  (event: 'save'): void;
  (event: 'update:value', value: string): void;
}>();

function handleInput(event: Event) {
  emit('update:value', (event.target as HTMLTextAreaElement).value);
}
</script>
