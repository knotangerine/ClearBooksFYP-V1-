// DOM Elements
const vouchersTable = document.getElementById('vouchers-table');
const voucherModal = document.getElementById('voucher-modal');
const voucherForm = document.getElementById('voucher-form');
const addVoucherBtn = document.getElementById('add-voucher-btn');
const closeModalBtn = document.getElementById('close-modal');
const addLineBtn = document.getElementById('add-line-btn');
const transactionTypeSelect = document.getElementById('transaction-type');
const voucherDetailsTable = document.getElementById('voucher-details-table').querySelector('tbody');
const totalDebitElement = document.getElementById('total-debit');
const totalCreditElement = document.getElementById('total-credit');
const balanceError = document.getElementById('balance-error');

// State Management
let accounts = [];
let glMappings = [];
let editingVoucherId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        fetchAccounts(),
        fetchGLMappings(),
        loadVouchers()
    ]);
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    addVoucherBtn.addEventListener('click', initNewVoucher);
    closeModalBtn.addEventListener('click', closeModal);
    addLineBtn.addEventListener('click', addVoucherLine);
    voucherForm.addEventListener('submit', handleVoucherSubmit);
    transactionTypeSelect.addEventListener('change', handleTransactionTypeChange);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === voucherModal) {
            closeModal();
        }
    });
}

// Fetch Functions
async function fetchAccounts() {
    try {
        const response = await fetch('/api/ChartOfAccounts');
        const data = await response.json();

        // Validate that we have all required fields
        accounts = data.map(account => ({
            accountId: account.accountId,
            accountNumber: account.accountNumber || '',
            accountName: account.accountName || '',
            accountType: account.accountType || '',
            description: account.description || ''
        }));

        return accounts;
    } catch (error) {
        console.error('Error fetching accounts:', error);
        showError('Failed to load accounts');
    }
}

async function fetchGLMappings() {
    try {
        const response = await fetch('/api/GLMappings');
        glMappings = await response.json();
        populateTransactionTypes();
        return glMappings;
    } catch (error) {
        console.error('Error fetching GL mappings:', error);
        showError('Failed to load GL mappings');
    }
}

async function getNewVoucherNumber() {
    try {
        const response = await fetch('/api/Vouchers/GetNewVoucherNumber');
        const data = await response.json();
        return data.voucherNumber;
    } catch (error) {
        console.error('Error getting new voucher number:', error);
        showError('Failed to get new voucher number');
    }
}

async function loadVouchers() {
    try {
        const response = await fetch('/api/Vouchers');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        const vouchers = await response.json();
        renderVouchersTable(vouchers);
    } catch (error) {
        console.error('Error loading vouchers:', error);
        showError('Failed to load vouchers: ' + error.message);
    }
}

// First, we'll add a function to get full account details
function getAccountDetails(accountId) {
    const account = accounts.find(a => a.accountId === parseInt(accountId));
    if (!account) {
        throw new Error(`Account with ID ${accountId} not found`);
    }
    return {
        accountId: account.accountId,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        accountType: account.accountType,
        description: account.description || 'Account description'  // Provide default if missing
    };
}


// UI Rendering Functions
function populateTransactionTypes() {
    const uniqueTypes = [...new Set(glMappings.map(m => m.transactionType))];
    transactionTypeSelect.innerHTML = '<option value="">Select Type</option>';
    uniqueTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        transactionTypeSelect.appendChild(option);
    });
}

function renderVouchersTable(vouchers) {
    const tbody = vouchersTable.querySelector('tbody');
    tbody.innerHTML = '';

    vouchers.forEach(voucher => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${voucher.voucherNumber}</td>
            <td>${new Date(voucher.voucherDate).toLocaleDateString()}</td>
            <td>${voucher.transactionType}</td>
            <td>${voucher.description || ''}</td>
            <td class="text-right">${voucher.totalAmount.toFixed(2)}</td>
            <td>${voucher.status}</td>
            <td>
                <button onclick="editVoucher(${voucher.voucherId})">Edit</button>
                <button onclick="deleteVoucher(${voucher.voucherId})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function createAccountSelect() {
    const select = document.createElement('select');
    select.required = true;
    select.innerHTML = '<option value="">Select Account</option>';
    accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.accountId;
        option.textContent = `${account.accountNumber} - ${account.accountName}`;
        select.appendChild(option);
    });
    return select;
}

function addVoucherLine() {
    const row = voucherDetailsTable.insertRow();
    row.innerHTML = `
        <td></td>
        <td><input type="text" class="detail-description"></td>
        <td><input type="number" class="debit-amount" step="0.01" min="0" value="0"></td>
        <td><input type="number" class="credit-amount" step="0.01" min="0" value="0"></td>
        <td><button type="button" onclick="removeLine(this)">Remove</button></td>
    `;

    const accountCell = row.cells[0];
    accountCell.appendChild(createAccountSelect());

    setupLineEventListeners(row);
}

// Event Handlers
async function initNewVoucher() {
    editingVoucherId = null;
    voucherForm.reset();
    clearVoucherDetails();

    const voucherNumber = await getNewVoucherNumber();
    document.getElementById('voucher-number').value = voucherNumber;
    document.getElementById('voucher-date').value = new Date().toISOString().split('T')[0];

    voucherModal.style.display = 'flex';
}

async function editVoucher(voucherId) {
    try {
        const response = await fetch(`/api/Vouchers/${voucherId}`);
        const voucher = await response.json();

        editingVoucherId = voucherId;
        populateVoucherForm(voucher);
        voucherModal.style.display = 'block';
    } catch (error) {
        console.error('Error loading voucher:', error);
        showError('Failed to load voucher details');
    }
}

async function deleteVoucher(voucherId) {
    if (!confirm('Are you sure you want to delete this voucher?')) {
        return;
    }

    try {
        const response = await fetch(`/api/Vouchers/${voucherId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete voucher');
        }

        await loadVouchers(); // Reload the table after successful deletion
        showSuccess('Voucher deleted successfully');
    } catch (error) {
        console.error('Error deleting voucher:', error);
        showError(error.message);
    }
}

// Update the handleVoucherSubmit function with better error handling
async function handleVoucherSubmit(e) {
    e.preventDefault();

    if (!validateVoucherForm()) {
        return;
    }

    try {
        const voucherData = collectVoucherData();
        const url = '/api/Vouchers' + (editingVoucherId ? `/${editingVoucherId}` : '');
        const method = editingVoucherId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(voucherData)
        });

        const contentType = response.headers.get("content-type");

        if (!response.ok) {
            let errorMessage = 'Failed to save voucher';

            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                if (errorData.errors) {
                    errorMessage = Object.entries(errorData.errors)
                        .map(([key, value]) => `${key}: ${value.join(', ')}`)
                        .join('\n');
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } else {
                errorMessage = await response.text();
            }

            throw new Error(errorMessage);
        }

        const result = await response.json();
        await loadVouchers();
        closeModal();
        showSuccess('Voucher saved successfully');
    } catch (error) {
        console.error('Error saving voucher:', error);
        showError(error.message);
    }
}
// Helper Functions
function populateVoucherForm(voucher) {
    document.getElementById('voucher-number').value = voucher.voucherNumber;
    document.getElementById('voucher-date').value = voucher.voucherDate.split('T')[0];
    document.getElementById('transaction-type').value = voucher.transactionType;
    document.getElementById('description').value = voucher.description || '';

    clearVoucherDetails();
    voucher.voucherDetails.forEach(detail => {
        const row = voucherDetailsTable.insertRow();
        row.innerHTML = `
            <td></td>
            <td><input type="text" class="detail-description" value="${detail.description || ''}"></td>
            <td><input type="number" class="debit-amount" step="0.01" min="0" value="${detail.isDebit ? detail.amount : 0}"></td>
            <td><input type="number" class="credit-amount" step="0.01" min="0" value="${!detail.isDebit ? detail.amount : 0}"></td>
            <td><button type="button" onclick="removeLine(this)">Remove</button></td>
        `;

        const accountSelect = createAccountSelect();
        accountSelect.value = detail.accountId;
        row.cells[0].appendChild(accountSelect);

        setupLineEventListeners(row);
    });

    updateTotals();
}

function clearVoucherDetails() {
    voucherDetailsTable.innerHTML = '';
    updateTotals();
}

function setupLineEventListeners(row) {
    const debitInput = row.querySelector('.debit-amount');
    const creditInput = row.querySelector('.credit-amount');

    debitInput.addEventListener('input', function () {
        if (this.value && parseFloat(this.value) > 0) {
            creditInput.value = '0';
        }
        updateTotals();
    });

    creditInput.addEventListener('input', function () {
        if (this.value && parseFloat(this.value) > 0) {
            debitInput.value = '0';
        }
        updateTotals();
    });
}

function updateTotals() {
    let totalDebit = 0;
    let totalCredit = 0;

    const rows = voucherDetailsTable.rows;
    for (let row of rows) {
        totalDebit += parseFloat(row.querySelector('.debit-amount').value) || 0;
        totalCredit += parseFloat(row.querySelector('.credit-amount').value) || 0;
    }

    totalDebitElement.textContent = totalDebit.toFixed(2);
    totalCreditElement.textContent = totalCredit.toFixed(2);

    const difference = Math.abs(totalDebit - totalCredit);
    balanceError.textContent = difference > 0.01 ? 'Debit and Credit must be equal' : '';
}

function validateVoucherForm() {
    if (!voucherForm.checkValidity()) {
        showError('Please fill in all required fields');
        return false;
    }

    const totalDebit = parseFloat(totalDebitElement.textContent);
    const totalCredit = parseFloat(totalCreditElement.textContent);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        showError('Debit and Credit must be equal');
        return false;
    }

    if (totalDebit === 0 || totalCredit === 0) {
        showError('Voucher must have at least one entry');
        return false;
    }

    return true;
}

// Update the collectVoucherData function to ensure all required fields are present
// Update the collectVoucherData function to match server expectations exactly
function collectVoucherData() {
    const voucherHeader = {
        voucherId: editingVoucherId || 0,
        voucherNumber: document.getElementById('voucher-number').value,
        voucherDate: new Date(document.getElementById('voucher-date').value).toISOString(),
        transactionType: document.getElementById('transaction-type').value,
        description: document.getElementById('description').value || '',
        totalAmount: parseFloat(totalDebitElement.textContent),
        status: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        voucherDetails: []
    };

    const rows = voucherDetailsTable.rows;
    for (let row of rows) {
        const accountSelect = row.querySelector('select');
        const accountId = parseInt(accountSelect.value);
        const debitAmount = parseFloat(row.querySelector('.debit-amount').value) || 0;
        const creditAmount = parseFloat(row.querySelector('.credit-amount').value) || 0;

        // Only add details with valid amounts
        if (debitAmount > 0 || creditAmount > 0) {
            voucherHeader.voucherDetails.push({
                detailId: 0,
                voucherId: voucherHeader.voucherId,
                accountId: accountId,
                description: row.querySelector('.detail-description').value || '',
                isDebit: debitAmount > 0,
                amount: debitAmount || creditAmount,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
    }

    return voucherHeader;
}


function validateVoucherForm() {
    if (!voucherForm.checkValidity()) {
        showError('Please fill in all required fields');
        return false;
    }

    if (!document.getElementById('transaction-type').value) {
        showError('Transaction type is required');
        return false;
    }

    const totalDebit = parseFloat(totalDebitElement.textContent);
    const totalCredit = parseFloat(totalCreditElement.textContent);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        showError('Debit and Credit must be equal');
        return false;
    }

    if (totalDebit === 0 || totalCredit === 0) {
        showError('Voucher must have at least one entry');
        return false;
    }

    const details = voucherDetailsTable.rows;
    if (!details.length) {
        showError('At least one voucher detail is required');
        return false;
    }

    for (let row of details) {
        const accountSelect = row.querySelector('select');
        if (!accountSelect.value) {
            showError('Please select an account for all lines');
            return false;
        }
    }

    return true;
}


function closeModal() {
    voucherModal.style.display = 'none';
    editingVoucherId = null;
    voucherForm.reset();
    clearVoucherDetails();
    balanceError.textContent = '';
}

function removeLine(button) {
    const row = button.closest('tr');
    row.remove();
    updateTotals();
}

function handleTransactionTypeChange() {
    const selectedType = transactionTypeSelect.value;
    if (!selectedType) return;

    clearVoucherDetails();
    const mapping = glMappings.find(m => m.transactionType === selectedType);
    if (mapping) {
        addDefaultLines(mapping);
    }
}

function addDefaultLines(mapping) {
    // Add debit line
    const debitRow = voucherDetailsTable.insertRow();
    debitRow.innerHTML = `
        <td></td>
        <td><input type="text" class="detail-description"></td>
        <td><input type="number" class="debit-amount" step="0.01" min="0" value="0"></td>
        <td><input type="number" class="credit-amount" step="0.01" min="0" value="0"></td>
        <td><button type="button" onclick="removeLine(this)">Remove</button></td>
    `;
    const debitSelect = createAccountSelect();
    debitSelect.value = mapping.debitAccount;
    debitRow.cells[0].appendChild(debitSelect);

    // Add credit line
    const creditRow = voucherDetailsTable.insertRow();
    creditRow.innerHTML = `
        <td></td>
        <td><input type="text" class="detail-description"></td>
        <td><input type="number" class="debit-amount" step="0.01" min="0" value="0"></td>
        <td><input type="number" class="credit-amount" step="0.01" min="0" value="0"></td>
        <td><button type="button" onclick="removeLine(this)">Remove</button></td>
    `;
    const creditSelect = createAccountSelect();
    creditSelect.value = mapping.creditAccount;
    creditRow.cells[0].appendChild(creditSelect);

    setupLineEventListeners(debitRow);
    setupLineEventListeners(creditRow);
}

// Utility Functions
// Update the error display function
function showError(message) {
    console.error('Error Details:', message);

    let displayMessage = message;
    if (typeof message === 'object') {
        try {
            displayMessage = JSON.stringify(message, null, 2);
        } catch (e) {
            displayMessage = message.toString();
        }
    }

    // Limit the length of the message for alert
    if (displayMessage.length > 500) {
        displayMessage = displayMessage.substring(0, 500) + '...';
    }

    alert(displayMessage);
}

function showSuccess(message) {
    let displayMessage = message;
    if (typeof message === 'object' && message.message) {
        displayMessage = message.message;
    }
    alert(displayMessage);
}