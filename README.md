# Web Application for Marvel Superheroes and Marvel Comics
# Introduction
This web application offers a unique blend of functionalities catering to both superhero enthusiasts and those keeping up with new comics. It features user registration, action history tracking, and integrates APIs for Marvel superheroes and comics, as well as, REST API. Additionally, the application includes an admin panel for user account and REST API management.
#Table of Contents
ADMIN LOGIN: AdminAmir PASSWORD: 123456789
Installation
Usage
Features
Dependencies
Configuration
Documentation
Examples
Troubleshooting
Contributors
License
Installation
bash
Copy code
# Clone the repository
git clone [https://github.com/kh4mzin/full_amir.git]

# Install dependencies
[npm install]
Usage
Registration: Users can register by filling out a form with their name, email, and password.
Action History: Users can view their action history on the site.
Marvel API: Search and retrieve information on Marvel superheroes and villains.
Marvel Comics: List of Marvel comics that you mind find interesting
REST API: Allows the admin to post, update, delete the superhero list, while ordinary users might just see the list of heroes 
Features
# User Registration: 
Secure registration system with fields for name, email, and password.
# Action History Page:
Keeps track of user activities on the site.
# Marvel Superheroes API Integration: 
Fetches detailed information about Marvel characters.
# Marvel Comics:
List of Marvel comics that you mind find interesting.
# REST API: Allows the admin to post, update, delete the superhero list, while ordinary users might just see the list of heroes.
# Admin Panel:
Enables admins to manage user accounts, including adding, deleting, and granting admin privileges.
# Dependencies
axios: For making HTTP requests.
bcrypt: For hashing user passwords.
body-parser: To parse incoming request bodies.
bootstrap: For styling the frontend.
cookie-parser: To parse cookies.
ejs: For rendering HTML templates.
express: As the web application framework.
express-session: For handling user sessions.
hbs: As the view engine.
mongoose: For database modeling.
node-fetch: To make HTTP requests in Node.js.
Configuration
Configuration settings can be found and modified in the vercel.json file.

