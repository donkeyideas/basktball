# DATABASE SCHEMA - Reprezentative E-Commerce

## 🗄️ Complete Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USER MANAGEMENT
// ============================================

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      UserRole @default(CUSTOMER)
  
  // Profile
  name      String?
  phone     String?
  avatar    String?
  birthdate DateTime?
  gender    String?
  
  // Preferences
  marketingEmails    Boolean @default(true)
  orderEmails        Boolean @default(true)
  newArrivalsEmails  Boolean @default(true)
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  cart       CartItem[]
  orders     Order[]
  addresses  Address[]
  wishlist   WishlistItem[]
  reviews    Review[]
  
  @@index([email])
  @@map("users")
}

enum UserRole {
  CUSTOMER
  ADMIN
}

// ============================================
// PRODUCTS
// ============================================

model Product {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String   @db.Text
  
  // Pricing
  price         Float
  compareAtPrice Float?  // For showing "was $X, now $Y"
  
  // Product Details
  sku         String   @unique
  material    String   // "300+ GSM Cotton Blend"
  fit         FitType
  category    String
  
  // Media
  images      String[] // Array of S3 URLs
  
  // Variants
  colors      Json     // [{ name: "Black", hex: "#000000", available: true }]
  sizes       Json     // [{ name: "S", available: true }, ...]
  
  // Status
  featured    Boolean  @default(false)
  isNew       Boolean  @default(false)
  inStock     Boolean  @default(true)
  
  // SEO
  metaTitle       String?
  metaDescription String?
  keywords        String[] // ["hoodie", "premium", "streetwear"]
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  variants    ProductVariant[]
  cartItems   CartItem[]
  orderItems  OrderItem[]
  wishlist    WishlistItem[]
  reviews     Review[]
  
  @@index([slug])
  @@index([category])
  @@index([featured])
  @@map("products")
}

enum FitType {
  REGULAR
  OVERSIZED
  SLIM
}

// ============================================
// INVENTORY MANAGEMENT (NEW)
// ============================================

model ProductVariant {
  id        String   @id @default(cuid())
  productId String
  
  // Variant Details
  color     String   // "Charcoal Black"
  colorHex  String   // "#1f1f1f"
  size      String   // "L"
  
  // Inventory
  stock            Int      @default(0)
  reserved         Int      @default(0)  // In active carts
  available        Int      // Calculated: stock - reserved
  restockThreshold Int      @default(10) // Alert when below this
  
  // Tracking
  sku              String   @unique // Variant-specific SKU
  
  // Status
  discontinued     Boolean  @default(false)
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  product       Product          @relation(fields: [productId], references: [id], onDelete: Cascade)
  stockHistory  StockHistory[]
  
  @@unique([productId, color, size])
  @@index([productId])
  @@index([stock])
  @@map("product_variants")
}

// Stock change tracking for auditing
model StockHistory {
  id        String   @id @default(cuid())
  variantId String
  
  // Change Details
  action    StockAction
  quantity  Int      // Amount changed (positive or negative)
  reason    String?  // Optional reason for adjustment
  
  // Tracking
  userId    String?  // Admin who made the change
  orderId   String?  // If change due to order
  
  // New Stock
  newStock  Int      // Stock level after this change
  
  // Timestamp
  createdAt DateTime @default(now())
  
  // Relations
  variant ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  
  @@index([variantId])
  @@index([createdAt])
  @@map("stock_history")
}

enum StockAction {
  ADDED      // Manual stock addition
  REDUCED    // Manual stock reduction
  SOLD       // Sold via order
  RETURNED   // Customer return
  ADJUSTED   // Inventory adjustment
  RESERVED   // Added to cart
  RELEASED   // Removed from cart
}

// ============================================
// SHOPPING CART
// ============================================

model CartItem {
  id        String   @id @default(cuid())
  userId    String
  productId String
  
  // Selection
  size      String
  color     String
  quantity  Int
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@unique([userId, productId, size, color])
  @@index([userId])
  @@map("cart_items")
}

// ============================================
// ORDERS
// ============================================

model Order {
  id          String      @id @default(cuid())
  orderNumber String      @unique // ORD-2024-XXXX
  userId      String
  
  // Status
  status      OrderStatus @default(PENDING)
  
  // Pricing
  subtotal    Float
  shipping    Float
  tax         Float
  discount    Float       @default(0)
  total       Float
  
  // Addresses
  shippingAddress Json  // { name, street, city, state, zip, country, phone }
  billingAddress  Json
  
  // Shipping
  shippingMethod  String?    // "Standard" or "Express"
  trackingNumber  String?
  carrier         String?    // "USPS", "UPS", "FedEx"
  estimatedDelivery DateTime?
  
  // Payment
  stripePaymentId String?
  paymentMethod   String?    // "card", "apple_pay", etc.
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  user    User        @relation(fields: [userId], references: [id])
  items   OrderItem[]
  
  @@index([userId])
  @@index([orderNumber])
  @@index([status])
  @@index([createdAt])
  @@map("orders")
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

model OrderItem {
  id        String @id @default(cuid())
  orderId   String
  productId String
  
  // Details at time of purchase
  name      String
  image     String
  size      String
  color     String
  quantity  Int
  price     Float
  
  // Relations
  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])
  
  @@index([orderId])
  @@map("order_items")
}

// ============================================
// ADDRESSES
// ============================================

model Address {
  id        String  @id @default(cuid())
  userId    String
  
  // Address Details
  label     String?  // "Home", "Work", etc.
  name      String
  street    String
  city      String
  state     String
  zipCode   String
  country   String
  phone     String
  
  // Status
  isDefault Boolean @default(false)
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("addresses")
}

// ============================================
// WISHLIST
// ============================================

model WishlistItem {
  id        String   @id @default(cuid())
  userId    String
  productId String
  
  // Tracking
  addedAt   DateTime @default(now())
  priceWhenAdded Float // Track if price drops
  
  // Relations
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@unique([userId, productId])
  @@index([userId])
  @@map("wishlist_items")
}

// ============================================
// REVIEWS
// ============================================

model Review {
  id        String   @id @default(cuid())
  productId String
  userId    String
  
  // Review Content
  rating    Int      // 1-5
  title     String?
  comment   String   @db.Text
  
  // Verification
  verifiedPurchase Boolean @default(false)
  
  // Moderation
  approved  Boolean  @default(true)
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([productId])
  @@index([userId])
  @@map("reviews")
}

// ============================================
// CONTENT MANAGEMENT
// ============================================

model Content {
  id    String @id @default(cuid())
  key   String @unique  // "hero", "featured_split", "footer", etc.
  data  Json            // All content for that section
  
  // Versioning
  published Boolean  @default(true)
  version   Int      @default(1)
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([key])
  @@map("content")
}

// Example Content.data structure:
// For key="hero":
// {
//   videoUrl: "https://s3.../hero-video.mp4",
//   headline: "The Heritage Collection",
//   subheadline: "Timeless design...",
//   ctaText: "Explore Collection",
//   ctaLink: "/shop"
// }

// ============================================
// NEWSLETTER
// ============================================

model Newsletter {
  id         String   @id @default(cuid())
  email      String   @unique
  subscribed Boolean  @default(true)
  
  // Timestamps
  subscribedAt   DateTime @default(now())
  unsubscribedAt DateTime?
  
  @@index([email])
  @@map("newsletter")
}

// ============================================
// COUPONS
// ============================================

model Coupon {
  id          String      @id @default(cuid())
  code        String      @unique
  type        CouponType
  value       Float       // Percentage (0-100) or fixed amount
  
  // Rules
  minPurchase Float?      // Minimum order amount
  maxUses     Int?        // Max total uses (null = unlimited)
  usedCount   Int         @default(0)
  
  // Status
  active      Boolean     @default(true)
  
  // Validity
  startsAt    DateTime?
  expiresAt   DateTime?
  
  // Timestamps
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  @@index([code])
  @@index([active])
  @@map("coupons")
}

enum CouponType {
  PERCENTAGE  // e.g., 20% off
  FIXED       // e.g., $10 off
}

// ============================================
// MARKETING CAMPAIGNS (NEW)
// ============================================

model Campaign {
  id          String         @id @default(cuid())
  name        String
  type        CampaignType
  
  // Email Content
  subject     String
  previewText String?
  htmlContent String         @db.Text
  
  // Targeting
  segment     String?        // "all", "vip", "new", etc.
  
  // Metrics
  sentTo      Int            @default(0)
  opens       Int            @default(0)
  clicks      Int            @default(0)
  revenue     Float          @default(0)
  
  // Status
  status      CampaignStatus @default(DRAFT)
  
  // Scheduling
  scheduledFor DateTime?
  sentAt       DateTime?
  
  // Timestamps
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  
  @@index([status])
  @@index([sentAt])
  @@map("campaigns")
}

enum CampaignType {
  PROMOTIONAL
  TRANSACTIONAL
  NEWSLETTER
  ABANDONED_CART
}

enum CampaignStatus {
  DRAFT
  SCHEDULED
  SENT
  CANCELLED
}

// ============================================
// AI CHAT HISTORY (NEW)
// ============================================

model AIChatMessage {
  id        String   @id @default(cuid())
  sessionId String   // Group messages by session
  userId    String   // Admin user
  
  // Message
  role      String   // "user" or "assistant"
  content   String   @db.Text
  
  // Context (optional, for debugging)
  dataContext Json?  // What data was sent to AI
  
  // Timestamp
  createdAt DateTime @default(now())
  
  @@index([sessionId])
  @@index([userId])
  @@map("ai_chat_messages")
}

// ============================================
// ANALYTICS TRACKING (NEW)
// ============================================

model PageView {
  id        String   @id @default(cuid())
  
  // Page Details
  path      String   // "/product/heritage-hoodie"
  referrer  String?
  
  // User Info
  userId    String?  // If logged in
  sessionId String   // Track anonymous users
  
  // Device Info
  userAgent String?
  device    String?  // "mobile", "tablet", "desktop"
  
  // Timestamp
  createdAt DateTime @default(now())
  
  @@index([path])
  @@index([sessionId])
  @@index([createdAt])
  @@map("page_views")
}

model ProductView {
  id        String   @id @default(cuid())
  productId String
  
  // User Info
  userId    String?
  sessionId String
  
  // Timestamp
  viewedAt  DateTime @default(now())
  
  @@index([productId])
  @@index([sessionId])
  @@index([viewedAt])
  @@map("product_views")
}

// ============================================
// SETTINGS (NEW)
// ============================================

model Setting {
  id    String @id @default(cuid())
  key   String @unique  // "store_name", "support_email", etc.
  value String @db.Text
  
  // Timestamps
  updatedAt DateTime @updatedAt
  
  @@map("settings")
}
```

## 📊 Database Relationships Diagram

```
User
├── CartItem (1:many)
├── Order (1:many)
├── Address (1:many)
├── WishlistItem (1:many)
└── Review (1:many)

Product
├── ProductVariant (1:many) ← INVENTORY MANAGEMENT
├── CartItem (1:many)
├── OrderItem (1:many)
├── WishlistItem (1:many)
└── Review (1:many)

ProductVariant
└── StockHistory (1:many) ← AUDIT TRAIL

Order
└── OrderItem (1:many)
```

## 🔄 Database Migrations

### Initial Setup

```bash
# Install Prisma
npm install prisma @prisma/client

# Initialize Prisma
npx prisma init

# Copy the schema above to prisma/schema.prisma

# Create migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### Seeding Database

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@reprezentative.com',
      password: hashedPassword,
      role: 'ADMIN',
      name: 'Admin User',
    },
  });

  // Create content for homepage sections
  await prisma.content.createMany({
    data: [
      {
        key: 'navigation',
        data: {
          logoText: 'REPREZENTATIVE',
          menuItems: [
            { label: 'New Arrivals', link: '/shop?filter=new' },
            { label: 'Collection', link: '/shop' },
            { label: 'Our Story', link: '/story' },
          ],
        },
      },
      {
        key: 'hero',
        data: {
          videoUrl: 'https://your-s3-bucket.com/hero-video.mp4',
          headline: 'The Heritage\nCollection',
          subheadline: 'Timeless design. Uncompromising quality.',
          ctaText: 'Explore Collection',
          ctaLink: '/shop',
        },
      },
      {
        key: 'featured_split',
        data: {
          imageUrl: 'https://your-s3-bucket.com/featured.jpg',
          heading: 'Heritage\nRedefined',
          bodyText: 'Our signature hoodie combines 300+ GSM premium cotton...',
          ctaText: 'Discover More',
          ctaLink: '/product/heritage-hoodie',
        },
      },
      {
        key: 'footer',
        data: {
          description: 'Premium streetwear for those who stand for something.',
          columns: [
            {
              heading: 'Shop',
              links: [
                { label: 'All Products', url: '/shop' },
                { label: 'New Arrivals', url: '/shop?filter=new' },
              ],
            },
            // ... more columns
          ],
          copyright: '© 2024 REPREZENTATIVE. ALL RIGHTS RESERVED.',
        },
      },
    ],
  });

  // Create sample product
  const product = await prisma.product.create({
    data: {
      name: 'Heritage Hoodie',
      slug: 'heritage-hoodie',
      description: 'Classic comfort meets timeless design...',
      price: 145,
      sku: 'REP-HH-001',
      material: '300+ GSM Cotton Blend',
      fit: 'OVERSIZED',
      category: 'Hoodies',
      images: [
        'https://your-s3-bucket.com/products/heritage-1.jpg',
        'https://your-s3-bucket.com/products/heritage-2.jpg',
      ],
      colors: [
        { name: 'Charcoal Black', hex: '#1f1f1f', available: true },
        { name: 'Stone Grey', hex: '#9ca3af', available: true },
      ],
      sizes: [
        { name: 'S', available: true },
        { name: 'M', available: true },
        { name: 'L', available: true },
        { name: 'XL', available: true },
      ],
      featured: true,
      isNew: true,
      inStock: true,
      metaTitle: 'Heritage Hoodie - Premium Quality',
      metaDescription: 'Our signature heritage hoodie...',
      keywords: ['hoodie', 'premium', 'streetwear'],
    },
  });

  // Create product variants with inventory
  await prisma.productVariant.createMany({
    data: [
      {
        productId: product.id,
        color: 'Charcoal Black',
        colorHex: '#1f1f1f',
        size: 'S',
        stock: 25,
        reserved: 0,
        available: 25,
        sku: 'REP-HH-001-BLK-S',
      },
      {
        productId: product.id,
        color: 'Charcoal Black',
        colorHex: '#1f1f1f',
        size: 'M',
        stock: 30,
        reserved: 0,
        available: 30,
        sku: 'REP-HH-001-BLK-M',
      },
      {
        productId: product.id,
        color: 'Charcoal Black',
        colorHex: '#1f1f1f',
        size: 'L',
        stock: 35,
        reserved: 0,
        available: 35,
        sku: 'REP-HH-001-BLK-L',
      },
      // ... more variants
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run seeding:
```bash
npx prisma db seed
```

## 🔍 Common Queries

### Get Product with Variants and Stock

```typescript
const product = await prisma.product.findUnique({
  where: { slug: 'heritage-hoodie' },
  include: {
    variants: {
      where: { discontinued: false },
      orderBy: { size: 'asc' },
    },
    reviews: {
      where: { approved: true },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    },
  },
});
```

### Update Inventory (Add Stock)

```typescript
const variant = await prisma.productVariant.update({
  where: { id: variantId },
  data: {
    stock: { increment: quantityAdded },
    available: { increment: quantityAdded },
  },
});

// Log the change
await prisma.stockHistory.create({
  data: {
    variantId: variant.id,
    action: 'ADDED',
    quantity: quantityAdded,
    reason: 'Restock from supplier',
    userId: adminUserId,
    newStock: variant.stock,
  },
});
```

### Reserve Stock (Add to Cart)

```typescript
await prisma.$transaction([
  // Add to cart
  prisma.cartItem.create({
    data: {
      userId,
      productId,
      size,
      color,
      quantity,
    },
  }),
  // Reserve stock
  prisma.productVariant.update({
    where: {
      productId_color_size: {
        productId,
        color,
        size,
      },
    },
    data: {
      reserved: { increment: quantity },
      available: { decrement: quantity },
    },
  }),
  // Log history
  prisma.stockHistory.create({
    data: {
      variantId: variant.id,
      action: 'RESERVED',
      quantity,
      reason: 'Added to cart',
      newStock: variant.stock,
    },
  }),
]);
```

### Complete Order (Reduce Stock)

```typescript
await prisma.$transaction(async (tx) => {
  // Create order
  const order = await tx.order.create({
    data: orderData,
  });

  // For each cart item
  for (const item of cartItems) {
    // Create order item
    await tx.orderItem.create({
      data: {
        orderId: order.id,
        productId: item.productId,
        name: item.product.name,
        image: item.product.images[0],
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: item.product.price,
      },
    });

    // Update variant stock
    const variant = await tx.productVariant.findUnique({
      where: {
        productId_color_size: {
          productId: item.productId,
          color: item.color,
          size: item.size,
        },
      },
    });

    await tx.productVariant.update({
      where: { id: variant.id },
      data: {
        stock: { decrement: item.quantity },
        reserved: { decrement: item.quantity },
        // available stays the same (was already decremented when reserved)
      },
    });

    // Log stock change
    await tx.stockHistory.create({
      data: {
        variantId: variant.id,
        action: 'SOLD',
        quantity: -item.quantity,
        orderId: order.id,
        newStock: variant.stock - item.quantity,
      },
    });

    // Delete cart item
    await tx.cartItem.delete({
      where: { id: item.id },
    });
  }

  return order;
});
```

## 🚨 Critical Notes

1. **Always use transactions** when updating stock to prevent race conditions
2. **Stock = Available + Reserved** - available is what customers can buy
3. **Reserved stock** is in active carts but not yet purchased
4. **Stock history** tracks every change for auditing and debugging
5. **ProductVariant** is the single source of truth for inventory
6. **Never hardcode** product data - always query from database

---

*Database schema designed for scalability, data integrity, and zero hardcoded values.*
