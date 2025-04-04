# create_app.py
import subprocess
import os


def main():
    # Prompt the user for the app name
    app_name = input("Enter the app name: ").strip()
    if not app_name:
        print("App name cannot be empty.")
        return
    # Define the path where the new app will be created
    app_path = os.path.join("apps", app_name)
    # Check if the app directory already exists
    if os.path.exists(app_path):
        print(f"App '{app_name}' already exists in '{app_path}'.")
        return
    # Create the directory if it does not exist
    os.makedirs(app_path)
    print(f"Created directory '{app_path}'")

    # Create the app in the specified directory
    command_to_run = f"python manage.py startapp {app_name} {app_path}"

    try:
        subprocess.run(command_to_run, check=True, shell=True)
        print(f"App '{app_name}' created successfully in '{app_path}'.")
    except subprocess.CalledProcessError as e:
        print(f"Error creating app: {e}")

    api_path = os.path.join('apps', app_name, 'api.py')
    api_file = open(api_path, 'w')
    api_file.write("hello = '123'")
    api_file.close()


if __name__ == "__main__":
    main()
