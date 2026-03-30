import { computed, ref } from 'vue';
import { client, setAuthToken } from '../api';

type AuthUser = NonNullable<Awaited<ReturnType<typeof client.auth.me.query>>['user']>;
type AuthRole = AuthUser['role'];

export function useAuth() {
  const currentUser = ref<AuthUser | null>(null);
  const requiresSetup = ref(false);
  const authError = ref<string | null>(null);
  const isLoadingAuth = ref(false);
  const isSubmittingAuth = ref(false);
  const profileMessage = ref<string | null>(null);
  const users = ref<
    Array<{
      id: string;
      username: string;
      role: AuthRole;
      createdAt: Date;
    }>
  >([]);

  const canEditData = computed(
    () => currentUser.value?.role === 'ADMIN' || currentUser.value?.role === 'EDITOR'
  );

  const canViewScoutPerformance = computed(
    () =>
      currentUser.value?.role === 'ADMIN' ||
      currentUser.value?.role === 'EDITOR' ||
      currentUser.value?.role === 'SCOUT'
  );

  const isAdmin = computed(() => currentUser.value?.role === 'ADMIN');

  async function refreshAuthState() {
    authError.value = null;
    profileMessage.value = null;
    isLoadingAuth.value = true;

    try {
      const [bootstrap, me] = await Promise.all([
        client.auth.bootstrapStatus.query(),
        client.auth.me.query(),
      ]);

      requiresSetup.value = bootstrap.requiresSetup;
      currentUser.value = me.user;

      if (me.user?.role === 'ADMIN') {
        users.value = await client.auth.listUsers.query();
      } else {
        users.value = [];
      }
    } catch (error) {
      authError.value = error instanceof Error ? error.message : 'Unable to load auth state.';
      currentUser.value = null;
      users.value = [];
    } finally {
      isLoadingAuth.value = false;
    }
  }

  async function bootstrapAdmin(username: string, password: string) {
    authError.value = null;
    profileMessage.value = null;
    isSubmittingAuth.value = true;

    try {
      const result = await client.auth.bootstrapAdmin.mutate({
        username,
        password,
      });

      setAuthToken(result.token);
      currentUser.value = result.user;
      requiresSetup.value = false;
      users.value = await client.auth.listUsers.query();
    } catch (error) {
      authError.value = error instanceof Error ? error.message : 'Unable to create the initial admin.';
    } finally {
      isSubmittingAuth.value = false;
    }
  }

  async function login(username: string, password: string) {
    authError.value = null;
    profileMessage.value = null;
    isSubmittingAuth.value = true;

    try {
      const result = await client.auth.login.mutate({
        username,
        password,
      });

      setAuthToken(result.token);
      currentUser.value = result.user;
      if (result.user.role === 'ADMIN') {
        users.value = await client.auth.listUsers.query();
      } else {
        users.value = [];
      }
    } catch (error) {
      authError.value = error instanceof Error ? error.message : 'Unable to log in.';
    } finally {
      isSubmittingAuth.value = false;
    }
  }

  async function logout() {
    authError.value = null;
    profileMessage.value = null;
    isSubmittingAuth.value = true;

    try {
      await client.auth.logout.mutate();
    } catch (_error) {
    } finally {
      setAuthToken(null);
      currentUser.value = null;
      users.value = [];
      isSubmittingAuth.value = false;
      await refreshAuthState();
    }
  }

  async function createUser(username: string, password: string, role: AuthRole) {
    authError.value = null;
    profileMessage.value = null;
    isSubmittingAuth.value = true;

    try {
      await client.auth.createUser.mutate({
        username,
        password,
        role,
      });
      users.value = await client.auth.listUsers.query();
    } catch (error) {
      authError.value = error instanceof Error ? error.message : 'Unable to create user.';
    } finally {
      isSubmittingAuth.value = false;
    }
  }

  async function updateUserRole(userId: string, role: AuthRole) {
    authError.value = null;
    profileMessage.value = null;
    isSubmittingAuth.value = true;

    try {
      await client.auth.updateUserRole.mutate({
        userId,
        role,
      });
      users.value = await client.auth.listUsers.query();
      if (currentUser.value?.id === userId) {
        await refreshAuthState();
      }
    } catch (error) {
      authError.value = error instanceof Error ? error.message : 'Unable to update user role.';
    } finally {
      isSubmittingAuth.value = false;
    }
  }

  async function updateProfile(username: string) {
    authError.value = null;
    profileMessage.value = null;
    isSubmittingAuth.value = true;

    try {
      const result = await client.auth.updateProfile.mutate({ username });
      currentUser.value = result.user;
      profileMessage.value = 'Account username updated.';
      if (result.user.role === 'ADMIN') {
        users.value = await client.auth.listUsers.query();
      }
    } catch (error) {
      authError.value = error instanceof Error ? error.message : 'Unable to update account username.';
    } finally {
      isSubmittingAuth.value = false;
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    authError.value = null;
    profileMessage.value = null;
    isSubmittingAuth.value = true;

    try {
      await client.auth.changePassword.mutate({
        currentPassword,
        newPassword,
      });
      profileMessage.value = 'Password updated.';
    } catch (error) {
      authError.value = error instanceof Error ? error.message : 'Unable to change password.';
    } finally {
      isSubmittingAuth.value = false;
    }
  }

  return {
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
  };
}
