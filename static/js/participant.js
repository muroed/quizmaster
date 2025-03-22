/**
 * Participant panel functionality for quiz game
 */

let teamId = null;
let gameId = null;
// socket is defined in socket.js

/**
 * Initialize the participant UI
 * @param {number} tId - The team ID
 * @param {number} gId - The game ID
 */
function initParticipantUI(tId, gId) {
    teamId = tId;
    gameId = gId;
    
    // Set up form submission
    const answerForm = document.getElementById('answerForm');
    if (answerForm) {
        answerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitAnswer(this);
        });
    }
    
    // Set up socket event listeners
    setupSocketListeners();
    
    // Add click listeners to answer cards for better UX
    const answerCards = document.querySelectorAll('.answer-card');
    answerCards.forEach(card => {
        card.addEventListener('click', function() {
            const input = this.querySelector('input');
            if (input.type === 'radio') {
                input.checked = true;
            } else if (input.type === 'checkbox') {
                input.checked = !input.checked;
            }
            
            // Update visual feedback
            updateAnswerCardSelection();
        });
    });
    
    // Initialize visual state of answer cards
    updateAnswerCardSelection();
}

/**
 * Set up socket event listeners
 */
function setupSocketListeners() {
    // Game started event
    socket.on('game_started', function(data) {
        console.log('Game started:', data);
        
        // Update status badges
        const statusBadge = document.getElementById('gameStatusBadge');
        if (statusBadge) {
            statusBadge.className = 'badge bg-success';
            statusBadge.textContent = 'Active';
        }
        
        // Reload the page to show the first question
        window.location.reload();
    });
    
    // Game ended event
    socket.on('game_ended', function(data) {
        console.log('Game ended:', data);
        
        // Show results modal
        const resultModal = document.getElementById('gameResultModal');
        const resultContent = document.getElementById('resultContent');
        
        if (resultModal && resultContent) {
            // Find our team in the leaderboard
            const ourTeam = data.leaderboard.find(team => team.team_id === teamId);
            const ourPosition = data.leaderboard.findIndex(team => team.team_id === teamId) + 1;
            
            // Create content for the modal
            let htmlContent = `
                <div class="text-center mb-4">
                    <i class="bi bi-flag-fill text-success fs-1"></i>
                    <h3 class="mt-3">Game Complete!</h3>
                    <p>The quiz has ended. Here are the final results:</p>
                </div>
                
                <div class="alert alert-info">
                    <h5>Your Team: ${ourTeam ? ourTeam.name : 'Unknown'}</h5>
                    <p>Final Position: ${ourPosition} of ${data.leaderboard.length}</p>
                    <p>Final Score: ${ourTeam ? ourTeam.score : '0'} points</p>
                </div>
                
                <h5 class="mt-4">Final Leaderboard</h5>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Position</th>
                                <th>Team</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            // Add each team to the results
            data.leaderboard.forEach((team, index) => {
                htmlContent += `
                    <tr ${team.team_id === teamId ? 'class="table-primary"' : ''}>
                        <td>${index + 1}</td>
                        <td>
                            ${index < 3 ? '<i class="bi bi-trophy-fill me-2 ' + 
                              (index === 0 ? 'text-warning' : (index === 1 ? 'text-secondary' : 'text-danger')) + 
                              '"></i>' : ''}
                            ${team.name}
                            ${team.team_id === teamId ? ' <span class="badge bg-primary">Your Team</span>' : ''}
                        </td>
                        <td>${team.score}</td>
                    </tr>
                `;
            });
            
            htmlContent += `
                        </tbody>
                    </table>
                </div>
            `;
            
            resultContent.innerHTML = htmlContent;
            
            // Show the modal
            const modal = new bootstrap.Modal(resultModal);
            modal.show();
        }
        
        // Update status badges
        const statusBadge = document.getElementById('gameStatusBadge');
        if (statusBadge) {
            statusBadge.className = 'badge bg-secondary';
            statusBadge.textContent = 'Completed';
        }
        
        // Update question display
        const questionDisplay = document.getElementById('questionDisplay');
        if (questionDisplay) {
            questionDisplay.innerHTML = `
                <div class="alert alert-secondary text-center py-5">
                    <i class="bi bi-flag-fill fs-1 d-block mb-3"></i>
                    <h4>Game Over!</h4>
                    <p>The quiz has been completed. Check the results to see your final position.</p>
                </div>
            `;
        }
    });
    
    // New question event
    socket.on('new_question', function(data) {
        console.log('New question:', data);
        
        // Update the question counter
        const questionCounter = document.getElementById('questionCounter');
        if (questionCounter) {
            questionCounter.textContent = `Question: ${data.question_index}`;
        }
        
        // Reload page to show the new question
        window.location.reload();
    });
    
    // Points awarded event
    socket.on('points_awarded', function(data) {
        console.log('Points awarded:', data);
        
        // If these are points for our team, update the score
        if (data.team_id === teamId) {
            const teamScore = document.getElementById('teamScore');
            if (teamScore) {
                teamScore.textContent = data.new_score;
            }
            
            // Show a notification
            const feedbackModal = document.getElementById('answerFeedbackModal');
            const feedbackTitle = document.getElementById('feedbackTitle');
            const feedbackContent = document.getElementById('feedbackContent');
            
            if (feedbackModal && feedbackTitle && feedbackContent) {
                feedbackTitle.textContent = 'Points Awarded!';
                feedbackContent.innerHTML = `
                    <i class="bi bi-award text-success fs-1 mb-3"></i>
                    <h4>+${data.points_awarded} points!</h4>
                    <p>The moderator has awarded your team extra points.</p>
                    <p>Your new score: ${data.new_score}</p>
                `;
                
                const modal = new bootstrap.Modal(feedbackModal);
                modal.show();
            }
        }
        
        // Update leaderboard
        fetchLeaderboard(gameId);
    });
    
    // Leaderboard updated event
    socket.on('leaderboard_updated', function(data) {
        console.log('Leaderboard updated:', data);
        renderLeaderboard(data.leaderboard);
    });
}

/**
 * Submit an answer to the current question
 * @param {HTMLFormElement} form - The answer form
 */
function submitAnswer(form) {
    const questionId = form.dataset.questionId;
    const teamId = form.dataset.teamId;
    
    // Depending on the question type, gather the appropriate answer data
    let answerData = {};
    const questionType = form.querySelector('input[type="radio"], input[type="checkbox"], textarea') ? 
                         form.querySelector('input[type="radio"], input[type="checkbox"], textarea').name : '';
    
    if (questionType === 'text_answer') {
        // Text answer
        const textAnswer = form.querySelector('textarea').value;
        answerData = {
            text: textAnswer
        };
    } else if (questionType === 'answer_id') {
        // Single choice
        const selectedAnswer = form.querySelector('input[name="answer_id"]:checked');
        if (!selectedAnswer) {
            alert('Please select an answer.');
            return;
        }
        
        answerData = {
            answer_id: parseInt(selectedAnswer.value)
        };
    } else if (questionType.includes('answer_ids[]')) {
        // Multiple choice
        const selectedAnswers = Array.from(form.querySelectorAll('input[name="answer_ids[]"]:checked')).map(input => parseInt(input.value));
        
        if (selectedAnswers.length === 0) {
            alert('Please select at least one answer.');
            return;
        }
        
        answerData = {
            answer_ids: selectedAnswers
        };
    }
    
    // Disable the submit button to prevent multiple submissions
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i> Submitting...';
    }
    
    // Emit socket event
    socket.emit('submit_answer', {
        team_id: teamId,
        question_id: questionId,
        answer: answerData
    });
    
    // Also submit via AJAX for reliability
    const formData = new FormData();
    formData.append('team_id', teamId);
    formData.append('question_id', questionId);
    
    if (answerData.text) {
        formData.append('text_answer', answerData.text);
    } else if (answerData.answer_id) {
        formData.append('answer_id', answerData.answer_id);
    } else if (answerData.answer_ids) {
        answerData.answer_ids.forEach(id => {
            formData.append('answer_ids[]', id);
        });
    }
    
    fetch('/participant/submit-answer', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Answer submitted successfully');
            
            // Show feedback modal
            const feedbackModal = document.getElementById('answerFeedbackModal');
            const feedbackTitle = document.getElementById('feedbackTitle');
            const feedbackContent = document.getElementById('feedbackContent');
            
            if (feedbackModal && feedbackTitle && feedbackContent) {
                feedbackTitle.textContent = 'Answer Submitted';
                feedbackContent.innerHTML = `
                    <i class="bi bi-check-circle-fill text-success fs-1 mb-3"></i>
                    <h4>Your answer has been submitted!</h4>
                    <p>Waiting for the next question...</p>
                `;
                
                const modal = new bootstrap.Modal(feedbackModal);
                modal.show();
            }
            
            // Replace the form with a success message
            form.outerHTML = `
                <div class="alert alert-success text-center py-4 mt-4">
                    <i class="bi bi-check-circle-fill fs-1 d-block mb-2"></i>
                    <h4>Answer Submitted!</h4>
                    <p>Waiting for the next question...</p>
                </div>
            `;
        } else {
            console.error('Failed to submit answer:', data.message);
            
            // Re-enable the submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i> Submit Answer';
            }
            
            // Show error message
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error submitting answer:', error);
        
        // Re-enable the submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i> Submit Answer';
        }
        
        // Show error message
        alert('An error occurred. Please try again.');
    });
}

/**
 * Fetch the leaderboard data
 * @param {number} gameId - The game ID
 */
function fetchLeaderboard(gameId) {
    fetch(`/api/get-leaderboard/${gameId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderLeaderboard(data.leaderboard);
            }
        })
        .catch(error => {
            console.error('Error fetching leaderboard:', error);
        });
}

/**
 * Render the leaderboard with the provided data
 * @param {Array} leaderboard - Array of team data for the leaderboard
 */
function renderLeaderboard(leaderboard) {
    const container = document.getElementById('leaderboardContainer');
    if (!container) return;
    
    let html = '';
    
    if (leaderboard.length > 0) {
        html = '<div class="list-group">';
        
        leaderboard.forEach((team, index) => {
            const isOurTeam = team.name === document.querySelector('h2').textContent.replace('Team: ', '');
            
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center ${isOurTeam ? 'list-group-item-primary' : ''}">
                    <span>
                        ${index < 3 ? 
                            `<i class="bi bi-trophy-fill me-2 ${index === 0 ? 'text-warning' : (index === 1 ? 'text-secondary' : 'text-danger')}"></i>` :
                            `<span class="me-2">${index + 1}.</span>`
                        }
                        ${team.name}
                        ${isOurTeam ? ' <span class="badge bg-info">You</span>' : ''}
                    </span>
                    <span class="badge bg-primary">${team.score}</span>
                </div>
            `;
        });
        
        html += '</div>';
    } else {
        html = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i> No teams in the leaderboard yet.
            </div>
        `;
    }
    
    container.innerHTML = html;
}

/**
 * Update the visual state of answer cards based on selection
 */
function updateAnswerCardSelection() {
    const answerCards = document.querySelectorAll('.answer-card');
    
    answerCards.forEach(card => {
        const input = card.querySelector('input');
        if (input && input.checked) {
            card.classList.add('border-primary');
            card.classList.add('bg-dark');
        } else {
            card.classList.remove('border-primary');
            card.classList.remove('bg-dark');
        }
    });
}
