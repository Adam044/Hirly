// Contact page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Elements ---
    const contactForm = document.getElementById('contactForm');
    const contactMessage = document.getElementById('contactMessage');

    // Modal elements
    const confirmationModal = document.getElementById('confirmationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalIconContainer = document.getElementById('modalIcon');
    const modalCloseButtons = document.querySelectorAll('.modal-close-btn');

    // --- Helper Functions ---
    function showModal(isSuccess, messageText) {
        const t = window.translations;
        const lang = window.currentLanguage;
        
        confirmationModal.classList.add('show');
        document.body.classList.add('modal-open');

        if (isSuccess) {
            modalIconContainer.innerHTML = '<i class="fas fa-check-circle"></i>';
            modalIconContainer.className = 'modal-header-icon-container success-icon-bg';
            modalTitle.textContent = t?.['modal_success_title']?.[lang] || 'Message Sent!';
            modalMessage.textContent = messageText || (t?.['modal_success_message']?.[lang] || 'Thank you for your message. We will get back to you as soon as possible.');
        } else {
            modalIconContainer.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            modalIconContainer.className = 'modal-header-icon-container error-icon-bg';
            modalTitle.textContent = t?.['modal_error_title']?.[lang] || 'Error Sending Message';
            modalMessage.textContent = messageText || (t?.['modal_error_message']?.[lang] || 'There was an issue sending your message. Please try again.');
        }
    }

    function hideModal() {
        confirmationModal.classList.remove('show');
        document.body.classList.remove('modal-open');
    }
    
    // --- Event Listeners ---
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // Prevents the default form submission action (page reload)
            e.stopPropagation(); // Stops the event from bubbling up to parent elements
            
            contactMessage.style.display = 'block';
            contactMessage.textContent = (window.translations && window.translations['sending_message'] && window.translations['sending_message'][window.currentLanguage]) || 'Sending message...';
            contactMessage.style.color = 'var(--text-body)';

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;

            let userData = {};
            try {
                const userResponse = await fetch('/api/user');
                if (userResponse.ok) {
                    const user = await userResponse.json();
                    userData = {
                        userId: user.user.id,
                        userType: user.user.user_type,
                        userFirstName: user.user.first_name,
                        userLastName: user.user.last_name,
                        userEmail: user.user.email,
                        userPhone: user.user.phone,
                        userCity: user.user.city
                    };
                }
            } catch (error) {
                console.warn('Could not fetch logged-in user data for contact form:', error);
            }

            fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    email,
                    subject,
                    message,
                    ...userData
                })
            })
            .then(response => response.json())
            .then(data => {
                contactMessage.style.display = 'none';
                if (data.success) {
                    showModal(true);
                    contactForm.reset();
                } else {
                    showModal(false, data.error || (window.translations && window.translations['unknown_error'] && window.translations['unknown_error'][window.currentLanguage]) || 'Unknown error');
                }
            })
            .catch(error => {
                contactMessage.style.display = 'none';
                console.error('Error:', error);
                showModal(false, (window.translations && window.translations['an_error_occurred_sending'] && window.translations['an_error_occurred_sending'][window.currentLanguage]) || 'An error occurred while sending your message');
            });
        });
    }

    modalCloseButtons.forEach(button => button.addEventListener('click', hideModal));
    window.addEventListener('click', (event) => {
        if (event.target === confirmationModal) {
            hideModal();
        }
    });
});
