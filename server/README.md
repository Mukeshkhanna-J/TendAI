# 🚀 TendAI Express & MongoDB Backend

This is the production-ready Node.js, Express.js, and MongoDB backend for **TendAI**.

---

## 🛠️ Tech Stack
- **Node.js**: ES Modules runtime
- **Express.js**: REST API Web server
- **MongoDB & Mongoose**: Database & ODM
- **JWT & bcryptjs**: Secure authentication and password hashing
- **express-validator**: Request validation and sanitization
- **dotenv & cors & cookie-parser**: Configuration and middleware

---

## 📁 Folder Structure

```
server/
├── .env                    # Environment variables
├── .env.example            # Sample configuration template
├── package.json            # Server package metadata and scripts
├── app.js                  # Express application setup
├── server.js               # Main entry point
└── src/
    ├── config/
    │   └── db.js           # Mongoose MongoDB connection
    ├── controllers/        # Route logic handlers
    │   ├── authController.js
    │   ├── tenderController.js
    │   ├── bidController.js
    │   └── savedTenderController.js
    ├── middleware/         # Security & error handling middleware
    │   ├── authMiddleware.js
    │   ├── errorHandler.js
    │   └── validate.js
    ├── models/             # Mongoose Schemas
    │   ├── User.js
    │   ├── Tender.js
    │   └── Bid.js
    ├── routes/             # Express API routes
    │   ├── authRoutes.js
    │   ├── tenderRoutes.js
    │   ├── bidRoutes.js
    │   └── savedTenderRoutes.js
    ├── seeders/
    │   └── seed.js         # Auto DB seeder
    └── utils/
        └── generateHash.js # Mock blockchain hash generator
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` file (or copy `.env.example`):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/tendai
JWT_SECRET=tendai_super_secret_jwt_key_2026_production_v1
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3. Run Server
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

# Seed initial database records manually
npm run seed
```

### 🔑 Demo Accounts Automatically Created:
- **Admin**: `admin@tendai.gov.in` / `adminpassword123`
- **Bidder**: `bidder@tendai.gov.in` / `bidderpassword123`
