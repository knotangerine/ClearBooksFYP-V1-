// DOM Elements
const receiptsTable = document.getElementById('receipts-table');
const receiptModal = document.getElementById('receipt-modal');
const receiptForm = document.getElementById('receipt-form');
const addReceiptBtn = document.getElementById('add-receipt-btn');
const closeModalBtn = document.getElementById('close-modal');

// State Management
let vouchers = [];
let editingReceiptId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        fetchVouchers(),
        loadReceipts()
    ]);
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    addReceiptBtn.addEventListener('click', initNewReceipt);
    closeModalBtn.addEventListener('click', closeModal);
    receiptForm.addEventListener('submit', handleReceiptSubmit);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === receiptModal) {
            closeModal();
        }
    });

    // Add input event listener for amount formatting
    const amountInput = document.getElementById('amount');
    if (amountInput) {
        amountInput.addEventListener('input', formatAmount);
    }
}

// Fetch Functions
async function fetchVouchers() {
    try {
        const response = await fetch('/api/Vouchers');
        if (!response.ok) {
            throw new Error('Failed to fetch vouchers');
        }
        vouchers = await response.json();
    } catch (error) {
        console.error('Error fetching vouchers:', error);
        showError('Failed to load vouchers');
    }
}

async function getNewReceiptNumber() {
    try {
        const response = await fetch('/api/Receipts/GetNewReceiptNumber');
        const data = await response.json();
        return data.receiptNumber;
    } catch (error) {
        console.error('Error getting new receipt number:', error);
        return 'RCP' + Date.now(); // Fallback receipt number
    }
}

async function loadReceipts() {
    try {
        const response = await fetch('/api/Receipts');
        if (!response.ok) {
            throw new Error('Failed to fetch receipts');
        }
        const receipts = await response.json();
        renderReceiptsTable(receipts);
    } catch (error) {
        console.error('Error loading receipts:', error);
        
    }
}

// UI Rendering Functions
function renderReceiptsTable(receipts) {
    const tbody = receiptsTable.querySelector('tbody');
    tbody.innerHTML = '';

    receipts.forEach(receipt => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${receipt.receiptNumber}</td>
            <td>${new Date(receipt.date).toLocaleDateString()}</td>
            <td>${receipt.payerName}</td>
            <td class="text-right">${formatCurrency(receipt.amount)}</td>
            <td>${receipt.paymentMethod}</td>
            <td>${receipt.referenceNumber || ''}</td>
            <td>${receipt.currency}</td>
            <td>
                <button class="edit-btn" onclick="editReceipt(${receipt.receiptId})">Edit</button>
                <button class="delete-btn" onclick="deleteReceipt(${receipt.receiptId})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Event Handlers
async function initNewReceipt() {
    editingReceiptId = null;
    receiptForm.reset();

    const receiptNumber = await getNewReceiptNumber();
    document.getElementById('receipt-number').value = receiptNumber;
    document.getElementById('receipt-date').value = new Date().toISOString().split('T')[0];

    receiptModal.style.display = 'flex';
}

async function editReceipt(receiptId) {
    try {
        const response = await fetch(`/api/Receipts/${receiptId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch receipt details');
        }
        const receipt = await response.json();

        editingReceiptId = receiptId;
        populateReceiptForm(receipt);
        receiptModal.style.display = 'block';
    } catch (error) {
        console.error('Error loading receipt:', error);
        showError('Failed to load receipt details');
    }
}

async function deleteReceipt(receiptId) {
    if (!confirm('Are you sure you want to delete this receipt?')) {
        return;
    }

    try {
        const response = await fetch(`/api/Receipts/${receiptId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete receipt');
        }

        await loadReceipts();
        showSuccess('Receipt deleted successfully');
    } catch (error) {
        console.error('Error deleting receipt:', error);
        showError(error.message);
    }
}

async function handleReceiptSubmit(e) {
    e.preventDefault();

    if (!validateReceiptForm()) {
        return;
    }

    try {
        const receiptData = collectReceiptData();
        const url = '/api/Receipts' + (editingReceiptId ? `/${editingReceiptId}` : '');
        const method = editingReceiptId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(receiptData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save receipt');
        }

        await loadReceipts();
        closeModal();
        showSuccess('Receipt saved successfully');
    } catch (error) {
        console.error('Error saving receipt:', error);
        showError(error.message);
    }
}

// Helper Functions
function populateReceiptForm(receipt) {
    document.getElementById('receipt-number').value = receipt.receiptNumber;
    document.getElementById('receipt-date').value = new Date(receipt.date).toISOString().split('T')[0];
    document.getElementById('payer-name').value = receipt.payerName;
    document.getElementById('amount').value = receipt.amount.toFixed(2);
    document.getElementById('payment-method').value = receipt.paymentMethod;
    document.getElementById('reference-number').value = receipt.referenceNumber || '';
    document.getElementById('description').value = receipt.description || '';
    document.getElementById('currency').value = receipt.currency;
    document.getElementById('voucher-id').value = receipt.voucherId || '';
}

function validateReceiptForm() {
    if (!receiptForm.checkValidity()) {
        showError('Please fill in all required fields');
        return false;
    }

    const amount = parseFloat(document.getElementById('amount').value);
    if (isNaN(amount) || amount <= 0) {
        showError('Please enter a valid amount');
        return false;
    }

    return true;
}

function collectReceiptData() {
    return {
        receiptId: editingReceiptId || 0,
        receiptNumber: document.getElementById('receipt-number').value,
        payerName: document.getElementById('payer-name').value,
        amount: parseFloat(document.getElementById('amount').value),
        date: new Date(document.getElementById('receipt-date').value).toISOString(),
        paymentMethod: document.getElementById('payment-method').value,
        referenceNumber: document.getElementById('reference-number').value,
        description: document.getElementById('description').value,
        currency: document.getElementById('currency').value,
        voucherId: document.getElementById('voucher-id').value || null,
        createdBy: 'System', // Replace with actual user info
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

function closeModal() {
    receiptModal.style.display = 'none';
    editingReceiptId = null;
    receiptForm.reset();
}

// Utility Functions
function formatAmount(e) {
    let value = e.target.value.replace(/[^\d.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[1]?.length > 2) {
        value = parts[0] + '.' + parts[1].slice(0, 2);
    }
    e.target.value = value;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function showError(message) {
    console.error('Error:', message);
    alert(message);
}

function showSuccess(message) {
    alert(message);
}