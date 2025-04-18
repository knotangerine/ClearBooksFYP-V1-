// DOM Elements
const paymentsTable = document.getElementById('payments-table');
const paymentModal = document.getElementById('payment-modal');
const paymentForm = document.getElementById('payment-form');
const addPaymentBtn = document.getElementById('add-payment-btn');
const closeModalBtn = document.getElementById('close-modal');
const paymentMethodSelect = document.getElementById('payment-method');
const paymentDetailsTable = document.getElementById('payment-details-table').querySelector('tbody');
const totalPaymentAmount = document.getElementById('total-payment-amount');
const voucherSearch = document.getElementById('voucher-search');
const searchVouchersBtn = document.getElementById('search-vouchers');
const saveDraftBtn = document.getElementById('save-draft-btn');
const submitPaymentBtn = document.getElementById('submit-payment-btn');
const printPaymentBtn = document.getElementById('print-payment-btn');
const attachmentInput = document.getElementById('attachment-input');
const attachmentList = document.getElementById('attachment-list');

// State Management
let accounts = [];
let pendingVouchers = [];
let selectedVouchers = new Set();
let editingPaymentId = null;
let attachments = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        fetchAccounts(),
        loadPayments()
    ]);
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    addPaymentBtn.addEventListener('click', initNewPayment);
    closeModalBtn.addEventListener('click', closeModal);
    paymentForm.addEventListener('submit', handlePaymentSubmit);
    searchVouchersBtn.addEventListener('click', searchVouchers);
    saveDraftBtn.addEventListener('click', () => savePayment('Draft'));
    printPaymentBtn.addEventListener('click', printPayment);
    attachmentInput.addEventListener('change', handleAttachments);

    // Search input on enter key
    voucherSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchVouchers();
        }
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === paymentModal) {
            closeModal();
        }
    });
}

// Fetch Functions
async function fetchAccounts() {
    try {
        const response = await fetch('/api/ChartOfAccounts');
        accounts = await response.json();
        populatePayFromAccounts();
        return accounts;
    } catch (error) {
        console.error('Error fetching accounts:', error);
        showError('Failed to load accounts');
    }
}

async function getNewPaymentNumber() {
    try {
        const response = await fetch('/api/Payments/GetNewPaymentNumber');
        const data = await response.json();
        return data.paymentNumber;
    } catch (error) {
        console.error('Error getting new payment number:', error);
        showError('Failed to get new payment number');
        return 'PMT-' + Date.now();
    }
}

async function searchVouchers() {
    const searchTerm = voucherSearch.value.trim();
    try {
        const response = await fetch(`/api/Vouchers/Pending?search=${encodeURIComponent(searchTerm)}`);
        pendingVouchers = await response.json();
        renderVoucherSelection();
    } catch (error) {
        console.error('Error searching vouchers:', error);
        showError('Failed to search vouchers');
    }
}

async function loadPayments() {
    try {
        const response = await fetch('/api/Payments');
        const payments = await response.json();
        renderPaymentsTable(payments);
    } catch (error) {
        console.error('Error loading payments:', error);
        showError('Failed to load payments');
    }
}

// UI Rendering Functions
function populatePayFromAccounts() {
    const accountSelect = document.getElementById('account-id');
    accountSelect.innerHTML = '<option value="">Select Account</option>';

    const cashBankAccounts = accounts.filter(acc =>
        acc.accountType === 'Cash' || acc.accountType === 'Bank'
    );

    cashBankAccounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.accountId;
        option.textContent = `${account.accountNumber} - ${account.accountName}`;
        accountSelect.appendChild(option);
    });
}

function renderPaymentsTable(payments) {
    const tbody = paymentsTable.querySelector('tbody');
    tbody.innerHTML = '';

    payments.forEach(payment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.paymentNumber}</td>
            <td>${new Date(payment.paymentDate).toLocaleDateString()}</td>
            <td>${payment.payeeName}</td>
            <td>${payment.paymentMethod}</td>
            <td class="text-right">${payment.totalAmount.toFixed(2)}</td>
            <td>${payment.status}</td>
            <td>
                <button onclick="editPayment(${payment.paymentId})" ${payment.status === 'Paid' ? 'disabled' : ''}>Edit</button>
                <button onclick="voidPayment(${payment.paymentId})" ${payment.status === 'Void' ? 'disabled' : ''}>Void</button>
                <button onclick="printPayment(${payment.paymentId})">Print</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderVoucherSelection() {
    paymentDetailsTable.innerHTML = '';

    pendingVouchers.forEach(voucher => {
        const row = document.createElement('tr');
        const remainingAmount = calculateRemainingAmount(voucher);

        row.innerHTML = `
            <td><input type="checkbox" class="voucher-select" data-voucher-id="${voucher.voucherId}" 
                ${selectedVouchers.has(voucher.voucherId) ? 'checked' : ''}></td>
            <td>${voucher.voucherNumber}</td>
            <td>${new Date(voucher.voucherDate).toLocaleDateString()}</td>
            <td class="text-right">${voucher.totalAmount.toFixed(2)}</td>
            <td class="text-right">${(voucher.totalAmount - remainingAmount).toFixed(2)}</td>
            <td class="text-right">${remainingAmount.toFixed(2)}</td>
            <td><input type="number" class="payment-amount" step="0.01" min="0" 
                max="${remainingAmount}" value="${remainingAmount}"></td>
        `;

        setupVoucherRowListeners(row);
        paymentDetailsTable.appendChild(row);
    });

    updateTotalPaymentAmount();
}

// Event Handlers
async function initNewPayment() {
    editingPaymentId = null;
    paymentForm.reset();
    selectedVouchers.clear();
    attachments = [];
    updateAttachmentList();

    const paymentNumber = await getNewPaymentNumber();
    document.getElementById('payment-number').value = paymentNumber;
    document.getElementById('payment-date').value = new Date().toISOString().split('T')[0];

    paymentModal.style.display = 'flex';
    await searchVouchers();
}

function setupVoucherRowListeners(row) {
    const checkbox = row.querySelector('.voucher-select');
    const amountInput = row.querySelector('.payment-amount');

    checkbox.addEventListener('change', () => {
        const voucherId = parseInt(checkbox.dataset.voucherId);
        if (checkbox.checked) {
            selectedVouchers.add(voucherId);
        } else {
            selectedVouchers.delete(voucherId);
        }
        updateTotalPaymentAmount();
    });

    amountInput.addEventListener('input', () => {
        const max = parseFloat(amountInput.max);
        let value = parseFloat(amountInput.value);

        if (value > max) {
            value = max;
            amountInput.value = max;
        }

        updateTotalPaymentAmount();
    });
}

function updateTotalPaymentAmount() {
    let total = 0;
    const rows = paymentDetailsTable.rows;

    for (let row of rows) {
        const checkbox = row.querySelector('.voucher-select');
        if (checkbox && checkbox.checked) {
            const amountInput = row.querySelector('.payment-amount');
            total += parseFloat(amountInput.value) || 0;
        }
    }

    totalPaymentAmount.textContent = total.toFixed(2);
}

function handleAttachments(e) {
    const files = Array.from(e.target.files);
    attachments = [...attachments, ...files];
    updateAttachmentList();
}

function updateAttachmentList() {
    attachmentList.innerHTML = '';
    attachments.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'attachment-item';
        item.innerHTML = `
            ${file.name}
            <button type="button" onclick="removeAttachment(${index})">Remove</button>
        `;
        attachmentList.appendChild(item);
    });
}

function removeAttachment(index) {
    attachments.splice(index, 1);
    updateAttachmentList();
}

async function savePayment(status = 'Paid') {
    if (!validatePaymentForm()) {
        return false;
    }

    try {
        const formData = new FormData();
        const paymentData = collectPaymentData(status);

        formData.append('payment', JSON.stringify(paymentData));
        attachments.forEach(file => {
            formData.append('attachments', file);
        });

        const url = '/api/Payments' + (editingPaymentId ? `/${editingPaymentId}` : '');
        const method = editingPaymentId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            body: formData
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        await loadPayments();
        closeModal();
        showSuccess('Payment saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving payment:', error);
        showError(error.message);
        return false;
    }
}

async function handlePaymentSubmit(e) {
    e.preventDefault();
    await savePayment('Paid');
}

function calculateRemainingAmount(voucher) {
    // This should be replaced with actual payment history calculation
    return voucher.totalAmount;
}

async function voidPayment(paymentId) {
    if (!confirm('Are you sure you want to void this payment?')) {
        return;
    }

    try {
        const response = await fetch(`/api/Payments/${paymentId}/void`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        await loadPayments();
        showSuccess('Payment voided successfully');
    } catch (error) {
        console.error('Error voiding payment:', error);
        showError(error.message);
    }
}

async function printPayment(paymentId) {
    try {
        const response = await fetch(`/api/Payments/${paymentId}/print`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-${paymentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error printing payment:', error);
        showError('Failed to generate payment document');
    }
}

// Validation Functions
function validatePaymentForm() {
    if (!paymentForm.checkValidity()) {
        showError('Please fill in all required fields');
        return false;
    }

    const totalAmount = parseFloat(totalPaymentAmount.textContent);
    if (totalAmount <= 0) {
        showError('Total payment amount must be greater than zero');
        return false;
    }

    if (selectedVouchers.size === 0) {
        showError('Please select at least one voucher to pay');
        return false;
    }

    if (!document.getElementById('account-id').value) {
        showError('Please select a payment account');
        return false;
    }

    return true;
}

function collectPaymentData(status) {
    const paymentDetails = [];
    const rows = paymentDetailsTable.rows;

    for (let row of rows) {
        const checkbox = row.querySelector('.voucher-select');
        if (checkbox && checkbox.checked) {
            const voucherId = parseInt(checkbox.dataset.voucherId);
            const amount = parseFloat(row.querySelector('.payment-amount').value);

            paymentDetails.push({
                voucherId: voucherId,
                amount: amount
            });
        }
    }

    return {
        paymentId: editingPaymentId || 0,
        paymentNumber: document.getElementById('payment-number').value,
        paymentDate: document.getElementById('payment-date').value,
        paymentMethod: document.getElementById('payment-method').value,
        accountId: parseInt(document.getElementById('account-id').value),
        payeeName: document.getElementById('payee-name').value,
        referenceNumber: document.getElementById('reference-number').value,
        description: document.getElementById('description').value,
        totalAmount: parseFloat(totalPaymentAmount.textContent),
        status: status,
        paymentDetails: paymentDetails
    };
}

// Utility Functions
function closeModal() {
    paymentModal.style.display = 'none';
    editingPaymentId = null;
    paymentForm.reset();
    selectedVouchers.clear();
    attachments = [];
    updateAttachmentList();
}

function showError(message) {
    const errorElement = document.getElementById('payment-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    alert(message);
}