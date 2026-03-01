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

        // Obter sessão atual
        const { data: { session } } = await supabase.auth.getSession();

        let profile = null;
        if (session?.user) {
            profile = await loadProfile(session.user.id);
        }

        set({ session, user: session?.user || null, profile, loading: false });

        // Escutar mudanças de autenticação
        supabase.auth.onAuthStateChange(async (_event, newSession) => {
            const currentSession = get().session;
            // Evitar loop se nada mudou de fato na sessão root
            if (currentSession?.access_token !== newSession?.access_token) {
                let newProfile = null;
                if (newSession?.user) {
                    newProfile = await loadProfile(newSession.user.id);
                }
                set({ session: newSession, user: newSession?.user || null, profile: newProfile });
            }
        });
    },

    loginMaster: async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { success: false, error: 'Credenciais inválidas' };

            const profile = await loadProfile(data.user.id);
            if (!profile || profile.role !== 'master') {
                await supabase.auth.signOut();
                return { success: false, error: 'Acesso negado: Requer privilégios Master' };
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: 'Erro ao conectar com o servidor' };
        }
    },

    loginUnit: async (slug, email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { success: false, error: 'Credenciais inválidas' };

            const profile = await loadProfile(data.user.id);
            if (!profile || profile.role !== 'unit') {
                await supabase.auth.signOut();
                return { success: false, error: 'Acesso negado: Perfil não é de unidade' };
            }

            if (profile.units?.slug !== slug) {
                await supabase.auth.signOut();
                return { success: false, error: 'Acesso negado: Esta conta pertence a outra unidade' };
            }

            if (!profile.units?.active) {
                await supabase.auth.signOut();
                return { success: false, error: 'Acesso negado: Unidade inativa' };
            }

            return { success: true };
        } catch (error) {
            return { success: false, error: 'Erro ao conectar com o servidor' };
        }
    },

    logout: async () => {
        await supabase.auth.signOut();
    },
}));

export default useAuthStore;
