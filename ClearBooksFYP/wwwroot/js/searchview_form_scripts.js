document.addEventListener("DOMContentLoaded", function () {
    // API endpoint
    const apiUrl = 'https://localhost:5001/api';

    // State management
    let currentPage = 1;
    let pageSize = 10;
    let totalPages = 1;
    let currentSort = { field: 'date', direction: 'desc' };
    let savedFilters = JSON.parse(localStorage.getItem('savedFilters') || '[]');

    // DOM elements
    const searchForm = document.getElementById('search-form');
    const resultsTable = document.getElementById('results-table');
    const tableBody = resultsTable.querySelector('tbody');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const pageSizeSelect = document.getElementById('page-size');
    const exportModal = document.getElementById('export-modal');
    const saveFilterModal = document.getElementById('save-filter-modal');
    const savedFiltersList = document.getElementById('saved-filters-list');

    // Initialize saved filters
    function initializeSavedFilters() {
        savedFiltersList.innerHTML = '';
        savedFilters.forEach(filter => {
            const filterElement = document.createElement('div');
            filterElement.className = 'saved-filter';
            filterElement.innerHTML = `
                <span>${filter.name}</span>
                <button onclick="applyFilter('${filter.name}')">Apply</button>
                <button onclick="deleteFilter('${filter.name}')">×</button>
            `;
            savedFiltersList.appendChild(filterElement);
        });
    }

    // Save current filter
    document.getElementById('save-filter-form').onsubmit = function (e) {
        e.preventDefault();
        const filterName = document.getElementById('filter-name').value;
        const filterData = {
            name: filterName,
            criteria: getSearchCriteria()
        };
        savedFilters = savedFilters.filter(f => f.name !== filterName);
        savedFilters.push(filterData);
        localStorage.setItem('savedFilters', JSON.stringify(savedFilters));
        initializeSavedFilters();
        hideModal(saveFilterModal);
    };

    // Apply saved filter
    window.applyFilter = function (filterName) {
        const filter = savedFilters.find(f => f.name === filterName);
        if (filter) {
            Object.entries(filter.criteria).forEach(([key, value]) => {
                const element = document.getElementById(key);
                if (element) element.value = value;
            });
            performSearch();
        }
    };

    // Delete saved filter
    window.deleteFilter = function (filterName) {
        if (confirm('Are you sure you want to delete this saved filter?')) {
            savedFilters = savedFilters.filter(f => f.name !== filterName);
            localStorage.setItem('savedFilters', JSON.stringify(savedFilters));
            initializeSavedFilters();
        }
    };

    // Get search criteria from form
    function getSearchCriteria() {
        return {
            'account-name': document.getElementById('account-name').value,
            'voucher-number': document.getElementById('voucher-number').value,
            'transaction-type': document.getElementById('transaction-type').value,
            'date-from': document.getElementById('date-from').value,
            'date-to': document.getElementById('date-to').value,
            'amount-min': document.getElementById('amount-min').value,
            'amount-max': document.getElementById('amount-max').value,
            'status': document.getElementById('status').value,
            'description': document.getElementById('description').value
        };
    }

    // Perform search
    async function performSearch() {
        try {
            const criteria = getSearchCriteria();
            const queryParams = new URLSearchParams({
                ...criteria,
                page: currentPage,
                pageSize: pageSize,
                sortField: currentSort.field,
                sortDirection: currentSort.direction
            });

            const response = await fetch(`${apiUrl}/search?${queryParams}`);
            if (!response.ok) throw new Error('Search failed');

            const data = await response.json();
            updateTable(data.results);
            updatePagination(data.totalPages);
        } catch (error) {
            showError('Failed to perform search. Please try again.');
            console.error('Search error:', error);
        }
    }

    // Update table with results
    function updateTable(results) {
        tableBody.innerHTML = '';
        if (results.length === 0) {
            showError('No results found');
            return;
        }

        results.forEach(result => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${result.transactionId}</td>
                <td>${new Date(result.date).toLocaleDateString()}</td>
                <td>${result.voucherNumber}</td>
                <td>${result.accountName}</td>
                <td>${result.type}</td>
                <td>${result.amount.toFixed(2)}</td>
                <td><span class="status-badge ${result.status.toLowerCase()}">${result.status}</span></td>
                <td>${result.description}</td>
                <td>
                    <button onclick="viewDetails(${result.transactionId})" class="action-btn view-btn">View</button>
                    <button onclick="editRecord(${result.transactionId})" class="action-btn edit-btn">Edit</button>
                    <button onclick="deleteRecord(${result.transactionId})" class="action-btn delete-btn">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Update pagination controls
    function updatePagination(total) {
        totalPages = total;
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }

    // Handle sorting
    function initializeSorting() {
        const headers = resultsTable.querySelectorAll('th[data-sort]');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const field = header.dataset.sort;
                if (currentSort.field === field) {
                    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.field = field;
                    currentSort.direction = 'asc';
                }

                // Update sort indicators
                headers.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
                header.classList.add(`sort-${currentSort.direction}`);

                currentPage = 1;
                performSearch();
            });
        });
    }

    // Export functionality
    function initializeExport() {
        const exportButtons = document.querySelectorAll('.export-options button');
        exportButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const format = button.dataset.format;
                try {
                    const criteria = getSearchCriteria();
                    const response = await fetch(`${apiUrl}/export`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ format, criteria })
                    });

                    if (!response.ok) throw new Error('Export failed');

                    if (format === 'print') {
                        const printWindow = window.open('', '_blank');
                        printWindow.document.write(await response.text());
                        printWindow.print();
                    } else if (format === 'email') {
                        showMessage('Export has been sent to your email.');
                    } else {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `search-results.${format}`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                    }
                } catch (error) {
                    showError('Export failed. Please try again.');
                    console.error('Export error:', error);
                }
            });
        });
    }

    // Record actions
    window.viewDetails = async function (id) {
        try {
            const response = await fetch(`${apiUrl}/transactions/${id}`);
            if (!response.ok) throw new Error('Failed to fetch details');
            const details = await response.json();
            // Redirect to appropriate module based on transaction type
            window.location.href = `${details.type.toLowerCase()}_form.html?id=${id}`;
        } catch (error) {
            showError('Failed to load transaction details.');
            console.error('View details error:', error);
        }
    };

    window.editRecord = async function (id) {
        try {
            const response = await fetch(`${apiUrl}/transactions/${id}`);
            if (!response.ok) throw new Error('Failed to fetch record');
            const record = await response.json();
            // Redirect to appropriate edit form
            window.location.href = `${record.type.toLowerCase()}_form.html?id=${id}&mode=edit`;
        } catch (error) {
            showError('Failed to load record for editing.');
            console.error('Edit error:', error);
        }
    };

    window.deleteRecord = async function (id) {
        if (!confirm('Are you sure you want to delete this record?')) return;

        try {
            const response = await fetch(`${apiUrl}/transactions/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Delete failed');
            performSearch(); // Refresh results
            showMessage('Record deleted successfully.');
        } catch (error) {
            showError('Failed to delete record.');
            console.error('Delete error:', error);
        }
    };

    // UI Helpers
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        resultsTable.parentNode.insertBefore(errorDiv, resultsTable);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    function showMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.textContent = message;
        resultsTable.parentNode.insertBefore(messageDiv, resultsTable);
        setTimeout(() => messageDiv.remove(), 3000);
    }

    function showModal(modal) {
        modal.style.display = 'flex';
    }

    function hideModal(modal) {
        modal.style.display = 'none';
    }

    // Event Listeners
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentPage = 1;
        performSearch();
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        searchForm.reset();
        performSearch();
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            performSearch();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            performSearch();
        }
    });

    pageSizeSelect.addEventListener('change', () => {
        pageSize = parseInt(pageSizeSelect.value);
        currentPage = 1;
        performSearch();
    });

    document.getElementById('export-btn').addEventListener('click', () => {
        showModal(exportModal);
    });

    document.getElementById('save-filter-btn').addEventListener('click', () => {
        showModal(saveFilterModal);
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            hideModal(e.target);
        }
    });

    // Close buttons in modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            hideModal(closeBtn.closest('.modal'));
        });
    });

    // Initialize components
    initializeSavedFilters();
    initializeSorting();
    initializeExport();
    performSearch(); // Initial search
});