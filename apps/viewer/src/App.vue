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
                  : page.disabled
                    ? 'border border-slate-200 bg-slate-100 text-slate-400'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-sea/30 hover:text-ink'
              "
              type="button"
              :disabled="page.disabled"
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
        :can-open-scanner="canEditData"
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
        :can-edit-data="canEditData"
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

      <AccountPage
        v-else-if="currentPage === 'account'"
        :is-loading-auth="isLoadingAuth"
        :is-submitting="isSubmittingAuth"
        :auth-error="authError"
        :profile-message="profileMessage"
        :requires-setup="requiresSetup"
        :current-user="currentUser"
        :is-admin="isAdmin"
        :login-username="loginUsername"
        :login-password="loginPassword"
        :setup-username="setupUsername"
        :setup-password="setupPassword"
        :setup-password-confirm="setupPasswordConfirm"
        :setup-validation-message="setupValidationMessage"
        :can-bootstrap-admin="canBootstrapAdmin"
        :profile-username="profileUsername"
        :current-password="currentPassword"
        :new-password="newPassword"
        :new-password-confirm="newPasswordConfirm"
        :profile-validation-message="profileValidationMessage"
        :change-password-message="changePasswordMessage"
        :can-save-profile="canSaveProfile"
        :can-change-password="canChangePassword"
        :new-user-username="newUserUsername"
        :new-user-password="newUserPassword"
        :new-user-password-confirm="newUserPasswordConfirm"
        :new-user-role="newUserRole"
        :create-user-validation-message="createUserValidationMessage"
        :can-create-user="canCreateUser"
        :role-drafts="roleDrafts"
        :users="users"
        @update:login-username="loginUsername = $event"
        @update:login-password="loginPassword = $event"
        @update:setup-username="setupUsername = $event"
        @update:setup-password="setupPassword = $event"
        @update:setup-password-confirm="setupPasswordConfirm = $event"
        @update:profile-username="profileUsername = $event"
        @update:current-password="currentPassword = $event"
        @update:new-password="newPassword = $event"
        @update:new-password-confirm="newPasswordConfirm = $event"
        @update:new-user-username="newUserUsername = $event"
        @update:new-user-password="newUserPassword = $event"
        @update:new-user-password-confirm="newUserPasswordConfirm = $event"
        @update:new-user-role="newUserRole = $event"
        @update:role-draft="setRoleDraft"
        @bootstrap-admin="handleBootstrapAdmin"
        @login="handleLogin"
        @logout="logout"
        @save-profile="handleSaveProfile"
        @change-password="handleChangePassword"
        @refresh-users="refreshAuthState"
        @create-user="handleCreateUser"
        @save-role="handleSaveRole"
      />

      <PlaceholderPage v-else />
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import HomePage from './pages/HomePage.vue';
import DataBrowserPage from './pages/DataBrowserPage.vue';
import AccountPage from './pages/AccountPage.vue';
import PlaceholderPage from './pages/PlaceholderPage.vue';
import { useAuth } from './composables/useAuth';
import { useViewerData } from './composables/useViewerData';
import type { PageCard, ViewerPage } from './types/viewer';

const currentPage = ref<ViewerPage>('home');

const {
  currentUser,
  requiresSetup,
  authError,
  profileMessage,
  isLoadingAuth,
  isSubmittingAuth,
  users,
  canEditData,
  canViewScoutPerformance,
  isAdmin,
  refreshAuthState,
  bootstrapAdmin,
  login,
  logout,
  createUser,
  updateUserRole,
  updateProfile,
  changePassword,
} = useAuth();

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

const loginUsername = ref('');
const loginPassword = ref('');
const setupUsername = ref('');
const setupPassword = ref('');
const setupPasswordConfirm = ref('');
const profileUsername = ref('');
const currentPassword = ref('');
const newPassword = ref('');
const newPasswordConfirm = ref('');
const newUserUsername = ref('');
const newUserPassword = ref('');
const newUserPasswordConfirm = ref('');
const newUserRole = ref<'ADMIN' | 'EDITOR' | 'SCOUT'>('EDITOR');
const roleDrafts = ref<Record<string, 'ADMIN' | 'EDITOR' | 'SCOUT'>>({});

const pages = computed(() => [
  { label: 'Home', value: 'home' as const, disabled: false },
  { label: 'Data Browser', value: 'browser' as const, disabled: false },
  { label: 'Account', value: 'account' as const, disabled: false },
  { label: 'Performance', value: 'performance' as const, disabled: !canViewScoutPerformance.value },
]);

const pageCards = computed<PageCard[]>(() => [
  {
    kicker: 'Ready Now',
    label: 'Data Browser',
    value: 'browser',
    description: 'Inspect database records by match or team, then edit and save corrected JSON.',
    disabled: false,
  },
  {
    kicker: currentUser.value ? 'Account Ready' : 'Public Entry',
    label: 'Account',
    value: 'account',
    description: 'Sign in, manage your account, and administer user roles if permitted.',
    disabled: false,
  },
  {
    kicker: canViewScoutPerformance.value ? 'Allowed Role' : 'Restricted',
    label: 'Performance',
    value: 'performance',
    description: 'Reserved for scout performance and quality metrics.',
    disabled: !canViewScoutPerformance.value,
  },
]);

const scannerUrl = computed(() => {
  const configured = import.meta.env.VITE_SCANNER_URL;
  if (configured) return configured;
  return new URL('http://localhost:3001').toString();
});

function validatePassword(
  password: string,
  confirmation: string,
  options: {
    requireCurrent?: boolean;
    currentPassword?: string;
  } = {}
) {
  if (options.requireCurrent && !options.currentPassword) {
    return 'Enter your current password.';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }

  if (confirmation !== password) {
    return 'Passwords do not match.';
  }

  return null;
}

const canOpenScanner = computed(() => canEditData.value);
const setupValidationMessage = computed(() => {
  if (setupUsername.value.trim().length < 3) return 'Username must be at least 3 characters.';
  return validatePassword(setupPassword.value, setupPasswordConfirm.value);
});
const canBootstrapAdmin = computed(() => setupValidationMessage.value === null);
const profileValidationMessage = computed(() => {
  if (!currentUser.value) return null;
  if (profileUsername.value.trim().length < 3) return 'Username must be at least 3 characters.';
  if (profileUsername.value.trim() === currentUser.value.username) return 'Enter a new username to save changes.';
  return null;
});
const canSaveProfile = computed(() => profileValidationMessage.value === null);
const changePasswordMessage = computed(() =>
  validatePassword(newPassword.value, newPasswordConfirm.value, {
    requireCurrent: true,
    currentPassword: currentPassword.value,
  })
);
const canChangePassword = computed(() => changePasswordMessage.value === null);
const createUserValidationMessage = computed(() => {
  if (newUserUsername.value.trim().length < 3) return 'Username must be at least 3 characters.';
  return validatePassword(newUserPassword.value, newUserPasswordConfirm.value);
});
const canCreateUser = computed(() => createUserValidationMessage.value === null);

function normalizePage(hash: string): ViewerPage {
  if (hash === '#browser') return 'browser';
  if (hash === '#account') return 'account';
  if (hash === '#performance') return 'performance';
  return 'home';
}

function syncPageFromHash() {
  const nextPage = normalizePage(window.location.hash);
  currentPage.value =
    nextPage === 'performance' && !canViewScoutPerformance.value ? 'home' : nextPage;
}

function goToPage(page: ViewerPage) {
  if (page === 'performance' && !canViewScoutPerformance.value) {
    currentPage.value = 'home';
    return;
  }

  const targetHash = page === 'home' ? '#home' : `#${page}`;
  if (window.location.hash === targetHash) {
    currentPage.value = page;
    return;
  }

  window.location.hash = targetHash;
}

function syncRoleDrafts() {
  roleDrafts.value = Object.fromEntries(users.value.map((user) => [user.id, user.role]));
}

function setRoleDraft(userId: string, role: 'ADMIN' | 'EDITOR' | 'SCOUT') {
  roleDrafts.value = {
    ...roleDrafts.value,
    [userId]: role,
  };
}

async function handleBootstrapAdmin() {
  if (!canBootstrapAdmin.value) return;
  await bootstrapAdmin(setupUsername.value.trim(), setupPassword.value);
  if (!authError.value) {
    setupUsername.value = '';
    setupPassword.value = '';
    setupPasswordConfirm.value = '';
    profileUsername.value = currentUser.value?.username ?? '';
    syncRoleDrafts();
  }
}

async function handleLogin() {
  await login(loginUsername.value.trim(), loginPassword.value);
  if (!authError.value) {
    loginUsername.value = '';
    loginPassword.value = '';
    profileUsername.value = currentUser.value?.username ?? '';
    syncRoleDrafts();
  }
}

async function handleSaveProfile() {
  if (!canSaveProfile.value) return;
  await updateProfile(profileUsername.value.trim());
  if (!authError.value) {
    profileUsername.value = currentUser.value?.username ?? profileUsername.value;
    syncRoleDrafts();
  }
}

async function handleChangePassword() {
  if (!canChangePassword.value) return;
  await changePassword(currentPassword.value, newPassword.value);
  if (!authError.value) {
    currentPassword.value = '';
    newPassword.value = '';
    newPasswordConfirm.value = '';
  }
}

async function handleCreateUser() {
  if (!canCreateUser.value) return;
  await createUser(newUserUsername.value.trim(), newUserPassword.value, newUserRole.value);
  if (!authError.value) {
    newUserUsername.value = '';
    newUserPassword.value = '';
    newUserPasswordConfirm.value = '';
    newUserRole.value = 'EDITOR';
    syncRoleDrafts();
  }
}

async function handleSaveRole(userId: string) {
  const role = roleDrafts.value[userId];
  if (!role) return;
  await updateUserRole(userId, role);
  if (!authError.value) {
    syncRoleDrafts();
  }
}

onMounted(async () => {
  syncPageFromHash();
  window.addEventListener('hashchange', syncPageFromHash);
  await Promise.all([refreshDashboard(), refreshAuthState()]);
  profileUsername.value = currentUser.value?.username ?? '';
  syncRoleDrafts();
});

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', syncPageFromHash);
});
</script>
