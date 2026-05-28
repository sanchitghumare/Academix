Stratos is a full-stack academic command center designed to streamline attendance tracking, grade calculations, and course resource management. Built using the MERN stack and Next.js, the application provides students with real-time analytics, predictive scheduling simulations, and cloud-backed asset storage.

Live Demo: sanchit05-ecru.vercel.app

🚀 Features
Secure Authentication: Protected user routing ensuring personalized dashboard data.

Live Academic Dashboard: Instantly view your next scheduled lecture based on real-time timetable tracking.

Attendance Analytics with Bunk Simulation: Track overall and subject-wise attendance percentages. Includes an interactive simulator to calculate the mathematical impact of skipping a lecture before making the decision.

Grade & SGPI Tracker: Log and analyze subject-wise grades alongside automated SGPI calculations.

Dynamic Timetable System: Centralized view of daily class line-ups and timing configurations.

Cloud-Backed Resource Repository: Upload, store, and fetch academic documents and question papers seamlessly via Cloudinary integration.

🛠️ Tech Stack
Frontend: Next.js, React.js, Tailwind CSS

Backend: Node.js, Express.js

Database: MongoDB

Cloud Storage: Cloudinary (Asset Management)

Deployment: Vercel

Installation & Setup
Follow these steps to run the project locally:

1. Clone the Repository
Bash
git clone https://github.com/YOUR_USERNAME/stratos.git
cd stratos
2. Install Dependencies
Install all project dependencies with a single command:

Bash
npm install
3. Environment Variables Setup
Create a .env.local file in the root directory of the project and configure the following keys:

Code snippet
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
4. Run the Application
Start the unified Next.js local development server:

Bash
npm run dev
Open http://localhost:3000 in your browser to view the application.
