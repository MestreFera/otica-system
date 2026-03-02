import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Helper: load full profile including unit data
async function loadProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*, units(*)')
        .eq('id', userId)
        .single();
    if (error) {
        console.error('Error loading profile:', error);
        return null;
    }
    return data;
}

const useAuthStore = create((set, get) => ({
    session: null,
    user: null,
    profile: null,
    loading: true,

    init: async () => {
        set({ loading: true });

        // First attempt to grab current session from Supabase local storage memory
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
            set({ session: null, user: null, profile: null, loading: false });
        } else {
            const profile = await loadProfile(session.user.id);
            set({ session, user: session.user, profile, loading: false });
        }

        // Listen for all future auth changes (login, logout, token refresh)
        supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log('🔄 Auth State Changed:', event);

            if (event === 'SIGNED_OUT' || !newSession) {
                set({ session: null, user: null, profile: null, loading: false });
                return;
            }

            // Only reload profile if user ID changed to avoid unnecessary fetches on TOKEN_REFRESH
            const currentSession = get().session;
            if (!currentSession || currentSession.user.id !== newSession.user.id) {
                set({ loading: true });
                const newProfile = await loadProfile(newSession.user.id);
                set({ session: newSession, user: newSession.user, profile: newProfile, loading: false });
            } else {
                set({ session: newSession, user: newSession.user }); // Just update tokens, profile remains
            }
        });
    },

    loginMaster: async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { success: false, error: 'Credenciais inválidas: ' + error.message };

            const profile = await loadProfile(data.user.id);
            if (!profile || profile.role !== 'master') {
                await supabase.auth.signOut();
                return { success: false, error: 'Acesso negado: Requer privilégios Master' };
            }

            set({ profile });
            return { success: true };
        } catch (error) {
            return { success: false, error: 'Erro ao conectar com o servidor' };
        }
    },

    loginUnit: async (slug, email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                // Give clearer message for common errors
                const msg = error.message?.toLowerCase() || '';
                if (msg.includes('invalid') || msg.includes('credentials')) {
                    return { success: false, error: 'E-mail ou senha incorretos' };
                }
                if (msg.includes('email not confirmed')) {
                    return { success: false, error: 'Email não confirmado. Contate o administrador.' };
                }
                return { success: false, error: 'Erro ao autenticar: ' + error.message };
            }

            const profile = await loadProfile(data.user.id);

            if (!profile) {
                await supabase.auth.signOut();
                return { success: false, error: 'Perfil não encontrado. Contate o administrador.' };
            }

            if (profile.role !== 'unit') {
                await supabase.auth.signOut();
                return { success: false, error: 'Acesso negado: esta conta não é de unidade' };
            }

            if (profile.units?.slug !== slug) {
                await supabase.auth.signOut();
                return { success: false, error: `Acesso negado: esta conta pertence à unidade "${profile.units?.name || 'outra unidade'}"` };
            }

            if (!profile.units?.active) {
                await supabase.auth.signOut();
                return { success: false, error: 'Acesso negado: unidade inativa' };
            }

            // ✅ Store profile so UnitDashboard and UnitLayout can read it immediately
            set({ profile });
            return { success: true };
        } catch (err) {
            return { success: false, error: 'Erro inesperado: ' + err.message };
        }
    },

    logout: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null, profile: null });
    },
}));

export default useAuthStore;
