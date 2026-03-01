// Store de autenticação e dados globais
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateSeedData } from './seedData';

// Inicializar seed data se não existir
generateSeedData();

const useStore = create(
    persist(
        (set, get) => ({
            // Auth
            masterAuth: null,   // { email, role: 'master' }
            unitAuth: null,     // { email, slug, role: 'unit' }

            // Login Master
            loginMaster: (email, password) => {
                if (email === 'admin@master.com' && password === 'master123') {
                    set({ masterAuth: { email, role: 'master' } });
                    return { success: true };
                }
                return { success: false, error: 'Credenciais inválidas' };
            },

            // Login Unidade
            loginUnit: (slug, email, password) => {
                const units = get().getUnits();
                const unit = units.find(u => u.slug === slug);
                if (!unit) return { success: false, error: 'Unidade não encontrada' };
                if (unit.status === 'inactive') return { success: false, error: 'Unidade inativa' };
                if (unit.adminEmail === email && unit.adminPassword === password) {
                    const now = new Date().toISOString();
                    // Atualiza último acesso
                    const updated = units.map(u => u.slug === slug ? { ...u, lastAccess: now } : u);
                    localStorage.setItem('otica_units', JSON.stringify(updated));
                    set({ unitAuth: { email, slug, role: 'unit', unitName: unit.name } });
                    return { success: true };
                }
                return { success: false, error: 'Credenciais inválidas' };
            },

            logoutMaster: () => set({ masterAuth: null }),
            logoutUnit: () => set({ unitAuth: null }),

            // Units CRUD
            getUnits: () => {
                try {
                    return JSON.parse(localStorage.getItem('otica_units') || '[]');
                } catch { return []; }
            },

            createUnit: (unit) => {
                const units = get().getUnits();
                const exists = units.find(u => u.slug === unit.slug);
                if (exists) return { success: false, error: 'Slug já existe' };
                const newUnit = {
                    ...unit,
                    id: Date.now().toString(),
                    createdAt: new Date().toISOString(),
                    lastAccess: null,
                };
                localStorage.setItem('otica_units', JSON.stringify([...units, newUnit]));
                return { success: true };
            },

            updateUnit: (slug, data) => {
                const units = get().getUnits();
                const updated = units.map(u => u.slug === slug ? { ...u, ...data } : u);
                localStorage.setItem('otica_units', JSON.stringify(updated));
            },

            toggleUnitStatus: (slug) => {
                const units = get().getUnits();
                const updated = units.map(u =>
                    u.slug === slug ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u
                );
                localStorage.setItem('otica_units', JSON.stringify(updated));
            },

            // Clients (per unit)
            getClients: (slug) => {
                try {
                    return JSON.parse(localStorage.getItem(`otica_${slug}_clients`) || '[]');
                } catch { return []; }
            },

            saveClients: (slug, clients) => {
                localStorage.setItem(`otica_${slug}_clients`, JSON.stringify(clients));
            },

            createClient: (slug, clientData) => {
                const clients = get().getClients(slug);
                const unit = get().getUnits().find(u => u.slug === slug);
                const tso = (unit?.tsoCounter || 1000) + 1;

                // Update TSO counter
                const units = get().getUnits();
                const updatedUnits = units.map(u => u.slug === slug ? { ...u, tsoCounter: tso } : u);
                localStorage.setItem('otica_units', JSON.stringify(updatedUnits));

                const newClient = {
                    ...clientData,
                    id: Date.now().toString(),
                    tso: `TSO${tso}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    statusHistory: [{ status: clientData.status, date: new Date().toISOString(), note: 'Cadastro inicial' }],
                };
                localStorage.setItem(`otica_${slug}_clients`, JSON.stringify([...clients, newClient]));
                return newClient;
            },

            updateClient: (slug, id, data) => {
                const clients = get().getClients(slug);
                const client = clients.find(c => c.id === id);
                const statusChanged = client && data.status && client.status !== data.status;
                const updated = clients.map(c => {
                    if (c.id !== id) return c;
                    const history = statusChanged
                        ? [...(c.statusHistory || []), { status: data.status, date: new Date().toISOString(), note: 'Status atualizado' }]
                        : c.statusHistory;
                    return { ...c, ...data, updatedAt: new Date().toISOString(), statusHistory: history };
                });
                localStorage.setItem(`otica_${slug}_clients`, JSON.stringify(updated));
            },

            deleteClient: (slug, id) => {
                const clients = get().getClients(slug);
                const updated = clients.filter(c => c.id !== id);
                localStorage.setItem(`otica_${slug}_clients`, JSON.stringify(updated));
            },

            // Notifications
            getNotifications: (slug) => {
                try {
                    return JSON.parse(localStorage.getItem(`otica_${slug}_notifications`) || '[]');
                } catch { return []; }
            },

            sendNotification: (slugs, message) => {
                const allSlugs = slugs === 'all' ? get().getUnits().map(u => u.slug) : [slugs];
                allSlugs.forEach(slug => {
                    const notifs = get().getNotifications(slug);
                    const newNotif = {
                        id: Date.now().toString(),
                        message,
                        date: new Date().toISOString(),
                        read: false,
                    };
                    localStorage.setItem(`otica_${slug}_notifications`, JSON.stringify([newNotif, ...notifs]));
                });
            },
        }),
        {
            name: 'otica-system-auth',
            partialize: (state) => ({
                masterAuth: state.masterAuth,
                unitAuth: state.unitAuth,
            }),
        }
    )
);

export default useStore;
