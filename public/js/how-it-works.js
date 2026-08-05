// Hirly/public/how-it-works.js
document.addEventListener('DOMContentLoaded', function() {
    // This script handles the tab switching functionality for the "How It Works" page.
    const howItWorksTabs = document.querySelectorAll('.how-it-works-tab');
    const howItWorksTabContents = document.querySelectorAll('.how-it-works-tab-content');

    howItWorksTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove 'active' from all tabs and hide all content
            howItWorksTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            howItWorksTabContents.forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
            });

            // Add 'active' to the clicked tab and show its content
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            const targetId = this.dataset.target;
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
                targetContent.style.display = 'block';
            }
        });
    });

    // Initialize: Show the first tab content by default
    if (howItWorksTabs.length > 0 && howItWorksTabContents.length > 0) {
        howItWorksTabs[0].classList.add('active');
        howItWorksTabs[0].setAttribute('aria-selected', 'true');
        howItWorksTabContents[0].classList.add('active');
        howItWorksTabContents[0].style.display = 'block';
    }
});
