/**
 * TaskFlow Application JavaScript
 * Handles all interactive functionality for the task management system
 */

// Global TaskFlow object to prevent namespace pollution
const TaskFlow = {
    // Configuration
    config: {
        csrfToken: null,
        urls: {
            updateTask: null
        }
    },

    // Initialize the application
    init: function() {
        this.initCSRF();
        this.initTaskManagement();
        this.initUI();
        this.initProfile();
    },

    // Initialize CSRF token
    initCSRF: function() {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
        if (csrfToken) {
            this.config.csrfToken = csrfToken.value;
        }
    },

    // Get CSRF token
    getCSRFToken: function() {
        return this.config.csrfToken || document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    },

    // Task Management Functions
    initTaskManagement: function() {
        this.initTaskCheckboxes();
        this.initTaskEditing();
        this.initNewTaskCreation();
    },

    // Handle task completion checkboxes
    initTaskCheckboxes: function() {
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleTaskCompletion(e.target);
            });
        });
    },

    // Handle task completion toggle
    handleTaskCompletion: function(checkbox) {
        const taskId = checkbox.dataset.taskId;
        const completed = checkbox.checked;

        this.updateTask(taskId, 'completed', completed)
            .then(success => {
                if (success) {
                    // Toggle completed styling
                    const taskItem = checkbox.closest('.task-item') || checkbox.closest('.card');
                    if (completed) {
                        taskItem.classList.add('task-completed');
                    } else {
                        taskItem.classList.remove('task-completed');
                    }
                } else {
                    // Revert checkbox state on failure
                    checkbox.checked = !completed;
                }
            });
    },

    // Initialize task title editing
    initTaskEditing: function() {
        document.querySelectorAll('.task-title-input').forEach(input => {
            let originalValue = input.value;

            input.addEventListener('focus', function() {
                originalValue = this.value;
            });

            input.addEventListener('blur', (e) => {
                this.handleTaskTitleUpdate(e.target, originalValue);
            });

            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    this.blur();
                }
            });
        });
    },

    // Handle task title updates
    handleTaskTitleUpdate: function(input, originalValue) {
        if (input.value !== originalValue && input.value.trim()) {
            const taskId = input.dataset.taskId;
            const field = input.dataset.field;
            const value = input.value.trim();

            this.updateTask(taskId, field, value)
                .then(success => {
                    if (success) {
                        // Show success feedback
                        this.showFieldSuccess(input);
                    } else {
                        input.value = originalValue;
                    }
                });
        } else if (!input.value.trim()) {
            input.value = originalValue;
        }
    },

    // Show success feedback for field updates
    showFieldSuccess: function(element) {
        element.style.backgroundColor = '#d4edda';
        setTimeout(() => {
            element.style.backgroundColor = '';
        }, 1000);
    },

    // Initialize new task creation
    initNewTaskCreation: function() {
        document.querySelectorAll('.new-task-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                    this.createNewTask(e.target);
                }
            });
        });
    },

    // Create new task
    createNewTask: function(input) {
        const timeSlot = input.dataset.timeSlot;
        const title = input.value.trim();

        // Create and submit form
        const form = this.createTaskForm({
            task_title: title,
            time_slot: timeSlot,
            task_priority: 'medium'
        });

        document.body.appendChild(form);
        form.submit();
    },

    // Create form for task submission
    createTaskForm: function(data) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.style.display = 'none';

        // Add CSRF token
        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrfmiddlewaretoken';
        csrfInput.value = this.getCSRFToken();
        form.appendChild(csrfInput);

        // Add data fields
        Object.keys(data).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = data[key];
            form.appendChild(input);
        });

        return form;
    },

    // Update task via AJAX
    updateTask: function(taskId, field, value) {
        const updateUrl = this.config.urls.updateTask || '/update-task/';

        return fetch(updateUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken()
            },
            body: JSON.stringify({
                task_id: taskId,
                field: field,
                value: value
            })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('Failed to update task:', data.error);
                this.showError('Failed to update task');
            }
            return data.success;
        })
        .catch(error => {
            console.error('Error updating task:', error);
            this.showError('Network error while updating task');
            return false;
        });
    },

    // UI Enhancement Functions
    initUI: function() {
        this.initAnimations();
        this.initTooltips();
        this.initModals();
    },

    // Initialize animations
    initAnimations: function() {
        // Add fade-in class to cards after load
        document.querySelectorAll('.card').forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('fade-in');
            }, index * 100);
        });
    },

    // Initialize tooltips (if using Bootstrap tooltips)
    initTooltips: function() {
        // Enable Bootstrap tooltips if available
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function(tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    },

    // Initialize modal functionality
    initModals: function() {
        // Auto-focus first input in modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('shown.bs.modal', function() {
                const firstInput = this.querySelector('input[type="text"], input[type="email"], textarea');
                if (firstInput) {
                    firstInput.focus();
                }
            });
        });
    },

    // Profile page specific functions
    initProfile: function() {
        this.initExportFunction();
        this.initPasswordForm();
    },

    // Export tasks function (placeholder)
    exportTasks: function() {
        this.showInfo('Export functionality coming soon! This will allow you to download your tasks as CSV or PDF.');
    },

    // Initialize export function globally
    initExportFunction: function() {
        window.exportTasks = () => this.exportTasks();
    },

    // Initialize password form validation
    initPasswordForm: function() {
        const passwordForm = document.querySelector('#changePasswordForm form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                const newPassword = passwordForm.querySelector('#new_password').value;
                const confirmPassword = passwordForm.querySelector('#confirm_password').value;

                if (newPassword !== confirmPassword) {
                    e.preventDefault();
                    this.showError('New passwords do not match.');
                    return false;
                }

                if (newPassword.length < 8) {
                    e.preventDefault();
                    this.showError('Password must be at least 8 characters long.');
                    return false;
                }
            });
        }
    },

    // Utility Functions
    showError: function(message) {
        this.showAlert(message, 'danger');
    },

    showSuccess: function(message) {
        this.showAlert(message, 'success');
    },

    showInfo: function(message) {
        this.showAlert(message, 'info');
    },

    // Show alert message
    showAlert: function(message, type = 'info') {
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alert.style.top = '20px';
        alert.style.right = '20px';
        alert.style.zIndex = '9999';
        alert.style.minWidth = '300px';

        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alert);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    },

    // Calendar specific functions
    initCalendar: function() {
        // Add hover effects to calendar days
        document.querySelectorAll('.calendar-day a').forEach(dayLink => {
            dayLink.addEventListener('mouseenter', function() {
                this.style.transform = 'scale(1.05)';
                this.style.transition = 'transform 0.2s ease';
            });

            dayLink.addEventListener('mouseleave', function() {
                this.style.transform = 'scale(1)';
            });
        });

        // Add keyboard navigation to calendar
        this.initCalendarKeyboardNav();
    },

    // Initialize calendar keyboard navigation
    initCalendarKeyboardNav: function() {
        const calendarDays = document.querySelectorAll('.calendar-day a');
        if (calendarDays.length === 0) return;

        let currentIndex = -1;

        // Find today's index if present
        calendarDays.forEach((day, index) => {
            if (day.closest('.bg-warning')) {
                currentIndex = index;
            }
        });

        document.addEventListener('keydown', (e) => {
            if (!document.querySelector('.calendar-table')) return;

            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    currentIndex = Math.max(0, currentIndex - 1);
                    this.focusCalendarDay(calendarDays, currentIndex);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    currentIndex = Math.min(calendarDays.length - 1, currentIndex + 1);
                    this.focusCalendarDay(calendarDays, currentIndex);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    currentIndex = Math.max(0, currentIndex - 7);
                    this.focusCalendarDay(calendarDays, currentIndex);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    currentIndex = Math.min(calendarDays.length - 1, currentIndex + 7);
                    this.focusCalendarDay(calendarDays, currentIndex);
                    break;
                case 'Enter':
                    if (currentIndex >= 0 && calendarDays[currentIndex]) {
                        e.preventDefault();
                        calendarDays[currentIndex].click();
                    }
                    break;
            }
        });
    },

    // Focus a calendar day
    focusCalendarDay: function(calendarDays, index) {
        if (index >= 0 && index < calendarDays.length) {
            calendarDays[index].focus();
        }
    },

    // Initialize form enhancements
    initForms: function() {
        // Add loading states to form submissions
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', function() {
                const submitBtn = this.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.classList.add('loading');
                    submitBtn.disabled = true;

                    // Re-enable after 3 seconds as fallback
                    setTimeout(() => {
                        submitBtn.classList.remove('loading');
                        submitBtn.disabled = false;
                    }, 3000);
                }
            });
        });
    },

    // Keyboard shortcuts
    initKeyboardShortcuts: function() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + / for help (future feature)
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                this.showKeyboardHelp();
            }

            // Escape to close modals
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    const bsModal = bootstrap.Modal.getInstance(openModal);
                    if (bsModal) {
                        bsModal.hide();
                    }
                }
            }
        });
    },

    // Show keyboard shortcuts help
    showKeyboardHelp: function() {
        this.showInfo('Keyboard shortcuts: Escape - Close modals, Enter - Save task edits');
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    TaskFlow.init();

    // Page-specific initializations
    if (document.querySelector('.calendar-table')) {
        TaskFlow.initCalendar();
    }

    if (document.querySelector('form')) {
        TaskFlow.initForms();
    }

    TaskFlow.initKeyboardShortcuts();
});

// Export TaskFlow for global access
window.TaskFlow = TaskFlow;