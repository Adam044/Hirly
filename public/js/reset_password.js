document.addEventListener('DOMContentLoaded', function() {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const tokenInput = document.getElementById('token');
    const resetPasswordSpinner = document.getElementById('resetPasswordSpinner');
    const resetPasswordMessage = document.getElementById('resetPasswordMessage');

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

        if (newPassword.length < 6) {
            displayMessage('password_length_error', 'danger'); // Using translation key
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
