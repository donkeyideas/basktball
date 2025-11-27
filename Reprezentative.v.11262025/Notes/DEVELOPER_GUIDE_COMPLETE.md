# DEVELOPER GUIDE - Reprezentative E-Commerce Platform

## 📋 Table of Contents

1. [Critical Rules](#critical-rules)
2. [Technology Stack](#technology-stack)
3. [Project Setup](#project-setup)
4. [DeepSeek API Integration](#deepseek-api-integration)
5. [Database Implementation](#database-implementation)
6. [API Routes Reference](#api-routes-reference)
7. [Frontend Implementation](#frontend-implementation)
8. [Content Management System](#content-management-system)
9. [Inventory Management System](#inventory-management-system)
10. [Testing & Deployment](#testing--deployment)

---

## ⚠️ CRITICAL RULES

### READ THIS FIRST - THESE ARE NON-NEGOTIABLE

#### Rule #1: ZERO Hardcoded Data

**WRONG:**
```typescript
const products = [
  { id: 1, name: "Heritage Hoodie", price: 145 },
  { id: 2, name: "Essential Hoodie", price: 135 }
];
```

**CORRECT:**
```typescript
const products = await prisma.product.findMany();
```

**This means:**
- ❌ No array literals with product data
- ❌ No hardcoded text strings for website content
- ❌ No example/placeholder data in components
- ✅ Every piece of data comes from database via Prisma
- ✅ Use database seeding scripts for initial data

#### Rule #2: ZERO Mock Data

**WRONG:**
```typescript
// Mock data for testing
const mockUser = { id: '123', name: 'Test User' };
```

**CORRECT:**
```typescript
const user = await prisma.user.findUnique({ where: { id: userId } });
if (!user) throw new Error('User not found');
```

#### Rule #3: Content Manager Controls EVERYTHING

Every single piece of text, image, video, button text, or link visible on the website MUST be:
- Stored in the `Content` table
- Editable via Admin Dashboard → Content Manager
- Fetched dynamically on page load

**No exceptions.** If admin can't edit it, you built it wrong.

#### Rule #4: DeepSeek API Only

- ❌ NOT OpenAI
- ❌ NOT Claude
- ❌ NOT any other AI provider
- ✅ ONLY DeepSeek API (https://api.deepseek.com)
- ✅ Model: `deepseek-chat`

#### Rule #5: Real-Time Inventory

- Stock levels must be accurate in real-time
- Use database transactions for all stock operations
- Reserve stock when added to cart
- Release stock when removed from cart or cart expires
- Track every stock change in StockHistory table

---

## 🛠️ Technology Stack

### Required Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    
    "@prisma/client": "^5.7.0",
    "prisma": "^5.7.0",
    
    "next-auth": "^4.24.5",
    "bcryptjs": "^2.4.3",
    "@types/bcryptjs": "^2.4.6",
    
    "@stripe/stripe-js": "^2.3.0",
    "stripe": "^14.9.0",
    
    "aws-sdk": "^2.1514.0",
    
    "@sendgrid/mail": "^8.1.0",
    
    "axios": "^1.6.2",
    
    "zod": "^3.22.4",
    "react-hook-form": "^7.49.2",
    "@hookform/resolvers": "^3.3.3",
    
    "date-fns": "^3.0.0",
    "clsx": "^2.0.0",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "@types/react": "^18.2.45",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}
```

### Project Structure

```
reprezentative/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                 # Homepage
│   │   ├── shop/
│   │   │   ├── page.tsx             # Shop listing
│   │   │   └── [slug]/page.tsx      # Product detail
│   │   ├── cart/page.tsx            # Shopping cart
│   │   ├── checkout/page.tsx        # Checkout
│   │   └── layout.tsx               # Public layout
│   ├── account/
│   │   ├── orders/page.tsx          # User orders
│   │   ├── wishlist/page.tsx        # User wishlist
│   │   ├── profile/page.tsx         # User profile
│   │   └── layout.tsx               # Account layout
│   ├── admin/
│   │   ├── dashboard/page.tsx       # Admin overview
│   │   ├── content/page.tsx         # Content Manager ⚠️ CRITICAL
│   │   ├── products/page.tsx        # Product management
│   │   ├── inventory/page.tsx       # Inventory Manager ⚠️ CRITICAL
│   │   ├── orders/page.tsx          # Order management
│   │   ├── customers/page.tsx       # Customer management
│   │   ├── analytics/page.tsx       # Analytics
│   │   ├── seo/page.tsx            # SEO tools
│   │   ├── marketing/page.tsx       # Marketing hub
│   │   ├── ai-assistant/page.tsx    # DeepSeek AI chat
│   │   └── layout.tsx               # Admin layout
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── products/
│   │   │   ├── route.ts             # GET all products
│   │   │   ├── [slug]/route.ts      # GET single product
│   │   │   ├── filters/route.ts     # GET filter options
│   │   │   └── related/route.ts     # GET related products
│   │   ├── cart/
│   │   │   ├── route.ts             # GET cart
│   │   │   ├── add/route.ts         # POST add to cart
│   │   │   ├── update/route.ts      # PUT update quantity
│   │   │   └── remove/route.ts      # DELETE remove item
│   │   ├── checkout/
│   │   │   ├── create-intent/route.ts  # Stripe payment intent
│   │   │   ├── confirm/route.ts        # Confirm order
│   │   │   └── calculate-tax/route.ts  # TaxJar
│   │   ├── content/
│   │   │   └── [key]/route.ts       # GET/PUT content sections
│   │   ├── admin/
│   │   │   ├── inventory/
│   │   │   │   ├── route.ts         # GET inventory
│   │   │   │   └── update/route.ts  # PUT stock levels
│   │   │   ├── ai/
│   │   │   │   ├── insights/route.ts      # DeepSeek insights
│   │   │   │   ├── generate-description/route.ts
│   │   │   │   └── chat/route.ts    # DeepSeek chat
│   │   │   └── ...
│   │   └── webhooks/
│   │       └── stripe/route.ts      # Stripe webhooks
│   ├── layout.tsx                   # Root layout
│   └── globals.css
├── components/
│   ├── ui/                          # Reusable UI components
│   ├── admin/                       # Admin-specific components
│   └── shared/                      # Shared components
├── lib/
│   ├── prisma.ts                    # Prisma client
│   ├── deepseek.ts                  # DeepSeek API client ⚠️
│   ├── stripe.ts                    # Stripe client
│   ├── s3.ts                        # AWS S3 client
│   ├── sendgrid.ts                  # SendGrid client
│   └── auth.ts                      # NextAuth config
├── prisma/
│   ├── schema.prisma                # Database schema
│   └── seed.ts                      # Database seeding
├── public/
│   └── ...
├── .env.local                       # Environment variables
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🚀 Project Setup

### 1. Create Next.js Project

```bash
npx create-next-app@latest reprezentative --typescript --tailwind --app
cd reprezentative
```

### 2. Install Dependencies

```bash
npm install @prisma/client next-auth bcryptjs @stripe/stripe-js stripe aws-sdk @sendgrid/mail axios zod react-hook-form @hookform/resolvers date-fns clsx

npm install -D prisma @types/bcryptjs @types/node
```

### 3. Initialize Prisma

```bash
npx prisma init
```

Copy the complete database schema from `DATABASE_SCHEMA.md` into `prisma/schema.prisma`.

### 4. Setup Environment Variables

Create `.env.local`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/reprezentative"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# DeepSeek AI (NOT OpenAI!)
DEEPSEEK_API_KEY="sk-..."
DEEPSEEK_API_URL="https://api.deepseek.com/v1"

# AWS S3
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_S3_BUCKET="reprezentative-images"

# SendGrid
SENDGRID_API_KEY="SG...."
EMAIL_FROM="noreply@reprezentative.com"

# TaxJar
TAXJAR_API_KEY="..."

# SmartyStreets
SMARTYSTREETS_AUTH_ID="..."
SMARTYSTREETS_AUTH_TOKEN="..."

# Analytics (Optional)
GOOGLE_ANALYTICS_ID="G-..."
```

### 5. Run Database Migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Seed Database

```bash
npx prisma db seed
```

---

## 🤖 DeepSeek API Integration

### Setup DeepSeek Client

Create `lib/deepseek.ts`:

```typescript
// lib/deepseek.ts

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekRequest {
  model: string;
  messages: DeepSeekMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekClient {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY!;
    this.apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';

    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not set in environment variables');
    }
  }

  async chat(messages: DeepSeekMessage[], options?: Partial<DeepSeekRequest>): Promise<string> {
    const response = await fetch(`${this.apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        max_tokens: options?.max_tokens || 1000,
        temperature: options?.temperature || 0.7,
        top_p: options?.top_p || 0.95,
        ...options,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`DeepSeek API Error: ${error.message || response.statusText}`);
    }

    const data: DeepSeekResponse = await response.json();
    return data.choices[0].message.content;
  }

  // Generate product description
  async generateProductDescription(productName: string, material: string, fit: string): Promise<string> {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: 'You are a premium fashion copywriter for Reprezentative, a luxury streetwear brand. Write compelling, concise product descriptions that emphasize quality and craftsmanship.',
      },
      {
        role: 'user',
        content: `Write a product description for a hoodie with these details:
Name: ${productName}
Material: ${material}
Fit: ${fit}

Requirements:
- 100-150 words
- Emphasize premium quality and attention to detail
- Appeal to customers who value both style and substance
- Use sophisticated, aspirational language
- No bullet points, write in prose`,
      },
    ];

    return await this.chat(messages, { temperature: 0.8, max_tokens: 300 });
  }

  // Generate SEO metadata
  async generateSEOMetadata(productName: string, description: string): Promise<{
    title: string;
    description: string;
    keywords: string[];
  }> {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: 'You are an SEO expert. Generate optimized metadata for e-commerce products.',
      },
      {
        role: 'user',
        content: `Generate SEO metadata for this product:

Product Name: ${productName}
Description: ${description}

Return as JSON:
{
  "title": "50-60 character optimized title",
  "description": "150-160 character meta description",
  "keywords": ["keyword1", "keyword2", ...]
}`,
      },
    ];

    const response = await this.chat(messages, { temperature: 0.5, max_tokens: 300 });
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse SEO metadata from DeepSeek response');
    
    return JSON.parse(jsonMatch[0]);
  }

  // Business insights
  async generateBusinessInsights(data: {
    salesData: any;
    inventoryData: any;
    customerData: any;
  }): Promise<{ insights: Array<{ type: 'urgent' | 'warning' | 'opportunity'; message: string }> }> {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: 'You are a business analyst for an e-commerce platform. Analyze data and provide actionable insights.',
      },
      {
        role: 'user',
        content: `Analyze this business data and provide 3-5 critical insights:

Sales Data: ${JSON.stringify(data.salesData)}
Inventory Data: ${JSON.stringify(data.inventoryData)}
Customer Data: ${JSON.stringify(data.customerData)}

For each insight, categorize as:
- "urgent": immediate action needed (stock outs, revenue drops)
- "warning": attention required (declining metrics)
- "opportunity": growth potential (upsells, trends)

Return as JSON:
{
  "insights": [
    { "type": "urgent", "message": "..." },
    ...
  ]
}`,
      },
    ];

    const response = await this.chat(messages, { temperature: 0.7, max_tokens: 1000 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse insights from DeepSeek response');
    
    return JSON.parse(jsonMatch[0]);
  }

  // Inventory forecasting
  async forecastInventoryNeeds(data: {
    productId: string;
    productName: string;
    currentStock: number;
    salesVelocity: number; // units per day
    seasonalTrends: any[];
  }): Promise<{ daysUntilStockout: number; recommendedRestock: number; reasoning: string }> {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: 'You are an inventory management expert. Analyze sales data and forecast restocking needs.',
      },
      {
        role: 'user',
        content: `Analyze this product's inventory:

Product: ${data.productName}
Current Stock: ${data.currentStock} units
Average Daily Sales: ${data.salesVelocity} units
Seasonal Trends: ${JSON.stringify(data.seasonalTrends)}

Calculate:
1. Days until stockout at current rate
2. Recommended restock quantity (consider lead time, seasonal trends)
3. Brief reasoning

Return as JSON:
{
  "daysUntilStockout": number,
  "recommendedRestock": number,
  "reasoning": "explanation"
}`,
      },
    ];

    const response = await this.chat(messages, { temperature: 0.5, max_tokens: 500 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse forecast from DeepSeek response');
    
    return JSON.parse(jsonMatch[0]);
  }

  // Customer segmentation
  async segmentCustomers(customers: any[]): Promise<{
    segments: Array<{
      name: string;
      criteria: string;
      count: number;
      recommendedAction: string;
    }>;
  }> {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: 'You are a customer analytics expert. Segment customers for targeted marketing campaigns.',
      },
      {
        role: 'user',
        content: `Segment these customers into 4-6 actionable groups:

Customer Data Summary:
${JSON.stringify(customers.slice(0, 100))} // Sample for context

Create segments like: VIP, At-Risk, New Customers, Frequent Buyers, etc.
For each segment provide: name, criteria, estimated count, and marketing recommendation.

Return as JSON:
{
  "segments": [
    {
      "name": "VIP Customers",
      "criteria": "Spent $500+, ordered 3+ times",
      "count": estimated_number,
      "recommendedAction": "Send exclusive early access..."
    },
    ...
  ]
}`,
      },
    ];

    const response = await this.chat(messages, { temperature: 0.7, max_tokens: 1500 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse segments from DeepSeek response');
    
    return JSON.parse(jsonMatch[0]);
  }

  // Marketing campaign suggestions
  async suggestCampaigns(data: {
    salesData: any;
    inventoryData: any;
    seasonalData: any;
  }): Promise<{
    campaigns: Array<{
      type: string;
      title: string;
      targetAudience: string;
      strategy: string;
      expectedImpact: string;
    }>;
  }> {
    const messages: DeepSeekMessage[] = [
      {
        role: 'system',
        content: 'You are a marketing strategist for an e-commerce fashion brand.',
      },
      {
        role: 'user',
        content: `Based on this business data, suggest 3-5 marketing campaigns to run this month:

Sales Data: ${JSON.stringify(data.salesData)}
Inventory Levels: ${JSON.stringify(data.inventoryData)}
Seasonal Trends: ${JSON.stringify(data.seasonalData)}

For each campaign, provide:
- Type (Sale, Product Launch, Re-engagement, etc.)
- Campaign title
- Target audience
- Strategy overview
- Expected revenue impact

Return as JSON:
{
  "campaigns": [
    {
      "type": "Flash Sale",
      "title": "...",
      "targetAudience": "...",
      "strategy": "...",
      "expectedImpact": "..."
    },
    ...
  ]
}`,
      },
    ];

    const response = await this.chat(messages, { temperature: 0.8, max_tokens: 2000 });
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse campaigns from DeepSeek response');
    
    return JSON.parse(jsonMatch[0]);
  }
}

// Export singleton instance
export const deepseek = new DeepSeekClient();
```

### Using DeepSeek in API Routes

Example: Generate Product Description

```typescript
// app/api/admin/products/generate-description/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { deepseek } from '@/lib/deepseek';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productName, material, fit } = await req.json();

    // Validate inputs
    if (!productName || !material || !fit) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate description using DeepSeek
    const description = await deepseek.generateProductDescription(
      productName,
      material,
      fit
    );

    return NextResponse.json({ description });
  } catch (error) {
    console.error('DeepSeek API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    );
  }
}
```

---

## 📊 Database Implementation

### Prisma Client Setup

Create `lib/prisma.ts`:

```typescript
// lib/prisma.ts

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Critical Database Operations

#### 1. Fetching Products (NO HARDCODING)

```typescript
// WRONG - NEVER DO THIS
const products = [
  { id: '1', name: 'Heritage Hoodie', price: 145 }
];

// CORRECT
import { prisma } from '@/lib/prisma';

export async function getProducts(filters: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  colors?: string[];
  sizes?: string[];
}) {
  const products = await prisma.product.findMany({
    where: {
      ...(filters.category && { category: filters.category }),
      ...(filters.minPrice && { price: { gte: filters.minPrice } }),
      ...(filters.maxPrice && { price: { lte: filters.maxPrice } }),
      inStock: true,
    },
    include: {
      variants: {
        where: {
          discontinued: false,
          available: { gt: 0 },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return products;
}
```

#### 2. Managing Inventory with Transactions

```typescript
// Adding product to cart (reserves stock)
export async function addToCart(userId: string, productId: string, size: string, color: string, quantity: number) {
  return await prisma.$transaction(async (tx) => {
    // Get variant
    const variant = await tx.productVariant.findUnique({
      where: {
        productId_color_size: {
          productId,
          color,
          size,
        },
      },
    });

    if (!variant) {
      throw new Error('Product variant not found');
    }

    if (variant.available < quantity) {
      throw new Error('Insufficient stock');
    }

    // Check if already in cart
    const existingCartItem = await tx.cartItem.findUnique({
      where: {
        userId_productId_size_color: {
          userId,
          productId,
          size,
          color,
        },
      },
    });

    if (existingCartItem) {
      // Update quantity
      await tx.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + quantity },
      });
    } else {
      // Create new cart item
      await tx.cartItem.create({
        data: {
          userId,
          productId,
          size,
          color,
          quantity,
        },
      });
    }

    // Reserve stock
    await tx.productVariant.update({
      where: { id: variant.id },
      data: {
        reserved: { increment: quantity },
        available: { decrement: quantity },
      },
    });

    // Log stock change
    await tx.stockHistory.create({
      data: {
        variantId: variant.id,
        action: 'RESERVED',
        quantity,
        reason: 'Added to cart',
        userId,
        newStock: variant.stock,
      },
    });

    return { success: true };
  });
}
```

#### 3. Processing Orders

```typescript
export async function createOrder(userId: string, orderData: any) {
  return await prisma.$transaction(async (tx) => {
    // Get user's cart
    const cartItems = await tx.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Create order
    const order = await tx.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}`,
        userId,
        status: 'PENDING',
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        tax: orderData.tax,
        discount: orderData.discount,
        total: orderData.total,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        stripePaymentId: orderData.stripePaymentId,
      },
    });

    // Create order items and update stock
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

      // Get variant
      const variant = await tx.productVariant.findUnique({
        where: {
          productId_color_size: {
            productId: item.productId,
            color: item.color,
            size: item.size,
          },
        },
      });

      if (!variant) continue;

      // Update stock (decrement stock, decrement reserved, available stays same)
      await tx.productVariant.update({
        where: { id: variant.id },
        data: {
          stock: { decrement: item.quantity },
          reserved: { decrement: item.quantity },
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
}
```

---

## 🎨 Content Management System

### CRITICAL: Admin Must Control ALL Website Content

Every piece of text, image, video URL visible on the website MUST be stored in the `Content` table and editable via the admin dashboard.

### Content Table Structure

```typescript
{
  key: string;    // "hero", "featured_split", "footer", etc.
  data: Json;     // All content for that section
  published: boolean;
  version: number;
}
```

### Fetching Content in Pages

**Homepage Example:**

```typescript
// app/(public)/page.tsx

import { prisma } from '@/lib/prisma';

export default async function Homepage() {
  // Fetch ALL content sections for homepage
  const [hero, featuredSplit, banner, columns, editorial, newsletter, footer] = await Promise.all([
    prisma.content.findUnique({ where: { key: 'hero' } }),
    prisma.content.findUnique({ where: { key: 'featured_split' } }),
    prisma.content.findUnique({ where: { key: 'full_width_banner' } }),
    prisma.content.findUnique({ where: { key: 'three_columns' } }),
    prisma.content.findUnique({ where: { key: 'editorial' } }),
    prisma.content.findUnique({ where: { key: 'newsletter_section' } }),
    prisma.content.findUnique({ where: { key: 'footer' } }),
  ]);

  if (!hero || !featuredSplit || !banner) {
    throw new Error('Required content not found. Please set up content in admin dashboard.');
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <video autoPlay muted loop playsInline>
          <source src={hero.data.videoUrl} type="video/mp4" />
        </video>
        <div className="hero-content">
          <h1>{hero.data.headline}</h1>
          <p>{hero.data.subheadline}</p>
          <a href={hero.data.ctaLink}>{hero.data.ctaText}</a>
        </div>
      </section>

      {/* Featured Split */}
      <section className="featured-split">
        <img src={featuredSplit.data.imageUrl} alt={featuredSplit.data.heading} />
        <div>
          <h2>{featuredSplit.data.heading}</h2>
          <p>{featuredSplit.data.bodyText}</p>
          <a href={featuredSplit.data.ctaLink}>{featuredSplit.data.ctaText}</a>
        </div>
      </section>

      {/* Continue for all sections... */}
    </div>
  );
}
```

### Admin Content Manager Implementation

```typescript
// app/admin/content/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContentManager() {
  const [activeSection, setActiveSection] = useState('hero');
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Load content for current section
  useEffect(() => {
    async function loadContent() {
      const res = await fetch(`/api/content/${activeSection}`);
      const data = await res.json();
      setContent(data.data || {});
    }
    loadContent();
  }, [activeSection]);

  // Save content
  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/${activeSection}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: content }),
      });

      if (!res.ok) throw new Error('Failed to save');

      alert('Content saved successfully!');
      router.refresh(); // Refresh to show changes on website
    } catch (error) {
      alert('Error saving content');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="content-manager">
      <h1>Content Manager</h1>
      <p>Edit all website content from here</p>

      {/* Section Tabs */}
      <div className="tabs">
        {['hero', 'featured_split', 'full_width_banner', 'three_columns', 'editorial', 'newsletter_section', 'footer'].map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={activeSection === section ? 'active' : ''}
          >
            {section.replace('_', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Dynamic Form Based on Section */}
      <div className="form">
        {activeSection === 'hero' && (
          <>
            <label>
              Video URL
              <input
                type="text"
                value={content.videoUrl || ''}
                onChange={(e) => setContent({ ...content, videoUrl: e.target.value })}
              />
            </label>
            <label>
              Headline
              <textarea
                value={content.headline || ''}
                onChange={(e) => setContent({ ...content, headline: e.target.value })}
              />
            </label>
            <label>
              Subheadline
              <textarea
                value={content.subheadline || ''}
                onChange={(e) => setContent({ ...content, subheadline: e.target.value })}
              />
            </label>
            <label>
              CTA Button Text
              <input
                type="text"
                value={content.ctaText || ''}
                onChange={(e) => setContent({ ...content, ctaText: e.target.value })}
              />
            </label>
            <label>
              CTA Button Link
              <input
                type="text"
                value={content.ctaLink || ''}
                onChange={(e) => setContent({ ...content, ctaLink: e.target.value })}
              />
            </label>
          </>
        )}

        {/* Add similar forms for each section */}
      </div>

      {/* Save Button */}
      <button onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
```

### Content API Route

```typescript
// app/api/content/[key]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET content
export async function GET(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const content = await prisma.content.findUnique({
      where: { key: params.key },
    });

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    return NextResponse.json(content);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

// PUT (update) content - Admin only
export async function PUT(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data } = await req.json();

    const content = await prisma.content.upsert({
      where: { key: params.key },
      update: {
        data,
        updatedAt: new Date(),
      },
      create: {
        key: params.key,
        data,
      },
    });

    return NextResponse.json(content);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
```

---

## 📦 Inventory Management System

### Overview

The Inventory Manager tracks stock levels for every product variant (size + color combination). It must:

1. Show real-time stock levels
2. Track reserved stock (in active carts)
3. Calculate available stock (total - reserved)
4. Log every stock change
5. Alert when stock is low
6. Forecast restocking needs using DeepSeek AI

### Inventory Dashboard Implementation

```typescript
// app/admin/inventory/page.tsx

'use client';

import { useState, useEffect } from 'react';

export default function InventoryManager() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    stockStatus: 'all', // all, in-stock, low-stock, out-of-stock
    search: '',
  });

  useEffect(() => {
    loadInventory();
  }, [filters]);

  async function loadInventory() {
    setLoading(true);
    const params = new URLSearchParams(filters);
    const res = await fetch(`/api/admin/inventory?${params}`);
    const data = await res.json();
    setInventory(data);
    setLoading(false);
  }

  async function updateStock(variantId: string, newStock: number) {
    const res = await fetch('/api/admin/inventory/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId, stock: newStock, reason: 'Manual adjustment' }),
    });

    if (res.ok) {
      alert('Stock updated!');
      loadInventory();
    }
  }

  return (
    <div>
      <h1>Inventory Manager</h1>

      {/* Filters */}
      <div className="filters">
        <select value={filters.stockStatus} onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}>
          <option value="all">All</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      {/* Inventory Table */}
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Color</th>
            <th>Size</th>
            <th>Total Stock</th>
            <th>Reserved</th>
            <th>Available</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventory.map((item: any) => (
            <tr key={item.id} className={item.available === 0 ? 'out-of-stock' : item.available < 10 ? 'low-stock' : ''}>
              <td>{item.product.name}</td>
              <td>
                <span style={{ backgroundColor: item.colorHex, width: 20, height: 20, display: 'inline-block', marginRight: 8 }} />
                {item.color}
              </td>
              <td>{item.size}</td>
              <td>{item.stock}</td>
              <td>{item.reserved}</td>
              <td>{item.available}</td>
              <td>
                {item.available === 0 ? '❌ Out of Stock' : item.available < 10 ? '⚠️ Low Stock' : '✅ In Stock'}
              </td>
              <td>
                <button onClick={() => {
                  const newStock = prompt('Enter new stock quantity:', item.stock);
                  if (newStock) updateStock(item.id, parseInt(newStock));
                }}>
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* DeepSeek AI Insights */}
      <div className="ai-insights">
        <h2>AI Restocking Recommendations</h2>
        <button onClick={async () => {
          const res = await fetch('/api/admin/ai/inventory-insights');
          const insights = await res.json();
          console.log(insights);
        }}>
          Generate Insights
        </button>
      </div>
    </div>
  );
}
```

### Inventory API Route

```typescript
// app/api/admin/inventory/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const stockStatus = searchParams.get('stockStatus');
    const search = searchParams.get('search');

    let where: any = {};

    // Filter by stock status
    if (stockStatus === 'out-of-stock') {
      where.available = 0;
    } else if (stockStatus === 'low-stock') {
      where.available = { gt: 0, lt: 10 };
    } else if (stockStatus === 'in-stock') {
      where.available = { gte: 10 };
    }

    // Search by product name
    if (search) {
      where.product = {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      };
    }

    const inventory = await prisma.productVariant.findMany({
      where,
      include: {
        product: {
          select: {
            name: true,
            images: true,
          },
        },
      },
      orderBy: {
        available: 'asc', // Show lowest stock first
      },
    });

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}
```

### Update Stock API Route

```typescript
// app/api/admin/inventory/update/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { variantId, stock, reason } = await req.json();

    // Get current variant
    const currentVariant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!currentVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    // Calculate change
    const stockChange = stock - currentVariant.stock;
    const newAvailable = stock - currentVariant.reserved;

    // Update variant in transaction
    await prisma.$transaction([
      // Update stock
      prisma.productVariant.update({
        where: { id: variantId },
        data: {
          stock,
          available: newAvailable,
        },
      }),
      // Log change
      prisma.stockHistory.create({
        data: {
          variantId,
          action: stockChange > 0 ? 'ADDED' : 'REDUCED',
          quantity: Math.abs(stockChange),
          reason: reason || 'Manual adjustment',
          userId: session.user.id,
          newStock: stock,
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Stock update error:', error);
    return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
  }
}
```

---

## ✅ Testing & Deployment Checklist

### Pre-Deployment Testing

- [ ] All pages load without errors
- [ ] No hardcoded data anywhere
- [ ] No mock data in components
- [ ] Admin Content Manager controls 100% of website content
- [ ] Inventory Manager tracks all product variants
- [ ] DeepSeek API calls working
- [ ] Stripe payments processing
- [ ] Emails sending via SendGrid
- [ ] Images uploading to S3
- [ ] User authentication working
- [ ] Cart functionality working
- [ ] Checkout flow complete
- [ ] Order confirmation emails sending
- [ ] Admin dashboard fully functional
- [ ] Mobile responsive on all pages
- [ ] SEO metadata on all pages
- [ ] Error handling implemented
- [ ] Loading states on async operations

### Deployment Steps

1. **Database Setup:**
   ```bash
   # Production database
   npx prisma migrate deploy
   npx prisma db seed
   ```

2. **Environment Variables:**
   - Set all environment variables in hosting platform
   - Double-check DeepSeek API key is set
   - Verify Stripe webhook secret

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

4. **Post-Deployment:**
   - Test all functionality in production
   - Set up monitoring (Sentry, etc.)
   - Configure DNS
   - Enable SSL
   - Test Stripe webhooks with live mode

---

## 🚨 Common Mistakes to Avoid

1. **Hardcoding any data** → Always fetch from database
2. **Using OpenAI instead of DeepSeek** → Double-check API endpoint
3. **Not using transactions for stock updates** → Data corruption risk
4. **Forgetting to release reserved stock** → Customers can't buy available items
5. **Not tracking stock history** → No audit trail
6. **Making content not editable** → Violates core requirement
7. **Skipping error handling** → Bad user experience
8. **Not validating inputs** → Security vulnerabilities

---

## 📞 Support During Development

If you encounter issues:
1. Check this documentation first
2. Review PROJECT_SCOPE.md for feature requirements
3. Check DATABASE_SCHEMA.md for data structure
4. Email with specific error messages and code snippets
5. Weekly check-in meetings to review progress

---

**This is a complete, production-ready implementation guide. Follow every step and you'll deliver a perfect project with ZERO hardcoded data, ZERO mock data, and 100% admin-controlled content.**

*Last Updated: November 25, 2024*
