import { supabase } from '../lib/supabase';

// Realtime subscription manager
class RealtimeService {
    constructor() {
        this.channels = {};
        this.listeners = new Set();
    }

    subscribeToClients(unitId, callback) {
        const key = `clients-${unitId}`;
        if (this.channels[key]) return;

        this.channels[key] = supabase
            .channel(key)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'clients',
                filter: `unit_id=eq.${unitId}`,
            }, (payload) => {
                if (payload.new.status !== payload.old?.status) {
                    callback({
                        type: 'status_change',
                        clientName: payload.new.client_name || payload.new.name,
                        oldStatus: payload.old?.status,
                        newStatus: payload.new.status,
                        clientId: payload.new.id,
                    });
                }
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'clients',
                filter: `unit_id=eq.${unitId}`,
            }, (payload) => {
                callback({
                    type: 'new_client',
                    clientName: payload.new.client_name || payload.new.name,
                    clientId: payload.new.id,
                });
            })
            .subscribe();
    }

    subscribeToNotifications(unitId, callback) {
        const key = `notifications-${unitId}`;
        if (this.channels[key]) return;

        this.channels[key] = supabase
            .channel(key)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `unit_id=eq.${unitId}`,
            }, (payload) => {
                callback({ type: 'notification', ...payload.new });
            })
            .subscribe();
    }

    unsubscribeAll() {
        Object.entries(this.channels).forEach(([key, channel]) => {
            supabase.removeChannel(channel);
        });
        this.channels = {};
    }

    unsubscribe(key) {
        if (this.channels[key]) {
            supabase.removeChannel(this.channels[key]);
            delete this.channels[key];
        }
    }
}

export const realtimeService = new RealtimeService();
