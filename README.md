---

### Backend README (`backend_readme.md`)

```markdown
# HomeServeHub (Repari) - Backend

The RESTful API backend for **HomeServeHub** (Repari), built using **Node.js**, **Express.js**, and **MongoDB**. Handles user authentication, service listings, bookings, and **Groq AI** integration for automated problem diagnostics.

---

## 🚀 Key Features

* **REST API:** Clean, modular endpoints for users, services, bookings, and AI chat.
* **Security & Auth:** JWT-based authentication with bcrypt and role-based middleware.
* **Groq AI Integration:** Backend service leveraging `@groq-sdk/sdk` for intelligent repair diagnostics.
* **Database Layer:** MongoDB with Mongoose ODM schemas.

---

## 🛠️ Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (Mongoose)
* **AI SDK:** Groq API (`@groq-sdk/sdk`)

---

## 📁 Project Structure

```text
homeservehub-backend/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── scripts/
├── .env.example
├── server.js
└── package.json
⚙️ Getting Started & How to Run
Prerequisites
Node.js (v18+)

MongoDB (Local instance or Atlas URI)

1. Clone the Repository
Bash
git clone [https://github.com/your-username/homeservehub-backend.git](https://github.com/your-username/homeservehub-backend.git)
cd homeservehub-backend
2. Install Dependencies
Bash
npm install
3. Configure Environment Variables
Create a .env file in the root directory:

Extrait de code
PORT=5000
MONGO_URI=mongodb://localhost:27017/homeservehub
JWT_SECRET=your_super_secret_jwt_key
GROQ_API_KEY=your_groq_api_key_here
NODE_ENV=development
4. Seed Initial Data (Optional)
Bash
npm run seed
5. Run the Server
Development (with hot-reloading via Nodemon):

Bash
npm run dev
Production:

Bash
npm start
Server runs on: http://localhost:5000
