-- ========================================================
-- SCHEMA DATABASE SUPABASE LENGKAP UNTUK BRAND HIJAB BY.NVDILA
-- Modest Wear Boutique CRM & Customer Portal
-- ========================================================

-- Aktifkan ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- 1. TABEL PENGGUNA & AKUN (USERS & AUTH)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- --------------------------------------------------------
-- 2. TABEL PENGATURAN TOKO (STORE SETTINGS)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    brand_name TEXT NOT NULL DEFAULT 'by.nvdila',
    tagline TEXT DEFAULT 'Sentuhan Elegan & Modest Fashion Terbaik',
    instagram TEXT DEFAULT '@by.nvdila',
    whatsapp TEXT DEFAULT '081234567890',
    bank_name TEXT DEFAULT 'Bank Central Asia (BCA)',
    bank_number TEXT DEFAULT '123-456-7890',
    bank_holder TEXT DEFAULT 'by.nvdila Boutique',
    qris_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- --------------------------------------------------------
-- 3. TABEL PRODUK (ETALASE HIJAB)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY, -- Contoh: 'PRD-001'
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Pashmina Viscose Modal',
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    colors TEXT NOT NULL, -- Contoh: 'Espresso, Mauve Taupe, Soft Sand'
    status TEXT NOT NULL DEFAULT 'Tersedia', -- 'Tersedia', 'Stok Menipis', 'Stok Habis'
    image TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- --------------------------------------------------------
-- 4. TABEL PELANGGAN (CUSTOMERS)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY, -- Contoh: 'CUST-001'
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    join_date DATE DEFAULT CURRENT_DATE,
    segment TEXT DEFAULT 'New Customer', -- 'New Customer', 'Regular Customer', 'Loyal Customer', 'VIP Customer', 'Inactive Customer'
    status TEXT DEFAULT 'Aktif', -- 'Aktif', 'Non-aktif'
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC(14, 2) DEFAULT 0,
    last_purchase_date DATE,
    points INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_segment ON public.customers(segment);

-- --------------------------------------------------------
-- 5. TABEL PESANAN (ORDERS)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- Contoh: 'ORD-2026-001'
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT NOT NULL, -- Wajib diisi alamat pengiriman
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array item pesanan [{productId, productName, color, price, quantity, subtotal}]
    total NUMERIC(14, 2) NOT NULL DEFAULT 0,
    order_date DATE DEFAULT CURRENT_DATE,
    order_status TEXT DEFAULT 'Processing', -- 'Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'
    payment_status TEXT DEFAULT 'Lunas', -- 'Lunas', 'Belum Bayar', 'Menunggu Verifikasi'
    payment_method TEXT DEFAULT 'Transfer Bank BCA',
    channel TEXT DEFAULT 'Website Portal',
    resi TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON public.orders(order_date DESC);

-- --------------------------------------------------------
-- 6. TABEL FOLLOW-UP CRM
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.followups (
    id TEXT PRIMARY KEY, -- Contoh: 'FLW-001'
    customer_id TEXT REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    category TEXT DEFAULT 'New Customer', -- 'New Customer', 'Inactive Customer', 'Product Recommendation', 'Special Offer'
    followup_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'Belum Dihubungi', -- 'Belum Dihubungi', 'Sedang Dihubungi', 'Selesai'
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_followups_status ON public.followups(status);
CREATE INDEX IF NOT EXISTS idx_followups_customer ON public.followups(customer_id);

-- --------------------------------------------------------
-- 7. TABEL CHAT & PESAN (LIVE CONSULTATION)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('customer', 'admin')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_chats_customer_id ON public.chats(customer_id, created_at ASC);

-- --------------------------------------------------------
-- 8. TABEL LOG AKTIVITAS (AUDIT TRAIL)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activities (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'order_created', 'customer_added', 'product_updated', dll.
    title TEXT NOT NULL,
    description TEXT,
    customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_activities_created ON public.activities(created_at DESC);

-- --------------------------------------------------------
-- 9. OTOMATISASI UPDATED_AT (TRIGGER FUNCTION)
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pasang trigger updated_at
DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER trigger_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_customers_updated_at ON public.customers;
CREATE TRIGGER trigger_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON public.orders;
CREATE TRIGGER trigger_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_followups_updated_at ON public.followups;
CREATE TRIGGER trigger_followups_updated_at
BEFORE UPDATE ON public.followups
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- --------------------------------------------------------
-- 10. STORED PROCEDURE: CANCEL ORDER & RESTORE STOCK
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_customer_order(target_order_id TEXT)
RETURNS JSONB AS $$
DECLARE
    ord RECORD;
    item RECORD;
    restored_items_count INT := 0;
BEGIN
    SELECT * INTO ord FROM public.orders WHERE id = target_order_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pesanan tidak ditemukan.');
    END IF;

    IF ord.order_status = 'Shipped' OR ord.order_status = 'Completed' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pesanan yang sudah dikirim atau selesai tidak dapat dibatalkan.');
    END IF;

    IF ord.order_status = 'Cancelled' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Pesanan sudah dibatalkan sebelumnya.');
    END IF;

    -- Kembalikan stok untuk setiap produk di items JSONB
    FOR item IN SELECT * FROM jsonb_to_recordset(ord.items) AS x(product_id TEXT, "productId" TEXT, quantity INT, qty INT)
    LOOP
        DECLARE
            pid TEXT := COALESCE(item."productId", item.product_id);
            amount INT := COALESCE(item.quantity, item.qty, 1);
        BEGIN
            IF pid IS NOT NULL THEN
                UPDATE public.products 
                SET stock = stock + amount,
                    status = CASE WHEN (stock + amount) > 5 THEN 'Tersedia' ELSE 'Stok Menipis' END
                WHERE id = pid;
                restored_items_count := restored_items_count + 1;
            END IF;
        END;
    END LOOP;

    -- Update status pesanan jadi Cancelled
    UPDATE public.orders SET order_status = 'Cancelled', updated_at = TIMEZONE('utc', NOW()) WHERE id = target_order_id;

    -- Catat aktivitas
    INSERT INTO public.activities (id, type, title, description, customer_id, created_at)
    VALUES (
        'ACT-' || FLOOR(RANDOM() * 899999 + 100000)::TEXT,
        'order_cancelled',
        'Pesanan Dibatalkan: ' || target_order_id,
        'Pelanggan membatalkan pesanan. Stok produk telah dikembalikan.',
        ord.customer_id,
        TIMEZONE('utc', NOW())
    );

    RETURN jsonb_build_object('success', true, 'message', 'Pesanan berhasil dibatalkan dan stok dikembalikan.');
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) & HAK AKSES
-- --------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses:
-- A. Pengguna & Auth
CREATE POLICY "Akses publik untuk registrasi akun" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Pengguna dapat membaca profil sendiri" ON public.users FOR SELECT USING (true);
CREATE POLICY "Pengguna dapat memperbarui profil" ON public.users FOR UPDATE USING (true) WITH CHECK (true);

-- B. Pengaturan Toko
CREATE POLICY "Pengaturan toko dapat dilihat semua orang" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admin dapat mengelola pengaturan toko" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);

-- C. Produk (Etalase Publik)
CREATE POLICY "Produk dapat dilihat oleh semua orang" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin dapat mengelola produk" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- D. Pesanan (Customer Checkout)
CREATE POLICY "Semua orang dapat membuat pesanan" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Akses penuh pesanan" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- E. Pelanggan, Followup, Chat, Activities
CREATE POLICY "Akses penuh pelanggan" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses penuh followups" ON public.followups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses penuh chats" ON public.chats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Akses penuh activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);

-- --------------------------------------------------------
-- 12. REALTIME PUBLICATION SUPABASE
-- --------------------------------------------------------
-- Mengaktifkan sinkronisasi realtime pada tabel-tabel utama
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;

-- --------------------------------------------------------
-- 13. SEED AKUN ADMIN RESMI SELLA & PENGATURAN DEFAULT
-- --------------------------------------------------------
INSERT INTO public.users (email, password_hash, name, role, phone, address)
VALUES (
    'sellanrhrdni123@gmail.com',
    'admin123',
    'Sella Nurhardiani',
    'admin',
    '081234567890',
    'Jakarta, Indonesia'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.store_settings (id, brand_name, tagline, instagram, whatsapp, bank_name, bank_number, bank_holder)
VALUES (
    'default',
    'by.nvdila',
    'Sentuhan Elegan & Modest Fashion Terbaik',
    '@by.nvdila',
    '081234567890',
    'Bank Central Asia (BCA)',
    '123-456-7890',
    'by.nvdila Boutique'
)
ON CONFLICT (id) DO NOTHING;
