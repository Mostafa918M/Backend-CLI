const app = () => `require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const { globalError, handleNotFound } = require('./middlewares/globalErrorHandler');
//import routes here

const app = express();

// Middlewares
app.use(cookieParser());
app.use(express.json());

app.use('/health', (req, res) => {
  res.status(200).send('OK');
});

// TODO: Add your routes here

app.use(handleNotFound);
app.use(globalError);

module.exports = app;
`;

const server = () => `const app = require('./app');
const chalk = require('chalk');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(chalk.bgCyan.white.bold(\`  Server is running on port \${PORT}  \`));
  logger.info(\`Server started on port \${PORT}\`);
});
`;

const logger = () => `const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, colorize } = format;

const consoleFormat = combine(
  colorize(),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  printf(({ level, message, timestamp }) => {
    return \`\${timestamp} [\${level}] : \${message}\`;
  })
);

const fileFormat = combine(
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  printf(({ level, message, timestamp }) => {
    return \`\${timestamp} [\${level}] : \${message}\`;
  })
);

const logger = createLogger({
  level: "info",
  transports: [
    new transports.Console({ format: consoleFormat }),
    new transports.File({ filename: "logs/app.log", format: fileFormat }),
    new transports.File({ filename: "logs/error.log", level: "error", format: fileFormat }),
  ],
});

module.exports = logger;
`;

const globalErrorHandler = () => `const ApiError = require("../utils/apiError");
const logger = require("../utils/logger");

/**
 * DEV: return full error details
 */
const sendErrorForDev = (err, req, res) => {
  res.status(err.statusCode || 500).json({
    status: err.status || "error",
    message: err.message,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
    meta: {
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    },
  });
};

/**
 * PROD: return safe message only
 */
const sendErrorForProd = (err, req, res) => {
  res.status(err.statusCode || 500).json({
    status: err.status || "error",
    message: err.isExpected ? err.message : "Something went wrong!",
    timestamp: new Date().toISOString(),
  });
};

/* ---------------- JWT Error Handlers ---------------- */
const handleJwtInvalidSignature = () =>
  new ApiError("Invalid token, please login again", 401);

const handleJwtExpired = () =>
  new ApiError("Your token has expired, please login again", 401);

/* ---------------- Multer Error Handler ---------------- */
const handleMulterErrors = (err) => {
  if (err.code === "LIMIT_FILE_SIZE")
    return new ApiError("File too large. Maximum size allowed is 10MB", 400);

  if (err.code === "LIMIT_FILE_COUNT")
    return new ApiError("Too many files uploaded", 400);

  if (err.code === "LIMIT_UNEXPECTED_FILE")
    return new ApiError(\`Unexpected field: \${err.field}\`, 400);

  if (err.code === "LIMIT_PART_COUNT")
    return new ApiError("Too many parts in multipart data", 400);

  if (err.message && err.message.includes("Invalid file type"))
    return new ApiError(
      "Invalid file type. Please upload a supported file format",
      400
    );

  return err;
};

/* ---------------- System Error Handler ---------------- */
const handleSystemErrors = (err) => {
  if (err.code === "ENOENT") return new ApiError("File or directory not found", 404);
  if (err.code === "EACCES") return new ApiError("Permission denied", 403);
  if (err.code === "EMFILE") return new ApiError("Too many open files", 503);
  if (err.code === "ECONNREFUSED") return new ApiError("Connection refused", 503);
  if (err.code === "ETIMEDOUT") return new ApiError("Network operation timed out", 504);
  if (err.code === "EHOSTUNREACH") return new ApiError("Host is unreachable", 503);
  return err;
};

/* ---------------- Mongo/Mongoose Error Handler ---------------- */
const handleMongoErrors = (err) => {

  if (err.name === "ValidationError" && err.errors) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return new ApiError(messages.join(". "), 400);
  }

  if (err.name === "CastError") {
    return new ApiError(\`Invalid \${err.path}: \${err.value}\`, 400);
  }

  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : "field";
    const value = err.keyValue ? err.keyValue[field] : "";
    const msg = value
      ? \`Duplicate value for \${field}: \${value}. Please use another value!\`
      : "Duplicate value. Please use another value!";
    return new ApiError(msg, 400);
  }

  if (err.name === "MongoNetworkError") {
    return new ApiError("Database connection failed", 503);
  }

  if (err.name === "MongoServerError") {
    return new ApiError("Database server error", 500);
  }

  return err;
};

/* ---------------- Global Error Middleware ---------------- */
const globalError = (err, req, res, next) => {

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  logger.error({
    name: err.name,
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    ip: req.ip,
  });

  if (process.env.NODE_ENV === "development") {
    return sendErrorForDev(err, req, res);
  }

  let error = err;

  if (error.name === "JsonWebTokenError") error = handleJwtInvalidSignature();
  if (error.name === "TokenExpiredError") error = handleJwtExpired();

  if (error.code && String(error.code).startsWith("LIMIT_")) {
    error = handleMulterErrors(error);
  }

  error = handleSystemErrors(error);
  error = handleMongoErrors(error);

  if (!error.isExpected) {
    error = new ApiError("Something went wrong!", 500);
  }

  return sendErrorForProd(error, req, res);
};

/* ---------------- 404 Handler ---------------- */
const handleNotFound = (req, res, next) => {
  next(new ApiError(\`Route \${req.originalUrl} not found\`, 404));
};

module.exports = { globalError, handleNotFound };
`;

const apiError = () => `class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = \`\${statusCode}\`.startsWith("4") ? "fail" : "error";
    this.isExpected = true;
  }
}

module.exports = ApiError;
`;

const sendResponse = () => `/**
 * Standardized response sender
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} status - "success" | "fail" | "error"
 * @param {string} message - Response message
 * @param {object} data - Response data
 */
module.exports = (res, statusCode, status, message, data = {}) => {
  res.status(statusCode).json({
    status,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};
`;

const asyncErrorHandler = () => `/**
 * Async error handler wrapper
 * Catches errors in async route handlers and passes them to error middleware
 */
module.exports = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    if (res.headersSent) return next(err);
    next(err);
  }
};
`;

const packageJson = (projectName) => `{
  "name": "${projectName}",
  "version": "1.0.0",
  "description": "Express.js API project",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "keywords": [
    "express",
    "api",
    "nodejs"
  ],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "chalk": "^4.1.2",
    "cookie-parser": "^1.4.6",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-validator": "^7.3.1",
    "winston": "^3.11.0",
    "mongoose": "^9.1.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
`;

const env = () => `# Server Configuration
PORT=3000
NODE_ENV=development

# Database (Add your database connection string)
# DATABASE_URL=mongodb://localhost:27017/myapp
# or
# DATABASE_URL=postgresql://user:password@localhost:5432/myapp

# JWT Secret (Generate a secure random string)
# JWT_SECRET=your-super-secret-jwt-key
# JWT_EXPIRES_IN=7d

# Other configurations
# Add your environment variables here
`;

const gitignore = () => `# Dependencies
node_modules/

# Environment variables
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build output
dist/
build/
`;

const readme = (projectName) => `# ${projectName}

Express.js API project generated with cname-cli.
BY MOSTAFA MAHMOUD

## 🚀 Getting Started

### Install dependencies
\`\`\`bash
npm install
\`\`\`

### Configure environment variables
Edit the \`.env\` file with your configuration.

### Run the server
\`\`\`bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
\`\`\`

## 📁 Project Structure

\`\`\`
${projectName}/
├── controllers/      # Route controllers
├── services/         # Business logic
├── routes/          # API routes
├── validators/      # Request validation
├── middlewares/     # Custom middlewares
├── utils/           # Utility functions
├── config/          # Configuration files
├── logs/            # Application logs
├── app.js           # Express app setup
├── server.js        # Server entry point
└── .env             # Environment variables
\`\`\`

## 🛠️ Generate Resources

Use the CLI to generate new resources:

\`\`\`bash
cname g resource user
\`\`\`

This will create:
- Controller with CRUD operations
- Service layer
- Routes with validation
- Validator middleware

## 📝 Available Scripts

- \`npm start\` - Start the server
- \`npm run dev\` - Start with nodemon (auto-reload)

## 🔧 Features

- ✅ Global error handling
- ✅ Request logging with Winston
- ✅ Environment-based configuration
- ✅ Standardized API responses
- ✅ Async error handling
- ✅ Health check endpoint

## 📖 API Endpoints

### Health Check
\`GET /health\` - Check if server is running

### Add your routes here
After generating resources, register them in \`app.js\`:

\`\`\`javascript
app.use('/api/users', require('./routes/user.routes'));
\`\`\`

## 🤝 Contributing

Feel free to contribute to this project!

## 📄 License

ISC
`;

module.exports = {
  app,
  server,
  logger,
  globalErrorHandler,
  apiError,
  sendResponse,
  asyncErrorHandler,
  packageJson,
  env,
  gitignore,
  readme
};