# SupaSport Setup Instructions

## Step 1: Deploy Firestore Security Rules

You need to deploy the security rules to Firebase to fix permission errors.

1. Install Firebase CLI if you haven't:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in the project (if not already done):
   ```bash
   cd /Users/ashokjaiswal/Development/Consulting/supasport
   firebase init firestore
   ```
   - Select your existing project: `supasport`
   - Use `firestore.rules` as the rules file
   - Don't overwrite the existing file

4. Deploy the security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Step 2: Create Admin Account in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select the `supasport` project
3. Navigate to **Authentication** → **Users**
4. Click **Add User**
5. Create user with:
   - **Email**: `admin@supasport.com`
   - **Password**: `SupaSport2024!` (or your preferred password)

## Step 3: Update Login Page (Optional)

The login page has been pre-filled with admin credentials for easier testing:
- Email: `admin@supasport.com`
- Password: `SupaSport2024!`

You can change these defaults in `src/app/login/page.tsx` if needed.

## Step 4: Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Troubleshooting

### Permission Errors

If you see permission errors when adding coaches or clients:
1. Make sure you've deployed the Firestore security rules (Step 1)
2. Make sure you're logged in as `admin@supasport.com`
3. Check the Firebase Console → Firestore → Rules to verify they're deployed

### No Data Showing

This is normal on first run. You need to:
1. Login as admin
2. Add clients first (Clients tab)
3. Add coaches (Coaches tab)
4. Create packages for clients (Packages tab)
5. Add lessons (Lessons tab or let coaches add them)

### Coach Creation Issues

If coaches aren't being created:
1. Check browser console for errors
2. Verify Firebase Authentication is enabled in Firebase Console
3. Make sure the admin account exists and you're logged in

## Package Types

The system now uses these package types:
- Private
- Semi-Private Group
- Custom-Private
- Custom-Semi-Private
- Custom Group

These are pre-configured in the dropdowns throughout the app.
