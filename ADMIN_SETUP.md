# Admin Dashboard Setup Guide



SUPABASE_URL="https://lyseweefepvnkawfiafw.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5c2V3ZWVmZXB2bmthd2ZpYWZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njk0NzE1NywiZXhwIjoyMDkyNTIzMTU3fQ.qlKrL0kxWxDj3taqoBKMP2282k2dfeOn3xMl_wbKljY"
VITE_SUPABASE_PROJECT_ID="lyseweefepvnkawfiafw"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5c2V3ZWVmZXB2bmthd2ZpYWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NDcxNTcsImV4cCI6MjA5MjUyMzE1N30.q9DX3JO6qffy_N79Zwjr4lrFIPg4wVWeh2S05xv8QeY"
VITE_SUPABASE_URL="https://lyseweefepvnkawfiafw.supabase.co"
ADMIN_SIGNUP_CODE="DYqzWhvC7WAVQvU"





## Quick Start for Admin Setup

### 1. **Create Admin Account**
- Navigate to `http://localhost:5080/auth`
- Click "Have an admin code? Create account"
- Enter:
  - **Email**: Your admin email
  - **Password**: At least 6 characters
  - **Admin Code**: `ADMIN123` (or change in `.env`)
- Click "Create admin account"

### 2. **Access Admin Dashboard**
- Navigate to `http://localhost:5080/admin`
- You'll see three main sections:

#### **Inquiries Tab** (Orders)
- Real-time WhatsApp order notifications
- See all customer inquiries about products
- Mark inquiries as read
- **Seed Sample Data Button** - Quickly populate the database with sample categories and products

#### **Products Tab**
- Add, edit, and manage products
- Set product visibility and stock status
- Upload product images
- Organize by category
- Set prices and descriptions

#### **Categories Tab**
- Manage product categories (Necklaces, Earrings, Rings, Bracelets)
- Set category visibility and sort order
- Edit category names and descriptions

## Admin Setup Features

### Fast Admin Account Creation
- Admin signup has been optimized with:
  - Parallel role assignment
  - Better error handling
  - Faster user creation

### One-Click Data Seeding
- Click **"Seed Sample Data"** button in the Inquiries tab
- Automatically creates:
  - 4 product categories
  - 4 sample products
  - All marked as visible and active

### Environment Configuration
Your `.env` file now includes:
```
ADMIN_SIGNUP_CODE="ADMIN123"
```

Change this code to something unique for your site:
```
ADMIN_SIGNUP_CODE="YOUR_CUSTOM_CODE_HERE"
```

## Database Operations

### Adding Categories
Use the Categories tab to add new categories or click "Seed Sample Data" for defaults.

### Adding Products
Use the Products tab to:
1. Click "Add Product"
2. Fill in product details
3. Select a category
4. Set price and stock status
5. Upload an image (or use placeholder)

### Managing Inquiries
- Real-time notifications when customers click "Order on WhatsApp"
- View product name, customer info, and timestamp
- Mark as read when handled

## Troubleshooting

### Admin signup is slow
- Check your internet connection
- Verify ADMIN_SIGNUP_CODE is set in `.env`
- Restart the development server

### Categories not showing on navbar
- Go to Admin → Categories
- Click "Seed Sample Data" in the Inquiries tab
- Or manually add categories and ensure `is_visible` is checked
- Reload the storefront

### Can't access admin dashboard
- Verify you're logged in with an admin account
- Check that your user has the `admin` role in the `user_roles` table
- Check browser console for errors
