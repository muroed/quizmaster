/**
 * Admin panel functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Add question type change event listeners
    const questionTypeSelects = document.querySelectorAll('[id^="question_type"]');
    questionTypeSelects.forEach(function(select) {
        select.addEventListener('change', function() {
            toggleAnswersSection(this);
        });
        
        // Initialize state based on current value
        toggleAnswersSection(select);
    });
    
    // Add answer buttons
    const addAnswerButtons = document.querySelectorAll('[id^="addAnswerBtn"]');
    addAnswerButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const containerId = this.getAttribute('data-container') || 'answersContainer';
            addAnswerRow(containerId);
        });
    });
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

/**
 * Toggle the answers section based on question type
 */
function toggleAnswersSection(selectElement) {
    const questionType = selectElement.value;
    const id = selectElement.id.replace('question_type', '');
    const answersSection = document.getElementById(`answersSection${id}`) || document.getElementById('answersSection');
    
    if (answersSection) {
        if (questionType === 'text') {
            answersSection.classList.add('d-none');
        } else {
            answersSection.classList.remove('d-none');
            
            // Handle radio vs checkbox for single vs multiple choice
            const answerInputs = answersSection.querySelectorAll('input[type="checkbox"], input[type="radio"]');
            
            answerInputs.forEach(function(input) {
                if (questionType === 'single_choice') {
                    input.type = 'radio';
                } else {
                    input.type = 'checkbox';
                }
            });
        }
    }
}

/**
 * Add a new answer row to the specified container
 */
function addAnswerRow(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const answerCount = container.querySelectorAll('.answer-row').length;
    const newRow = document.createElement('div');
    newRow.className = 'row mb-2 answer-row';
    
    // Determine if we're in a single or multiple choice question
    const questionTypeEl = document.querySelector('[id^="question_type"]');
    const questionType = questionTypeEl ? questionTypeEl.value : 'multiple_choice';
    const inputType = questionType === 'single_choice' ? 'radio' : 'checkbox';
    
    newRow.innerHTML = `
        <div class="col-7">
            <input type="text" class="form-control" name="answer_text[]" placeholder="Answer text" required>
        </div>
        <div class="col-3">
            <input type="text" class="form-control" name="answer_media_url[]" placeholder="Media URL (optional)">
        </div>
        <div class="col-2">
            <div class="form-check mt-2">
                <input class="form-check-input" type="${inputType}" name="is_correct[]" value="${answerCount}">
                <label class="form-check-label">Correct</label>
            </div>
        </div>
    `;
    
    container.appendChild(newRow);
}

/**
 * Delete an answer row
 */
function deleteAnswerRow(btn) {
    const row = btn.closest('.answer-row');
    if (row) {
        row.remove();
        
        // Update the values for checkboxes/radios so they stay sequential
        const container = document.getElementById('answersContainer');
        const inputs = container.querySelectorAll('input[name="is_correct[]"]');
        
        inputs.forEach((input, index) => {
            input.value = index;
        });
    }
}

/**
 * Media type change handler
 */
function handleMediaTypeChange(selectElement) {
    const mediaType = selectElement.value;
    const id = selectElement.id.replace('media_type', '');
    const mediaUrlInput = document.getElementById(`media_url${id}`) || document.getElementById('media_url');
    
    if (mediaUrlInput) {
        if (mediaType) {
            mediaUrlInput.removeAttribute('disabled');
            
            // Update placeholder based on media type
            let placeholder = 'URL to media';
            
            if (mediaType === 'image') {
                placeholder = 'URL to image (JPG, PNG, etc.)';
            } else if (mediaType === 'audio') {
                placeholder = 'URL to audio file (MP3, WAV, etc.)';
            } else if (mediaType === 'video') {
                placeholder = 'URL to video file (MP4, etc.)';
            }
            
            mediaUrlInput.setAttribute('placeholder', placeholder);
        } else {
            mediaUrlInput.setAttribute('disabled', 'disabled');
            mediaUrlInput.value = '';
        }
    }
}
