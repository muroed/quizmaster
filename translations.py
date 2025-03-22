"""
Translations module for multilingual support
"""

class Translation:
    """Class for handling translations"""
    
    # Dictionary of translations
    translations = {
        'en': {
            # Common
            'app_name': 'QuizMaster',
            'welcome': 'Welcome to QuizMaster',
            'description': 'A real-time quiz management system with admin, moderator, and participant panels.',
            'description_long': 'Create and manage quizzes, run live quiz sessions, and engage participants in real-time.',
            'card_create_description': 'Design engaging quizzes with various question types including text, single-choice, and multiple-choice.',
            'card_host_description': 'Run live quiz sessions with real-time updates and instant feedback for participants.',
            'card_team_description': 'Participants can join with team names, answer questions, and compete in real-time.',
            
            # Navigation
            'login': 'Login',
            'logout': 'Logout',
            'admin_dashboard': 'Admin Dashboard',
            'moderator_panel': 'Moderator Panel',
            'back': 'Back',
            
            # Auth
            'username': 'Username',
            'password': 'Password',
            
            # Admin
            'admin_instructions': 'Admin Instructions',
            'manage_quizzes': 'Manage your quizzes and create new ones.',
            'create_quiz': 'Create New Quiz',
            'edit_quiz': 'Edit Quiz',
            'delete_quiz': 'Delete Quiz',
            'confirm_delete': 'Confirm Delete',
            'quiz_title': 'Quiz Title',
            'quiz_description': 'Description (Optional)',
            'created_at': 'Created at',
            'quiz_created': 'Quiz created successfully!',
            'quiz_updated': 'Quiz updated successfully!',
            'quiz_deleted': 'Quiz deleted successfully!',
            
            # Questions
            'questions': 'Questions',
            'add_question': 'Add Question',
            'edit_question': 'Edit Question',
            'delete_question': 'Delete Question',
            'question_text': 'Question Text',
            'question_type': 'Question Type',
            'text_answer': 'Text Answer',
            'single_choice': 'Single Choice',
            'multiple_choice': 'Multiple Choice',
            'media_type': 'Media Type (Optional)',
            'media_url': 'Media URL (Optional)',
            'points': 'Points',
            'correct': 'Correct',
            'answers': 'Answers',
            'add_answer': 'Add Answer',
            
            # Moderator
            'moderator_instructions': 'How to Run a Quiz',
            'select_quiz': 'Select a quiz to start a new game or manage ongoing games.',
            'active_games': 'Active Games',
            'available_quizzes': 'Available Quizzes',
            'start_game': 'Start Game',
            'end_game': 'End Game',
            'game_code': 'Game Code',
            'join_link': 'Join Link',
            'copy': 'Copy',
            'copied': 'Copied!',
            'status': 'Status',
            'teams': 'Teams',
            'manage_game': 'Manage Game',
            'question_control': 'Question Control',
            'previous': 'Previous',
            'next': 'Next',
            'current_question': 'Current Question',
            'team_responses': 'Team Responses',
            'leaderboard': 'Leaderboard',
            'award_points': 'Award Points',
            'question_navigator': 'Question Navigator',
            'connected_teams': 'Connected Teams',
            'game_results': 'Game Results',
            
            # Participant
            'join_game': 'Join Quiz Game',
            'join_instructions': 'How to Play',
            'team_name': 'Team Name',
            'submit_answer': 'Submit Answer',
            'your_answer': 'Your Answer',
            'answer_submitted': 'Answer Submitted!',
            'waiting_next': 'Waiting for the next question...',
            'game_over': 'Game Over!',
            'final_results': 'The quiz has ended. Check the results to see your final position.',
            'final_position': 'Final Position',
            'final_score': 'Final Score',
            'team_score': 'Score',
            'game_info': 'Game Info',
            
            # Status
            'waiting': 'Waiting',
            'active': 'Active',
            'completed': 'Completed',
        },
        'ru': {
            # Common
            'app_name': 'КвизМастер',
            'welcome': 'Добро пожаловать в КвизМастер',
            'description': 'Система управления викторинами в реальном времени с панелями администратора, модератора и участника.',
            'description_long': 'Создавайте и управляйте викторинами, проводите сессии в реальном времени и вовлекайте участников.',
            'card_create_description': 'Создавайте увлекательные викторины с различными типами вопросов, включая текстовые ответы, выбор одного или нескольких вариантов.',
            'card_host_description': 'Проводите викторины в реальном времени с мгновенными обновлениями и обратной связью для участников.',
            'card_team_description': 'Участники могут присоединяться с названиями команд, отвечать на вопросы и соревноваться в реальном времени.',
            
            # Navigation
            'login': 'Вход',
            'logout': 'Выход',
            'admin_dashboard': 'Панель администратора',
            'moderator_panel': 'Панель модератора',
            'back': 'Назад',
            
            # Auth
            'username': 'Имя пользователя',
            'password': 'Пароль',
            
            # Admin
            'admin_instructions': 'Инструкции для администратора',
            'manage_quizzes': 'Управляйте своими викторинами и создавайте новые.',
            'create_quiz': 'Создать новую викторину',
            'edit_quiz': 'Редактировать викторину',
            'delete_quiz': 'Удалить викторину',
            'confirm_delete': 'Подтвердить удаление',
            'quiz_title': 'Название викторины',
            'quiz_description': 'Описание (Необязательно)',
            'created_at': 'Создано',
            'quiz_created': 'Викторина успешно создана!',
            'quiz_updated': 'Викторина успешно обновлена!',
            'quiz_deleted': 'Викторина успешно удалена!',
            
            # Questions
            'questions': 'Вопросы',
            'add_question': 'Добавить вопрос',
            'edit_question': 'Редактировать вопрос',
            'delete_question': 'Удалить вопрос',
            'question_text': 'Текст вопроса',
            'question_type': 'Тип вопроса',
            'text_answer': 'Текстовый ответ',
            'single_choice': 'Один вариант',
            'multiple_choice': 'Несколько вариантов',
            'media_type': 'Тип медиа (Необязательно)',
            'media_url': 'URL медиа (Необязательно)',
            'points': 'Баллы',
            'correct': 'Правильный',
            'answers': 'Ответы',
            'add_answer': 'Добавить ответ',
            
            # Moderator
            'moderator_instructions': 'Как провести викторину',
            'select_quiz': 'Выберите викторину для начала новой игры или управления текущими играми.',
            'active_games': 'Активные игры',
            'available_quizzes': 'Доступные викторины',
            'start_game': 'Начать игру',
            'end_game': 'Завершить игру',
            'game_code': 'Код игры',
            'join_link': 'Ссылка для присоединения',
            'copy': 'Копировать',
            'copied': 'Скопировано!',
            'status': 'Статус',
            'teams': 'Команды',
            'manage_game': 'Управлять игрой',
            'question_control': 'Управление вопросами',
            'previous': 'Предыдущий',
            'next': 'Следующий',
            'current_question': 'Текущий вопрос',
            'team_responses': 'Ответы команд',
            'leaderboard': 'Таблица лидеров',
            'award_points': 'Начислить баллы',
            'question_navigator': 'Навигатор по вопросам',
            'connected_teams': 'Подключенные команды',
            'game_results': 'Результаты игры',
            
            # Participant
            'join_game': 'Присоединиться к викторине',
            'join_instructions': 'Как играть',
            'team_name': 'Название команды',
            'submit_answer': 'Отправить ответ',
            'your_answer': 'Ваш ответ',
            'answer_submitted': 'Ответ отправлен!',
            'waiting_next': 'Ожидание следующего вопроса...',
            'game_over': 'Игра окончена!',
            'final_results': 'Викторина завершена. Проверьте результаты, чтобы увидеть вашу итоговую позицию.',
            'final_position': 'Итоговая позиция',
            'final_score': 'Итоговый счет',
            'team_score': 'Счет',
            'game_info': 'Информация об игре',
            
            # Status
            'waiting': 'Ожидание',
            'active': 'Активна',
            'completed': 'Завершена',
        }
    }
    
    @staticmethod
    def get(key, lang='en'):
        """Get a translation for a key in the specified language"""
        if lang not in Translation.translations:
            lang = 'en'  # Fallback to English
        
        if key not in Translation.translations[lang]:
            # If key doesn't exist in the chosen language, try English
            if key in Translation.translations['en']:
                return Translation.translations['en'][key]
            return key  # Return the key itself as fallback
        
        return Translation.translations[lang][key]