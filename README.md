# UltimateWatch

Full-stack development of a web platform for tracking audiovisual content inspired by IMDb. The system integrates a REST API built with NestJS and TypeScript on the backend, a PostgreSQL database managed with TypeORM, and a frontend developed with React and Vite.

Among the most outstanding features is a group viewing event system with two modalities: standard events and events with voting for the content to be played. These events incorporate a real-time chat with role-based moderation, a playback timer synchronized among all participants via WebSockets, and a live metrics system.

The platform also includes advanced exploration and search of movies and series through integration with The Movie Database (TMDb) and Watchmode APIs, alongside a social module featuring friendships, invitations, and event access requests.

---

## Installation Manual

### Introduction
This manual details the technical steps required to replicate the development environment and perform a local deployment of UltimateWatch.

### Prerequisites
Before starting the system configuration, ensure you have the following tools installed on your development machine:
- Git: For cloning and version control of the repository.
- Node.js (LTS version recommended): Runtime environment required for both the backend (NestJS) and the frontend (React/Vite).
- PostgreSQL: Relational database management system for persistent data storage.

### Step 1: Cloning the Repository
Open a system terminal and execute the following command to download the project's source code:

```
git clone https://github.com/Ultimate88x/UltimateWatch.git
cd UltimateWatch
```

### Step 2: Database Configuration
It is necessary to initialize a database in PostgreSQL. To do this, you can access the interactive psql console or use a graphical administration tool (such as pgAdmin). The creation commands are as follows:

```
CREATE DATABASE ultimate_watch_db;
CREATE USER ultimate_watch_user WITH PASSWORD 'your_password_';
GRANT ALL PRIVILEGES ON DATABASE ultimate_watch_db TO ultimate_watch_user;
```

### Step 3: Backend Configuration and Startup
The backend is developed on the NestJS framework. The repository includes a template file containing all the necessary environment variables.

#### Dependency Installation and Environment Variables
Navigate to the corresponding directory, generate the configuration file from the provided example, and install the required Node modules:

```
cd backend-ultimatewatch
cp .env.example .env
npm install
```

#### Editing the Configuration File (.env)
Open the newly created .env file and fill in the variables with your local database credentials and third-party service keys:

```
FRONTEND_URL=http://localhost:5173/

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=ultimate_watch_user
DB_PASSWORD=your_password
DB_DATABASE=ultimate_watch_db

JWT_SECRET=your_jwt_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key_cloudinary
CLOUDINARY_API_SECRET=your_api_secret_cloudinary

SENDGRID_API_KEY=your_api_key_sendgrid
SENDGRID_FROM_EMAIL=your_verified_email@domain.com
SENDGRID_FROM_NAME=UltimateWatch

TMDB_API_KEY=your_api_key_tmdb
WATCHMODE_API_KEY=your_api_key_watchmode
```

#### Running the Service
To start the backend server in development mode (with automatic reload enabled to catch code changes), execute:

```
npm run start:dev
```

### Step 4: Frontend Configuration and Startup
The frontend is built with React and managed by Vite. Open a new terminal window and follow these steps for its configuration and startup:

```
cd frontend-ultimatewatch
npm install
npm run dev
```

Once this step is completed, the Vite development server will indicate that the web application is accessible and fully operational at the default local address: http://localhost:5173/.

---

## Simultaneous Project Execution

For the correct operation of the platform in the local environment, it is required to keep two terminals open simultaneously as follows:
- Terminal 1 (Backend API Server): Located in the backend-ultimatewatch folder, running: ```npm run start:dev```.
- Terminal 2 (Frontend SPA Client): Located in the frontend-ultimatewatch folder, running: ```npm run dev```.