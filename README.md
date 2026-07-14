# Mock Test Portal

Simple single-page web app to run mock tests with Firebase authentication and Firestore storage.

Features
- Student login / signup
- Home page with Start Test
- Test UI with next/previous, timer, submit
- Result page showing score and correct answers
- Admin panel to Add/Edit/Delete questions (requires `users` doc with role `admin`)
- Firestore storage for `questions` and `scores`; leaderboard

Quick start
1. Create a Firebase project and enable Email/Password auth and Firestore.
2. Copy your Firebase web config into `app.js` firebaseConfig section.
3. (Optional) Create an admin user by creating a document in `users` collection with the admin's uid and `{email:"...",role:"admin"}`.
4. Serve the folder (any static server). Example using Python:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

Firestore rules
- An example rules file is included at `firestore.rules`. Deploy with `firebase deploy --only firestore:rules`.

Deploy to Firebase Hosting
- Optional quick deploy steps:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting firestore
# update firebase.json and copy public directory to this project
firebase deploy
```

Deploy site (prepared)
- I created a `public/` folder containing the built site and added `firebase.json` and `.firebaserc`.
- To deploy to Firebase Hosting:

```bash
# 1) Install firebase tools if needed
npm install -g firebase-tools

# 2) Login and select your project (or set project id in .firebaserc)
firebase login
firebase use --add YOUR_FIREBASE_PROJECT_ID

# 3) Deploy hosting
firebase deploy --only hosting
```

After deploy, your site will be available at `https://<YOUR_FIREBASE_PROJECT_ID>.web.app` or the URL shown by `firebase deploy`.

GitHub Pages deployment

I added a GitHub Actions workflow that publishes the `public/` folder to GitHub Pages whenever you push to `main`.

To enable:

1. Commit and push the repository to GitHub (if not already):

```bash
git add .
git commit -m "Prepare site for hosting"
git push origin main
```

2. The workflow `.github/workflows/deploy-gh-pages.yml` will run on push and publish `public/` to the `gh-pages` branch.

3. After the workflow completes, enable GitHub Pages in the repository settings (or use the Pages UI). The site will be available at `https://<your-github-username>.github.io/<repo-name>/`.

Note: The action uses the automatic `GITHUB_TOKEN` so no additional secrets are required.

Notes
- This is a minimal starter. For production, add input validation, security rules in Firestore, and better UX.
# Test-Portal-
This is a free mock portal where you can solve general studies questions for competitive examination
