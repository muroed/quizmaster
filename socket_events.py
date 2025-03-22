from flask_socketio import emit, join_room, leave_room
from flask import request, session
from app import socketio, db
from models import Game, Team, Question, Answer, TeamAnswer

@socketio.on('connect')
def handle_connect():
    print('Client connected', request.sid)

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected', request.sid)

@socketio.on('join_game')
def handle_join_game(data):
    game_id = data.get('game_id')
    team_id = data.get('team_id')
    role = data.get('role', 'participant')  # moderator or participant
    
    if game_id:
        room = f"game_{game_id}"
        join_room(room)
        print(f"{role} joined game room: {room}")
        
        # If this is a team joining, notify others
        if team_id and role == 'participant':
            team = Team.query.get(team_id)
            if team:
                emit('team_joined', {
                    'team_id': team_id,
                    'team_name': team.name
                }, to=room)

@socketio.on('leave_game')
def handle_leave_game(data):
    game_id = data.get('game_id')
    
    if game_id:
        room = f"game_{game_id}"
        leave_room(room)
        print(f"User left game room: {room}")

@socketio.on('start_game')
def handle_start_game(data):
    game_id = data.get('game_id')
    
    if game_id:
        game = Game.query.get(game_id)
        if game:
            game.status = 'active'
            db.session.commit()
            
            room = f"game_{game_id}"
            emit('game_started', {
                'game_id': game_id
            }, to=room)

@socketio.on('end_game')
def handle_end_game(data):
    game_id = data.get('game_id')
    
    if game_id:
        game = Game.query.get(game_id)
        if game:
            game.status = 'completed'
            db.session.commit()
            
            # Get final leaderboard
            teams = Team.query.filter_by(game_id=game_id).order_by(Team.score.desc()).all()
            leaderboard = [{'team_id': t.id, 'name': t.name, 'score': t.score} for t in teams]
            
            room = f"game_{game_id}"
            emit('game_ended', {
                'game_id': game_id,
                'leaderboard': leaderboard
            }, to=room)

@socketio.on('show_question')
def handle_show_question(data):
    game_id = data.get('game_id')
    question_index = data.get('question_index')
    
    if game_id and question_index is not None:
        game = Game.query.get(game_id)
        if game:
            # Update game's current question
            game.current_question = question_index
            db.session.commit()
            
            # Get the question details
            questions = Question.query.filter_by(quiz_id=game.quiz_id).order_by(Question.order).all()
            
            if 0 <= question_index - 1 < len(questions):
                question = questions[question_index - 1]
                
                # Get answers if applicable
                answers = []
                if question.question_type in ['single_choice', 'multiple_choice']:
                    answers = Answer.query.filter_by(question_id=question.id).all()
                    answers = [{'id': a.id, 'text': a.answer_text, 'media_url': a.media_url} for a in answers]
                
                room = f"game_{game_id}"
                emit('new_question', {
                    'question_id': question.id,
                    'question_text': question.question_text,
                    'question_type': question.question_type,
                    'media_type': question.media_type,
                    'media_url': question.media_url,
                    'answers': answers,
                    'question_index': question_index,
                    'total_questions': len(questions)
                }, to=room)

@socketio.on('submit_answer')
def handle_submit_answer(data):
    team_id = data.get('team_id')
    question_id = data.get('question_id')
    answer_data = data.get('answer')
    
    if team_id and question_id:
        team = Team.query.get(team_id)
        question = Question.query.get(question_id)
        
        if team and question:
            # Check if team has already answered
            existing_answer = TeamAnswer.query.filter_by(team_id=team_id, question_id=question_id).first()
            
            if not existing_answer:
                points_awarded = 0
                is_correct = False
                
                # Process based on question type
                if question.question_type == 'text':
                    text_answer = answer_data.get('text', '')
                    team_answer = TeamAnswer(
                        team_id=team_id,
                        question_id=question_id,
                        text_answer=text_answer
                    )
                    
                elif question.question_type == 'single_choice':
                    answer_id = answer_data.get('answer_id')
                    if answer_id:
                        answer = Answer.query.get(answer_id)
                        if answer and answer.is_correct:
                            is_correct = True
                            points_awarded = question.points
                        
                        team_answer = TeamAnswer(
                            team_id=team_id,
                            question_id=question_id,
                            answer_ids=[answer_id],
                            is_correct=is_correct,
                            points_awarded=points_awarded
                        )
                        
                elif question.question_type == 'multiple_choice':
                    answer_ids = answer_data.get('answer_ids', [])
                    
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
                
                # Notify moderator
                game_id = team.game_id
                room = f"game_{game_id}"
                
                emit('answer_submitted', {
                    'team_id': team_id,
                    'team_name': team.name,
                    'question_id': question_id,
                    'is_correct': is_correct,
                    'points_awarded': points_awarded,
                    'new_score': team.score
                }, to=room)

@socketio.on('award_points')
def handle_award_points(data):
    team_id = data.get('team_id')
    points = data.get('points', 0)
    question_id = data.get('question_id')
    
    if team_id and points:
        team = Team.query.get(team_id)
        
        if team:
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
            
            # Notify everyone about the update
            game_id = team.game_id
            room = f"game_{game_id}"
            
            emit('points_awarded', {
                'team_id': team_id,
                'team_name': team.name,
                'points_awarded': points,
                'new_score': team.score,
                'question_id': question_id
            }, to=room)

@socketio.on('update_leaderboard')
def handle_update_leaderboard(data):
    game_id = data.get('game_id')
    
    if game_id:
        teams = Team.query.filter_by(game_id=game_id).order_by(Team.score.desc()).all()
        leaderboard = [{'team_id': t.id, 'name': t.name, 'score': t.score} for t in teams]
        
        room = f"game_{game_id}"
        emit('leaderboard_updated', {
            'leaderboard': leaderboard
        }, to=room)
