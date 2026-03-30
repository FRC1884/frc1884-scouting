import { computed, ref } from 'vue';
import { client } from '../api';
import type { MatchRecord, MatchType, ObjectiveRecord, PitRecord } from '../types/viewer';

export function useViewerData() {
  const objectiveRecords = ref<ObjectiveRecord[]>([]);
  const pitRecords = ref<PitRecord[]>([]);
  const matches = ref<MatchRecord[]>([]);
  const matchObjectiveRecords = ref<ObjectiveRecord[]>([]);
  const teamObjectiveRecords = ref<ObjectiveRecord[]>([]);
  const teamPitRecords = ref<PitRecord[]>([]);
  const controllerOk = ref(false);
  const errorMessage = ref<string | null>(null);
  const isRefreshing = ref(false);
  const loadingMatchView = ref(false);
  const loadingTeamView = ref(false);
  const selectedMode = ref<'match' | 'team'>('match');
  const selectedMatchType = ref<MatchType>('Qualification');
  const selectedMatchNumber = ref<number>(1);
  const selectedTeamNumber = ref<number>(0);
  const recordDrafts = ref<Record<string, string>>({});
  const savingRecordIds = ref(new Set<string>());

  const allTrackedTeams = computed(() =>
    [
      ...new Set([
        ...objectiveRecords.value.map((record) => record.content.info.teamNumber),
        ...pitRecords.value.map((record) => record.content.info.teamNumber),
      ]),
    ].sort((a, b) => a - b)
  );

  const teamNumberOptions = computed(() => allTrackedTeams.value);

  const matchTypeOptions = computed<MatchType[]>(() => {
    const options = [...new Set(objectiveRecords.value.map((record) => record.content.info.matchType))];
    if (options.length === 0) return ['Qualification'];
    return options.sort();
  });

  const matchNumberOptions = computed(() => {
    const fromObjective = objectiveRecords.value
      .filter((record) => record.content.info.matchType === selectedMatchType.value)
      .map((record) => record.content.info.matchNumber);
    const fromTba = matches.value
      .filter((match) => mapCompLevelToMatchType(match.comp_level) === selectedMatchType.value)
      .map((match) => match.match_number);

    const values = [...new Set([...fromObjective, ...fromTba])].sort((a, b) => a - b);
    return values.length > 0 ? values : [1];
  });

  const matchTeamsLabel = computed(() => {
    const teams = [...new Set(matchObjectiveRecords.value.map((record) => record.content.info.teamNumber))];
    return teams.length > 0 ? teams.join(', ') : 'None';
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
      value: allTrackedTeams.value.length,
      caption: 'Unique teams seen in scouting data',
    },
  ]);

  function mapCompLevelToMatchType(compLevel: MatchRecord['comp_level']): MatchType {
    if (compLevel === 'qm') return 'Qualification';
    if (compLevel === 'ef' || compLevel === 'qf' || compLevel === 'sf' || compLevel === 'f') {
      return 'Elimination';
    }
    return 'Practice';
  }

  function formatJson(value: unknown) {
    return JSON.stringify(value, null, 2);
  }

  function setRecordDraft(recordId: string, value: string) {
    recordDrafts.value = {
      ...recordDrafts.value,
      [recordId]: value,
    };
  }

  function ensureDefaultsAfterRefresh() {
    if (!matchTypeOptions.value.includes(selectedMatchType.value)) {
      selectedMatchType.value = matchTypeOptions.value[0];
    }

    if (!matchNumberOptions.value.includes(selectedMatchNumber.value)) {
      selectedMatchNumber.value = matchNumberOptions.value[0];
    }

    if (!teamNumberOptions.value.includes(selectedTeamNumber.value)) {
      selectedTeamNumber.value = teamNumberOptions.value[0] ?? 0;
    }
  }

  async function refreshDashboard() {
    errorMessage.value = null;
    isRefreshing.value = true;

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
      ensureDefaultsAfterRefresh();

      if (selectedMode.value === 'match') {
        await loadMatchView();
      } else {
        await loadTeamView();
      }
    } catch (error) {
      controllerOk.value = false;
      errorMessage.value =
        error instanceof Error
          ? error.message
          : 'Unable to reach the controller. Check the backend and try again.';
    } finally {
      isRefreshing.value = false;
    }
  }

  async function loadMatchView() {
    errorMessage.value = null;
    loadingMatchView.value = true;

    try {
      matchObjectiveRecords.value = await client.objective.findByMatch.query({
        matchType: selectedMatchType.value,
        matchNumber: selectedMatchNumber.value,
      });
      controllerOk.value = true;
    } catch (error) {
      controllerOk.value = false;
      errorMessage.value =
        error instanceof Error ? error.message : 'Unable to load match records.';
    } finally {
      loadingMatchView.value = false;
    }
  }

  async function loadTeamView() {
    errorMessage.value = null;
    loadingTeamView.value = true;

    try {
      const [objective, pit] = await Promise.all([
        client.objective.findByTeam.query({
          teamNumber: selectedTeamNumber.value,
        }),
        client.pit.findByTeam.query({
          teamNumber: selectedTeamNumber.value,
        }),
      ]);

      teamObjectiveRecords.value = objective.sort(
        (left: ObjectiveRecord, right: ObjectiveRecord) =>
          left.content.info.matchNumber - right.content.info.matchNumber
      );
      teamPitRecords.value = pit;
      controllerOk.value = true;
    } catch (error) {
      controllerOk.value = false;
      errorMessage.value = error instanceof Error ? error.message : 'Unable to load team records.';
    } finally {
      loadingTeamView.value = false;
    }
  }

  async function saveObjectiveRecord(recordId: string) {
    const record = [...matchObjectiveRecords.value, ...teamObjectiveRecords.value].find(
      (candidate) => candidate.id === recordId
    );
    if (!record) return;

    const draft = recordDrafts.value[recordId] ?? formatJson(record.content);
    const nextSavingRecordIds = new Set(savingRecordIds.value);
    nextSavingRecordIds.add(recordId);
    savingRecordIds.value = nextSavingRecordIds;
    errorMessage.value = null;

    try {
      await client.objective.updateOne.mutate({
        id: recordId,
        record: JSON.parse(draft),
      });
      await refreshDashboard();
    } catch (error) {
      errorMessage.value =
        error instanceof Error ? error.message : 'Unable to save objective record changes.';
    } finally {
      const updatedSavingRecordIds = new Set(savingRecordIds.value);
      updatedSavingRecordIds.delete(recordId);
      savingRecordIds.value = updatedSavingRecordIds;
    }
  }

  async function savePitRecord(recordId: string) {
    const record = teamPitRecords.value.find((candidate) => candidate.id === recordId);
    if (!record) return;

    const draft = recordDrafts.value[recordId] ?? formatJson(record.content);
    const nextSavingRecordIds = new Set(savingRecordIds.value);
    nextSavingRecordIds.add(recordId);
    savingRecordIds.value = nextSavingRecordIds;
    errorMessage.value = null;

    try {
      await client.pit.updateOne.mutate({
        id: recordId,
        record: JSON.parse(draft),
      });
      await refreshDashboard();
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : 'Unable to save pit record changes.';
    } finally {
      const updatedSavingRecordIds = new Set(savingRecordIds.value);
      updatedSavingRecordIds.delete(recordId);
      savingRecordIds.value = updatedSavingRecordIds;
    }
  }

  return {
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
  };
}
