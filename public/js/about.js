// Hirly/public/about.js
document.addEventListener('DOMContentLoaded', function() {
    const benefitTabs = document.querySelectorAll('.benefit-tab');
    const benefitTabContents = document.querySelectorAll('.benefit-tab-content');

    benefitTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove 'active' from all tabs and hide all content
            benefitTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            benefitTabContents.forEach(content => {
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
    if (benefitTabs.length > 0 && benefitTabContents.length > 0) {
        benefitTabs[0].classList.add('active');
        benefitTabs[0].setAttribute('aria-selected', 'true');
        benefitTabContents[0].classList.add('active');
        benefitTabContents[0].style.display = 'block';
    }
});
