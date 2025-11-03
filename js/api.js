/**
 * API modul pro komunikaci s REST API
 * Obsahuje funkce pro CRUD operace s transakcemi
 */

const API = {
    baseURL: 'api/index.php', // Základní URL pro API
    
    /**
     * Detekce online/offline stavu
     */
    isOnline() {
        return navigator.onLine;
    },

    /**
     * GET - Získání všech transakcí
     */
    async getTransactions() {
        if (!this.isOnline()) {
            return { success: false, offline: true };
        }

        try {
            const response = await $.ajax({
                url: this.baseURL + '?action=get',
                method: 'GET',
                dataType: 'json'
            });
            return { success: true, data: response };
        } catch (error) {
            console.error('Error loading transactions:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * POST - Přidání nové transakce
     */
    async addTransaction(transaction) {
        if (!this.isOnline()) {
            return { success: false, offline: true };
        }

        try {
            const response = await $.ajax({
                url: this.baseURL + '?action=add',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(transaction),
                dataType: 'json'
            });
            return { success: true, data: response };
        } catch (error) {
            console.error('Error adding transaction:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * PUT - Aktualizace transakce
     */
    async updateTransaction(id, transaction) {
        if (!this.isOnline()) {
            return { success: false, offline: true };
        }

        try {
            const response = await $.ajax({
                url: this.baseURL + '?action=update&id=' + id,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(transaction),
                dataType: 'json'
            });
            return { success: true, data: response };
        } catch (error) {
            console.error('Error updating transaction:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * DELETE - Smazání transakce
     */
    async deleteTransaction(id) {
        if (!this.isOnline()) {
            return { success: false, offline: true };
        }

        try {
            const response = await $.ajax({
                url: this.baseURL + '?action=delete&id=' + id,
                method: 'DELETE',
                dataType: 'json'
            });
            return { success: true, data: response };
        } catch (error) {
            console.error('Error deleting transaction:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Synchronizace transakcí z localStorage na server
     */
    async syncTransactions(transactions) {
        if (!this.isOnline()) {
            return { success: false, offline: true };
        }

        try {
            const response = await $.ajax({
                url: this.baseURL + '?action=sync',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ transactions: transactions }),
                dataType: 'json'
            });
            return { success: true, data: response };
        } catch (error) {
            console.error('Error synchronizing:', error);
            return { success: false, error: error.message };
        }
    }
};

