/**
 * Storage modul pro práci s localStorage
 * Umožňuje offline ukládání a synchronizaci dat
 */

const Storage = {
    STORAGE_KEY: 'financni_rozpocar_transactions',
    PENDING_KEY: 'financni_rozpocar_pending',
    SYNC_KEY: 'financni_rozpocar_sync_flag',

    /**
     * Uložení transakcí do localStorage
     */
    saveTransactions(transactions) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },

    /**
     * Načtení transakcí z localStorage
     */
    getTransactions() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return [];
        }
    },

    /**
     * Přidání transakce do pending (čeká na synchronizaci)
     */
    addPendingTransaction(action, transaction, id = null) {
        try {
            const pending = this.getPendingTransactions();
            const pendingItem = {
                id: Date.now() + Math.random(),
                action: action, // 'add', 'update', 'delete'
                transaction: transaction,
                originalId: id,
                timestamp: new Date().toISOString()
            };
            pending.push(pendingItem);
            localStorage.setItem(this.PENDING_KEY, JSON.stringify(pending));
            return true;
        } catch (error) {
            console.error('Error adding to pending:', error);
            return false;
        }
    },

    /**
     * Načtení pending transakcí
     */
    getPendingTransactions() {
        try {
            const data = localStorage.getItem(this.PENDING_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading pending:', error);
            return [];
        }
    },

    /**
     * Vymazání pending transakcí po úspěšné synchronizaci
     */
    clearPendingTransactions() {
        try {
            localStorage.removeItem(this.PENDING_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing pending:', error);
            return false;
        }
    },

    /**
     * Označení, že je potřeba synchronizace
     */
    setSyncNeeded(needed = true) {
        try {
            localStorage.setItem(this.SYNC_KEY, needed ? 'true' : 'false');
            return true;
        } catch (error) {
            console.error('Error setting sync flag:', error);
            return false;
        }
    },

    /**
     * Kontrola, zda je potřeba synchronizace
     */
    isSyncNeeded() {
        try {
            return localStorage.getItem(this.SYNC_KEY) === 'true';
        } catch (error) {
            return false;
        }
    },

    /**
     * Smazání všech dat
     */
    clearAll() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.PENDING_KEY);
            localStorage.removeItem(this.SYNC_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    },

    /**
     * Generování unikátního ID pro offline transakce
     */
    generateId() {
        return 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
};

