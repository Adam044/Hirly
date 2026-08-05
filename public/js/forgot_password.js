document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const verifyCodeForm = document.getElementById('verifyCodeForm');
    const emailInput = document.getElementById('email');
    const verificationCodeInput = document.getElementById('verificationCode');
    const sendLinkSpinner = document.getElementById('sendLinkSpinner');
    const verifyCodeSpinner = document.getElementById('verifyCodeSpinner');
    const forgotPasswordMessage = document.getElementById('forgotPasswordMessage');
    const formSubtitle = document.getElementById('form-subtitle');
    const resendCodeLink = document.getElementById('resendCodeLink');

    let userEmail = '';

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
        if (forgotPasswordMessage) {
            forgotPasswordMessage.textContent = message;
            forgotPasswordMessage.className = `mt-3 text-center text-${type}`;
            forgotPasswordMessage.style.display = 'block';
        }
    }

    function clearMessage() {
        if (forgotPasswordMessage) {
            forgotPasswordMessage.textContent = '';
            forgotPasswordMessage.className = 'mt-3 text-center';
            forgotPasswordMessage.style.display = 'none';
        }
    }

    function showStep(step) {
        const steps = document.querySelectorAll('.form-section');
        steps.forEach(s => s.style.display = 'none');
        document.querySelector(`.form-section[data-step="${step}"]`).style.display = 'block';
    }

    // Set initial step to 1
    showStep(1);

    // Handle the initial form submission to send the code
    forgotPasswordForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        clearMessage();
        showSpinner(sendLinkSpinner);
        forgotPasswordForm.querySelector('button[type="submit"]').disabled = true;

        userEmail = emailInput.value.trim();

        if (!userEmail) {
            displayMessage('enter_email_address', 'danger');
            hideSpinner(sendLinkSpinner);
            forgotPasswordForm.querySelector('button[type="submit"]').disabled = false;
            return;
        }

        try {
            const response = await fetch('/api/forgot-password-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: userEmail })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // On success, hide the email form and show the code verification form
                showStep(2);
                const translatedSubtitle = (window.translations && window.translations['code_sent_subtitle'] && window.translations['code_sent_subtitle'][window.currentLanguage]) || `A reset code has been sent to <strong>${userEmail}</strong>.`;
                formSubtitle.innerHTML = translatedSubtitle;
                displayMessage(result.message || 'code_sent_success', 'success');
            } else {
                displayMessage(result.error || 'failed_to_send_reset_code', 'danger');
            }
        } catch (error) {
            console.error('Error requesting password reset code:', error);
            displayMessage('unexpected_error_occurred', 'danger');
        } finally {
            hideSpinner(sendLinkSpinner);
            forgotPasswordForm.querySelector('button[type="submit"]').disabled = false;
        }
    });

    // Handle the verification code form submission
    verifyCodeForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        clearMessage();
        showSpinner(verifyCodeSpinner);
        verifyCodeForm.querySelector('button[type="submit"]').disabled = true;

        const verificationCode = verificationCodeInput.value.trim();

        if (!verificationCode) {
            displayMessage('enter_verification_code', 'danger');
            hideSpinner(verifyCodeSpinner);
            verifyCodeForm.querySelector('button[type="submit"]').disabled = false;
            return;
        }

        try {
            const response = await fetch('/api/verify-password-reset-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: userEmail, code: verificationCode })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // On success, redirect to the reset password page with the new token
                window.location.href = `/reset_password.html?token=${result.token}`;
            } else {
                displayMessage(result.error || 'invalid_code', 'danger');
            }
        } catch (error) {
            console.error('Error verifying password reset code:', error);
            displayMessage('unexpected_error_occurred', 'danger');
        } finally {
            hideSpinner(verifyCodeSpinner);
            verifyCodeForm.querySelector('button[type="submit"]').disabled = false;
        }
    });

    // Handle resend code button click
    resendCodeLink.addEventListener('click', async function() {
        clearMessage();
        displayMessage('sending_new_code_info', 'info');
        showSpinner(resendCodeLink.querySelector('.loading-spinner'));
        resendCodeLink.disabled = true;

        try {
            const response = await fetch('/api/forgot-password-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: userEmail })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                displayMessage('new_code_sent_success', 'success');
            } else {
                displayMessage(result.error || 'resend_failed_generic', 'danger');
            }
        } catch (error) {
            console.error('Error resending verification code:', error);
            displayMessage('unexpected_error_occurred', 'danger');
        } finally {
            hideSpinner(resendCodeLink.querySelector('.loading-spinner'));
            resendCodeLink.disabled = false;
        }
    });
});
