# REPREZENTATIVE - Complete Project Scope of Work

## 🎯 Project Overview

**Project Name:** Reprezentative E-Commerce Platform  
**Tech Stack:** Next.js 14+, TypeScript, PostgreSQL, Prisma, Tailwind CSS  
**AI Provider:** DeepSeek API (NOT OpenAI)  
**Timeline:** 4-6 weeks for full implementation  

---

## ⚠️ CRITICAL REQUIREMENTS

### ABSOLUTE RULES - NO EXCEPTIONS

1. **ZERO HARDCODED DATA**
   - Every single piece of content must come from the database
   - No mock arrays, no placeholder text, no example products
   - All data retrieved via API routes with Prisma queries
   - If you hardcode ANY data, the entire build is rejected

2. **ZERO MOCK DATA**
   - No fake product listings in components
   - No example users or orders in code
   - Everything must be database-driven
   - Use database seeding scripts for initial data, not hardcoded values

3. **DeepSeek API Integration**
   - All AI features use DeepSeek API (https://api.deepseek.com)
   - NOT OpenAI, NOT Claude, NOT any other AI provider
   - Model: `deepseek-chat` for text generation
   - Implement proper error handling and rate limiting

4. **Content Management**
   - Admin dashboard Content Manager must control 100% of website content
   - Every text, image, video URL, button text visible on website must be editable
   - No exceptions - if it appears on website, admin can edit it

---

## 📋 WEBSITE PAGES (Public-Facing)

### 1. Homepage (`01-homepage.html` → Next.js Page)

**Purpose:** Main landing page showcasing brand and driving conversions

**Sections to Build:**

#### Navigation Bar
- **Fetches From:** `/api/content/navigation`
- **Database:** `Content` table, key: `navigation`
- **Admin Control:** Content Manager → Navigation section
- **Fields:**
  - Logo text (editable)
  - Menu items (array: label, link)
  - Cart count (from `/api/cart/count`)

#### Hero Section
- **Fetches From:** `/api/content/hero`
- **Database:** `Content` table, key: `hero`
- **Admin Control:** Content Manager → Hero Section
- **Fields:**
  - Video URL (AWS S3 or external)
  - Headline text
  - Subheadline text
  - CTA button text
  - CTA button link

#### Featured Split Section
- **Fetches From:** `/api/content/featured-split`
- **Database:** `Content` table, key: `featured_split`
- **Admin Control:** Content Manager → Featured Split
- **Fields:**
  - Featured image URL
  - Heading text
  - Body paragraph
  - CTA link text
  - CTA destination

#### Full Width Banner
- **Fetches From:** `/api/content/banner`
- **Database:** `Content` table, key: `full_width_banner`
- **Admin Control:** Content Manager → Banner Section
- **Fields:**
  - Banner image URL
  - Overlay heading
  - CTA button text
  - CTA button link

#### Three Column Grid
- **Fetches From:** `/api/content/columns`
- **Database:** `Content` table, key: `three_columns`
- **Admin Control:** Content Manager → Column Grid
- **Fields:** Array of 3 objects, each with:
  - Image URL
  - Title
  - Subtitle
  - Link destination

#### Editorial Section
- **Fetches From:** `/api/content/editorial`
- **Database:** `Content` table, key: `editorial`
- **Admin Control:** Content Manager → Editorial
- **Fields:**
  - Heading
  - Paragraph 1
  - Paragraph 2
  - CTA text

#### Newsletter Section
- **Fetches From:** `/api/content/newsletter`
- **Database:** `Content` table, key: `newsletter_section`
- **Admin Control:** Content Manager → Newsletter
- **Fields:**
  - Heading
  - Subheading
  - Button text
- **Submission:** Posts to `/api/newsletter/subscribe`
  - Saves email to `Newsletter` table
  - Returns success/error response

#### Footer
- **Fetches From:** `/api/content/footer`
- **Database:** `Content` table, key: `footer`
- **Admin Control:** Content Manager → Footer
- **Fields:**
  - Company description
  - 4 column arrays (Shop, Customer Care, Company, etc.)
  - Copyright text
  - Social media links

**Technical Requirements:**
- Server-side rendering (SSR) for SEO
- Image optimization with Next.js Image component
- Lazy loading for below-the-fold content
- Mobile responsive breakpoints at 768px, 1024px
- Video must autoplay, muted, loop
- All content fetched on server before page renders

---

### 2. Shop/Collection Page (`03-shop-page.html` → Next.js Page)

**Purpose:** Product listing with filtering and sorting

**Data Sources:**

#### Products Grid
- **Fetches From:** `/api/products`
- **Query Parameters:**
  - `category` (string)
  - `colors` (array)
  - `sizes` (array)
  - `minPrice` (number)
  - `maxPrice` (number)
  - `sort` (featured | price-asc | price-desc | newest)
  - `page` (number)
  - `limit` (number, default 12)
- **Database:** `Product` table
- **Returns:** Array of products with:
  - id, slug, name, price
  - Primary image URL
  - Available colors
  - Available sizes
  - inStock status
  - isNew flag

#### Filter Options
- **Fetches From:** `/api/products/filters`
- **Database:** Aggregates from `Product` table
- **Returns:**
  - Available categories (distinct)
  - Available colors (distinct)
  - Available sizes (distinct)
  - Price range (min/max)

**Features:**
- Real-time filtering (updates URL params)
- Product count updates as filters change
- Pagination (12 products per page)
- Hover effects on products
- Click product card → navigate to product detail page
- Badges for "NEW" and "SOLD OUT"
- No products? Show "No products found" message

**Technical Requirements:**
- Client-side filtering with debounced API calls
- URL state management (filters persist on refresh)
- Loading states during fetch
- Error handling with user-friendly messages
- Infinite scroll OR traditional pagination

---

### 3. Product Detail Page (`02-product-detail.html` → Next.js Dynamic Route)

**Purpose:** Single product view with purchase functionality

**Route:** `/product/[slug]`

**Data Sources:**

#### Product Data
- **Fetches From:** `/api/products/[slug]`
- **Database:** `Product` table joined with `Review` table
- **Returns:**
  - Full product details (name, description, price, sku, material, fit, category)
  - Image gallery (array of URLs from AWS S3)
  - Available colors (JSON array)
  - Available sizes (JSON array with stock count per size)
  - SEO fields (metaTitle, metaDescription)

#### Product Reviews
- **Fetches From:** `/api/reviews?productId=[id]`
- **Database:** `Review` table joined with `User` table
- **Returns:** Array of reviews with:
  - Reviewer name
  - Rating (1-5)
  - Comment
  - Date
  - Verified purchase badge
- **Sorts By:** Most recent first

#### Related Products
- **Fetches From:** `/api/products/related?productId=[id]&category=[category]`
- **Database:** `Product` table
- **Returns:** 4 products from same category, excluding current product

**Features:**
- Image gallery with thumbnail navigation
- Color selection (updates main image, shows availability)
- Size selection (shows stock per size, disables if out of stock)
- Quantity selector (min: 1, max: stock available)
- Add to Cart button
  - Disabled until size selected
  - Posts to `/api/cart/add` with userId, productId, size, color, quantity
  - Shows success notification
  - Updates cart count in navbar
- Add to Wishlist button (heart icon)
  - Posts to `/api/wishlist/add`
  - Toggles filled/outlined state
- Product features section (free shipping, warranty, returns)
- Product details accordion (material, fit, care instructions)
- Reviews section (paginated if > 10 reviews)

**Technical Requirements:**
- Dynamic route with slug validation
- 404 page if product not found
- Image zoom on hover/click
- Schema.org Product markup for SEO
- Share buttons (copy link, social media)
- Breadcrumbs (Home > Shop > Category > Product Name)

---

### 4. Shopping Cart Page (`04-cart.html` → Next.js Page)

**Purpose:** Review items before checkout

**Data Sources:**

#### Cart Items
- **Fetches From:** `/api/cart`
- **Database:** `CartItem` table joined with `Product` table
- **Requires:** User session (NextAuth)
- **Returns:** Array of cart items with:
  - Product details (name, image, price)
  - Selected size and color
  - Quantity
  - Subtotal per item
  - Stock availability (real-time check)

#### Cart Summary
- **Calculated From:** Cart items
- **Fields:**
  - Subtotal (sum of all items)
  - Shipping (FREE if > $150, else $15)
  - Tax (calculated via TaxJar API based on user location)
  - Discount (if coupon applied)
  - Total

**Features:**
- Update quantity per item
  - Posts to `/api/cart/update` with cartItemId, quantity
  - Real-time validation (can't exceed stock)
  - Updates subtotal immediately
- Remove item from cart
  - Posts to `/api/cart/remove` with cartItemId
  - Soft delete or hard delete (your choice)
- Coupon code input
  - Posts to `/api/cart/apply-coupon` with code
  - Validates against `Coupon` table (active, not expired, usage count)
  - Applies discount (percentage or fixed)
  - Shows error if invalid
- Free shipping progress bar
  - "Add $XX more for free shipping"
  - Updates as cart changes
- Continue shopping link → back to shop page
- Proceed to checkout button → `/checkout`
- Empty cart state
  - "Your cart is empty"
  - CTA to shop page

**Technical Requirements:**
- Protected route (requires authentication)
- Real-time stock validation
- Optimistic UI updates (immediate feedback, rollback on error)
- Cart persists in database (not localStorage)
- Auto-remove out of stock items with notification

---

### 5. Checkout Page (NEW - Not in HTML files, must build)

**Purpose:** Payment and order completion

**Route:** `/checkout`

**Data Sources:**

#### Cart Summary
- **Fetches From:** `/api/cart`
- **Shows:** Read-only order summary

#### User Addresses
- **Fetches From:** `/api/user/addresses`
- **Database:** `Address` table
- **Returns:** User's saved addresses
- **Features:** Select existing or add new address

#### Payment
- **Integration:** Stripe Payment Element
- **API Route:** `/api/checkout/create-intent`
- **Process:**
  1. Frontend calls `/api/checkout/create-intent` with cart total
  2. Backend creates Stripe PaymentIntent
  3. Returns clientSecret to frontend
  4. Frontend displays Stripe Payment Element
  5. User enters card details (handled by Stripe)
  6. Frontend confirms payment with Stripe
  7. On success, frontend calls `/api/checkout/confirm`

#### Order Confirmation
- **Endpoint:** `/api/checkout/confirm`
- **Process:**
  1. Verify payment succeeded with Stripe
  2. Create `Order` record in database
  3. Create `OrderItem` records for each cart item
  4. Update product stock quantities
  5. Clear user's cart
  6. Send order confirmation email (SendGrid)
  7. Return order ID and redirect to order confirmation page

**Form Sections:**
1. Shipping Information
   - Name, email, phone
   - Address (street, city, state, zip, country)
   - Save address checkbox
2. Shipping Method
   - Standard (5-7 days) - FREE
   - Express (2-3 days) - $15
3. Billing Address
   - "Same as shipping" checkbox
   - Or separate billing address
4. Payment
   - Stripe Payment Element (card, Apple Pay, Google Pay)
   - Cardholder name

**Features:**
- Address validation via SmartyStreets API
- Tax calculation via TaxJar API (updates when address changes)
- Order summary shows final prices
- Terms and conditions checkbox (required)
- Place Order button (disabled until all valid)
- Loading state during payment processing
- Error handling (payment declined, API errors)

**Technical Requirements:**
- Protected route
- Multi-step form OR single page
- Form validation (Zod schema)
- Stripe PCI compliance
- 3D Secure support
- Mobile-optimized payment flow
- Redirect to order confirmation page on success
- Email confirmation sent automatically

---

## 👤 USER DASHBOARD PAGES

### 6. User Dashboard - Orders (`05-user-dashboard.html` → Next.js Page)

**Purpose:** Customer account management

**Route:** `/account/orders` (default landing)

**Protected:** Requires authentication via NextAuth

**Navigation Sections:**
1. Orders (default)
2. Wishlist
3. Profile
4. Addresses
5. Payment Methods
6. Settings

---

#### Orders Tab

**Fetches From:** `/api/user/orders`

**Database:** `Order` table joined with `OrderItem` and `Product` tables

**Returns:** Array of orders with:
- Order number
- Date
- Status (processing, shipped, delivered, cancelled)
- Items (product name, image, size, color, quantity)
- Subtotal, shipping, tax, total
- Tracking number (if shipped)
- Estimated delivery date

**Features:**
- Order list sorted by date (newest first)
- Status badges with icons
- Click order → expand details
- Track Order button (opens tracking page if shipped)
- Reorder button (adds all items back to cart)
- Request Return button (if within 30 days, delivered status)
- Download Invoice button (generates PDF)
- Filter orders by status
- Search orders by order number or product name

---

#### Wishlist Tab

**Fetches From:** `/api/user/wishlist`

**Database:** `WishlistItem` table joined with `Product` table

**Returns:** Array of wishlist items with:
- Product details (name, image, price, colors, sizes)
- Date added
- In stock status
- Price change notification (if price dropped since added)

**Features:**
- Grid view of wishlist items
- Click item → go to product detail page
- Add to Cart button (shows size/color selector modal)
- Remove from Wishlist button
- Move to Cart button
- Share Wishlist button (generates shareable link)
- Email me when back in stock (if out of stock)
- Price drop alerts checkbox

---

#### Profile Tab

**Fetches From:** `/api/user/profile`

**Database:** `User` table

**Shows:**
- Profile photo (upload to AWS S3)
- Full name
- Email
- Phone number
- Date of birth (optional)
- Gender (optional)
- Account created date

**Features:**
- Edit profile form
  - Posts to `/api/user/profile/update`
  - Validates all fields
  - Shows success notification
- Change password
  - Current password
  - New password
  - Confirm password
  - Posts to `/api/user/password/change`
- Email preferences
  - Marketing emails checkbox
  - Order updates checkbox
  - New arrivals notifications
- Delete account button
  - Requires password confirmation
  - Shows warning modal
  - Posts to `/api/user/delete`

---

#### Addresses Tab

**Fetches From:** `/api/user/addresses`

**Database:** `Address` table

**Returns:** Array of saved addresses with:
- Label (Home, Work, etc.)
- Full address
- Phone number
- Default address flag

**Features:**
- List of saved addresses
- Set default button
- Edit address button (opens modal)
- Delete address button (confirmation required)
- Add new address button
  - Form with all address fields
  - Address validation via SmartyStreets
  - Posts to `/api/user/addresses/add`

---

#### Payment Methods Tab

**Fetches From:** `/api/user/payment-methods`

**Integration:** Stripe Customer Portal

**Shows:**
- Saved payment methods from Stripe
- Last 4 digits, brand, expiry
- Default payment method flag

**Features:**
- Add payment method button
  - Opens Stripe Elements modal
  - Saves to Stripe, links to customer
- Remove payment method button
- Set default button
- All handled via Stripe API

---

#### Settings Tab

**Preferences:**
- Language (English, Spanish, etc.)
- Currency (USD, EUR, etc.)
- Timezone
- Notifications settings
- Privacy settings
  - Profile visibility
  - Order history visibility
- Two-factor authentication
  - Enable/disable 2FA
  - SMS or authenticator app

**Posts To:** `/api/user/settings/update`

---

## 🔐 ADMIN DASHBOARD PAGES

### 7. Admin Dashboard (`06-admin-dashboard.html` → Next.js Pages)

**Purpose:** Complete business management system

**Route:** `/admin` (protected by role check)

**Access Control:**
- Only users with role: `ADMIN` can access
- Middleware checks on every admin route
- Redirect to login if not authenticated
- Redirect to homepage if not admin

---

#### Dashboard Overview (Default Landing)

**Route:** `/admin/dashboard`

**Fetches From:** `/api/admin/dashboard/stats`

**Stats Cards:**
1. **Total Revenue**
   - Query: `SELECT SUM(total) FROM Order WHERE status != 'cancelled'`
   - Month-over-month comparison
   - Sparkline chart (7 days)

2. **Total Orders**
   - Query: `SELECT COUNT(*) FROM Order`
   - Month-over-month comparison
   - Status breakdown (processing, shipped, delivered)

3. **Total Customers**
   - Query: `SELECT COUNT(*) FROM User WHERE role = 'CUSTOMER'`
   - New customers this month
   - Growth percentage

4. **Conversion Rate**
   - Query: (Orders / Sessions) * 100
   - Requires Google Analytics integration OR
   - Track sessions in database
   - Month-over-month comparison

**Charts:**
1. **Revenue Trend (7 Days)**
   - Bar chart or line chart
   - Daily revenue for last 7 days
   - Hover shows exact amount

2. **Top Products**
   - List of top 5 products by revenue
   - Product name, units sold, total revenue
   - Link to product edit page

3. **Recent Orders**
   - Last 10 orders
   - Order number, customer, total, status
   - Quick actions (view, update status)

**DeepSeek AI Insights:**

**Fetches From:** `/api/admin/ai/insights`

**Process:**
1. Backend aggregates business data:
   - Sales trends (last 30 days)
   - Inventory levels
   - Customer behavior (abandoned carts, repeat customers)
   - Product performance
2. Sends data to DeepSeek API with prompt:
   ```
   Analyze this e-commerce data and provide 3-5 actionable insights.
   Focus on: sales optimization, inventory management, customer retention.
   Data: {JSON data}
   ```
3. DeepSeek returns insights
4. Display as alert cards with icons:
   - Red: Urgent (low stock, revenue drop)
   - Yellow: Warning (underperforming products)
   - Green: Opportunity (upsell suggestions, trending items)

**Example Insights:**
- "⚠️ Heritage Hoodie (Charcoal) predicted to sell out in 3 days based on current sales velocity"
- "💡 Customers who buy Heritage Hoodie also buy Essential Hoodie 67% of the time. Create a bundle discount."
- "📉 Conversion rate dropped 15% this week. Consider optimizing product images or running a promotion."

---

#### Content Manager

**Route:** `/admin/content`

**Purpose:** Edit ALL website content - must mirror every section of the website

**CRITICAL REQUIREMENT:** Every piece of text, image URL, video URL, button text, link visible on the public website MUST be editable here. No exceptions.

**Content Sections:**

##### Navigation
- **Database:** `Content` table, key: `navigation`
- **Fields:**
  - Logo text (input)
  - Menu items (array, add/remove/reorder)
    - Each item: label, link

##### Hero Section
- **Database:** `Content` table, key: `hero`
- **Fields:**
  - Video URL (input with upload button → AWS S3)
  - Headline (textarea)
  - Subheadline (textarea)
  - CTA button text (input)
  - CTA button link (input)
- **Preview:** Live preview of hero section
- **Save Button:** Posts to `/api/admin/content/update`

##### Featured Split Section
- **Database:** `Content` table, key: `featured_split`
- **Fields:**
  - Image URL (upload → AWS S3)
  - Heading (input)
  - Body text (textarea)
  - CTA text (input)
  - CTA link (input)

##### Full Width Banner
- **Database:** `Content` table, key: `full_width_banner`
- **Fields:**
  - Banner image URL (upload → AWS S3)
  - Overlay heading (textarea)
  - CTA button text (input)
  - CTA button link (input)

##### Three Column Grid
- **Database:** `Content` table, key: `three_columns`
- **Fields:** Array of 3 objects
  - Column 1:
    - Image URL (upload → AWS S3)
    - Title (input)
    - Subtitle (input)
    - Link (input)
  - Column 2: (same fields)
  - Column 3: (same fields)

##### Editorial Section
- **Database:** `Content` table, key: `editorial`
- **Fields:**
  - Heading (input)
  - Paragraph 1 (textarea)
  - Paragraph 2 (textarea)
  - CTA text (input)
  - CTA link (input)

##### Newsletter Section
- **Database:** `Content` table, key: `newsletter_section`
- **Fields:**
  - Heading (input)
  - Subheading (input)
  - Button text (input)

##### Footer
- **Database:** `Content` table, key: `footer`
- **Fields:**
  - Company description (textarea)
  - Column 1 heading (input)
  - Column 1 links (array: label, URL)
  - Column 2 heading (input)
  - Column 2 links (array: label, URL)
  - Column 3 heading (input)
  - Column 3 links (array: label, URL)
  - Column 4 heading (input)
  - Column 4 links (array: label, URL)
  - Copyright text (input)
  - Social media links (array: platform, URL)

**Features:**
- Tabbed interface (one tab per section)
- Live preview mode (opens website in iframe, highlights edited section)
- Bulk save (save all changes at once)
- Revision history (track changes, revert to previous versions)
- Publish/Draft status
- DeepSeek AI "Optimize Content" button:
  - Sends section content to DeepSeek
  - Asks for SEO optimization, better copywriting
  - Shows suggestions, admin can accept/reject

---

#### Product Management

**Route:** `/admin/products`

**Fetches From:** `/api/admin/products`

**Features:**

**Product List View:**
- Table showing all products
- Columns: Image, Name, SKU, Price, Stock, Status, Actions
- Sortable columns
- Search by name or SKU
- Filter by category, stock status
- Pagination (50 per page)
- Bulk actions (delete, update status, export CSV)

**Add New Product:**
- **Route:** `/admin/products/new`
- **Form Fields:**
  - Name (required)
  - Slug (auto-generated, editable)
  - Description (rich text editor)
  - Price (number, required)
  - Compare at price (optional, for sale pricing)
  - SKU (required, unique)
  - Material (text, e.g., "300+ GSM Cotton Blend")
  - Fit (select: Regular, Oversized, Slim)
  - Category (select from database categories)
  - Images (multiple upload → AWS S3, drag to reorder)
  - Colors (array: color name, hex code, available)
  - Sizes (array: size name, stock count per size)
  - Featured (checkbox)
  - New Arrival (checkbox)
  - SEO Fields:
    - Meta title
    - Meta description
    - Keywords (tags)
- **DeepSeek AI Integration:**
  - "Generate Description" button
    - Sends product name, material, fit to DeepSeek
    - Prompt: "Write a compelling product description for this premium hoodie. Keep it under 200 words, highlight quality and craftsmanship."
    - Inserts AI-generated text into description field
  - "Generate SEO Meta" button
    - Generates meta title and description
  - "Suggest Keywords" button
    - Generates relevant SEO keywords
- **Save Button:** Posts to `/api/admin/products/create`
- **Success:** Redirects to product list with success notification

**Edit Product:**
- **Route:** `/admin/products/[id]/edit`
- Same form as Add New Product, pre-filled with existing data
- **Save Button:** Posts to `/api/admin/products/[id]/update`
- **Delete Button:** Confirmation modal, soft delete (sets status to inactive)

---

#### Inventory Manager (NEW - REQUIRED)

**Route:** `/admin/inventory`

**Purpose:** Manage product stock across all sizes and colors

**Fetches From:** `/api/admin/inventory`

**Features:**

**Inventory Overview:**
- Table showing all product variants
- Columns: Product Name, Color, Size, Current Stock, Reserved (in carts), Available, Status, Actions
- Color-coded alerts:
  - Red: Out of stock (0)
  - Yellow: Low stock (< 10)
  - Green: In stock (≥ 10)
- Search by product name, SKU, or color
- Filter by:
  - Stock status (all, in stock, low stock, out of stock)
  - Category
  - Size
- Sortable by stock level
- Export to CSV

**Bulk Stock Update:**
- Select multiple variants (checkboxes)
- Bulk actions:
  - Add stock (input quantity, applies to all selected)
  - Reduce stock
  - Set stock to specific number
  - Mark as discontinued (hides from website)
- Posts to `/api/admin/inventory/bulk-update`

**Individual Variant Edit:**
- Click "Edit" on any row
- Modal opens with:
  - Product info (read-only)
  - Color and size (read-only)
  - Current stock (editable number input)
  - Reserved count (read-only, from active carts)
  - Available stock (calculated: current - reserved)
  - Restock alert threshold (input, sends alert when stock drops below)
  - Save button
- Posts to `/api/admin/inventory/update-variant`

**Stock History Log:**
- Shows all stock changes for a product
- Columns: Date, User, Action (added, reduced, adjusted), Quantity Changed, Reason, New Stock
- Useful for auditing
- Exports to CSV

**Restock Alerts:**
- List of products below restock threshold
- Email notification sent to admin when triggered
- Click product → quick add stock form

**DeepSeek AI Inventory Insights:**

**Endpoint:** `/api/admin/ai/inventory-insights`

**Process:**
1. Backend queries:
   - Current stock levels per variant
   - Sales velocity (units sold per day, last 30 days)
   - Seasonal trends (sales by month, last 12 months)
2. Sends data to DeepSeek API:
   ```
   Analyze this inventory data and provide restocking recommendations.
   For each product at risk of stockout, calculate:
   - Days until stockout (current stock / average daily sales)
   - Recommended restock quantity (consider seasonal trends)
   Data: {JSON data}
   ```
3. Display AI recommendations:
   - "Heritage Hoodie (Charcoal, L) will stock out in 3 days at current sales rate. Recommend restocking 50 units."
   - "Essential Hoodie sales increase 45% in November historically. Consider increasing stock by 30% before month end."

**Posts To:** `/api/admin/inventory/create-purchase-order` (optional feature)
- Generates purchase order PDF with recommended quantities
- Can email to supplier

---

#### Order Management

**Route:** `/admin/orders`

**Fetches From:** `/api/admin/orders`

**Features:**

**Orders List:**
- Table view of all orders
- Columns: Order #, Date, Customer, Items, Total, Status, Actions
- Filters:
  - Status (all, pending, processing, shipped, delivered, cancelled, refunded)
  - Date range picker
  - Payment method
  - Shipping method
- Search by order number, customer email, or product name
- Sortable columns
- Export orders to CSV

**Order Details View:**
- **Route:** `/admin/orders/[id]`
- **Order Information:**
  - Order number, date, status
  - Customer info (name, email, phone, link to customer profile)
  - Shipping address
  - Billing address
  - Payment method (last 4 digits, Stripe payment ID)
  - Shipping method
- **Order Items:**
  - Product name, image, SKU, size, color, quantity, price, subtotal
- **Order Totals:**
  - Subtotal, shipping, tax, discount, total
- **Order Timeline:**
  - Order placed (timestamp)
  - Payment confirmed (timestamp)
  - Order processed (timestamp)
  - Shipped (timestamp, tracking number)
  - Delivered (timestamp)
- **Actions:**
  - Update Status dropdown:
    - Posts to `/api/admin/orders/[id]/update-status`
    - Options: Processing, Shipped, Delivered, Cancelled, Refunded
    - If Shipped: requires tracking number input
    - Triggers email notification to customer
  - Add Tracking Number button
    - Input field, carrier select (USPS, UPS, FedEx, DHL)
    - Posts to `/api/admin/orders/[id]/add-tracking`
    - Sends tracking email to customer
  - Refund Order button
    - Confirmation modal
    - Select full or partial refund
    - Reason input
    - Processes refund via Stripe API
    - Updates order status
    - Sends refund confirmation email
  - Print Invoice button (generates PDF)
  - Print Packing Slip button (generates PDF)
  - Resend Confirmation Email button

---

#### Customer Management

**Route:** `/admin/customers`

**Fetches From:** `/api/admin/customers`

**Features:**

**Customer List:**
- Table view of all customers
- Columns: Name, Email, Orders, Total Spent, Last Order, Status, Actions
- Search by name or email
- Filter by:
  - Registration date
  - Order count (no orders, 1-5, 6-10, 11+)
  - Total spent
  - Status (active, inactive)
- Sort by orders, total spent, last order date
- Export to CSV

**Customer Segments (DeepSeek AI):**

**Endpoint:** `/api/admin/ai/customer-segments`

**Process:**
1. Backend queries all customers with:
   - Order history
   - Total spent
   - Average order value
   - Last order date
   - Product preferences
2. Sends to DeepSeek API:
   ```
   Segment these customers into actionable groups for marketing campaigns.
   Suggest segments like: VIP, At-Risk, New, Frequent Buyers, etc.
   For each segment, provide: criteria, size, and recommended action.
   Data: {JSON data}
   ```
3. Display segments with:
   - Segment name
   - Customer count
   - Criteria (e.g., "Spent $500+, ordered 3+ times")
   - Recommended action (e.g., "Send exclusive VIP early access")
   - View customers button (opens filtered list)

**Customer Detail View:**
- **Route:** `/admin/customers/[id]`
- **Customer Info:**
  - Profile photo
  - Name, email, phone
  - Registration date
  - Total orders
  - Total spent
  - Average order value
  - Last order date
- **Order History:**
  - List of all orders with details
- **Lifetime Value Chart:**
  - Line chart showing cumulative spending over time
- **Product Preferences:**
  - Most ordered products
  - Favorite categories
  - Preferred sizes/colors
- **Actions:**
  - Send Email button (opens email modal with templates)
  - Add Note button (internal notes about customer)
  - Ban User button (disables account)

---

#### Analytics Dashboard

**Route:** `/admin/analytics`

**Purpose:** Business intelligence and reporting

**Fetches From:** `/api/admin/analytics`

**Sections:**

**Sales Analytics:**
- Revenue over time (line chart: daily, weekly, monthly view toggle)
- Orders over time (line chart)
- Average order value trend
- Best selling products (bar chart)
- Revenue by category (pie chart)
- Revenue by traffic source (if Google Analytics integrated)
- Date range selector (last 7 days, 30 days, 90 days, year, custom)

**Product Analytics:**
- Product performance table:
  - Product name, units sold, revenue, profit margin, views, conversion rate
- Top products by revenue
- Top products by units sold
- Products with most views but low conversions (optimization opportunities)
- Products with highest return rate

**Customer Analytics:**
- New customers over time (line chart)
- Returning customer rate
- Customer lifetime value distribution
- Customer acquisition cost (if ad spend tracked)
- Churn rate

**Conversion Funnel:**
- Product views → Add to cart → Checkout → Purchase
- Drop-off rates at each stage
- Identifies where customers abandon

**DeepSeek AI Analytics:**

**Endpoint:** `/api/admin/ai/analytics-insights`

**Process:**
1. Backend aggregates all analytics data
2. Sends to DeepSeek API:
   ```
   Analyze this e-commerce analytics data and provide strategic insights.
   Focus on: revenue optimization, customer behavior patterns, product opportunities.
   Identify trends, anomalies, and actionable recommendations.
   Data: {JSON data}
   ```
3. Display insights with visualizations:
   - Key findings (bullet points)
   - Recommended actions (prioritized list)
   - Predicted trends (e.g., "Sales expected to increase 12% next month based on historical patterns")

---

#### SEO Tools

**Route:** `/admin/seo`

**Purpose:** Search engine optimization management

**Features:**

**Site-Wide SEO Settings:**
- **Form Fields:**
  - Site title (appears in browser tab)
  - Site description (meta description)
  - Keywords (tags)
  - Robots.txt content (textarea)
  - Sitemap URL (auto-generated, displays URL)
- **Save Button:** Posts to `/api/admin/seo/settings`

**Page SEO Manager:**
- **List of Pages:**
  - Homepage, Shop, Product pages (dynamic), Cart, Checkout, etc.
- **Click page to edit:**
  - Meta title (input, shows character count, recommends 50-60)
  - Meta description (textarea, shows character count, recommends 150-160)
  - Keywords (tag input)
  - Open Graph image (upload for social sharing)
  - Canonical URL
- **DeepSeek AI "Optimize SEO" button:**
  - Sends current page content to DeepSeek
  - Prompt: "Optimize this page's SEO metadata. Create compelling title and description that will improve click-through rate. Page content: {content}"
  - Shows AI suggestions, admin can accept or edit
- **Save Button:** Posts to `/api/admin/seo/pages/update`

**Product SEO Bulk Editor:**
- Table of all products
- Columns: Product name, Meta title, Meta description, Keywords, Status
- Status indicators:
  - ✅ Optimized (has unique meta title/description)
  - ⚠️ Missing (no meta title or description)
  - ❌ Duplicate (shares meta with another product)
- Bulk "Generate SEO" button:
  - Select multiple products
  - DeepSeek AI generates unique SEO for each
  - Review and save

**SEO Performance Tracking:**
- Integrate Google Search Console API
- Show for each page:
  - Impressions (how many times appeared in search)
  - Clicks
  - Click-through rate (CTR)
  - Average position
  - Top keywords driving traffic
- Chart showing SEO performance over time
- Alerts for ranking drops

**Keyword Research Tool:**
- Input target keyword
- DeepSeek AI suggests:
  - Related keywords
  - Long-tail variations
  - Search intent (informational, commercial, navigational)
  - Recommended content strategy

---

#### Marketing Hub

**Route:** `/admin/marketing`

**Purpose:** Campaign management and promotions

**Features:**

**Email Campaigns:**
- **Campaign List:**
  - Table of all campaigns
  - Columns: Name, Type, Sent to, Open Rate, Click Rate, Revenue, Status
- **Create Campaign:**
  - **Route:** `/admin/marketing/email/new`
  - **Form:**
    - Campaign name (internal)
    - Subject line (input)
    - Preview text (input)
    - Email template (select from templates: Welcome, Promotion, Order Confirmation, etc.)
    - Or custom HTML editor
    - Recipient segment (select from customer segments)
    - Schedule (send now or schedule date/time)
  - **DeepSeek AI Integration:**
    - "Optimize Subject Line" button:
      - Sends campaign details to DeepSeek
      - Prompt: "Generate 5 compelling email subject lines for this campaign that will increase open rates. Campaign: {details}"
      - Shows suggestions, admin selects
    - "AI Send Time" button:
      - DeepSeek analyzes customer open rate patterns
      - Recommends best day/time to send for maximum opens
    - "Generate Content" button:
      - Creates email body copy based on campaign goal
  - **Preview:** Shows email preview (desktop/mobile)
  - **Test Send:** Enter email to send test
  - **Send Button:** Posts to `/api/admin/marketing/email/send`
    - Sends via SendGrid
    - Tracks opens/clicks

**Discount Codes:**
- **List of Codes:**
  - Table: Code, Type, Value, Min Purchase, Uses, Max Uses, Active, Expires
- **Create Code:**
  - Code (text, uppercase, auto-generate option)
  - Type (percentage or fixed amount)
  - Value (number)
  - Minimum purchase (optional)
  - Maximum uses (optional, 0 = unlimited)
  - Expiration date
  - Active (toggle)
- **Posts To:** `/api/admin/marketing/coupons/create`

**Abandoned Cart Recovery:**
- **Dashboard showing:**
  - Number of abandoned carts (last 30 days)
  - Total value of abandoned carts
  - Recovery rate (carts recovered / total abandoned)
- **Automated Emails:**
  - Settings form:
    - Enable automated recovery emails (toggle)
    - First email delay (e.g., 1 hour after abandonment)
    - Second email delay (e.g., 24 hours)
    - Third email delay (e.g., 3 days)
    - Include discount code in email (toggle, select code)
  - Posts to `/api/admin/marketing/abandoned-cart/settings`
- **Manual Recovery:**
  - List of current abandoned carts
  - Columns: Customer, Email, Cart Value, Items, Time Abandoned, Actions
  - Send Recovery Email button (individual or bulk)

**DeepSeek AI Campaign Suggestions:**

**Endpoint:** `/api/admin/ai/campaign-suggestions`

**Process:**
1. Backend analyzes:
   - Recent sales data
   - Inventory levels
   - Customer behavior
   - Seasonal trends
   - Competitor activity (if integrated)
2. Sends to DeepSeek:
   ```
   Based on this e-commerce data, suggest 3-5 marketing campaigns to run this month.
   For each campaign, provide: goal, target audience, strategy, expected impact.
   Data: {JSON data}
   ```
3. Display campaign suggestions with:
   - Campaign type (Sale, Product Launch, Re-engagement, etc.)
   - Target audience
   - Strategy details
   - Expected revenue impact
   - "Create Campaign" button (pre-fills campaign form)

---

#### AI Assistant

**Route:** `/admin/ai-assistant`

**Purpose:** DeepSeek-powered business assistant

**Features:**

**AI Chat Interface:**
- Chat UI (like ChatGPT)
- Admin types questions about their business
- DeepSeek AI has access to:
  - All product data
  - All sales data
  - All customer data
  - All inventory data
- Example queries:
  - "What were my best selling products last month?"
  - "Which customers are at risk of churning?"
  - "Suggest a pricing strategy for the Heritage Hoodie"
  - "Write a product description for [product name]"
  - "Create a marketing email for our new collection"

**Endpoint:** `/api/admin/ai/chat`

**Process:**
1. Admin sends message
2. Backend determines what data is needed:
   - Parses intent (sales query, product query, marketing request, etc.)
   - Queries relevant database tables
   - Formats data as context
3. Sends to DeepSeek API:
   ```
   You are a business assistant for Reprezentative, a premium hoodie e-commerce brand.
   Use the following data to answer the admin's question accurately and provide actionable insights.
   
   Data: {JSON data}
   Question: {admin's question}
   ```
4. DeepSeek responds with answer
5. Display answer in chat
6. Store conversation history in database (for context in follow-up questions)

**Quick Actions (Buttons):**
- "Generate Product Description" (opens modal, selects product, inserts AI text)
- "Optimize Inventory" (runs inventory insights analysis)
- "Suggest Marketing Campaign" (runs campaign suggestions)
- "Analyze Sales Trends" (runs sales analysis, shows charts)

**AI Content Generator:**
- **Product Descriptions:**
  - Input: Product name, features, target audience
  - Output: Compelling product description
- **Email Templates:**
  - Input: Email type (promotional, welcome, etc.), tone (casual, formal)
  - Output: Full email with subject line and body
- **Social Media Posts:**
  - Input: Platform (Instagram, Facebook, Twitter), product or campaign
  - Output: Caption with hashtags, emoji suggestions
- **Blog Posts:**
  - Input: Topic, keywords, target word count
  - Output: Full blog post with SEO optimization

**AI Image Optimizer:**
- Upload product photo
- DeepSeek AI analyzes image:
  - Suggests improvements (lighting, composition, background)
  - Generates alt text for SEO
  - Recommends which image to use as primary

**AI Predictive Analytics:**
- **Sales Forecasting:**
  - Predicts next month's revenue based on historical data
  - Shows confidence interval
- **Inventory Demand Forecasting:**
  - Predicts which products will sell out
  - Recommends restock quantities
- **Customer Lifetime Value Prediction:**
  - Predicts future value of each customer
  - Identifies high-value customers for VIP treatment

---

#### Settings

**Route:** `/admin/settings`

**Sections:**

**General Settings:**
- Store name
- Store email
- Support phone number
- Store address
- Currency
- Timezone
- Language

**Shipping Settings:**
- Free shipping threshold ($150)
- Standard shipping rate
- Express shipping rate
- Shipping carriers (USPS, UPS, FedEx, etc.)
- Regions/countries you ship to

**Tax Settings:**
- Enable tax calculation (toggle)
- TaxJar API key
- Nexus states (where you collect sales tax)

**Payment Settings:**
- Stripe API keys (publishable, secret)
- Payment methods enabled (Card, Apple Pay, Google Pay)

**Email Settings:**
- SendGrid API key
- From email address
- From name
- Email templates (order confirmation, shipping, etc.)

**Admin Users:**
- List of admin users
- Add new admin (email, password, role)
- Edit/delete admins

---

## 🗄️ DATABASE SCHEMA

**See DATABASE_SCHEMA.md for complete Prisma schema**

Key tables:
- User (customers and admins)
- Product (all products)
- ProductVariant (NEW for inventory - stores stock per size/color combo)
- CartItem (shopping cart)
- Order (orders)
- OrderItem (items in orders)
- Address (customer addresses)
- Wishlist (wishlist items)
- Review (product reviews)
- Content (website content sections)
- Newsletter (email subscribers)
- Coupon (discount codes)
- Campaign (email campaigns - NEW)

---

## 🔑 API INTEGRATION REQUIREMENTS

### DeepSeek API

**Base URL:** `https://api.deepseek.com/v1`

**Authentication:** API Key in headers
```
Authorization: Bearer YOUR_DEEPSEEK_API_KEY
```

**Model:** `deepseek-chat`

**Example Request:**
```javascript
const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: 'You are a helpful assistant for an e-commerce platform.' },
      { role: 'user', content: 'Generate a product description for a premium black hoodie.' }
    ],
    max_tokens: 500,
    temperature: 0.7
  })
});

const data = await response.json();
const aiResponse = data.choices[0].message.content;
```

**Use Cases in Project:**
1. Product description generation
2. SEO metadata optimization
3. Email campaign content
4. Business insights and analytics
5. Inventory forecasting
6. Customer segmentation
7. Marketing campaign suggestions
8. Chat assistant

**Rate Limiting:** Implement rate limiting (100 requests per minute)

**Error Handling:**
- Catch API errors
- Show fallback message if API fails
- Log errors for debugging
- Don't break user flow if AI fails

---

### Stripe

**API Keys:**
- Publishable key (frontend)
- Secret key (backend)
- Webhook secret (for events)

**Integration Points:**
1. Payment intents (checkout)
2. Customer creation
3. Payment method storage
4. Webhooks (payment confirmation)
5. Refunds (order management)

**Webhook Events to Handle:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

---

### AWS S3

**Purpose:** Image and video storage

**Process:**
1. Admin uploads file from frontend
2. Frontend sends file to `/api/upload`
3. Backend uploads to S3 bucket
4. Returns public URL
5. Store URL in database

**Bucket Configuration:**
- Public read access
- CORS enabled for browser uploads
- Organized folders (/products, /content, /user-avatars)

---

### SendGrid

**Purpose:** Transactional emails

**Email Types:**
1. Order confirmation
2. Shipping notification
3. Password reset
4. Welcome email
5. Abandoned cart recovery
6. Marketing campaigns

**Dynamic Templates:**
- Create templates in SendGrid dashboard
- Pass dynamic data from backend
- Track opens and clicks

---

### TaxJar

**Purpose:** Sales tax calculation

**Integration:**
- Call on checkout when address entered
- Calculate tax based on address and order total
- Store tax amount in order

---

### SmartyStreets

**Purpose:** Address validation

**Integration:**
- Call when user enters address
- Validate and standardize address
- Return suggestions if invalid

---

### Google Analytics (Optional but Recommended)

**Purpose:** Website traffic tracking

**Integration:**
- Add GA4 tracking code
- Track page views, events
- Use for conversion rate calculation

---

## 🚀 DEPLOYMENT REQUIREMENTS

**Platform:** Vercel (recommended) or any Node.js host

**Environment Variables:**
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

DEEPSEEK_API_KEY=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

SENDGRID_API_KEY=
EMAIL_FROM=

TAXJAR_API_KEY=

SMARTYSTREETS_AUTH_ID=
SMARTYSTREETS_AUTH_TOKEN=

GOOGLE_ANALYTICS_ID=
```

**Build Command:** `npm run build`

**Start Command:** `npm run start`

**Database:** PostgreSQL (Vercel Postgres, Supabase, or Railway)

---

## ✅ ACCEPTANCE CRITERIA

**The project is complete and approved when:**

1. ✅ Zero hardcoded data in any component
2. ✅ Zero mock data - everything from database
3. ✅ Admin Content Manager controls 100% of website content
4. ✅ Inventory Manager fully functional with stock tracking
5. ✅ DeepSeek API integrated in all specified features
6. ✅ All pages responsive (mobile, tablet, desktop)
7. ✅ Authentication working (NextAuth)
8. ✅ Stripe payments processing successfully
9. ✅ Emails sending via SendGrid
10. ✅ Images uploading to AWS S3
11. ✅ All admin features working (CRUD operations)
12. ✅ User dashboard fully functional
13. ✅ SEO metadata on all pages
14. ✅ Error handling on all forms and API calls
15. ✅ Loading states on all async operations
16. ✅ Deployed and live (production URL)

---

## 📦 DELIVERABLES TO CLIENT

1. ✅ Complete Next.js codebase (GitHub repository)
2. ✅ Database schema with Prisma
3. ✅ Seeding script for initial data
4. ✅ Environment variables template
5. ✅ Deployment guide
6. ✅ Admin user credentials
7. ✅ API documentation
8. ✅ User guide for admin dashboard
9. ✅ Testing documentation
10. ✅ 30-day support period

---

## ⏱️ ESTIMATED TIMELINE

**Week 1-2:** Database, Authentication, Core Pages
- Database schema and Prisma setup
- NextAuth implementation
- Homepage, shop page, product detail page
- Basic cart and checkout

**Week 3-4:** User Dashboard & Payment
- User dashboard all tabs
- Stripe integration
- Order processing
- Email notifications

**Week 5-6:** Admin Dashboard (Part 1)
- Admin authentication
- Dashboard overview
- Product management
- Order management
- Inventory Manager

**Week 7-8:** Admin Dashboard (Part 2) & AI
- Content Manager (all sections)
- Customer management
- Analytics dashboard
- SEO tools
- Marketing hub
- DeepSeek AI integration across all features

**Week 9:** Testing & Deployment
- End-to-end testing
- Bug fixes
- Performance optimization
- Deployment to production
- Documentation finalization

---

## 🆘 SUPPORT & QUESTIONS

**During Development:**
- Developer can ask questions via email or Slack
- Weekly check-in meetings to review progress
- Access to staging environment for client review

**After Delivery:**
- 30-day support period for bugs
- Training session for admin dashboard
- Documentation for future maintenance

---

## END OF SCOPE DOCUMENT

**Everything not explicitly listed in this document is out of scope and will require additional budget/timeline negotiation.**

---

*Last Updated: November 25, 2024*
*Version: 1.0*
