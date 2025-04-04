### Quick Start Guide for Django Backend Template

1. **Get the Project**

   First, download the project to your computer by cloning the repository:
   ```bash
   git clone https://github.com/saihanhtet/django-ninja-template.git
   ```

2. **Set Up Your Virtual Environment**

   Now, go into the project folder and create a virtual environment:
   ```bash
   cd django-ninja-template
   python -m venv env
   ```

3. **Activate the Virtual Environment**

   This step makes sure that any dependencies you install are kept separate from other projects.

   - **On Windows:**
     ```bash
     .\env\Scripts\activate
     ```
   - **On macOS/Linux:**
     ```bash
     source env/bin/activate
     ```

4. **Install Requirements**

   Now, install all the dependencies your project needs:
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the Project**

   Finally, let's make sure everything's working by running a few commands:
   ```bash
   rav run makemigrations
   rav run migrate
   rav run server
   ```

   Once you’ve done this, you can open your browser and go to `http://127.0.0.1:8000` to see the app in action!

---

### Using Django Management Scripts from `rav.yml`

Here are a few quick commands from `rav.yml` to manage your project, all under `rav run <script_name>`:

- **`server`**: Launches the development server (on port 8080).
- **`makemigrations`**: Creates migration files for any changes in your models.
- **`migrate`**: Applies those migrations to your database.
- **`shell`**: Opens an interactive Django shell to work with your database.
- **`createsuperuser`**: Prompts you to set up an admin user for the app.
- **`clean`**: Runs `clean_migrations.py` to tidy up old migration files.
- **`createapp`**: Runs `create_app.py`, a script to help you create new apps in the project.

### API Requests with `curl`

These commands let you interact with your API directly:

- **`curl_auth`**: Gets a JWT token by sending a POST request with email and password:
  ```bash
  curl -X POST -H "Content-Type: application/json" -d "{\"email\": \"testuser@gmail.com\", \"password\": \"testuser123\"}" http://127.0.0.1:8080/api/token/pair
  ```

- **`curl_protect`**: Accesses a protected endpoint with an Authorization Bearer token. Replace `<curl_auth-access-token>` with the token from `curl_auth`.
  ```bash
  curl -X GET -H "Authorization: Bearer <curl_auth-access-token>" http://127.0.0.1:8080/api/me
  ```


Python 3.10.16
