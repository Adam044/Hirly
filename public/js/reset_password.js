document.addEventListener('DOMContentLoaded', function() {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const tokenInput = document.getElementById('token');
    const resetPasswordSpinner = document.getElementById('resetPasswordSpinner');
    const resetPasswordMessage = document.getElementById('resetPasswordMessage');

    // Password requirement elements
    const reqElements = {
        length: document.getElementById('req-length'),
        lowercase: document.getElementById('req-lowercase'),
        uppercase: document.getElementById('req-uppercase'),
        number: document.getElementById('req-number')
    };

    function validatePasswordUI(password) {
        const hasMinLength = password.length >= 8;
        const hasLowercase = /[a-z]/.test(password);
        const hasUppercase = /[A-Z]/.test(password);
        const hasNumber = /\d/.test(password);

        updateRequirement(reqElements.length, hasMinLength);
        updateRequirement(reqElements.lowercase, hasLowercase);
        updateRequirement(reqElements.uppercase, hasUppercase);
        updateRequirement(reqElements.number, hasNumber);

        return hasMinLength && hasLowercase && hasUppercase && hasNumber;
    }

    function updateRequirement(element, isValid) {
        if (!element) return;
        if (isValid) {
            element.classList.add('valid', 'border-brand-200', 'bg-brand-50/50', 'text-brand-600');
            element.classList.remove('border-slate-100', 'text-slate-400');
            const icon = element.querySelector('i');
            if (icon) icon.className = 'fas fa-check-circle text-[9px] text-brand-500';
        } else {
            element.classList.remove('valid', 'border-brand-200', 'bg-brand-50/50', 'text-brand-600');
            element.classList.add('border-slate-100', 'text-slate-400');
            const icon = element.querySelector('i');
            if (icon) icon.className = 'fas fa-check-circle text-[9px] text-slate-300';
        }
    }

    newPasswordInput.addEventListener('input', function() {
        validatePasswordUI(newPasswordInput.value);
    });

    function showSpinner(spinnerElement) {
        if (spinnerElement) {
            spinnerElement.style.display = 'inline-block';
        }
    }

    function hideSpinner(spinnerElement) {
        if (spinnerElement) {
            spinnerElement.style.display = 'none';
        }
    }

    function displayMessage(messageKey, type = 'danger') {
        const message = (window.translations && window.translations[messageKey] && window.translations[messageKey][window.currentLanguage]) || messageKey;
        if (resetPasswordMessage) {
            resetPasswordMessage.textContent = message;
            resetPasswordMessage.className = `mt-3 text-center text-${type}`;
            resetPasswordMessage.style.display = 'block';
        }
    }

    function clearMessage() {
        if (resetPasswordMessage) {
            resetPasswordMessage.textContent = '';
            resetPasswordMessage.className = 'mt-3 text-center';
            resetPasswordMessage.style.display = 'none';
        }
    }

    // Extract token from URL on page load
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
        tokenInput.value = tokenFromUrl;
    } else {
        console.error("Client: No reset token found in URL.");
        displayMessage('no_reset_token_found', 'danger'); // Using translation key
        resetPasswordForm.querySelector('button[type="submit"]').disabled = true; // Disable submit if no token
    }

    resetPasswordForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        clearMessage();
        showSpinner(resetPasswordSpinner);
        resetPasswordForm.querySelector('button[type="submit"]').disabled = true;

        const newPassword = newPasswordInput.value;
        const confirmNewPassword = confirmNewPasswordInput.value;
        const token = tokenInput.value;

        if (!token) {
            displayMessage('password_reset_token_missing', 'danger'); // Using translation key
            hideSpinner(resetPasswordSpinner);
            resetPasswordForm.querySelector('button[type="submit"]').disabled = false;
            return;
        }

        if (!validatePasswordUI(newPassword)) {
            displayMessage('password_simple_requirements', 'danger'); // Using translation key
            hideSpinner(resetPasswordSpinner);
            resetPasswordForm.querySelector('button[type="submit"]').disabled = false;
            return;
        }

        if (newPassword !== confirmNewPassword) {
            displayMessage('passwords_do_not_match', 'danger'); // Using translation key
            hideSpinner(resetPasswordSpinner);
            resetPasswordForm.querySelector('button[type="submit"]').disabled = false;
            return;
        }

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: token, newPassword: newPassword })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Display success message and redirect to login
                displayMessage(result.message || 'password_reset_success', 'success');
                resetPasswordForm.reset();
                
                // Redirect to login after a short delay
                setTimeout(() => {
                    window.location.href = result.redirect || '/login.html';
                }, 2000);
            } else {
                displayMessage(result.error || 'password_reset_failed', 'danger'); // Using translation key
            }
        } catch (error) {
            console.error('Client: Error resetting password:', error);
            displayMessage('unexpected_error_occurred', 'danger'); // Using translation key
        } finally {
            hideSpinner(resetPasswordSpinner);
            resetPasswordForm.querySelector('button[type="submit"]').disabled = false;
        }
    });
});
