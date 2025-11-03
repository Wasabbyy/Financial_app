/**
 * Hlavní aplikační modul
 * Spravuje UI, logiku aplikace a koordinuje práci s API a Storage
 */

const App = {
    transactions: [],
    filteredTransactions: [],
    categoryChart: null,
    balanceChart: null,

    // Category definitions by transaction type
    categories: {
        expense: ['Food', 'Transport', 'Entertainment', 'Other'],
        income: ['Salary', 'Gift', 'Selling Old Stuff', 'Other']
    },

    /**
     * Inicializace aplikace
     */
    init() {
        // Načtení stavu filtrů z URL (před nastavením event listenerů)
        this.loadFiltersFromURL();
        
        // Inicializace URL state pro History API (pokud URL neobsahuje parametry)
        if (!window.location.search) {
            const state = {
                filters: {
                    type: $('#filterType').val() || '',
                    category: $('#filterCategory').val() || '',
                    dateFrom: $('#filterDateFrom').val() || '',
                    dateTo: $('#filterDateTo').val() || '',
                    search: $('#searchNotes').val() || ''
                }
            };
            window.history.replaceState(state, '', window.location.pathname);
        } else {
            // Pokud URL obsahuje parametry, nahradíme state
            const params = new URLSearchParams(window.location.search);
            const state = {
                filters: {
                    type: params.get('type') || '',
                    category: params.get('category') || '',
                    dateFrom: params.get('dateFrom') || '',
                    dateTo: params.get('dateTo') || '',
                    search: params.get('search') || ''
                }
            };
            window.history.replaceState(state, '', window.location.href);
        }
        
        this.setupEventListeners();
        this.updateConnectionStatus();
        this.setTodayDate();
        // Initialize categories based on default type
        this.updateCategories('#category', $('#type').val());
        this.loadTransactions();
        this.initCharts();

        // Sledování online/offline stavu
        window.addEventListener('online', () => {
            this.updateConnectionStatus();
            this.syncData();
        });

        window.addEventListener('offline', () => {
            this.updateConnectionStatus();
        });

        // Sledování změn historie prohlížeče (tlačítka zpět/dopředu)
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.filters) {
                this.loadFiltersFromState(e.state.filters);
            } else {
                this.loadFiltersFromURL();
            }
        });

        // Pravidelná kontrola synchronizace (každých 30 sekund)
        setInterval(() => {
            if (API.isOnline() && Storage.isSyncNeeded()) {
                this.syncData();
            }
        }, 30000);
    },

    /**
     * Nastavení event listenerů
     */
    setupEventListeners() {
        // Formulář pro přidání transakce
        $('#transactionForm').on('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // Update categories when transaction type changes
        $('#type').on('change', () => {
            this.updateCategories('#category', $('#type').val());
        });

        // Update categories when edit type changes
        $('#editType').on('change', () => {
            this.updateCategories('#editCategory', $('#editType').val());
        });

        // Filtry - s debouncing pro vyhledávání
        let filterTimeout;
        $('#filterType, #filterCategory, #filterDateFrom, #filterDateTo').on('change', () => {
            this.applyFilters();
            this.saveFiltersToURL();
        });

        $('#searchNotes').on('input', () => {
            clearTimeout(filterTimeout);
            filterTimeout = setTimeout(() => {
                this.applyFilters();
                this.saveFiltersToURL();
            }, 300); // Debounce 300ms pro vyhledávání
        });

        $('#clearFilters').on('click', () => {
            this.clearFilters();
            this.clearFiltersFromURL();
        });

        // Export
        $('#exportJSON').on('click', () => {
            this.exportToJSON();
        });

        $('#exportCSV').on('click', () => {
            this.exportToCSV();
        });

        // Modal
        $('.close').on('click', () => {
            $('#editModal').hide();
        });

        $('#editForm').on('submit', (e) => {
            e.preventDefault();
            this.updateTransaction();
        });

        // Kliknutí mimo modal zavře modal
        $(window).on('click', (e) => {
            if ($(e.target).is('#editModal')) {
                $('#editModal').hide();
            }
        });
    },

    /**
     * Nastavení dnešního data jako výchozího
     */
    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        $('#date').val(today);
    },

    /**
     * Aktualizace indikátoru připojení
     */
    updateConnectionStatus() {
        const isOnline = API.isOnline();
        const statusIndicator = $('#statusIndicator');
        const statusText = $('#statusText');

        if (isOnline) {
            statusIndicator.removeClass('offline').addClass('online');
            statusText.text('Connected');
        } else {
            statusIndicator.removeClass('online').addClass('offline');
            statusText.text('Offline - data stored locally');
        }
    },

    /**
     * Načtení transakcí (z API nebo localStorage)
     */
    async loadTransactions() {
        if (API.isOnline()) {
            const result = await API.getTransactions();
            if (result.success) {
                this.transactions = result.data || [];
                Storage.saveTransactions(this.transactions);
            } else if (result.offline) {
                // Pokud není připojení, načteme z localStorage
                this.transactions = Storage.getTransactions();
            }
        } else {
            // Offline režim - načteme z localStorage
            this.transactions = Storage.getTransactions();
        }

        this.updateCategoryFilter();
        this.applyFilters();
        this.updateSummary();
        this.updateCharts();
    },

    /**
     * Přidání nové transakce
     */
    async addTransaction() {
        const formData = {
            amount: parseFloat($('#amount').val()),
            type: $('#type').val(),
            category: $('#category').val(),
            date: $('#date').val(),
            notes: $('#notes').val() || ''
        };

        // Validation
        if (!formData.amount || !formData.category || !formData.date) {
            alert('Please fill in all required fields.');
            return;
        }

        // Validate amount is positive
        if (formData.amount <= 0) {
            alert('Amount must be a positive number.');
            return;
        }

        // Přidání ID a timestampu
        const transaction = {
            id: Storage.generateId(),
            ...formData,
            createdAt: new Date().toISOString(),
            synced: false
        };

        if (API.isOnline()) {
            // Zkusíme uložit na server
            const result = await API.addTransaction(transaction);
            if (result.success) {
                transaction.id = result.data.id || transaction.id;
                transaction.synced = true;
            } else {
                // Pokud selže, přidáme do pending
                Storage.addPendingTransaction('add', transaction);
                Storage.setSyncNeeded(true);
            }
        } else {
            // Offline - přidáme do pending
            Storage.addPendingTransaction('add', transaction);
            Storage.setSyncNeeded(true);
        }

        // Přidáme do lokální kolekce
        this.transactions.push(transaction);
        Storage.saveTransactions(this.transactions);

        // Reset formuláře
        $('#transactionForm')[0].reset();
        this.setTodayDate();
        // Update categories after reset (type defaults to expense)
        this.updateCategories('#category', $('#type').val());

        this.updateCategoryFilter();
        this.applyFilters();
        this.updateSummary();
        this.updateCharts();
    },

    /**
     * Smazání transakce
     */
    async deleteTransaction(id) {
        if (!confirm('Are you sure you want to delete this transaction?')) {
            return;
        }

        if (API.isOnline()) {
            const result = await API.deleteTransaction(id);
            if (!result.success && !result.offline) {
                // Pokud selže a není offline, přidáme do pending
                const transaction = this.transactions.find(t => t.id === id);
                if (transaction) {
                    Storage.addPendingTransaction('delete', transaction, id);
                    Storage.setSyncNeeded(true);
                }
            }
        } else {
            // Offline - přidáme do pending
            const transaction = this.transactions.find(t => t.id === id);
            if (transaction) {
                Storage.addPendingTransaction('delete', transaction, id);
                Storage.setSyncNeeded(true);
            }
        }

        // Odebereme z lokální kolekce
        this.transactions = this.transactions.filter(t => t.id !== id);
        Storage.saveTransactions(this.transactions);

        this.applyFilters();
        this.updateSummary();
        this.updateCharts();
    },

    /**
     * Update categories dropdown based on transaction type
     */
    updateCategories(selectId, type) {
        const select = $(selectId);
        const currentValue = select.val();
        
        // Clear existing options except the placeholder
        select.html('<option value="">Select category</option>');
        
        // Add categories based on type
        if (type && this.categories[type]) {
            this.categories[type].forEach(category => {
                select.append(`<option value="${category}">${category}</option>`);
            });
            
            // Restore previous value if it exists in the new category list, otherwise clear it
            if (currentValue && this.categories[type].includes(currentValue)) {
                select.val(currentValue);
            } else {
                select.val(''); // Clear if current category doesn't exist in new list
            }
        }
    },

    /**
     * Otevření modalu pro úpravu transakce
     */
    openEditModal(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;

        $('#editId').val(transaction.id);
        $('#editAmount').val(transaction.amount);
        $('#editType').val(transaction.type);
        $('#editDate').val(transaction.date);
        $('#editNotes').val(transaction.notes);

        // Update categories based on transaction type, then set the category value
        this.updateCategories('#editCategory', transaction.type);
        $('#editCategory').val(transaction.category);

        $('#editModal').show();
    },

    /**
     * Aktualizace transakce
     */
    async updateTransaction() {
        const id = $('#editId').val();
        const formData = {
            amount: parseFloat($('#editAmount').val()),
            type: $('#editType').val(),
            category: $('#editCategory').val(),
            date: $('#editDate').val(),
            notes: $('#editNotes').val() || ''
        };

        // Validation
        if (!formData.amount || !formData.category || !formData.date) {
            alert('Please fill in all required fields.');
            return;
        }

        // Validate amount is positive
        if (formData.amount <= 0) {
            alert('Amount must be a positive number.');
            return;
        }

        const transactionIndex = this.transactions.findIndex(t => t.id === id);
        if (transactionIndex === -1) return;

        const updatedTransaction = {
            ...this.transactions[transactionIndex],
            ...formData,
            updatedAt: new Date().toISOString()
        };

        if (API.isOnline()) {
            const result = await API.updateTransaction(id, updatedTransaction);
            if (result.success) {
                updatedTransaction.synced = true;
            } else if (!result.offline) {
                // Pokud selže a není offline, přidáme do pending
                Storage.addPendingTransaction('update', updatedTransaction, id);
                Storage.setSyncNeeded(true);
            }
        } else {
            // Offline - přidáme do pending
            Storage.addPendingTransaction('update', updatedTransaction, id);
            Storage.setSyncNeeded(true);
        }

        // Aktualizujeme v lokální kolekci
        this.transactions[transactionIndex] = updatedTransaction;
        Storage.saveTransactions(this.transactions);

        $('#editModal').hide();
        this.applyFilters();
        this.updateSummary();
        this.updateCharts();
    },

    /**
     * Aktualizace seznamu kategorií ve filtru
     */
    updateCategoryFilter() {
        const categories = [...new Set(this.transactions.map(t => t.category))].sort();
        const filterCategory = $('#filterCategory');
        const currentValue = filterCategory.val();
        
        // Uložíme aktuální hodnotu
        filterCategory.html('<option value="">All</option>');
        
        categories.forEach(category => {
            filterCategory.append(`<option value="${this.escapeHtml(category)}">${this.escapeHtml(category)}</option>`);
        });
        
        // Obnovíme původní hodnotu pokud existuje
        if (currentValue && categories.includes(currentValue)) {
            filterCategory.val(currentValue);
        }
    },

    /**
     * Aplikování filtrů
     */
    applyFilters() {
        let filtered = [...this.transactions];

        // Filtr podle typu
        const filterType = $('#filterType').val();
        if (filterType) {
            filtered = filtered.filter(t => t.type === filterType);
        }

        // Filtr podle kategorie
        const filterCategory = $('#filterCategory').val();
        if (filterCategory) {
            filtered = filtered.filter(t => t.category === filterCategory);
        }

        // Filtr podle data (od)
        const filterDateFrom = $('#filterDateFrom').val();
        if (filterDateFrom) {
            filtered = filtered.filter(t => t.date >= filterDateFrom);
        }

        // Filtr podle data (do)
        const filterDateTo = $('#filterDateTo').val();
        if (filterDateTo) {
            filtered = filtered.filter(t => t.date <= filterDateTo);
        }

        // Vyhledávání v poznámkách
        const searchNotes = $('#searchNotes').val().toLowerCase();
        if (searchNotes) {
            filtered = filtered.filter(t => 
                t.notes && t.notes.toLowerCase().includes(searchNotes)
            );
        }

        // Seřazení podle data (nejnovější první)
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        this.filteredTransactions = filtered;
        this.updateCategoryFilter();
        this.renderTransactions();
        this.updateCharts();
    },

    /**
     * Vymazání filtrů
     */
    clearFilters() {
        $('#filterType').val('');
        $('#filterCategory').val('');
        $('#filterDateFrom').val('');
        $('#filterDateTo').val('');
        $('#searchNotes').val('');
        this.applyFilters();
    },

    /**
     * Vyrenderování seznamu transakcí
     */
    renderTransactions() {
        const container = $('#transactionsList');
        
        if (this.filteredTransactions.length === 0) {
            container.html('<p class="empty-message">No transactions match the specified filters.</p>');
            return;
        }

        let html = '';
        this.filteredTransactions.forEach(transaction => {
            const amountClass = transaction.type === 'income' ? 'income' : 'expense';
            const itemClass = transaction.type === 'income' ? 'income' : 'expense';
            const amountPrefix = transaction.type === 'income' ? '+' : '-';
            
            html += `
                <div class="transaction-item ${itemClass}">
                    <div class="transaction-info">
                        <h3>${transaction.category}</h3>
                        <div class="transaction-meta">
                            <span>${this.formatDate(transaction.date)}</span>
                            ${transaction.notes ? `<span>${this.escapeHtml(transaction.notes)}</span>` : ''}
                        </div>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${amountPrefix}${this.formatAmount(transaction.amount)} CZK
                    </div>
                    <div class="transaction-actions">
                        <button class="btn btn-secondary edit-btn" data-id="${this.escapeHtml(transaction.id)}">Edit</button>
                        <button class="btn btn-danger delete-btn" data-id="${this.escapeHtml(transaction.id)}">Delete</button>
                    </div>
                </div>
            `;
        });

        container.html(html);
        
        // Nastavení event listenerů pro tlačítka
        container.find('.edit-btn').on('click', function() {
            const id = $(this).data('id');
            App.openEditModal(id);
        });
        
        container.find('.delete-btn').on('click', function() {
            const id = $(this).data('id');
            App.deleteTransaction(id);
        });
    },

    /**
     * Aktualizace souhrnu (příjmy, výdaje, zůstatek)
     */
    updateSummary() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const balance = income - expenses;

        $('#totalIncome').text(this.formatAmount(income) + ' CZK');
        $('#totalExpenses').text(this.formatAmount(expenses) + ' CZK');
        $('#balance').text(this.formatAmount(balance) + ' CZK');
    },

    /**
     * Inicializace grafů
     */
    initCharts() {
        // Koláčový graf kategorií
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        this.categoryChart = new Chart(categoryCtx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Čárový graf zůstatku
        const balanceCtx = document.getElementById('balanceChart').getContext('2d');
        this.balanceChart = new Chart(balanceCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Balance',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    },

    /**
     * Aktualizace grafů
     */
    updateCharts() {
        // Aktualizace koláčového grafu kategorií (pouze výdaje)
        const expensesByCategory = {};
        this.transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
            });

        const categories = Object.keys(expensesByCategory);
        const amounts = Object.values(expensesByCategory);

        this.categoryChart.data.labels = categories;
        this.categoryChart.data.datasets[0].data = amounts;
        this.categoryChart.update();

        // Aktualizace čárového grafu zůstatku
        const transactionsByDate = {};
        this.transactions.forEach(t => {
            if (!transactionsByDate[t.date]) {
                transactionsByDate[t.date] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') {
                transactionsByDate[t.date].income += t.amount;
            } else {
                transactionsByDate[t.date].expense += t.amount;
            }
        });

        const dates = Object.keys(transactionsByDate).sort();
        let balance = 0;
        const balanceData = dates.map(date => {
            balance += transactionsByDate[date].income - transactionsByDate[date].expense;
            return balance;
        });

        this.balanceChart.data.labels = dates.map(d => this.formatDate(d));
        this.balanceChart.data.datasets[0].data = balanceData;
        this.balanceChart.update();
    },

    /**
     * Synchronizace dat s serverem
     */
    async syncData() {
        if (!API.isOnline()) return;

        const pending = Storage.getPendingTransactions();
        if (pending.length === 0) {
            Storage.setSyncNeeded(false);
            return;
        }

        // Zkusíme synchronizovat každou pending transakci
        for (const item of pending) {
            let result = { success: false };

            switch (item.action) {
                case 'add':
                    result = await API.addTransaction(item.transaction);
                    break;
                case 'update':
                    result = await API.updateTransaction(item.originalId || item.transaction.id, item.transaction);
                    break;
                case 'delete':
                    result = await API.deleteTransaction(item.originalId || item.transaction.id);
                    break;
            }

            if (result.success) {
                // Odebereme z pending a aktualizujeme lokální transakci
                const localIndex = this.transactions.findIndex(t => t.id === item.transaction.id);
                if (localIndex !== -1) {
                    this.transactions[localIndex].synced = true;
                }
            }
        }

        // Načteme aktuální data ze serveru
        const serverResult = await API.getTransactions();
        if (serverResult.success && serverResult.data) {
            this.transactions = serverResult.data;
            Storage.saveTransactions(this.transactions);
            Storage.clearPendingTransactions();
            Storage.setSyncNeeded(false);
            this.applyFilters();
            this.updateSummary();
            this.updateCharts();
        }
    },

    /**
     * Export do JSON
     */
    exportToJSON() {
        const data = JSON.stringify(this.transactions, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Export do CSV
     */
    exportToCSV() {
        const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Notes'];
        const rows = this.transactions.map(t => [
            t.id,
            t.date,
            t.type === 'income' ? 'Income' : 'Expense',
            t.category,
            t.amount,
            (t.notes || '').replace(/"/g, '""')
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Pomocné funkce
     */
    formatAmount(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US');
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * URL Management - práce s historie prohlížeče
     */

    /**
     * Uložení stavu filtrů do URL
     */
    saveFiltersToURL() {
        const params = new URLSearchParams();
        
        const filterType = $('#filterType').val();
        const filterCategory = $('#filterCategory').val();
        const filterDateFrom = $('#filterDateFrom').val();
        const filterDateTo = $('#filterDateTo').val();
        const searchNotes = $('#searchNotes').val();

        if (filterType) params.set('type', filterType);
        if (filterCategory) params.set('category', filterCategory);
        if (filterDateFrom) params.set('dateFrom', filterDateFrom);
        if (filterDateTo) params.set('dateTo', filterDateTo);
        if (searchNotes) params.set('search', searchNotes);

        const newURL = params.toString() 
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname;

        // Vytvoření state objektu pro History API
        const state = {
            filters: {
                type: filterType || '',
                category: filterCategory || '',
                dateFrom: filterDateFrom || '',
                dateTo: filterDateTo || '',
                search: searchNotes || ''
            }
        };

        // Aktualizace URL bez reloadu stránky
        window.history.pushState(state, '', newURL);
    },

    /**
     * Vymazání filtrů z URL
     */
    clearFiltersFromURL() {
        // Aktualizace URL bez parametrů
        const newURL = window.location.pathname;
        const state = { filters: { type: '', category: '', dateFrom: '', dateTo: '', search: '' } };
        window.history.pushState(state, '', newURL);
    },

    /**
     * Načtení stavu filtrů z URL
     */
    loadFiltersFromURL() {
        const params = new URLSearchParams(window.location.search);
        
        const type = params.get('type') || '';
        const category = params.get('category') || '';
        const dateFrom = params.get('dateFrom') || '';
        const dateTo = params.get('dateTo') || '';
        const search = params.get('search') || '';

        $('#filterType').val(type);
        $('#filterCategory').val(category);
        $('#filterDateFrom').val(dateFrom);
        $('#filterDateTo').val(dateTo);
        $('#searchNotes').val(search);
    },

    /**
     * Načtení stavu filtrů z state objektu (pro popstate)
     */
    loadFiltersFromState(filters) {
        $('#filterType').val(filters.type || '');
        $('#filterCategory').val(filters.category || '');
        $('#filterDateFrom').val(filters.dateFrom || '');
        $('#filterDateTo').val(filters.dateTo || '');
        $('#searchNotes').val(filters.search || '');
        
        // Aplikujeme filtry po načtení
        this.applyFilters();
        this.updateCategoryFilter();
    }
};

// Inicializace aplikace po načtení DOM
$(document).ready(() => {
    App.init();
});

