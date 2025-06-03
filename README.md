# Project Name

Welcome to [Project Name]! This project is a full-stack web application built with a React frontend and a Node.js backend, supporting Redis or ClickHouse as database options.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 18.x or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Redis](https://redis.io/) or [ClickHouse](https://clickhouse.com/) (depending on your database choice)
- [nodemon](https://nodemon.io/) (optional, for development)

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/rajatmohan22/cookie-clicker
   cd cookie-clicker
   ```

2. **Install frontend dependencies**:
   In the root directory, run:

   ```bash
   npm install
   ```

3. **Install backend dependencies**:
   Navigate to the backend directory and install dependencies:
   ```bash
   cd src/backend
   npm install
   ```

## Running the Application

1. **Start the React frontend**:
   In the root directory, run:

   ```bash
   npm run dev
   ```

   The frontend will typically be available at `http://localhost:5123`.

2. **Start the backend services**:
   In the `src/backend` directory, start the required services using Docker Compose:

   ```bash
   docker-compose up -d
   ```

   or

   ```bash
   docker-compose up
   ```

   The `-d` flag runs the containers in detached mode (in the background).

3. **Run the backend server**:
   In the `src/backend` directory, start the Node.js server with your preferred database:
   - For Redis:
     ```bash
     DB=redis node index.js
     ```
   - For ClickHouse:
     ```bash
     DB=clickhouse node index.js
     ```
   - Alternatively, use `nodemon` for automatic restarts during development:
     ```bash
     DB=redis nodemon
     ```
     or
     ```bash
     DB=clickhouse nodemon
     ```

## Project Structure

```
cookie-clicker/
├── .gitignore
├── README.md
├── index.html
├── package.json
├── public/
│   └── ...
├── src/
│   ├── backend/
│   │   ├── docker-compose.yml
│   │   ├── index.js
│   │   └── ...
│   ├── components/
│   ├── App.jsx
│   ├── main.jsx
│   └── ...
└── ...
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m 'Add your feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

This project is licensed under the [MIT License](LICENSE). See the LICENSE file for details.
