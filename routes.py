import os
import random
import string
from datetime import datetime
from flask import render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import desc

from app import app, db
from models import User, Quiz, Question, Answer, Game, Team, TeamAnswer
from utils import login_required, admin_required, moderator_required
from translations import Translation

# Helper function to get translation
def _(key):
    """Get translation for key based on current session language"""
    lang = session.get('lang', 'en')
    return Translation.get(key, lang)

# Make translation function available in all templates
@app.context_processor
def inject_translation_function():
    return {'_': _}

# Home route
@app.route('/')
def index():
    return render_template('base.html')

# Authentication routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        
        if user and check_password_hash(user.password_hash, password):
            session['user_id'] = user.id
            session['is_admin'] = user.is_admin
            
            if user.is_admin:
                return redirect(url_for('admin_dashboard'))
            else:
                return redirect(url_for('moderator_select_quiz'))
        
        flash('Invalid username or password', 'danger')
    
    return render_template('base.html', show_login=True)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

# Admin routes
@app.route('/admin')
@admin_required
def admin_dashboard():
    quizzes = Quiz.query.order_by(desc(Quiz.created_at)).all()
    return render_template('admin/dashboard.html', quizzes=quizzes)

@app.route('/admin/create-quiz', methods=['GET', 'POST'])
@admin_required
def create_quiz():
    if request.method == 'POST':
        title = request.form.get('title')
        description = request.form.get('description', '')
        
        quiz = Quiz(
            title=title,
            description=description,
            user_id=session['user_id']
        )
        
        db.session.add(quiz)
        db.session.commit()
        
        return redirect(url_for('edit_quiz', quiz_id=quiz.id))
    
    return render_template('admin/create_quiz.html')

@app.route('/admin/edit-quiz/<int:quiz_id>', methods=['GET', 'POST'])
@admin_required
def edit_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    questions = Question.query.filter_by(quiz_id=quiz_id).order_by(Question.order).all()
    
    return render_template('admin/edit_quiz.html', quiz=quiz, questions=questions)

@app.route('/admin/add-question/<int:quiz_id>', methods=['POST'])
@admin_required
def add_question(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    
    question_text = request.form.get('question_text')
    question_type = request.form.get('question_type')
    media_type = request.form.get('media_type')
    media_url = request.form.get('media_url')
    points = int(request.form.get('points', 1))
    
    # Get the highest order number for this quiz
    highest_order = db.session.query(db.func.max(Question.order)).filter_by(quiz_id=quiz_id).scalar() or 0
    
    question = Question(
        quiz_id=quiz_id,
        question_text=question_text,
        question_type=question_type,
        media_type=media_type,
        media_url=media_url,
        points=points,
        order=highest_order + 1
    )
    
    db.session.add(question)
    db.session.commit()
    
    # Handle answers
    if question_type in ['single_choice', 'multiple_choice']:
        answer_texts = request.form.getlist('answer_text[]')
        is_correct_list = request.form.getlist('is_correct[]')
        media_urls = request.form.getlist('answer_media_url[]')
        
        for i, answer_text in enumerate(answer_texts):
            if answer_text.strip():  # Only add non-empty answers
                is_correct = f"{i}" in is_correct_list
                media_url = media_urls[i] if i < len(media_urls) else None
                
                answer = Answer(
                    question_id=question.id,
                    answer_text=answer_text,
                    is_correct=is_correct,
                    media_url=media_url
                )
                
                db.session.add(answer)
        
        db.session.commit()
    
    return redirect(url_for('edit_quiz', quiz_id=quiz_id))

@app.route('/admin/edit-question/<int:question_id>', methods=['POST'])
@admin_required
def edit_question(question_id):
    question = Question.query.get_or_404(question_id)
    
    question.question_text = request.form.get('question_text')
    question.question_type = request.form.get('question_type')
    question.media_type = request.form.get('media_type')
    question.media_url = request.form.get('media_url')
    question.points = int(request.form.get('points', 1))
    
    db.session.commit()
    
    # Handle answers
    if question.question_type in ['single_choice', 'multiple_choice']:
        # Delete existing answers
        Answer.query.filter_by(question_id=question_id).delete()
        
        # Add new answers
        answer_texts = request.form.getlist('answer_text[]')
        is_correct_list = request.form.getlist('is_correct[]')
        media_urls = request.form.getlist('answer_media_url[]')
        
        for i, answer_text in enumerate(answer_texts):
            if answer_text.strip():  # Only add non-empty answers
                is_correct = f"{i}" in is_correct_list
                media_url = media_urls[i] if i < len(media_urls) else None
                
                answer = Answer(
                    question_id=question.id,
                    answer_text=answer_text,
                    is_correct=is_correct,
                    media_url=media_url
                )
                
                db.session.add(answer)
        
        db.session.commit()
    
    return redirect(url_for('edit_quiz', quiz_id=question.quiz_id))

@app.route('/admin/delete-question/<int:question_id>', methods=['POST'])
@admin_required
def delete_question(question_id):
    question = Question.query.get_or_404(question_id)
    quiz_id = question.quiz_id
    
    # Delete answers first
    Answer.query.filter_by(question_id=question_id).delete()
    
    # Delete question
    db.session.delete(question)
    
    # Reorder remaining questions
    questions = Question.query.filter_by(quiz_id=quiz_id).order_by(Question.order).all()
    for i, q in enumerate(questions, 1):
        q.order = i
    
    db.session.commit()
    
    return redirect(url_for('edit_quiz', quiz_id=quiz_id))

@app.route('/admin/delete-quiz/<int:quiz_id>', methods=['POST'])
@admin_required
def delete_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    
    # Delete all associated data
    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    for question in questions:
        Answer.query.filter_by(question_id=question.id).delete()
    
    Question.query.filter_by(quiz_id=quiz_id).delete()
    
    games = Game.query.filter_by(quiz_id=quiz_id).all()
    for game in games:
        teams = Team.query.filter_by(game_id=game.id).all()
        for team in teams:
            TeamAnswer.query.filter_by(team_id=team.id).delete()
        
        Team.query.filter_by(game_id=game.id).delete()
    
    Game.query.filter_by(quiz_id=quiz_id).delete()
    
    db.session.delete(quiz)
    db.session.commit()
    
    return redirect(url_for('admin_dashboard'))

# Moderator routes
@app.route('/moderator')
@moderator_required
def moderator_select_quiz():
    quizzes = Quiz.query.order_by(desc(Quiz.created_at)).all()
    games = Game.query.filter_by(status='active').all()
    
    return render_template('moderator/select_quiz.html', quizzes=quizzes, games=games)

@app.route('/moderator/create-game/<int:quiz_id>', methods=['POST'])
@moderator_required
def create_game(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    
    # Generate a unique game code
    while True:
        game_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not Game.query.filter_by(game_code=game_code).first():
            break
    
    game = Game(
        quiz_id=quiz_id,
        game_code=game_code,
        status='waiting'
    )
    
    db.session.add(game)
    db.session.commit()
    
    return redirect(url_for('moderator_game', game_id=game.id))

@app.route('/moderator/game/<int:game_id>')
@moderator_required
def moderator_game(game_id):
    game = Game.query.get_or_404(game_id)
    quiz = Quiz.query.get_or_404(game.quiz_id)
    questions = Question.query.filter_by(quiz_id=quiz.id).order_by(Question.order).all()
    teams = Team.query.filter_by(game_id=game_id).all()
    
    current_question = None
    if game.current_question > 0 and game.current_question <= len(questions):
        current_question = questions[game.current_question - 1]
        current_question.answers = Answer.query.filter_by(question_id=current_question.id).all()
    
    return render_template('moderator/game.html', 
                         game=game, 
                         quiz=quiz, 
                         questions=questions, 
                         teams=teams,
                         current_question=current_question)

@app.route('/moderator/join-game/<int:game_id>')
def join_game_page(game_id):
    game = Game.query.get_or_404(game_id)
    
    if game.status == 'completed':
        flash('This game has ended', 'danger')
        return redirect(url_for('index'))
    
    return render_template('participant/join.html', game=game)

# Participant routes
@app.route('/join/<game_code>')
def join_game_by_code(game_code):
    game = Game.query.filter_by(game_code=game_code).first_or_404()
    
    if game.status == 'completed':
        flash('This game has ended', 'danger')
        return redirect(url_for('index'))
    
    return render_template('participant/join.html', game=game)

@app.route('/participant/register-team', methods=['POST'])
def register_team():
    game_id = request.form.get('game_id')
    team_name = request.form.get('team_name')
    
    game = Game.query.get_or_404(game_id)
    
    if game.status == 'completed':
        flash('This game has ended', 'danger')
        return redirect(url_for('index'))
    
    # Check if team name already exists in this game
    existing_team = Team.query.filter_by(game_id=game_id, name=team_name).first()
    if existing_team:
        flash('Team name already exists, please choose another name', 'danger')
        game = Game.query.get(game_id)
        return redirect(url_for('join_game_by_code', game_code=game.game_code))
    
    team = Team(
        game_id=game_id,
        name=team_name
    )
    
    db.session.add(team)
    db.session.commit()
    
    session['team_id'] = team.id
    
    return redirect(url_for('participant_game', team_id=team.id))

@app.route('/participant/game/<int:team_id>')
def participant_game(team_id):
    team = Team.query.get_or_404(team_id)
    game = Game.query.get_or_404(team.game_id)
    quiz = Quiz.query.get_or_404(game.quiz_id)
    
    # Security check - make sure the team belongs to the participant
    if session.get('team_id') != team.id:
        flash('Unauthorized access', 'danger')
        return redirect(url_for('index'))
    
    current_question = None
    if game.status == 'active' and game.current_question > 0:
        questions = Question.query.filter_by(quiz_id=quiz.id).order_by(Question.order).all()
        if game.current_question <= len(questions):
            current_question = questions[game.current_question - 1]
            current_question.answers = Answer.query.filter_by(question_id=current_question.id).all()
            
            # Check if team has already answered
            team_answer = TeamAnswer.query.filter_by(
                team_id=team.id, 
                question_id=current_question.id
            ).first()
            
            if team_answer:
                current_question.answered = True
                current_question.team_answer = team_answer
    
    return render_template('participant/game.html', 
                         team=team, 
                         game=game, 
                         quiz=quiz,
                         current_question=current_question)

@app.route('/participant/submit-answer', methods=['POST'])
def submit_answer():
    team_id = request.form.get('team_id')
    question_id = request.form.get('question_id')
    
    team = Team.query.get_or_404(team_id)
    question = Question.query.get_or_404(question_id)
    
    # Security check - make sure the team belongs to the participant
    if session.get('team_id') != team.id:
        return jsonify({'success': False, 'message': 'Unauthorized access'})
    
    # Check if team has already answered this question
    existing_answer = TeamAnswer.query.filter_by(team_id=team_id, question_id=question_id).first()
    if existing_answer:
        return jsonify({'success': False, 'message': 'You have already answered this question'})
    
    # Process answer based on question type
    is_correct = False
    points_awarded = 0
    
    if question.question_type == 'text':
        text_answer = request.form.get('text_answer', '')
        team_answer = TeamAnswer(
            team_id=team_id,
            question_id=question_id,
            text_answer=text_answer
        )
        
    elif question.question_type == 'single_choice':
        answer_id = request.form.get('answer_id')
        if answer_id:
            answer = Answer.query.get(answer_id)
            if answer and answer.is_correct:
                is_correct = True
                points_awarded = question.points
            
            team_answer = TeamAnswer(
                team_id=team_id,
                question_id=question_id,
                answer_ids=[int(answer_id)],
                is_correct=is_correct,
                points_awarded=points_awarded
            )
            
    elif question.question_type == 'multiple_choice':
        answer_ids = request.form.getlist('answer_ids[]')
        if answer_ids:
            # Convert to integers
            answer_ids = [int(aid) for aid in answer_ids]
            
            # Check if all selected answers are correct
            correct_answers = Answer.query.filter_by(question_id=question_id, is_correct=True).all()
            correct_ids = [a.id for a in correct_answers]
            
            if set(answer_ids) == set(correct_ids):
                is_correct = True
                points_awarded = question.points
            
            team_answer = TeamAnswer(
                team_id=team_id,
                question_id=question_id,
                answer_ids=answer_ids,
                is_correct=is_correct,
                points_awarded=points_awarded
            )
    
    db.session.add(team_answer)
    
    # Update team score if answer is correct
    if is_correct:
        team.score += points_awarded
    
    db.session.commit()
    
    return jsonify({'success': True, 'message': 'Answer submitted successfully'})

# API routes for AJAX requests
@app.route('/api/start-game/<int:game_id>', methods=['POST'])
@moderator_required
def start_game(game_id):
    game = Game.query.get_or_404(game_id)
    
    game.status = 'active'
    game.current_question = 0  # Will be incremented when showing first question
    
    db.session.commit()
    
    return jsonify({'success': True})

@app.route('/api/end-game/<int:game_id>', methods=['POST'])
@moderator_required
def end_game(game_id):
    game = Game.query.get_or_404(game_id)
    
    game.status = 'completed'
    game.ended_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'success': True})

@app.route('/api/next-question/<int:game_id>', methods=['POST'])
@moderator_required
def next_question(game_id):
    game = Game.query.get_or_404(game_id)
    
    # Get total question count
    question_count = Question.query.filter_by(quiz_id=game.quiz_id).count()
    
    # Increment question counter
    game.current_question += 1
    
    # If we've gone past the last question, stay on the last question
    if game.current_question > question_count:
        game.current_question = question_count
    
    db.session.commit()
    
    return jsonify({'success': True, 'current_question': game.current_question})

@app.route('/api/prev-question/<int:game_id>', methods=['POST'])
@moderator_required
def prev_question(game_id):
    game = Game.query.get_or_404(game_id)
    
    # Decrement question counter
    game.current_question -= 1
    
    # Ensure we don't go below 1
    if game.current_question < 1:
        game.current_question = 1
    
    db.session.commit()
    
    return jsonify({'success': True, 'current_question': game.current_question})

@app.route('/api/award-points/<int:team_id>', methods=['POST'])
@moderator_required
def award_points(team_id):
    team = Team.query.get_or_404(team_id)
    points = int(request.form.get('points', 0))
    question_id = request.form.get('question_id')
    
    if points:
        team.score += points
        
        # If this is for a specific question, record it
        if question_id:
            team_answer = TeamAnswer.query.filter_by(team_id=team_id, question_id=question_id).first()
            
            if team_answer:
                team_answer.points_awarded += points
            else:
                team_answer = TeamAnswer(
                    team_id=team_id,
                    question_id=question_id,
                    points_awarded=points
                )
                db.session.add(team_answer)
        
        db.session.commit()
    
    return jsonify({'success': True, 'new_score': team.score})

@app.route('/api/get-leaderboard/<int:game_id>')
def get_leaderboard(game_id):
    teams = Team.query.filter_by(game_id=game_id).order_by(desc(Team.score)).all()
    
    leaderboard = [{'name': team.name, 'score': team.score} for team in teams]
    
    return jsonify({'success': True, 'leaderboard': leaderboard})

# Setup initial admin user if it doesn't exist
def create_initial_admin():
    admin = User.query.filter_by(username='admin').first()
    if not admin:
        admin = User(
            username='admin',
            password_hash=generate_password_hash('adminpass'),
            is_admin=True
        )
        db.session.add(admin)
        db.session.commit()

# Use with_app_context instead of before_first_request
with app.app_context():
    create_initial_admin()
