// static/js/about.js
export function initAboutPage() {
    // Set up FAQ accordion functionality
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
      item.addEventListener('toggle', (e) => {
        if (item.open) {
          // Close all other open FAQ items
          faqItems.forEach(otherItem => {
            if (otherItem !== item && otherItem.open) {
              otherItem.open = false;
            }
          });
        }
      });
    });
  
    // Adjust spacing for the about page
    const hero = document.querySelector('.about-container .hero');
    if (hero) {
      hero.style.paddingTop = '6rem';
      hero.style.paddingBottom = '3rem';
    }
  
    // Adjust spacing for the CTA section
    const ctaSection = document.querySelector('.about-container .cta-section');
    if (ctaSection) {
      ctaSection.style.marginTop = '3rem';
      ctaSection.style.marginBottom = '3rem';
    }
  }