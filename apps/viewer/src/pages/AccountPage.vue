<template>
  <section class="rounded-[1.75rem] border border-white/80 bg-white/80 p-6 shadow-panel">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="font-code text-xs uppercase tracking-[0.3em] text-sea">Account</p>
        <h2 class="mt-2 font-display text-2xl font-semibold text-ink">
          Sign in and manage your account
        </h2>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Use this page to sign in, review your role, update your account details, and if you are
          an admin, manage user permissions.
        </p>
      </div>
      <button
        v-if="currentUser"
        class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-sea/30"
        type="button"
        :disabled="isSubmitting"
        @click="$emit('logout')"
      >
        Sign Out
      </button>
    </div>

    <div v-if="requiresSetup" class="mt-6 rounded-3xl border border-slate-200 bg-mist/40 p-6">
      <p class="font-code text-xs uppercase tracking-[0.25em] text-sea">Initial Setup</p>
      <h3 class="mt-3 text-xl font-semibold text-ink">Create the first admin</h3>
      <p class="mt-2 text-sm text-slate-600">
        There is no default admin account. Create one with a username of at least 3 characters and
        a password of at least 8 characters.
      </p>
      <div class="mt-5 grid gap-4 md:grid-cols-3">
        <input
          class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
          placeholder="Admin username"
          :value="setupUsername"
          @input="$emit('update:setupUsername', ($event.target as HTMLInputElement).value)"
        >
        <input
          class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
          type="password"
          placeholder="Password"
          :value="setupPassword"
          @input="$emit('update:setupPassword', ($event.target as HTMLInputElement).value)"
        >
        <input
          class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
          type="password"
          placeholder="Confirm password"
          :value="setupPasswordConfirm"
          @input="$emit('update:setupPasswordConfirm', ($event.target as HTMLInputElement).value)"
        >
        <button
          class="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-sea disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          :disabled="isSubmitting || !canBootstrapAdmin"
          @click="$emit('bootstrap-admin')"
        >
          {{ isSubmitting ? 'Creating…' : 'Create Admin' }}
        </button>
      </div>
      <p v-if="setupValidationMessage" class="mt-3 text-sm text-rose-600">
        {{ setupValidationMessage }}
      </p>
    </div>

    <div v-else-if="!currentUser" class="mt-6 rounded-3xl border border-slate-200 bg-mist/40 p-6">
      <p class="font-code text-xs uppercase tracking-[0.25em] text-sea">Sign In</p>
      <h3 class="mt-3 text-xl font-semibold text-ink">Authenticate to unlock permissions</h3>
      <div class="mt-5 grid gap-4 md:grid-cols-3">
        <input
          class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
          placeholder="Username"
          :value="loginUsername"
          @input="$emit('update:loginUsername', ($event.target as HTMLInputElement).value)"
        >
        <input
          class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
          type="password"
          placeholder="Password"
          :value="loginPassword"
          @input="$emit('update:loginPassword', ($event.target as HTMLInputElement).value)"
        >
        <button
          class="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-sea disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          :disabled="isSubmitting || isLoadingAuth"
          @click="$emit('login')"
        >
          {{ isSubmitting ? 'Signing in…' : 'Sign In' }}
        </button>
      </div>
    </div>

    <div v-else class="mt-6 space-y-6">
      <div class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <section class="rounded-3xl border border-slate-200 bg-mist/40 p-5">
          <p class="font-code text-xs uppercase tracking-[0.25em] text-sea">Profile</p>
          <h3 class="mt-3 text-xl font-semibold text-ink">Current account</h3>
          <div class="mt-4 space-y-4">
            <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Username</p>
              <p class="mt-1 font-semibold text-ink">{{ currentUser.username }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p class="text-xs uppercase tracking-[0.2em] text-slate-500">Role</p>
              <p class="mt-1 font-semibold text-ink">{{ currentUser.role }}</p>
            </div>
          </div>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white p-5">
          <p class="font-code text-xs uppercase tracking-[0.25em] text-sea">Settings</p>
          <div class="mt-4 grid gap-6 md:grid-cols-2">
            <div class="space-y-3">
              <h4 class="text-lg font-semibold text-ink">Change username</h4>
              <input
                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
                :value="profileUsername"
                @input="$emit('update:profileUsername', ($event.target as HTMLInputElement).value)"
              >
              <p v-if="profileValidationMessage" class="text-sm text-rose-600">
                {{ profileValidationMessage }}
              </p>
              <button
                class="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-sea disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                :disabled="isSubmitting || !canSaveProfile"
                @click="$emit('save-profile')"
              >
                Save Username
              </button>
            </div>

            <div class="space-y-3">
              <h4 class="text-lg font-semibold text-ink">Change password</h4>
              <input
                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
                type="password"
                placeholder="Current password"
                :value="currentPassword"
                @input="$emit('update:currentPassword', ($event.target as HTMLInputElement).value)"
              >
              <input
                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
                type="password"
                placeholder="New password"
                :value="newPassword"
                @input="$emit('update:newPassword', ($event.target as HTMLInputElement).value)"
              >
              <input
                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
                type="password"
                placeholder="Confirm new password"
                :value="newPasswordConfirm"
                @input="$emit('update:newPasswordConfirm', ($event.target as HTMLInputElement).value)"
              >
              <p v-if="changePasswordMessage" class="text-sm text-rose-600">
                {{ changePasswordMessage }}
              </p>
              <button
                class="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-sea disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                :disabled="isSubmitting || !canChangePassword"
                @click="$emit('change-password')"
              >
                Change Password
              </button>
            </div>
          </div>
        </section>
      </div>

      <section
        v-if="isAdmin"
        class="rounded-3xl border border-slate-200 bg-white p-5"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="font-code text-xs uppercase tracking-[0.25em] text-sea">Admin</p>
            <h3 class="mt-2 text-xl font-semibold text-ink">User permissions</h3>
          </div>
          <button
            class="rounded-full border border-gold/70 bg-gold/20 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold/30"
            type="button"
            :disabled="isSubmitting"
            @click="$emit('refresh-users')"
          >
            Refresh Users
          </button>
        </div>

        <div class="mt-5 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div class="rounded-3xl border border-slate-200 bg-mist/40 p-5">
            <h4 class="text-lg font-semibold text-ink">Create user</h4>
            <div class="mt-4 space-y-3">
              <input
                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
                placeholder="Username"
                :value="newUserUsername"
                @input="$emit('update:newUserUsername', ($event.target as HTMLInputElement).value)"
              >
              <input
                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
                type="password"
                placeholder="Password"
                :value="newUserPassword"
                @input="$emit('update:newUserPassword', ($event.target as HTMLInputElement).value)"
              >
              <input
                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
                type="password"
                placeholder="Confirm password"
                :value="newUserPasswordConfirm"
                @input="$emit('update:newUserPasswordConfirm', ($event.target as HTMLInputElement).value)"
              >
              <select
                class="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-sea"
                :value="newUserRole"
                @change="$emit('update:newUserRole', ($event.target as HTMLSelectElement).value)"
              >
                <option value="ADMIN">Admin</option>
                <option value="EDITOR">Editor</option>
                <option value="SCOUT">Scout</option>
              </select>
              <button
                class="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-sea disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                :disabled="isSubmitting || !canCreateUser"
                @click="$emit('create-user')"
              >
                {{ isSubmitting ? 'Saving…' : 'Create User' }}
              </button>
              <p v-if="createUserValidationMessage" class="text-sm text-rose-600">
                {{ createUserValidationMessage }}
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <div
              v-for="user in users"
              :key="user.id"
              class="rounded-2xl border border-slate-200 px-4 py-4"
            >
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p class="font-semibold text-ink">{{ user.username }}</p>
                  <p class="mt-1 text-sm text-slate-500">{{ formatDate(user.createdAt) }}</p>
                </div>
                <div class="flex flex-wrap items-center gap-3">
                  <select
                    class="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-ink outline-none transition focus:border-sea"
                    :value="roleDrafts[user.id] ?? user.role"
                    :disabled="isSubmitting"
                    @change="$emit('update:roleDraft', user.id, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="EDITOR">Editor</option>
                    <option value="SCOUT">Scout</option>
                  </select>
                  <button
                    class="rounded-full border border-sea/20 bg-sea/10 px-4 py-2 text-sm font-semibold text-sea transition hover:bg-sea/20 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    :disabled="isSubmitting || (roleDrafts[user.id] ?? user.role) === user.role"
                    @click="$emit('save-role', user.id)"
                  >
                    Save Role
                  </button>
                </div>
              </div>
            </div>
            <p v-if="users.length === 0" class="text-sm text-slate-500">No users created yet.</p>
          </div>
        </div>
      </section>
    </div>

    <p v-if="profileMessage" class="mt-6 text-sm text-emerald-700">
      {{ profileMessage }}
    </p>
    <p v-if="authError" class="mt-2 text-sm text-rose-600">
      {{ authError }}
    </p>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  isLoadingAuth: boolean;
  isSubmitting: boolean;
  authError: string | null;
  profileMessage: string | null;
  requiresSetup: boolean;
  currentUser: {
    id: string;
    username: string;
    role: 'ADMIN' | 'EDITOR' | 'SCOUT';
  } | null;
  isAdmin: boolean;
  loginUsername: string;
  loginPassword: string;
  setupUsername: string;
  setupPassword: string;
  setupPasswordConfirm: string;
  setupValidationMessage: string | null;
  canBootstrapAdmin: boolean;
  profileUsername: string;
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
  profileValidationMessage: string | null;
  changePasswordMessage: string | null;
  canSaveProfile: boolean;
  canChangePassword: boolean;
  newUserUsername: string;
  newUserPassword: string;
  newUserPasswordConfirm: string;
  newUserRole: 'ADMIN' | 'EDITOR' | 'SCOUT';
  createUserValidationMessage: string | null;
  canCreateUser: boolean;
  roleDrafts: Record<string, 'ADMIN' | 'EDITOR' | 'SCOUT'>;
  users: Array<{
    id: string;
    username: string;
    role: 'ADMIN' | 'EDITOR' | 'SCOUT';
    createdAt: Date;
  }>;
}>();

defineEmits([
  'update:loginUsername',
  'update:loginPassword',
  'update:setupUsername',
  'update:setupPassword',
  'update:setupPasswordConfirm',
  'update:profileUsername',
  'update:currentPassword',
  'update:newPassword',
  'update:newPasswordConfirm',
  'update:newUserUsername',
  'update:newUserPassword',
  'update:newUserPasswordConfirm',
  'update:newUserRole',
  'update:roleDraft',
  'bootstrap-admin',
  'login',
  'logout',
  'save-profile',
  'change-password',
  'refresh-users',
  'create-user',
  'save-role',
]);

function formatDate(value: Date) {
  return new Date(value).toLocaleString();
}
</script>
