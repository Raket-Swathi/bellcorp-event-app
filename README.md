# Bellcorp Event Management App (MERN)

A full‑stack **event management** web application built with the MERN stack where users can browse events, apply filters, register/cancel registrations, and view their personal dashboard with upcoming, past, and cancelled events.

Backend is deployed on **Render** and frontend on **Vercel**. 

---

## 1. Tech Stack

- **Frontend:** React, React Router, Axios, CSS. 
- **Backend:** Node.js, Express.js, JWT, bcrypt. 
- **Database:** MongoDB Atlas with Mongoose models. 
- **Auth:** JWT‑based authentication with protected routes.
- **Deployment:**  
  - Backend: Render Web Service. 
  - Frontend: Vercel (client subfolder). 

---

## 2. Features

### 2.1 Public (no login required)

- View **list of events** with details: name, organizer, date & time, location, category, seats. 
- **Search** events by name (case‑insensitive).
- **Filter** events by:
  - Location
  - Category
  - Date range (from – to)
- **Pagination** on events list for better browsing. 
- View **event details page** with full description and capacity information.

### 2.2 Authentication

- User **registration** with name, email, password.
- User **login** with JWT token issuance.
- Passwords stored securely using **bcrypt** hashing. 
- JWT stored client‑side and sent as `Authorization: Bearer <token>` for protected APIs.

### 2.3 Event Registration & Dashboard

- **Register** for an event (only when seats available):
  - Prevents duplicate registrations for same event+user.
  - Decrements available seats when registration succeeds.
- **Cancel registration**:
  - Only for authenticated user’s own registrations.
  - Marks registration as cancelled.
  - Increments available seats back.
- **Personal dashboard** for logged‑in user:
  - **Upcoming events** (future dated registrations).
  - **Past events** (already completed).
  - **Cancelled events**.
- Dashboard fetches data from `/api/registrations/me` and renders lists accordingly.

---

## 3. Project Structure

```text
bellcorp-event-app/
├─ server/                # Backend (Node/Express/MongoDB)
│  ├─ server.js           # Express app, routes mounting, DB connection
│  └─ package.json
│
└─ client/                # Frontend (React)
   ├─ src/
   │  ├─ pages/           # Pages: Login, Register, Events, EventDetails, Dashboard
   │  ├─ context/         # AuthContext (user & token in localStorage)
   │  ├─ App.js           # Routes configuration
   │  ├─ index.js         # React entry, BrowserRouter + AuthProvider
   │  ├─ index.css        # Global styling
   │  └─ ...
   └─ package.json
```
---
## 4. Getting Started (Local Setup)
### 4.1 Prerequisites

Node.js and npm installed.\
MongoDB Atlas account (or local MongoDB).\
Git installed.

### 4.2 Clone the repository
```
git clone https://github.com/Raket-Swathi/bellcorp-event-app.git
cd bellcorp-event-app
```
---
## 5. Backend – Setup & Scripts
### 5.1 Environment variables
#### Create a .env file inside server/:

```text
PORT=5000
MONGO_URI=<your-mongodb-atlas-connection-string>
JWT_SECRET=<your-jwt-secret>
MONGO_URI should be a valid MongoDB connection string and JWT_SECRET should be a strong random string.
```

### 5.2 Install dependencies
```
cd server
npm install
```
### 5.3 Run backend locally
```
npm run dev    
or
npm start
```
The API will run at:
http://localhost:5000
### 5.4 Main API endpoints
```
POST /api/auth/register – user registration.
POST /api/auth/login – user login, returns { user, token }.
GET /api/events – list events (supports query params for search & filters).
GET /api/events/:id – get single event details.
POST /api/registrations/:eventId – register for event (auth required).
DELETE /api/registrations/:eventId – cancel registration (auth required).
GET /api/registrations/me – get upcoming, past, cancelled events for logged‑in user.
```
---
## 6. Frontend – Setup & Scripts
### 6.1 Configure API base URL
In the frontend API calls, backend URL is set as:
```
const API_BASE = 'https://bellcorp-event-app-qij8.onrender.com/api';
```
For local development, you can switch it to:
```
const API_BASE = 'http://localhost:5000/api';
```
### 6.2 Install dependencies
```
cd client
npm install
```
### 6.3 Run frontend locally
```
npm start
```
The React app will run at: http://localhost:3000 \
The frontend will use the configured API_BASE to talk to the backend.

### 6.4 Available frontend scripts
```
From client/:
npm start       # Run development server
npm run build   # Create production build
npm test        # Run tests (if configured)
```
---
## 7. Authentication Flow
```
1. User registers or logs in via /api/auth/register or /api/auth/login.  
2. Backend returns { user, token } on success. 
3. Frontend AuthContext calls login(user, token) which: 
  Saves bellcorp_user and bellcorp_token in localStorage.
  Updates user and token in React context.
4. On app load, AuthContext reads from localStorage:
  If values exist, user stays logged in.
5. Protected requests include header:
Authorization: Bearer <JWT_TOKEN>
6. Backend JWT middleware verifies token and allows access to protected routes (registrations, dashboard data).
```
---
## 8. Deployment
### 8.1 Deploy Backend on Render
Push your project to GitHub. 

Go to Render → New → Web Service.

Connect your GitHub repo and select it.

Service configuration:

Root Directory: server

Environment: Node

Build Command: npm install

Start Command: npm start (or node server.js)

In Environment tab on Render, add:

PORT (optional, Render also sets PORT automatically)
MONGO_URI
JWT_SECRET
Deploy and wait for the URL, e.g.:
```
https://bellcorp-event-app-qij8.onrender.com
```
Test endpoints quickly in browser/Postman:
```
GET /api/events
GET /api/registrations/me (with Authorization header)
```

### 8.2 Deploy Frontend on Vercel
Push latest frontend code to GitHub (client folder updated).

Go to Vercel → Add New → Project.

Select the same GitHub repository.

In project configuration:

Root Directory: client

Framework Preset: Create React App

Build Command: npm run build

Output Directory: build

No environment variables are required (API base URL is hardcoded).

Click Deploy and wait for the build to finish.

Vercel gives you a URL like:

```
https://bellcorp-event-xxxx.vercel.app
Open that URL and test:

/events – events list with filters and pagination.

/login & /register – authentication works.

/dashboard – upcoming, past, cancelled events show correctly.
```
---
## 9. Usage Guide
Open the deployed frontend URL in a browser.

Click Register:

Enter name, email, password and submit.

You are redirected to Events page:

Browse events, use search and filters.

Click event titles to view details.

Click Register on any event to book a seat.

Open Dashboard:

Upcoming Events: future registrations, with Cancel button.

Past Events: completed events you attended.

Cancelled Events: events you cancelled.

Cancel an upcoming event from Dashboard and confirm:

It moves to Cancelled section.

Available seats for that event increase on the Events page.

---
## 10. Future Enhancements
Admin panel to create/edit/delete events. [web:22][web:26]

Event images and richer descriptions.

Role‑based access (admin vs normal users).

Export registrations as CSV or PDF.

Email / SMS notifications for registrations and cancellations.
