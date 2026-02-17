# ⚽ SupaSport - Sports Lesson Management System

A comprehensive Next.js application for managing sports lessons, coaches, clients, and packages with Firebase/Firestore backend.

## Features

### Admin Dashboard
- **Overview**: View key metrics, low-balance package alerts, and recent lessons
- **Coaches Management**: Add, edit, and delete coaches with automatic Firebase Auth account creation
- **Clients Management**: Manage client information (name, email, phone)
- **Packages Management**: Create lesson packages for clients with pricing and tracking
- **Lessons Management**: View all lessons with filtering by coach and status
- **Reports**: 
  - Monthly revenue breakdown by lesson type
  - Coach performance metrics
  - Client activity and spending reports
  - Package balance alerts for renewals

### Coach Dashboard
- **Calendar View**: Interactive monthly calendar showing lessons
- **Add Lessons**: Click any day to add lessons for clients
- **Package Linking**: Automatically link lessons to client packages and decrement balance
- **Mark Complete**: Mark scheduled lessons as completed
- **Monthly Stats**: View lesson count and hours for the current month

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore + Authentication)
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

The Firebase configuration is already set in `.env.local`:
- Project: `supasport`
- All credentials are pre-configured

### 3. Create Admin Account

Before running the app, you need to create the admin account in Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select the `supasport` project
3. Navigate to **Authentication** → **Users**
4. Click **Add User**
5. Create user with:
   - **Email**: `admin@supasport.com`
   - **Password**: `SupaSport2024!` (or your preferred password)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Credentials

### Admin Login
- **Email**: `admin@supasport.com`
- **Password**: `SupaSport2024!` (or the password you set in Firebase)

### Coach Login
Coaches are created by the admin through the dashboard. The admin sets a temporary password which is shared with the coach.

## Usage Guide

### For Admin

1. **Login** with admin credentials
2. **Add Clients**: Go to Clients → Add Client
3. **Add Coaches**: Go to Coaches → Add Coach (provide name, email, and temporary password)
4. **Create Packages**: Go to Packages → Add Package
   - Select client
   - Choose lesson type
   - Set package size (number of lessons)
   - Set price per lesson
5. **View Reports**: Go to Reports to see:
   - Monthly revenue
   - Coach performance
   - Client activity
   - Low-balance package alerts

### For Coaches

1. **Login** with credentials provided by admin
2. **View Calendar**: See all your lessons on the calendar
3. **Add Lesson**: 
   - Click on any day
   - Click "Add" button
   - Select client(s)
   - Choose lesson type
   - Optionally link to a package (auto-decrements balance)
   - Set time and hours
   - Mark as completed or scheduled
4. **Mark Complete**: Click the checkmark icon on scheduled lessons

## Data Structure

### Collections in Firestore

- **coaches**: Coach profiles (id matches Firebase Auth UID)
- **clients**: Client information
- **packages**: Lesson packages with balance tracking
- **lessons**: Individual lesson records

### Lesson Types

- Private Lesson
- Group Lesson
- One-on-One Lesson
- Semi-Private Lesson
- Custom Lesson

## Key Features Explained

### Package Balance Tracking
When a lesson is linked to a package, the system automatically:
- Decrements the package balance by 1
- Updates package status to "completed" when balance reaches 0
- Shows alerts when balance is ≤ 2 lessons

### Coach Account Creation
The admin can create coach accounts without being signed out. The system uses a secondary Firebase app instance to create the coach's authentication account.

### Reports & Analytics
- Monthly revenue with breakdown by lesson type
- Coach performance (total lessons, hours, revenue generated)
- Client overview (lessons taken, packages remaining, total spent)
- Low-balance alerts for proactive client follow-up

## Responsive Design

The app is fully responsive and works on:
- Desktop (optimized layout with sidebar)
- Tablet (collapsible sidebar)
- Mobile (hamburger menu, touch-friendly calendar)

## Support

For issues or questions, contact the development team.
