# RecipeHub Server

Express.js + MongoDB REST API backend for RecipeHub.

## Setup

```bash
npm install
cp .env.example .env
# Fill in your .env values
npm run dev
```

## Environment Variables

```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret
STRIPE_SECRET_KEY=sk_test_...
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/google
- POST /api/auth/logout
- GET  /api/auth/me
- GET  /api/auth/verify

### Recipes
- GET    /api/recipes
- GET    /api/recipes/featured
- GET    /api/recipes/popular
- GET    /api/recipes/:id
- POST   /api/recipes
- PUT    /api/recipes/:id
- DELETE /api/recipes/:id
- PATCH  /api/recipes/:id/like
- GET    /api/recipes/user/mine

### Users
- PUT /api/users/profile
- GET /api/users/stats

### Favorites
- GET    /api/favorites
- POST   /api/favorites
- DELETE /api/favorites/:recipeId
- GET    /api/favorites/check/:recipeId

### Payments
- POST /api/payments/create-payment-intent
- POST /api/payments/confirm
- GET  /api/payments/my-payments
- GET  /api/payments/purchased-recipes

### Reports
- POST /api/reports

### Admin
- GET   /api/admin/stats
- GET   /api/admin/users
- PATCH /api/admin/users/:id/block
- GET   /api/admin/recipes
- PATCH /api/admin/recipes/:id/feature
- DELETE /api/admin/recipes/:id
- GET   /api/admin/reports
- PATCH /api/admin/reports/:id/dismiss
- PATCH /api/admin/reports/:id/remove-recipe
- GET   /api/admin/transactions