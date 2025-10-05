import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-551107ff/health", (c) => {
  return c.json({ status: "ok" });
});

// Auth routes
app.post("/make-server-551107ff/auth/signup", async (c) => {
  try {
    const { email, password, name, phone } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, phone },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Signup error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Store additional user info in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      phone,
      avatar: null,
      facebook: null,
      drivingLicense: null,
      creditScore: 100,
      verified: false
    });

    return c.json({ user: data.user }, 201);
  } catch (error) {
    console.log(`Signup processing error: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get user profile
app.get("/make-server-551107ff/auth/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    return c.json({ user: userProfile || user });
  } catch (error) {
    console.log(`Profile fetch error: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update user profile
app.put("/make-server-551107ff/auth/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const updates = await c.req.json();
    const currentProfile = await kv.get(`user:${user.id}`) || {};
    const updatedProfile = { ...currentProfile, ...updates };
    
    await kv.set(`user:${user.id}`, updatedProfile);
    return c.json({ user: updatedProfile });
  } catch (error) {
    console.log(`Profile update error: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Vehicle routes
app.get("/make-server-551107ff/vehicles", async (c) => {
  try {
    const type = c.req.query('type'); // 'car' or 'motorcycle'
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '12');
    
    const vehicles = await kv.getByPrefix(`vehicle:${type}:`) || [];
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return c.json({
      vehicles: vehicles.slice(startIndex, endIndex),
      total: vehicles.length,
      page,
      totalPages: Math.ceil(vehicles.length / limit)
    });
  } catch (error) {
    console.log(`Vehicle listing error: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/make-server-551107ff/vehicles/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const vehicle = await kv.get(`vehicle:${id}`);
    
    if (!vehicle) {
      return c.json({ error: "Vehicle not found" }, 404);
    }

    return c.json({ vehicle });
  } catch (error) {
    console.log(`Vehicle detail error: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Booking routes
app.post("/make-server-551107ff/bookings", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { vehicleId, startDate, endDate, totalPrice, insurance, discountCode } = await c.req.json();
    
    const booking = {
      id: crypto.randomUUID(),
      userId: user.id,
      vehicleId,
      startDate,
      endDate,
      totalPrice,
      insurance,
      discountCode,
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
      paymentStatus: 'pending'
    };

    await kv.set(`booking:${booking.id}`, booking);
    await kv.set(`user_booking:${user.id}:${booking.id}`, booking.id);

    return c.json({ booking }, 201);
  } catch (error) {
    console.log(`Booking creation error: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get user bookings
app.get("/make-server-551107ff/bookings/user", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (!user || error) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const bookingIds = await kv.getByPrefix(`user_booking:${user.id}:`) || [];
    const bookings = await kv.mget(bookingIds.map(id => `booking:${id}`));

    return c.json({ bookings: bookings.filter(Boolean) });
  } catch (error) {
    console.log(`User bookings fetch error: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Initialize sample data
app.post("/make-server-551107ff/init-data", async (c) => {
  try {
    // Sample cars (30 vehicles)
    const cars = [
      // Toyota vehicles
      {
        id: 'car-1',
        type: 'car',
        name: 'Toyota Camry 2023',
        brand: 'Toyota',
        model: 'Camry',
        transmission: 'automatic',
        seats: 5,
        fuel: 'Xăng',
        consumption: '7.5L/100km',
        pricePerHour: 150000,
        pricePerDay: 1200000,
        location: 'Quận 1, TP.HCM',
        coordinates: { lat: 10.7769, lng: 106.7009 },
        images: [
          'https://images.unsplash.com/photo-1624578571415-09e9b1991929?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b3lvdGElMjBjYW1yeSUyMHNlZGFufGVufDF8fHx8MTc1OTU4ODA3N3ww&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'Xe sedan cao cấp Toyota Camry với nội thất sang trọng, động cơ mạnh mẽ và tiết kiệm nhiên liệu. Phù hợp cho các chuyến đi gia đình và công việc.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera lùi', 'Cổng USB', 'Túi khí an toàn', 'Điều hòa tự động', 'Cửa sổ trời'],
        available: true,
        rating: 4.8,
        reviewCount: 125
      },
      {
        id: 'car-2',
        type: 'car',
        name: 'Toyota Vios 2023',
        brand: 'Toyota',
        model: 'Vios',
        transmission: 'manual',
        seats: 5,
        fuel: 'Xăng',
        consumption: '6.2L/100km',
        pricePerHour: 100000,
        pricePerDay: 800000,
        location: 'Quận 3, TP.HCM',
        coordinates: { lat: 10.7861, lng: 106.6922 },
        images: [
          'https://images.unsplash.com/photo-1624578571415-09e9b1991929?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b3lvdGElMjBjYW1yeSUyMHNlZGFufGVufDF8fHx8MTc1OTU4ODA3N3ww&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'Toyota Vios sedan tiết kiệm nhiên liệu, phù hợp cho những chuyến đi trong thành phố. Thiết kế hiện đại và không gian rộng rãi.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera lùi', 'Cổng USB', 'Túi khí an toàn'],
        available: true,
        rating: 4.5,
        reviewCount: 89
      },
      {
        id: 'car-3',
        type: 'car',
        name: 'Toyota Fortuner 2023',
        brand: 'Toyota',
        model: 'Fortuner',
        transmission: 'automatic',
        seats: 7,
        fuel: 'Dầu diesel',
        consumption: '8.2L/100km',
        pricePerHour: 200000,
        pricePerDay: 1600000,
        location: 'Quận 7, TP.HCM',
        coordinates: { lat: 10.7244, lng: 106.7226 },
        images: [
          'https://images.unsplash.com/photo-1758411898310-ada9284a3086?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTVVYlMjBjYXIlMjByZW50YWx8ZW58MXx8fHwxNzU5NTg1MjAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'SUV 7 chỗ Toyota Fortuner mạnh mẽ, thích hợp cho những chuyến du lịch gia đình hoặc nhóm bạn. Khả năng vận hành địa hình tốt.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera 360', 'Cổng USB', 'Túi khí an toàn', 'Điều hòa 3 vùng', 'Cửa sổ trời'],
        available: true,
        rating: 4.7,
        reviewCount: 156
      },
      // Honda vehicles
      {
        id: 'car-4',
        type: 'car',
        name: 'Honda City 2023',
        brand: 'Honda',
        model: 'City',
        transmission: 'automatic',
        seats: 5,
        fuel: 'Xăng',
        consumption: '6.8L/100km',
        pricePerHour: 110000,
        pricePerDay: 900000,
        location: 'Quận 10, TP.HCM',
        coordinates: { lat: 10.7756, lng: 106.6669 },
        images: [
          'https://images.unsplash.com/photo-1686074449582-6374eaebacf3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob25kYSUyMGNpdmljJTIwY2FyfGVufDF8fHx8MTc1OTU4ODA3M3ww&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'Honda City sedan thời trang với thiết kế trẻ trung và công nghệ tiên tiến. Lý tưởng cho việc di chuyển hàng ngày.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera lùi', 'Cổng USB', 'Túi khí an toàn', 'Điều hòa tự động'],
        available: true,
        rating: 4.6,
        reviewCount: 102
      },
      {
        id: 'car-5',
        type: 'car',
        name: 'Honda Civic 2023',
        brand: 'Honda',
        model: 'Civic',
        transmission: 'automatic',
        seats: 5,
        fuel: 'Xăng',
        consumption: '7.2L/100km',
        pricePerHour: 140000,
        pricePerDay: 1100000,
        location: 'Quận 2, TP.HCM',
        coordinates: { lat: 10.8031, lng: 106.7234 },
        images: [
          'https://images.unsplash.com/photo-1686074449582-6374eaebacf3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob25kYSUyMGNpdmljJTIwY2FyfGVufDF8fHx8MTc1OTU4ODA3M3ww&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'Honda Civic sedan thể thao với hiệu suất vượt trội và thiết kế năng động. Phù hợp cho những ai yêu thích sự mạnh mẽ.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera lùi', 'Cổng USB', 'Túi khí an toàn', 'Cửa sổ trời', 'Âm thanh Bose'],
        available: true,
        rating: 4.7,
        reviewCount: 134
      },
      {
        id: 'car-6',
        type: 'car',
        name: 'Honda CR-V 2023',
        brand: 'Honda',
        model: 'CR-V',
        transmission: 'automatic',
        seats: 7,
        fuel: 'Xăng',
        consumption: '8.0L/100km',
        pricePerHour: 180000,
        pricePerDay: 1400000,
        location: 'Quận 5, TP.HCM',
        coordinates: { lat: 10.7590, lng: 106.6802 },
        images: [
          'https://images.unsplash.com/photo-1758411898310-ada9284a3086?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTVVYlMjBjYXIlMjByZW50YWx8ZW58MXx8fHwxNzU5NTg1MjAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'SUV Honda CR-V rộng rãi và tiện nghi, lý tưởng cho gia đình đông người. Trang bị công nghệ Honda Sensing.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera 360', 'Cổng USB-C', 'Túi khí an toàn', 'Điều hòa 3 vùng', 'Honda Sensing'],
        available: true,
        rating: 4.8,
        reviewCount: 167
      },
      // Hyundai vehicles
      {
        id: 'car-7',
        type: 'car',
        name: 'Hyundai Elantra 2023',
        brand: 'Hyundai',
        model: 'Elantra',
        transmission: 'automatic',
        seats: 5,
        fuel: 'Xăng',
        consumption: '7.0L/100km',
        pricePerHour: 130000,
        pricePerDay: 1000000,
        location: 'Quận 4, TP.HCM',
        coordinates: { lat: 10.7594, lng: 106.7044 },
        images: [
          'https://images.unsplash.com/photo-1646206276813-55812e6e6795?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoeXVuZGFpJTIwZWxhbnRyYSUyMHNlZGFufGVufDF8fHx8MTc1OTY2NzcwNXww&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'Hyundai Elantra sedan với thiết kế hiện đại và trang bị công nghệ tiên tiến. Mang lại trải nghiệm lái xe thoải mái.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera lùi', 'Cổng USB', 'Túi khí an toàn', 'Màn hình cảm ứng 8 inch'],
        available: true,
        rating: 4.5,
        reviewCount: 98
      },
      {
        id: 'car-8',
        type: 'car',
        name: 'Hyundai Accent 2023',
        brand: 'Hyundai',
        model: 'Accent',
        transmission: 'manual',
        seats: 5,
        fuel: 'Xăng',
        consumption: '6.5L/100km',
        pricePerHour: 95000,
        pricePerDay: 750000,
        location: 'Quận 6, TP.HCM',
        coordinates: { lat: 10.7463, lng: 106.6296 },
        images: [
          'https://images.unsplash.com/photo-1646206276813-55812e6e6795?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoeXVuZGFpJTIwZWxhbnRyYSUyMHNlZGFufGVufDF8fHx8MTc1OTY2NzcwNXww&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'Hyundai Accent sedan nhỏ gọn và tiết kiệm, phù hợp cho những chuyến đi ngắn trong thành phố.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera lùi', 'Cổng USB', 'Túi khí an toàn'],
        available: true,
        rating: 4.3,
        reviewCount: 76
      },
      {
        id: 'car-9',
        type: 'car',
        name: 'Hyundai Tucson 2023',
        brand: 'Hyundai',
        model: 'Tucson',
        transmission: 'automatic',
        seats: 5,
        fuel: 'Xăng',
        consumption: '8.5L/100km',
        pricePerHour: 170000,
        pricePerDay: 1350000,
        location: 'Quận 8, TP.HCM',
        coordinates: { lat: 10.7378, lng: 106.6621 },
        images: [
          'https://images.unsplash.com/photo-1758411898310-ada9284a3086?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTVVYlMjBjYXIlMjByZW50YWx8ZW58MXx8fHwxNzU5NTg1MjAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'SUV Hyundai Tucson thời trang với không gian rộng rãi và trang bị công nghệ thông minh.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera 360', 'Cổng USB', 'Túi khí an toàn', 'Màn hình 10.25 inch', 'Sạc không dây'],
        available: true,
        rating: 4.6,
        reviewCount: 143
      },
      // Mazda vehicles
      {
        id: 'car-10',
        type: 'car',
        name: 'Mazda 3 2023',
        brand: 'Mazda',
        model: 'Mazda3',
        transmission: 'automatic',
        seats: 5,
        fuel: 'Xăng',
        consumption: '6.9L/100km',
        pricePerHour: 135000,
        pricePerDay: 1050000,
        location: 'Quận 9, TP.HCM',
        coordinates: { lat: 10.8142, lng: 106.8289 },
        images: [
          'https://images.unsplash.com/photo-1658662160331-62f7e52e63de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXpkYSUyMHNlZGFuJTIwY2FyfGVufDF8fHx8MTc1OTY2NzcwN3ww&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'Mazda3 sedan sang trọng với thiết kế KODO và công nghệ SkyActiv. Mang lại cảm giác lái thể thao.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera lùi', 'Cổng USB', 'Túi khí an toàn', 'Âm thanh Bose', 'Head-up Display'],
        available: true,
        rating: 4.7,
        reviewCount: 112
      },
      {
        id: 'car-11',
        type: 'car',
        name: 'Mazda 6 2023',
        brand: 'Mazda',
        model: 'Mazda6',
        transmission: 'automatic',
        seats: 5,
        fuel: 'Xăng',
        consumption: '7.8L/100km',
        pricePerHour: 160000,
        pricePerDay: 1250000,
        location: 'Quận 11, TP.HCM',
        coordinates: { lat: 10.7625, lng: 106.6509 },
        images: [
          'https://images.unsplash.com/photo-1658662160331-62f7e52e63de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXpkYSUyMHNlZGFuJTIwY2FyfGVufDF8fHx8MTc1OTY2NzcwN3ww&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'Mazda6 sedan cao cấp với thiết kế tinh tế và công nghệ i-ACTIVSENSE. Phù hợp cho công việc và du lịch.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera 360', 'Cổng USB', 'Túi khí an toàn', 'Điều hòa 2 vùng', 'Cửa sổ trời'],
        available: true,
        rating: 4.8,
        reviewCount: 189
      },
      {
        id: 'car-12',
        type: 'car',
        name: 'Mazda CX-5 2023',
        brand: 'Mazda',
        model: 'CX-5',
        transmission: 'automatic',
        seats: 5,
        fuel: 'Xăng',
        consumption: '8.3L/100km',
        pricePerHour: 175000,
        pricePerDay: 1380000,
        location: 'Quận 12, TP.HCM',
        coordinates: { lat: 10.8676, lng: 106.6976 },
        images: [
          'https://images.unsplash.com/photo-1758411898310-ada9284a3086?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTVVYlMjBjYXIlMjByZW50YWx8ZW58MXx8fHwxNzU5NTg1MjAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'SUV Mazda CX-5 với thiết kế KODO đẹp mắt và khả năng vận hành ấn tượng. Lựa chọn tuyệt vời cho gia đình.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera 360', 'Cổng USB', 'Túi khí an toàn', 'i-ACTIVSENSE', 'Màn hình 10.25 inch'],
        available: true,
        rating: 4.7,
        reviewCount: 198
      },
      // Ford vehicles
      {
        id: 'car-13',
        type: 'car',
        name: 'Ford Focus 2023',
        brand: 'Ford',
        model: 'Focus',
        transmission: 'automatic',
        seats: 5,
        fuel: 'Xăng',
        consumption: '7.1L/100km',
        pricePerHour: 125000,
        pricePerDay: 980000,
        location: 'Gò Vấp, TP.HCM',
        coordinates: { lat: 10.8231, lng: 106.6904 },
        images: [
          'https://images.unsplash.com/photo-1737820720284-eaf24739d243?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JkJTIwZm9jdXMlMjBzZWRhbnxlbnwxfHx8fDE3NTk2Njc3MTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'Ford Focus hatchback với động cơ EcoBoost tiết kiệm nhiên liệu và hệ thống SYNC 3 thông minh.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera lùi', 'Cổng USB', 'Túi khí an toàn', 'SYNC 3'],
        available: true,
        rating: 4.4,
        reviewCount: 87
      },
      {
        id: 'car-14',
        type: 'car',
        name: 'Ford Everest 2023',
        brand: 'Ford',
        model: 'Everest',
        transmission: 'automatic',
        seats: 7,
        fuel: 'Dầu diesel',
        consumption: '8.8L/100km',
        pricePerHour: 195000,
        pricePerDay: 1550000,
        location: 'Tân Bình, TP.HCM',
        coordinates: { lat: 10.8009, lng: 106.6536 },
        images: [
          'https://images.unsplash.com/photo-1758411898310-ada9284a3086?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTVVYlMjBjYXIlMjByZW50YWx8ZW58MXx8fHwxNzU5NTg1MjAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'SUV Ford Everest 7 chỗ với khả năng off-road mạnh mẽ và nội thất cao cấp. Lý tưởng cho những chuyến phiêu lưu.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera 360', 'Cổng USB', 'Túi khí an toàn', 'Điều hòa 3 vùng', 'Terrain Management'],
        available: true,
        rating: 4.6,
        reviewCount: 172
      },
      {
        id: 'car-15',
        type: 'car',
        name: 'Ford Ranger 2023',
        brand: 'Ford',
        model: 'Ranger',
        transmission: 'manual',
        seats: 4,
        fuel: 'Dầu diesel',
        consumption: '9.2L/100km',
        pricePerHour: 165000,
        pricePerDay: 1300000,
        location: 'Bình Thạnh, TP.HCM',
        coordinates: { lat: 10.8014, lng: 106.7109 },
        images: [
          'https://images.unsplash.com/photo-1737820720284-eaf24739d243?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JkJTIwZm9jdXMlMjBzZWRhbnxlbnwxfHx8fDE3NTk2Njc3MTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'Bán tải Ford Ranger mạnh mẽ, phù hợp cho vận chuyển hàng hóa và những chuyến đi off-road.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera lùi', 'Cổng USB', 'Túi khí an toàn'],
        available: false,
        rating: 4.5,
        reviewCount: 134
      },
      // Kia vehicles
      {
        id: 'car-16',
        type: 'car',
        name: 'Kia Cerato 2023',
        brand: 'Kia',
        model: 'Cerato',
        transmission: 'automatic',
        seats: 5,
        fuel: 'Xăng',
        consumption: '6.7L/100km',
        pricePerHour: 115000,
        pricePerDay: 920000,
        location: 'Phú Nhuận, TP.HCM',
        coordinates: { lat: 10.7981, lng: 106.6825 },
        images: [
          'https://images.unsplash.com/photo-1750493601689-30a06059092a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWElMjBjZXJhdG8lMjBzZWRhbnxlbnwxfHx8fDE3NTk2Njc3MTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'Kia Cerato sedan thông minh với thiết kế hiện đại và trang bị công nghệ tiên tiến.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera lùi', 'Cổng USB', 'Túi khí an toàn', 'Màn hình 8 inch'],
        available: true,
        rating: 4.4,
        reviewCount: 93
      },
      {
        id: 'car-17',
        type: 'car',
        name: 'Kia Seltos 2023',
        brand: 'Kia',
        model: 'Seltos',
        transmission: 'automatic',
        seats: 5,
        fuel: 'Xăng',
        consumption: '8.1L/100km',
        pricePerHour: 155000,
        pricePerDay: 1200000,
        location: 'Thủ Đức, TP.HCM',
        coordinates: { lat: 10.8459, lng: 106.7621 },
        images: [
          'https://images.unsplash.com/photo-1758411898310-ada9284a3086?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTVVYlMjBjYXIlMjByZW50YWx8ZW58MXx8fHwxNzU5NTg1MjAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'SUV Kia Seltos năng động với thiết kế trẻ trung và trang bị hiện đại. Phù hợp cho giới trẻ.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera 360', 'Cổng USB', 'Túi khí an toàn', 'Màn hình 10.25 inch', 'Sạc không dây'],
        available: true,
        rating: 4.5,
        reviewCount: 146
      },
      {
        id: 'car-18',
        type: 'car',
        name: 'Kia Sorento 2023',
        brand: 'Kia',
        model: 'Sorento',
        transmission: 'automatic',
        seats: 7,
        fuel: 'Dầu diesel',
        consumption: '8.7L/100km',
        pricePerHour: 185000,
        pricePerDay: 1450000,
        location: 'Hóc Môn, TP.HCM',
        coordinates: { lat: 10.8804, lng: 106.5986 },
        images: [
          'https://images.unsplash.com/photo-1758411898310-ada9284a3086?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTVVYlMjBjYXIlMjByZW50YWx8ZW58MXx8fHwxNzU5NTg1MjAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'SUV Kia Sorento 7 chỗ cao cấp với nội thất sang trọng và công nghệ thông minh.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera 360', 'Cổng USB-C', 'Túi khí an toàn', 'Điều hòa 3 vùng', 'Âm thanh Harman Kardon'],
        available: true,
        rating: 4.7,
        reviewCount: 201
      },
      // More Toyota models
      {
        id: 'car-19',
        type: 'car',
        name: 'Toyota Corolla Altis 2023',
        brand: 'Toyota',
        model: 'Corolla Altis',
        transmission: 'automatic',
        seats: 5,
        fuel: 'Xăng',
        consumption: '6.9L/100km',
        pricePerHour: 140000,
        pricePerDay: 1100000,
        location: 'Củ Chi, TP.HCM',
        coordinates: { lat: 10.9698, lng: 106.4921 },
        images: [
          'https://images.unsplash.com/photo-1624578571415-09e9b1991929?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b3lvdGElMjBjYW1yeSUyMHNlZGFufGVufDF8fHx8MTc1OTU4ODA3N3ww&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'Toyota Corolla Altis sedan đáng tin cậy với độ bền cao và chi phí vận hành thấp.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera lùi', 'Cổng USB', 'Túi khí an toàn', 'Toyota Safety Sense'],
        available: true,
        rating: 4.6,
        reviewCount: 118
      },
      {
        id: 'car-20',
        type: 'car',
        name: 'Toyota Innova Cross 2023',
        brand: 'Toyota',
        model: 'Innova Cross',
        transmission: 'automatic',
        seats: 8,
        fuel: 'Xăng',
        consumption: '8.4L/100km',
        pricePerHour: 190000,
        pricePerDay: 1500000,
        location: 'Cần Giờ, TP.HCM',
        coordinates: { lat: 10.5892, lng: 106.9570 },
        images: [
          'https://images.unsplash.com/photo-1758411898310-ada9284a3086?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTVVYlMjBjYXIlMjByZW50YWx8ZW58MXx8fHwxNzU5NTg1MjAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'MPV Toyota Innova Cross 8 chỗ với thiết kế mới mẻ và không gian rộng rãi cho gia đình đông người.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera 360', 'Cổng USB', 'Túi khí an toàn', 'Điều hòa 3 vùng', 'Màn hình 9 inch'],
        available: true,
        rating: 4.8,
        reviewCount: 167
      },
      // More Honda models
      {
        id: 'car-21',
        type: 'car',
        name: 'Honda Accord 2023',
        brand: 'Honda',
        model: 'Accord',
        transmission: 'automatic',
        seats: 5,
        fuel: 'Xăng',
        consumption: '7.3L/100km',
        pricePerHour: 165000,
        pricePerDay: 1300000,
        location: 'Nhà Bè, TP.HCM',
        coordinates: { lat: 10.7036, lng: 106.7258 },
        images: [
          'https://images.unsplash.com/photo-1686074449582-6374eaebacf3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob25kYSUyMGNpdmljJTIwY2FyfGVufDF8fHx8MTc1OTU4ODA3M3ww&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'Honda Accord sedan cao cấp với động cơ turbo mạnh mẽ và nội thất sang trọng.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera 360', 'Cổng USB-C', 'Túi khí an toàn', 'Honda Sensing', 'Cửa sổ trời'],
        available: true,
        rating: 4.9,
        reviewCount: 203
      },
      {
        id: 'car-22',
        type: 'car',
        name: 'Honda Jazz 2023',
        brand: 'Honda',
        model: 'Jazz',
        transmission: 'automatic',
        seats: 5,
        fuel: 'Xăng',
        consumption: '6.1L/100km',
        pricePerHour: 105000,
        pricePerDay: 850000,
        location: 'Bình Chánh, TP.HCM',
        coordinates: { lat: 10.7411, lng: 106.6269 },
        images: [
          'https://images.unsplash.com/photo-1686074449582-6374eaebacf3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob25kYSUyMGNpdmljJTIwY2FyfGVufDF8fHx8MTc1OTU4ODA3M3ww&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'Honda Jazz hatchback nhỏ gọn và tiết kiệm nhiên liệu, lý tưởng cho việc di chuyển trong thành phố.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera lùi', 'Cổng USB', 'Túi khí an toàn'],
        available: true,
        rating: 4.3,
        reviewCount: 85
      },
      // More Hyundai models
      {
        id: 'car-23',
        type: 'car',
        name: 'Hyundai Santafe 2023',
        brand: 'Hyundai',
        model: 'Santafe',
        transmission: 'automatic',
        seats: 7,
        fuel: 'Dầu diesel',
        consumption: '9.1L/100km',
        pricePerHour: 200000,
        pricePerDay: 1600000,
        location: 'Quận 1, TP.HCM',
        coordinates: { lat: 10.7694, lng: 106.6917 },
        images: [
          'https://images.unsplash.com/photo-1758411898310-ada9284a3086?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTVVYlMjBjYXIlMjByZW50YWx8ZW58MXx8fHwxNzU5NTg1MjAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'SUV Hyundai Santafe cao cấp 7 chỗ với thiết kế sang trọng và trang bị đầy đủ.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera 360', 'Cổng USB-C', 'Túi khí an toàn', 'Điều hòa 3 vùng', 'Âm thanh Infinity'],
        available: true,
        rating: 4.8,
        reviewCount: 234
      },
      // More Mazda models
      {
        id: 'car-24',
        type: 'car',
        name: 'Mazda 2 2023',
        brand: 'Mazda',
        model: 'Mazda2',
        transmission: 'automatic',
        seats: 5,
        fuel: 'Xăng',
        consumption: '5.8L/100km',
        pricePerHour: 100000,
        pricePerDay: 800000,
        location: 'Quận 3, TP.HCM',
        coordinates: { lat: 10.7756, lng: 106.6954 },
        images: [
          'https://images.unsplash.com/photo-1658662160331-62f7e52e63de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXpkYSUyMHNlZGFuJTIwY2FyfGVufDF8fHx8MTc1OTY2NzcwN3ww&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'Mazda2 hatchback nhỏ gọn với thiết kế KODO và công nghệ SkyActiv tiết kiệm nhiên liệu.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera lùi', 'Cổng USB', 'Túi khí an toàn'],
        available: true,
        rating: 4.4,
        reviewCount: 76
      },
      // More Ford models
      {
        id: 'car-25',
        type: 'car',
        name: 'Ford EcoSport 2023',
        brand: 'Ford',
        model: 'EcoSport',
        transmission: 'automatic',
        seats: 5,
        fuel: 'Xăng',
        consumption: '7.6L/100km',
        pricePerHour: 135000,
        pricePerDay: 1080000,
        location: 'Quận 5, TP.HCM',
        coordinates: { lat: 10.7544, lng: 106.6779 },
        images: [
          'https://images.unsplash.com/photo-1758411898310-ada9284a3086?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTVVYlMjBjYXIlMjByZW50YWx8ZW58MXx8fHwxNzU5NTg1MjAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'SUV compact Ford EcoSport linh hoạt trong thành phố với động cơ EcoBoost.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera lùi', 'Cổng USB', 'Túi khí an toàn', 'SYNC 3'],
        available: false,
        rating: 4.2,
        reviewCount: 98
      },
      // More Kia models
      {
        id: 'car-26',
        type: 'car',
        name: 'Kia Morning 2023',
        brand: 'Kia',
        model: 'Morning',
        transmission: 'manual',
        seats: 5,
        fuel: 'Xăng',
        consumption: '5.5L/100km',
        pricePerHour: 85000,
        pricePerDay: 680000,
        location: 'Quận 7, TP.HCM',
        coordinates: { lat: 10.7378, lng: 106.7198 },
        images: [
          'https://images.unsplash.com/photo-1750493601689-30a06059092a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxraWElMjBjZXJhdG8lMjBzZWRhbnxlbnwxfHx8fDE3NTk2Njc3MTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'Kia Morning hatchback nhỏ gọn và tiết kiệm, phù hợp cho người mới lái xe.',
        amenities: ['Bluetooth', 'Cổng USB', 'Túi khí an toàn'],
        available: true,
        rating: 4.1,
        reviewCount: 64
      },
      // Additional luxury models
      {
        id: 'car-27',
        type: 'car',
        name: 'Toyota Land Cruiser 2023',
        brand: 'Toyota',
        model: 'Land Cruiser',
        transmission: 'automatic',
        seats: 8,
        fuel: 'Dầu diesel',
        consumption: '11.2L/100km',
        pricePerHour: 300000,
        pricePerDay: 2400000,
        location: 'Quận 2, TP.HCM',
        coordinates: { lat: 10.7942, lng: 106.7319 },
        images: [
          'https://images.unsplash.com/photo-1758411898310-ada9284a3086?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTVVYlMjBjYXIlMjByZW50YWx8ZW58MXx8fHwxNzU5NTg1MjAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'SUV cao cấp Toyota Land Cruiser với khả năng off-road hàng đầu và nội thất sang trọng.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera 360', 'Cổng USB-C', 'Túi khí an toàn', 'Điều hòa 4 vùng', 'JBL Premium Audio', 'Crawl Control'],
        available: true,
        rating: 4.9,
        reviewCount: 156
      },
      {
        id: 'car-28',
        type: 'car',
        name: 'Honda HR-V 2023',
        brand: 'Honda',
        model: 'HR-V',
        transmission: 'automatic',
        seats: 5,
        fuel: 'Xăng',
        consumption: '7.4L/100km',
        pricePerHour: 145000,
        pricePerDay: 1150000,
        location: 'Quận 9, TP.HCM',
        coordinates: { lat: 10.8376, lng: 106.8025 },
        images: [
          'https://images.unsplash.com/photo-1758411898310-ada9284a3086?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTVVYlMjBjYXIlMjByZW50YWx8ZW58MXx8fHwxNzU5NTg1MjAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'SUV compact Honda HR-V với thiết kế coupe thể thao và không gian nội thất linh hoạt.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera lùi', 'Cổng USB', 'Túi khí an toàn', 'Honda Sensing', 'Màn hình 7 inch'],
        available: true,
        rating: 4.5,
        reviewCount: 127
      },
      {
        id: 'car-29',
        type: 'car',
        name: 'Mazda CX-8 2023',
        brand: 'Mazda',
        model: 'CX-8',
        transmission: 'automatic',
        seats: 7,
        fuel: 'Dầu diesel',
        consumption: '8.9L/100km',
        pricePerHour: 210000,
        pricePerDay: 1680000,
        location: 'Quận 11, TP.HCM',
        coordinates: { lat: 10.7645, lng: 106.6490 },
        images: [
          'https://images.unsplash.com/photo-1758411898310-ada9284a3086?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTVVYlMjBjYXIlMjByZW50YWx8ZW58MXx8fHwxNzU5NTg1MjAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'SUV Mazda CX-8 cao cấp 7 chỗ với thiết kế KODO thanh lịch và công nghệ i-ACTIVSENSE.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera 360', 'Cổng USB', 'Túi khí an toàn', 'i-ACTIVSENSE', 'Âm thanh Bose', 'Màn hình 8 inch'],
        available: true,
        rating: 4.8,
        reviewCount: 178
      },
      {
        id: 'car-30',
        type: 'car',
        name: 'Ford Territory 2023',
        brand: 'Ford',
        model: 'Territory',
        transmission: 'automatic',
        seats: 5,
        fuel: 'Xăng',
        consumption: '8.0L/100km',
        pricePerHour: 160000,
        pricePerDay: 1280000,
        location: 'Quận 12, TP.HCM',
        coordinates: { lat: 10.8563, lng: 106.6958 },
        images: [
          'https://images.unsplash.com/photo-1758411898310-ada9284a3086?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTVVYlMjBjYXIlMjByZW50YWx8ZW58MXx8fHwxNzU5NTg1MjAyfDA&ixlib=rb-4.1.0&q=80&w=1080',
          'https://images.unsplash.com/photo-1599912027667-755b68b4dd3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjYXIlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NTk1NjQxNDN8MA&ixlib=rb-4.1.0&q=80&w=1080'
        ],
        description: 'SUV Ford Territory với thiết kế hiện đại và trang bị công nghệ thông minh tiên tiến.',
        amenities: ['Bản đồ GPS', 'Bluetooth', 'Camera 360', 'Cổng USB-C', 'Túi khí an toàn', 'SYNC 4', 'Màn hình 12.3 inch', 'Sạc không dây'],
        available: true,
        rating: 4.6,
        reviewCount: 194
      }
    ];

    // Sample motorcycles
    const motorcycles = [
      {
        id: 'motor-1',
        type: 'motorcycle',
        name: 'Honda Air Blade 2023',
        brand: 'Honda',
        model: 'Air Blade',
        engineType: 'tay ga',
        seats: 2,
        fuel: 'Xăng',
        consumption: '2.1L/100km',
        pricePerHour: 25000,
        pricePerDay: 180000,
        location: 'Quận 1, TP.HCM',
        coordinates: { lat: 10.7769, lng: 106.7009 },
        images: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
        ],
        description: 'Xe tay ga hiện đại, tiết kiệm nhiên liệu',
        available: true,
        rating: 4.7,
        reviewCount: 203
      },
      {
        id: 'motor-2',
        type: 'motorcycle',
        name: 'Yamaha Exciter 155',
        brand: 'Yamaha',
        model: 'Exciter',
        engineType: 'số',
        seats: 2,
        fuel: 'Xăng',
        consumption: '2.3L/100km',
        pricePerHour: 30000,
        pricePerDay: 220000,
        location: 'Quận 5, TP.HCM',
        coordinates: { lat: 10.7590, lng: 106.6802 },
        images: [
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
        ],
        description: 'Xe số thể thao, phù hợp cho những chuyến đi dài',
        available: true,
        rating: 4.5,
        reviewCount: 156
      }
    ];

    // Store vehicles
    for (const car of cars) {
      await kv.set(`vehicle:car:${car.id}`, car);
      await kv.set(`vehicle:${car.id}`, car);
    }

    for (const motorcycle of motorcycles) {
      await kv.set(`vehicle:motorcycle:${motorcycle.id}`, motorcycle);
      await kv.set(`vehicle:${motorcycle.id}`, motorcycle);
    }

    return c.json({ message: "Sample data initialized successfully" });
  } catch (error) {
    console.log(`Data initialization error: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

Deno.serve(app.fetch);