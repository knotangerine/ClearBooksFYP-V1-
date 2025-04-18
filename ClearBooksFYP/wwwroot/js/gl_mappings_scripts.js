﻿document.addEventListener("DOMContentLoaded", function () {
    const apiUrl = 'https://localhost:5001/api/GLMappings';
    const coaApiUrl = 'https://localhost:5001/api/ChartOfAccounts';
    const tableBody = document.querySelector("#mappings-table tbody");
    const mappingModal = document.getElementById("mapping-modal");
    const addMappingBtn = document.getElementById("add-mapping-btn");
    const closeModal = document.getElementById("close-modal");
    const mappingForm = document.getElementById("mapping-form");
    const modalTitle = document.querySelector(".modal-content h2");
    const submitButton = document.querySelector("#mapping-form button[type='submit']");

    // Form elements
    const transactionType = document.getElementById("transaction-type");
    const debitAccount = document.getElementById("debit-account");
    const creditAccount = document.getElementById("credit-account");

    let isEditMode = false;
    let editingMappingId = null;

    // Validation functions
    function validateTransactionType(value) {
        return value.trim().length > 0;
    }

    function validateAccounts() {
        return debitAccount.value && creditAccount.value && debitAccount.value !== creditAccount.value;
    }

    function validateForm() {
        let isValid = true;

        // Validate Transaction Type
        if (!validateTransactionType(transactionType.value)) {
            document.getElementById("transaction-type-error").textContent = "Please enter a valid transaction type";
            transactionType.classList.add('invalid');
            isValid = false;
        }

        // Validate Accounts
        if (!validateAccounts()) {
            if (!debitAccount.value) {
                document.getElementById("debit-account-error").textContent = "Please select a debit account";
                debitAccount.classList.add('invalid');
            }
            if (!creditAccount.value) {
                document.getElementById("credit-account-error").textContent = "Please select a credit account";
                creditAccount.classList.add('invalid');
            }
            if (debitAccount.value === creditAccount.value) {
                document.getElementById("credit-account-error").textContent = "Debit and Credit accounts must be different";
                creditAccount.classList.add('invalid');
            }
            isValid = false;
        }

        return isValid;
    }

    // Show/hide modal functions
    function showModal(isEdit = false) {
        isEditMode = isEdit;
        modalTitle.textContent = isEdit ? "Edit Mapping" : "Add New Mapping";
        submitButton.textContent = isEdit ? "Update Mapping" : "Add Mapping";
        mappingModal.style.display = "flex";
    }

    function hideModal() {
        mappingModal.style.display = "none";
        clearErrors();
        mappingForm.reset();
        isEditMode = false;
        editingMappingId = null;
    }

    // Clear error messages
    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(error => error.textContent = '');
        document.querySelectorAll('.invalid').forEach(field => field.classList.remove('invalid'));
    }

    // Populate account dropdowns
    async function populateAccountDropdowns() {
        try {
            const response = await fetch(coaApiUrl);
            if (!response.ok) throw new Error('Failed to fetch accounts');
            const accounts = await response.json();

            const debitOptions = accounts.map(account =>
                `<option value="${account.accountId}">${account.accountNumber} - ${account.accountName}</option>`
            ).join('');

            const creditOptions = accounts.map(account =>
                `<option value="${account.accountId}">${account.accountNumber} - ${account.accountName}</option>`
            ).join('');

            debitAccount.innerHTML = '<option value="">Select Debit Account</option>' + debitOptions;
            creditAccount.innerHTML = '<option value="">Select Credit Account</option>' + creditOptions;
        } catch (error) {
            console.error('Error loading accounts:', error);
        }
    }

    // Add row to table function
    function addRow(mapping) {
        const row = document.createElement("tr");
        row.setAttribute('data-mapping-id', mapping.mappingId);
        row.innerHTML = `
            <td>${mapping.mappingId}</td>
            <td>${mapping.transactionType}</td>
            <td>${mapping.debitAccount}</td>
            <td>${mapping.creditAccount}</td>
            <td>${new Date(mapping.createdAt).toLocaleDateString()}</td>
            <td>${new Date(mapping.updatedAt).toLocaleDateString()}</td>
            <td>
                <button class="edit-btn" data-mapping-id="${mapping.mappingId}">Edit</button>
                <button class="delete-btn" data-mapping-id="${mapping.mappingId}">Delete</button>
            </td>
        `;

        // Add edit and delete button event listeners
        const editBtn = row.querySelector('.edit-btn');
        const deleteBtn = row.querySelector('.delete-btn');

        editBtn.addEventListener('click', () => handleEdit(mapping.mappingId));
        deleteBtn.addEventListener('click', () => handleDelete(mapping.mappingId));

        if (isEditMode && mapping.mappingId === editingMappingId) {
            const existingRow = document.querySelector(`tr[data-mapping-id="${mapping.mappingId}"]`);
            if (existingRow) {
                existingRow.replaceWith(row);
            }
        } else {
            tableBody.appendChild(row);
        }
    }

    // Edit mapping function
    async function handleEdit(mappingId) {
        try {
            const response = await fetch(`${apiUrl}/${mappingId}`);
            if (!response.ok) throw new Error('Failed to fetch mapping details');

            const mapping = await response.json();

            // Populate form with mapping details
            transactionType.value = mapping.transactionType;
            debitAccount.value = mapping.debitAccount;
            creditAccount.value = mapping.creditAccount;

            editingMappingId = mappingId;
            showModal(true);
        } catch (error) {
            console.error('Error fetching mapping details:', error);
            alert('Failed to fetch mapping details. Please try again.');
        }
    }

    // Delete mapping function
    async function handleDelete(mappingId) {
        if (!confirm('Are you sure you want to delete this mapping?')) {
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/${mappingId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete mapping');
            }

            // Remove the row from the table
            const row = document.querySelector(`tr[data-mapping-id="${mappingId}"]`);
            if (row) {
                row.remove();
            }
        } catch (error) {
            console.error('Error deleting mapping:', error);
            alert('Failed to delete mapping. Please try again.');
        }
    }

    // Form submission handler
    mappingForm.onsubmit = async function (e) {
        e.preventDefault();
        clearErrors();

        if (!validateForm()) return;

        const mappingData = {
            transactionType: transactionType.value,
            debitAccount: parseInt(debitAccount.value),
            creditAccount: parseInt(creditAccount.value)
        };

        try {
            const url = isEditMode ? `${apiUrl}/${editingMappingId}` : apiUrl;
            const method = isEditMode ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(mappingData)
            });

            if (!response.ok) throw new Error(`Failed to ${isEditMode ? 'update' : 'add'} mapping`);

            const savedMapping = await response.json();
            addRow(savedMapping);
            hideModal();

        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'adding'} mapping:`, error);
            alert(`Failed to ${isEditMode ? 'update' : 'add'} mapping. Please try again.`);
        }
    };

    // Event listeners
    addMappingBtn.onclick = () => showModal(false);
    closeModal.onclick = hideModal;

    // Close modal when clicking outside
    window.onclick = function (event) {
        if (event.target === mappingModal) {
            hideModal();
        }
    };

    // Initial data loading
    populateAccountDropdowns();

    // Initial mappings fetch
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error("Failed to fetch data");
            return response.json();
        })
        .then(data => {
            console.log('Fetched mappings:', data);
            tableBody.innerHTML = "";
            data.forEach(mapping => addRow(mapping));
        })
        .catch(error => {
            console.error('Error fetching GL mappings:', error);
            tableBody.innerHTML = `<tr><td colspan="7">Error loading data: ${error.message}</td></tr>`;
        });
});