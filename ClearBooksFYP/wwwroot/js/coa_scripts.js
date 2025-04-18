document.addEventListener("DOMContentLoaded", function () {
    const apiUrl = 'https://localhost:5001/api/ChartOfAccounts';
    const tableBody = document.querySelector("#accounts-table tbody");
    const accountModal = document.getElementById("add-account-modal");
    const addAccountBtn = document.getElementById("add-account-btn");
    const closeModal = document.getElementById("close-modal");
    const accountForm = document.getElementById("add-account-form");
    const modalTitle = document.querySelector(".modal-content h2");
    const submitButton = document.querySelector("#add-account-form button[type='submit']");

    // Form elements
    const accountNumber = document.getElementById("account-number");
    const accountName = document.getElementById("account-name");
    const accountType = document.getElementById("account-type");
    const parentAccount = document.getElementById("parent-account");
    const description = document.getElementById("description");

    let isEditMode = false;
    let editingAccountId = null;

    // Validation functions
    function validateAccountNumber(value) {
        return /^\d+$/.test(value);
    }

    function validateAccountName(value) {
        return /^[A-Za-z\s]+$/.test(value);
    }

    function validateParentAccount(value) {
        return value === '' || /^\d+$/.test(value);
    }

    function validateForm() {
        let isValid = true;

        // Validate Account Number
        if (!validateAccountNumber(accountNumber.value)) {
            document.getElementById("account-number-error").textContent = "Please enter a valid number";
            accountNumber.classList.add('invalid');
            isValid = false;
        }

        // Validate Account Name
        if (!validateAccountName(accountName.value)) {
            document.getElementById("account-name-error").textContent = "Please enter only letters and spaces";
            accountName.classList.add('invalid');
            isValid = false;
        }

        // Validate Account Type
        if (!accountType.value) {
            document.getElementById("account-type-error").textContent = "Please select an account type";
            accountType.classList.add('invalid');
            isValid = false;
        }

        // Validate Parent Account if provided
        if (parentAccount.value && !validateParentAccount(parentAccount.value)) {
            document.getElementById("parent-account-error").textContent = "Please enter a valid number";
            parentAccount.classList.add('invalid');
            isValid = false;
        }

        return isValid;
    }

    // Show/hide modal functions
    function showModal(isEdit = false) {
        isEditMode = isEdit;
        modalTitle.textContent = isEdit ? "Edit Account" : "Add New Account";
        submitButton.textContent = isEdit ? "Update Account" : "Add Account";
        accountModal.style.display = "flex";
    }

    function hideModal() {
        accountModal.style.display = "none";
        clearErrors();
        accountForm.reset();
        isEditMode = false;
        editingAccountId = null;
    }

    // Clear error messages
    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(error => error.textContent = '');
        document.querySelectorAll('.invalid').forEach(field => field.classList.remove('invalid'));
    }

    // Add row to table function
    function addRow(account) {
        const row = document.createElement("tr");
        row.setAttribute('data-account-id', account.accountId);
        row.innerHTML = `
            <td>${account.accountId}</td>
            <td>${account.accountNumber}</td>
            <td>${account.accountName}</td>
            <td>${account.accountType}</td>
            <td>${account.parentAccount || ''}</td>
            <td>${account.description || ''}</td>
            <td>${new Date(account.createdAt).toLocaleDateString()}</td>
            <td>${new Date(account.updatedAt).toLocaleDateString()}</td>
            <td>
                <button class="edit-btn" data-account-id="${account.accountId}">Edit</button>
                <button class="delete-btn" data-account-id="${account.accountId}">Delete</button>
            </td>
        `;

        // Add edit and delete button event listeners
        const editBtn = row.querySelector('.edit-btn');
        const deleteBtn = row.querySelector('.delete-btn');

        editBtn.addEventListener('click', () => handleEdit(account.accountId));
        deleteBtn.addEventListener('click', () => handleDelete(account.accountId));

        if (isEditMode && account.accountId === editingAccountId) {
            const existingRow = document.querySelector(`tr[data-account-id="${account.accountId}"]`);
            if (existingRow) {
                existingRow.replaceWith(row);
            }
        } else {
            tableBody.appendChild(row);
        }
    }

    // Edit account function
    async function handleEdit(accountId) {
        try {
            const response = await fetch(`${apiUrl}/${accountId}`);
            if (!response.ok) throw new Error('Failed to fetch account details');

            const account = await response.json();

            // Populate form with account details
            accountNumber.value = account.accountNumber;
            accountName.value = account.accountName;
            accountType.value = account.accountType;
            parentAccount.value = account.parentAccount || '';
            description.value = account.description || '';

            editingAccountId = accountId;
            showModal(true);
        } catch (error) {
            console.error('Error fetching account details:', error);
            alert('Failed to fetch account details. Please try again.');
        }
    }

    // Delete account function
    async function handleDelete(accountId) {
        if (!confirm(`Are you sure you want to delete account ${accountId}?`)) {
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/${accountId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete account');
            }

            // Remove the row from the table
            const row = document.querySelector(`tr[data-account-id="${accountId}"]`);
            if (row) {
                row.remove();
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('Failed to delete account. Please try again.');
        }
    }

    // Form submission handler
    accountForm.onsubmit = async function (e) {
        e.preventDefault();
        clearErrors();

        if (!validateForm()) return;

        const accountData = {
            accountNumber: accountNumber.value,
            accountName: accountName.value,
            accountType: accountType.value,
            parentAccount: parentAccount.value ? parseInt(parentAccount.value) : null,
            description: description.value || null
        };

        try {
            const url = isEditMode ? `${apiUrl}/${editingAccountId}` : apiUrl;
            const method = isEditMode ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(accountData)
            });

            if (!response.ok) throw new Error(`Failed to ${isEditMode ? 'update' : 'add'} account`);

            const savedAccount = await response.json();
            addRow(savedAccount);
            hideModal();

        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'adding'} account:`, error);
            alert(`Failed to ${isEditMode ? 'update' : 'add'} account. Please try again.`);
        }
    };

    // Event listeners
    addAccountBtn.onclick = () => showModal(false);
    closeModal.onclick = hideModal;

    // Close modal when clicking outside
    window.onclick = function (event) {
        if (event.target === accountModal) {
            hideModal();
        }
    };

    // Initial data fetch
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) throw new Error("Failed to fetch data");
            return response.json();
        })
        .then(data => {
            tableBody.innerHTML = "";
            data.forEach(account => addRow(account));
        })
        .catch(error => console.error('Error fetching chart of accounts:', error));
});