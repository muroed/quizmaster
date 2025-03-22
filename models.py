from datetime import datetime
from sqlalchemy import JSON
from app import db

class User(db.Model):
    """User model for admin and moderator access"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    quizzes = db.relationship('Quiz', backref='creator', lazy=True)

class Quiz(db.Model):
    """Quiz model containing quiz metadata"""
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    questions = db.relationship('Question', backref='quiz', lazy=True, cascade="all, delete-orphan")
    games = db.relationship('Game', backref='quiz', lazy=True)

class Question(db.Model):
    """Question model for quiz questions"""
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(20), nullable=False)  # text, single_choice, multiple_choice
    media_type = db.Column(db.String(10), nullable=True)  # image, audio, video
    media_url = db.Column(db.Text, nullable=True)
    points = db.Column(db.Integer, default=1)
    order = db.Column(db.Integer, nullable=False)
    
    answers = db.relationship('Answer', backref='question', lazy=True, cascade="all, delete-orphan")

class Answer(db.Model):
    """Answer model for question answers"""
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)
    answer_text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, default=False)
    media_url = db.Column(db.Text, nullable=True)

class Game(db.Model):
    """Game model for quiz sessions"""
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    game_code = db.Column(db.String(8), unique=True, nullable=False)
    status = db.Column(db.String(20), default='waiting')  # waiting, active, completed
    current_question = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime, nullable=True)
    
    teams = db.relationship('Team', backref='game', lazy=True, cascade="all, delete-orphan")

class Team(db.Model):
    """Team model for participants"""
    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey('game.id'), nullable=False)
    name = db.Column(db.String(64), nullable=False)
    score = db.Column(db.Integer, default=0)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    answers = db.relationship('TeamAnswer', backref='team', lazy=True, cascade="all, delete-orphan")

class TeamAnswer(db.Model):
    """TeamAnswer model for storing team responses"""
    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('team.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)
    answer_ids = db.Column(JSON, nullable=True)  # For multiple choice
    text_answer = db.Column(db.Text, nullable=True)  # For text answers
    is_correct = db.Column(db.Boolean, default=False)
    points_awarded = db.Column(db.Integer, default=0)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
