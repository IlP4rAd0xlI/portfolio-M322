// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Validates email format
 */
function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

/**
 * Validates phone number based on country code pattern
 */
function validatePhoneNumber(phoneNumber, countryCodeSelect) {
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
    const selectedOption = countryCodeSelect.options[countryCodeSelect.selectedIndex];
    const pattern = selectedOption.getAttribute('data-pattern');

    if (!pattern) return false;

    const regex = new RegExp(pattern);
    return regex.test(cleanNumber);
}

/**
 * Generic field validation and UI update
 */
function validateField(field, errorElement, validationFn, errorMessage) {
    if (!field || !errorElement) return true;

    const isValid = validationFn(field.value);

    if (!isValid) {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
        if (errorMessage) errorElement.textContent = errorMessage;
        errorElement.classList.add('d-block');
        return false;
    } else {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
        errorElement.classList.remove('d-block');
        return true;
    }
}

/**
 * Clear validation state from a field
 */
function clearValidation(field, errorElement) {
    if (field) {
        field.classList.remove('is-invalid', 'is-valid');
    }
    if (errorElement) {
        errorElement.classList.remove('d-block');
    }
}

// ========================================
// DOM ELEMENTS
// ========================================

const elements = {
    // Contact method
    contactEmail: document.getElementById('contactEmail'),
    contactPhone: document.getElementById('contactPhone'),

    // Phone fields
    phoneGroup: document.getElementById('phone-group'),
    phoneInput: document.getElementById('phone'),
    countryCode: document.getElementById('countryCode'),
    phoneError: document.getElementById('phoneError'),

    // Form fields
    firstName: document.getElementById('firstName'),
    lastName: document.getElementById('lastName'),
    email: document.getElementById('email'),
    messageSubject: document.getElementById('messageSubject'),
    message: document.getElementById('message'),

    // Form
    form: document.getElementById('contactForm'),

    // Modal
    successModal: document.getElementById('successModal'),
    modalOverlay: document.getElementById('modalOverlay')
};

// ========================================
// PHONE FIELD MANAGEMENT
// ========================================

// Toggle phone field visibility
if (elements.contactPhone) {
    elements.contactPhone.addEventListener('change', function() {
        if (this.checked && elements.phoneGroup && elements.phoneInput) {
            elements.phoneGroup.style.display = 'block';
            elements.phoneInput.required = true;
        }
    });
}

if (elements.contactEmail) {
    elements.contactEmail.addEventListener('change', function() {
        if (this.checked && elements.phoneGroup && elements.phoneInput) {
            elements.phoneGroup.style.display = 'none';
            elements.phoneInput.required = false;
            clearValidation(elements.phoneInput, elements.phoneError);
        }
    });
}

// Update placeholder when country code changes
if (elements.countryCode && elements.phoneInput) {
    elements.countryCode.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const placeholder = selectedOption.getAttribute('data-placeholder');
        if (placeholder) {
            elements.phoneInput.placeholder = placeholder;
            clearValidation(elements.phoneInput, elements.phoneError);
        }
    });
}

// Restrict phone input to numbers and spaces only
if (elements.phoneInput) {
    elements.phoneInput.addEventListener('input', function(e) {
        const cursorPos = this.selectionStart;
        const oldLength = this.value.length;

        // Remove all non-digit and non-space characters
        const cleaned = this.value.replace(/[^\d\s]/g, '');
        this.value = cleaned;

        // Restore cursor position
        const newLength = this.value.length;
        const diff = oldLength - newLength;
        this.setSelectionRange(cursorPos - diff, cursorPos - diff);
    });

    // Prevent pasting non-numeric content
    elements.phoneInput.addEventListener('paste', function(e) {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        const cleaned = pastedText.replace(/[^\d\s]/g, '');

        const start = this.selectionStart;
        const end = this.selectionEnd;
        const currentValue = this.value;
        this.value = currentValue.substring(0, start) + cleaned + currentValue.substring(end);

        const newPos = start + cleaned.length;
        this.setSelectionRange(newPos, newPos);
        this.dispatchEvent(new Event('input'));
    });
}

// ========================================
// REAL-TIME VALIDATION (ON BLUR)
// ========================================

// Configuration object for field validation
const fieldValidators = {
    firstName: {
        validator: (value) => value.trim() !== '',
        errorMessage: 'Please provide your first name.'
    },
    lastName: {
        validator: (value) => value.trim() !== '',
        errorMessage: 'Please provide your last name.'
    },
    email: {
        validator: (value) => value.trim() !== '' && isValidEmail(value),
        errorMessage: 'Please provide a valid email address.',
        emptyMessage: 'Please provide your email address.'
    },
    messageSubject: {
        validator: (value) => value.trim() !== '',
        errorMessage: 'Please provide a subject.'
    },
    message: {
        validator: (value) => value.trim() !== '',
        errorMessage: 'Please write your message.'
    }
};

// Attach blur validators to all fields
Object.keys(fieldValidators).forEach(fieldName => {
    const field = elements[fieldName];
    const config = fieldValidators[fieldName];

    if (field) {
        field.addEventListener('blur', function() {
            const errorElement = document.getElementById(fieldName + 'Error');

            // Special handling for email (different messages for empty vs invalid)
            if (fieldName === 'email' && !this.value.trim()) {
                validateField(field, errorElement, () => false, config.emptyMessage);
            } else {
                validateField(field, errorElement, config.validator, config.errorMessage);
            }
        });
    }
});

// Phone field blur validation
if (elements.phoneInput) {
    elements.phoneInput.addEventListener('blur', function() {
        if (elements.contactPhone && elements.contactPhone.checked) {
            if (!this.value.trim()) {
                validateField(
                    this,
                    elements.phoneError,
                    () => false,
                    'Please provide your phone number.'
                );
            } else {
                validateField(
                    this,
                    elements.phoneError,
                    (value) => validatePhoneNumber(value, elements.countryCode),
                    'Please provide a valid phone number for the selected country.'
                );
            }
        }
    });
}

// ========================================
// FORM SUBMISSION
// ========================================

if (elements.form) {
    elements.form.addEventListener('submit', function(event) {
        event.preventDefault();
        event.stopPropagation();

        let isValid = true;

        // Validate all text fields
        Object.keys(fieldValidators).forEach(fieldName => {
            const field = elements[fieldName];
            const config = fieldValidators[fieldName];
            const errorElement = document.getElementById(fieldName + 'Error');

            if (field && errorElement) {
                // Special handling for email
                if (fieldName === 'email') {
                    if (!field.value.trim()) {
                        isValid = validateField(field, errorElement, () => false, config.emptyMessage) && isValid;
                    } else {
                        isValid = validateField(field, errorElement, config.validator, config.errorMessage) && isValid;
                    }
                } else {
                    isValid = validateField(field, errorElement, config.validator, config.errorMessage) && isValid;
                }
            }
        });

        // Phone validation if phone contact method is selected
        if (elements.contactPhone && elements.contactPhone.checked) {
            if (!elements.phoneInput.value.trim()) {
                isValid = validateField(
                    elements.phoneInput,
                    elements.phoneError,
                    () => false,
                    'Please provide your phone number.'
                ) && isValid;
            } else {
                isValid = validateField(
                    elements.phoneInput,
                    elements.phoneError,
                    (value) => validatePhoneNumber(value, elements.countryCode),
                    'Please provide a valid phone number for the selected country.'
                ) && isValid;
            }
        }

        if (isValid) {
            // Show success modal
            elements.modalOverlay.style.display = 'block';
            elements.successModal.style.display = 'block';

            // Reset form
            this.reset();
            this.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
                el.classList.remove('is-valid', 'is-invalid');
            });
            this.querySelectorAll('.invalid-feedback').forEach(el => {
                el.classList.remove('d-block');
            });
        }
    });
}

// ========================================
// MODAL MANAGEMENT
// ========================================

function closeModal() {
    if (elements.modalOverlay) elements.modalOverlay.style.display = 'none';
    if (elements.successModal) elements.successModal.style.display = 'none';
}

// Close modal when clicking overlay
if (elements.modalOverlay) {
    elements.modalOverlay.addEventListener('click', closeModal);
}

// ========================================
// NAVIGATION
// ========================================

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });

            // Close offcanvas if open
            const offcanvasEl = document.getElementById('offcanvasNavbar');
            if (offcanvasEl) {
                const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
                if (offcanvas) {
                    offcanvas.hide();
                }
            }
        }
    });
});

// Update active nav link on scroll
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section[id]');

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        if (link) {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        }
    });
});