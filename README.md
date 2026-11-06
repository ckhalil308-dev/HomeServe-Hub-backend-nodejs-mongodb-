# HomeServeHub (Repari) - Frontend

The official frontend repository for **HomeServeHub** (Repari), connecting clients with certified home service professionals. Built with **React** and **Tailwind CSS**, featuring client-provider workflows and Groq AI diagnostics integration.

---

## 🚀 Key Features

* **Authentication:** Secure login/signup with role-based routing (Client vs. Provider).
* **Service Marketplace:** Browse, filter, and search home service categories.
* **AI Diagnostic Assistant:** Chat interface powered by backend Groq AI integration.
* **Booking & Scheduling:** Real-time appointment management and status tracking.

---

## 🛠️ Tech Stack

* **Framework:** React.js (Vite)
* **Styling:** Tailwind CSS
* **Routing:** React Router
* **HTTP Client:** Axios

---

## 📁 Project Structure

```text
homeservehub-frontend/
├── public/
├── src/
│   ├── components/
│   ├── context/
│   ├── pages/
│   ├── services/
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── package.json
└── README.md
⚙️ Getting Started & How to Run
Prerequisites
Make sure you have Node.js (v18+) and npm installed.

1. Clone the Repository
Bash
git clone [https://github.com/your-username/homeservehub-frontend.git](https://github.com/your-username/homeservehub-frontend.git)
cd homeservehub-frontend
2. Install Dependencies
Bash
npm install
3. Configure Environment Variables
Create a .env file in the root directory:

Extrait de code
VITE_API_BASE_URL=http://localhost:5000/api
4. Run the Development Server
Bash
npm run dev
Access the app at: http://localhost:5173

📦 Build for Production
Bash
npm run build
