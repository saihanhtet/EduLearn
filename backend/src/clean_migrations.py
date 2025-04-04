import os
import shutil

# ANSI escape codes for colors
RESET = '\033[0m'
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'

# Path to the base Django project directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# The database file to exclude
DB_FILE = "db.sqlite3"


def delete_migration_files():
    try:
        # Walk through all directories and subdirectories
        for root, dirs, files in os.walk(BASE_DIR):
            # Delete files in 'migrations' directories except for __init__.py
            if 'migrations' in root:
                for file in files:
                    if file != '__init__.py' and file.endswith('.py'):
                        file_path = os.path.join(root, file)
                        print(
                            f"{YELLOW}Deleting migration file: {RESET} {file_path}")
                        os.remove(file_path)
            # Check and delete __pycache__ directories
            if '__pycache__' in dirs:
                pycache_path = os.path.join(root, '__pycache__')
                print(f"{YELLOW}Deleting __pycache__ folder: {RESET} {pycache_path}")
                # Recursively delete the __pycache__ folder
                shutil.rmtree(pycache_path)
            # Delete the database from folder
            if DB_FILE in files:
                print(f"{YELLOW}Deleting database file:{RESET} {DB_FILE}")
                os.remove(DB_FILE)
    except Exception as e:
        print(f"{RED}Error encountered:{RESET} {e}")


if __name__ == "__main__":
    delete_migration_files()
    print(f"{GREEN}Migration files cleanup complete.{RESET}")
