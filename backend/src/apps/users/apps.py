from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    # add the folder name in-front of the every app create by manage.py '<folder_name>.users'
    # apps.users
    name = 'apps.users'

    # add the signals
    def ready(self):
        import apps.users.signals
