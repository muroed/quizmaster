/**
 * Moderator panel functionality for managing quiz games
 */

let gameId = null;
let currentQuestion = 0;
let totalQuestions = 0;
// socket is defined in socket.js

/**
 * Initialize the moderator UI with game information
 * @param {number} gId - The game ID
 * @param {number} currQuestion - The current question number
 * @param {number} totQuestions - Total number of questions
 */
function initModeratorUI(gId, currQuestion, totQuestions) {
    gameId = gId;
    currentQuestion = currQuestion;
    totalQuestions = totQuestions;
    
    // Copy link button functionality
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', function() {
            const joinLink = document.getElementById('joinLink');
            joinLink.select();
            document.execCommand('copy');
            
            // Show toast or change button text temporarily
            this.innerHTML = '<i class="bi bi-check"></i> Copied!';
            setTimeout(() => {
                this.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
            }, 2000);
        });
    }
    
    // Start game button
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        startGameBtn.addEventListener('click', function() {
            const gameId = this.dataset.gameId;
            startGame(gameId);
        });
    }
    
    // End game button
    const endGameBtn = document.getElementById('endGameBtn');
    if (endGameBtn) {
        endGameBtn.addEventListener('click', function() {
            const gameId = this.dataset.gameId;
            if (confirm('Are you sure you want to end the game?')) {
                endGame(gameId);
            }
        });
    }
    
    // Next question button
    const nextQuestionBtn = document.getElementById('nextQuestionBtn');
    if (nextQuestionBtn) {
        nextQuestionBtn.addEventListener('click', function() {
            const gameId = this.dataset.gameId;
            showNextQuestion(gameId);
        });
    }
    
    // Previous question button
    const prevQuestionBtn = document.getElementById('prevQuestionBtn');
    if (prevQuestionBtn) {
        prevQuestionBtn.addEventListener('click', function() {
            const gameId = this.dataset.gameId;
            showPrevQuestion(gameId);
        });
    }
    
    // Question navigator buttons
    const questionNavButtons = document.querySelectorAll('#questionNavigator button');
    questionNavButtons.forEach(button => {
        button.addEventListener('click', function() {
            const gameId = this.dataset.gameId;
            const questionIndex = parseInt(this.dataset.questionIndex);
            showSpecificQuestion(gameId, questionIndex);
        });
    });
    
    // Award points buttons
    const awardPointsBtns = document.querySelectorAll('.award-points-btn');
    awardPointsBtns.forEach(button => {
        button.addEventListener('click', function() {
            const teamId = this.dataset.teamId;
            const pointsInput = this.closest('td').querySelector('.points-input');
            const points = parseInt(pointsInput.value || 0);
            
            if (points > 0) {
                awardPoints(teamId, points);
            }
        });
    });
    
    // Set up socket event listeners
    setupSocketListeners();
}

/**
 * Set up socket event listeners
 */
function setupSocketListeners() {
    // Team joined event
    socket.on('team_joined', function(data) {
        console.log('Team joined:', data);
        const teamsContainer = document.getElementById('connectedTeams');
        
        // Add to connected teams list if not already there
        if (teamsContainer) {
            const existingTeam = teamsContainer.querySelector(`[data-team-id="${data.team_id}"]`);
            if (!existingTeam) {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                listItem.setAttribute('data-team-id', data.team_id);
                listItem.innerHTML = `
                    ${data.team_name}
                    <small class="text-muted">Joined just now</small>
                `;
                
                // Clear "no teams" message if it exists
                const noTeamsAlert = teamsContainer.querySelector('.alert');
                if (noTeamsAlert) {
                    noTeamsAlert.remove();
                }
                
                teamsContainer.appendChild(listItem);
            }
        }
        
        // Add to responses table if not already there
        const responsesTable = document.getElementById('responsesTableBody');
        if (responsesTable) {
            const existingRow = responsesTable.querySelector(`[data-team-id="${data.team_id}"]`);
            if (!existingRow) {
                const row = document.createElement('tr');
                row.setAttribute('data-team-id', data.team_id);
                row.innerHTML = `
                    <td>${data.team_name}</td>
                    <td class="answer-status">
                        <span class="badge bg-secondary">Waiting</span>
                    </td>
                    <td class="team-answer">-</td>
                    <td>
                        <div class="input-group input-group-sm">
                            <input type="number" class="form-control form-control-sm points-input" min="0" value="1">
                            <button class="btn btn-sm btn-outline-success award-points-btn" data-team-id="${data.team_id}">
                                <i class="bi bi-plus-circle"></i> Award
                            </button>
                        </div>
                    </td>
                `;
                
                // Add event listener to new award points button
                row.querySelector('.award-points-btn').addEventListener('click', function() {
                    const teamId = this.dataset.teamId;
                    const pointsInput = this.closest('td').querySelector('.points-input');
                    const points = parseInt(pointsInput.value || 0);
                    
                    if (points > 0) {
                        awardPoints(teamId, points);
                    }
                });
                
                responsesTable.appendChild(row);
            }
        }
        
        // Add to leaderboard if not already there
        updateLeaderboard();
    });
    
    // Answer submitted event
    socket.on('answer_submitted', function(data) {
        console.log('Answer submitted:', data);
        
        // Update the response table
        const responsesTable = document.getElementById('responsesTableBody');
        if (responsesTable) {
            const teamRow = responsesTable.querySelector(`[data-team-id="${data.team_id}"]`);
            if (teamRow) {
                const statusCell = teamRow.querySelector('.answer-status');
                const answerCell = teamRow.querySelector('.team-answer');
                
                if (statusCell) {
                    statusCell.innerHTML = `
                        <span class="badge ${data.is_correct ? 'bg-success' : 'bg-danger'}">
                            ${data.is_correct ? 'Correct' : 'Incorrect'}
                        </span>
                    `;
                }
                
                if (answerCell) {
                    answerCell.textContent = 'Answered';
                }
            }
        }
        
        // Update leaderboard
        updateLeaderboard();
    });
    
    // Points awarded event
    socket.on('points_awarded', function(data) {
        console.log('Points awarded:', data);
        
        // Update the team's score in the leaderboard
        const leaderboardItem = document.querySelector(`#leaderboardContainer [data-team-id="${data.team_id}"] .team-score`);
        if (leaderboardItem) {
            leaderboardItem.textContent = data.new_score;
        }
        
        // Sort the leaderboard
        updateLeaderboard();
    });
    
    // Game started event
    socket.on('game_started', function(data) {
        console.log('Game started:', data);
        
        // Update UI to reflect game started
        const startGameBtn = document.getElementById('startGameBtn');
        if (startGameBtn) {
            startGameBtn.outerHTML = `
                <button id="endGameBtn" class="btn btn-danger me-2" data-game-id="${data.game_id}">
                    <i class="bi bi-stop-fill"></i> End Game
                </button>
            `;
            
            // Add event listener to the new end game button
            document.getElementById('endGameBtn').addEventListener('click', function() {
                const gameId = this.dataset.gameId;
                if (confirm('Are you sure you want to end the game?')) {
                    endGame(gameId);
                }
            });
        }
        
        // Update status badges
        document.querySelectorAll('.badge:contains("waiting")').forEach(badge => {
            badge.className = badge.className.replace('bg-warning', 'bg-success');
            badge.textContent = 'Active';
        });
        
        // Enable navigation buttons
        document.querySelectorAll('#questionNavigator button').forEach(button => {
            button.removeAttribute('disabled');
        });
    });
    
    // Game ended event
    socket.on('game_ended', function(data) {
        console.log('Game ended:', data);
        
        // Show results modal
        const resultModal = document.getElementById('gameResultModal');
        const resultContent = document.getElementById('resultContent');
        
        if (resultModal && resultContent) {
            // Create content for the modal
            let htmlContent = `
                <div class="text-center mb-4">
                    <i class="bi bi-trophy-fill text-warning fs-1"></i>
                    <h3 class="mt-3">Game Complete!</h3>
                    <p>The quiz has ended. Here are the final results:</p>
                </div>
                
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
                    <tr>
                        <td>${index + 1}</td>
                        <td>
                            ${index < 3 ? '<i class="bi bi-trophy-fill me-2 ' + 
                              (index === 0 ? 'text-warning' : (index === 1 ? 'text-secondary' : 'text-danger')) + 
                              '"></i>' : ''}
                            ${team.name}
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
        
        // Update UI to reflect game ended
        const endGameBtn = document.getElementById('endGameBtn');
        if (endGameBtn) {
            endGameBtn.outerHTML = `
                <button class="btn btn-secondary me-2" disabled>
                    <i class="bi bi-flag-fill"></i> Game Ended
                </button>
            `;
        }
        
        // Disable navigation buttons
        document.querySelectorAll('#questionNavigator button, #prevQuestionBtn, #nextQuestionBtn').forEach(button => {
            button.setAttribute('disabled', 'true');
        });
        
        // Update status badges
        document.querySelectorAll('.badge:contains("active")').forEach(badge => {
            badge.className = badge.className.replace('bg-success', 'bg-secondary');
            badge.textContent = 'Completed';
        });
    });
    
    // New question event
    socket.on('new_question', function(data) {
        console.log('New question:', data);
        
        // Update current question tracker
        currentQuestion = data.question_index;
        
        // Update question navigation
        const navButtons = document.querySelectorAll('#questionNavigator button');
        navButtons.forEach(button => {
            const buttonIndex = parseInt(button.dataset.questionIndex);
            if (buttonIndex === data.question_index) {
                button.classList.remove('btn-outline-secondary');
                button.classList.add('btn-primary');
            } else {
                button.classList.remove('btn-primary');
                button.classList.add('btn-outline-secondary');
            }
        });
        
        // Update prev/next buttons
        const prevBtn = document.getElementById('prevQuestionBtn');
        const nextBtn = document.getElementById('nextQuestionBtn');
        
        if (prevBtn) {
            prevBtn.disabled = data.question_index <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = data.question_index >= data.total_questions;
        }
        
        // Reload page to show the new question (alternatively, you could update the DOM)
        window.location.reload();
    });
    
    // Leaderboard updated event
    socket.on('leaderboard_updated', function(data) {
        console.log('Leaderboard updated:', data);
        renderLeaderboard(data.leaderboard);
    });
}

/**
 * Start the game
 * @param {number} gameId - The game ID
 */
function startGame(gameId) {
    // Emit socket event to start the game
    socket.emit('start_game', { game_id: gameId });
    
    // Also call the API endpoint
    fetch(`/api/start-game/${gameId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Game started successfully');
            // Show the first question
            showNextQuestion(gameId);
        } else {
            console.error('Failed to start game:', data.message);
        }
    })
    .catch(error => {
        console.error('Error starting game:', error);
    });
}

/**
 * End the game
 * @param {number} gameId - The game ID
 */
function endGame(gameId) {
    // Emit socket event to end the game
    socket.emit('end_game', { game_id: gameId });
    
    // Also call the API endpoint
    fetch(`/api/end-game/${gameId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Game ended successfully');
        } else {
            console.error('Failed to end game:', data.message);
        }
    })
    .catch(error => {
        console.error('Error ending game:', error);
    });
}

/**
 * Show the next question
 * @param {number} gameId - The game ID
 */
function showNextQuestion(gameId) {
    // Call the API endpoint to advance to the next question
    fetch(`/api/next-question/${gameId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Advanced to next question:', data.current_question);
            
            // Emit socket event to show the new question
            socket.emit('show_question', {
                game_id: gameId,
                question_index: data.current_question
            });
            
            // Update UI (alternatively, wait for the socket event to trigger a reload)
            currentQuestion = data.current_question;
            
            // Reset the responses table
            resetResponsesTable();
        } else {
            console.error('Failed to advance question');
        }
    })
    .catch(error => {
        console.error('Error advancing question:', error);
    });
}

/**
 * Show the previous question
 * @param {number} gameId - The game ID
 */
function showPrevQuestion(gameId) {
    // Call the API endpoint to go back to the previous question
    fetch(`/api/prev-question/${gameId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Went back to previous question:', data.current_question);
            
            // Emit socket event to show the new question
            socket.emit('show_question', {
                game_id: gameId,
                question_index: data.current_question
            });
            
            // Update UI (alternatively, wait for the socket event to trigger a reload)
            currentQuestion = data.current_question;
            
            // Reset the responses table
            resetResponsesTable();
        } else {
            console.error('Failed to go back to previous question');
        }
    })
    .catch(error => {
        console.error('Error going back to previous question:', error);
    });
}

/**
 * Show a specific question
 * @param {number} gameId - The game ID
 * @param {number} questionIndex - The index of the question to show
 */
function showSpecificQuestion(gameId, questionIndex) {
    // Emit socket event to show the specific question
    socket.emit('show_question', {
        game_id: gameId,
        question_index: questionIndex
    });
    
    // Reset the responses table
    resetResponsesTable();
    
    // Reload page to show the new question
    window.location.reload();
}

/**
 * Award points to a team
 * @param {number} teamId - The team ID
 * @param {number} points - The number of points to award
 */
function awardPoints(teamId, points) {
    // Get the current question ID if available
    const questionDisplay = document.getElementById('questionDisplay');
    let questionId = null;
    
    if (questionDisplay) {
        const question = questionDisplay.querySelector('[data-question-id]');
        if (question) {
            questionId = question.dataset.questionId;
        }
    }
    
    // Emit socket event to award points
    socket.emit('award_points', {
        team_id: teamId,
        points: points,
        question_id: questionId
    });
    
    // Also call the API endpoint
    const formData = new FormData();
    formData.append('points', points);
    if (questionId) {
        formData.append('question_id', questionId);
    }
    
    fetch(`/api/award-points/${teamId}`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Points awarded successfully:', data.new_score);
            
            // Update the team's score in the UI
            const teamScore = document.querySelector(`#leaderboardContainer [data-team-id="${teamId}"] .team-score`);
            if (teamScore) {
                teamScore.textContent = data.new_score;
            }
            
            // Show a flash message
            const pointsInput = document.querySelector(`[data-team-id="${teamId}"] .points-input`);
            const awardBtn = document.querySelector(`[data-team-id="${teamId}"] .award-points-btn`);
            
            if (awardBtn) {
                const originalText = awardBtn.innerHTML;
                awardBtn.innerHTML = '<i class="bi bi-check"></i> Awarded!';
                awardBtn.classList.remove('btn-outline-success');
                awardBtn.classList.add('btn-success');
                
                setTimeout(() => {
                    awardBtn.innerHTML = originalText;
                    awardBtn.classList.remove('btn-success');
                    awardBtn.classList.add('btn-outline-success');
                }, 2000);
            }
            
            // Update leaderboard order
            updateLeaderboard();
        } else {
            console.error('Failed to award points');
        }
    })
    .catch(error => {
        console.error('Error awarding points:', error);
    });
}

/**
 * Update the leaderboard
 */
function updateLeaderboard() {
    // Request updated leaderboard
    socket.emit('update_leaderboard', { game_id: gameId });
    
    // Also fetch from API
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
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center" data-team-id="${team.team_id}">
                    <span>
                        ${index < 3 ? 
                            `<i class="bi bi-trophy-fill me-2 ${index === 0 ? 'text-warning' : (index === 1 ? 'text-secondary' : 'text-danger')}"></i>` :
                            `<span class="me-2">${index + 1}.</span>`
                        }
                        ${team.name}
                    </span>
                    <span class="badge bg-primary team-score">${team.score}</span>
                </div>
            `;
        });
        
        html += '</div>';
    } else {
        html = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i> No teams have joined yet.
            </div>
        `;
    }
    
    container.innerHTML = html;
}

/**
 * Reset the responses table for a new question
 */
function resetResponsesTable() {
    const responsesTable = document.getElementById('responsesTableBody');
    if (!responsesTable) return;
    
    const rows = responsesTable.querySelectorAll('tr');
    rows.forEach(row => {
        const statusCell = row.querySelector('.answer-status');
        const answerCell = row.querySelector('.team-answer');
        
        if (statusCell) {
            statusCell.innerHTML = '<span class="badge bg-secondary">Waiting</span>';
        }
        
        if (answerCell) {
            answerCell.textContent = '-';
        }
    });
}
