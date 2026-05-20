-- MASTER SCHEMA: Online Shopping & Recommendation System
CREATE DATABASE IF NOT EXISTS shopping_db;
USE shopping_db;

-- 1. CLEANUP (Ensures fresh start)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- 2. TABLE DEFINITIONS
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL,
    category_id BIGINT,
    image_url LONGTEXT,
    tags VARCHAR(255),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    total_amount DECIMAL(10, 2),
    discount_applied DECIMAL(10, 2) DEFAULT 0,
    payment_method VARCHAR(50),
    bank_name VARCHAR(20),
    psid VARCHAR(50),
    delivery_full_name VARCHAR(100),
    delivery_address TEXT,
    delivery_phone VARCHAR(30),
    delivery_city VARCHAR(50),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id)
);

CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT,
    product_id BIGINT,
    quantity INT,
    price_at_purchase DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 3. SEED DATA
-- Pre-creating the Admin User
INSERT INTO users (username, email, password) VALUES 
('Admin', 'hassanfarooq565656@gmail.com', '12345678');

INSERT INTO categories (name, description) VALUES 
('Electronics', 'Next-gen gadgets'),
('Fashion', 'Premium apparel'),
('Gaming', 'Pro hardware'),
('Home Luxury', 'Modern decor'),
('Books', 'Bestsellers');

-- INSERTING 50 PRODUCTS (10 PER CATEGORY)
INSERT INTO products (name, description, price, stock_quantity, category_id, tags, image_url) VALUES 
-- Electronics
('Quantum Phone 15', 'AI camera with titanium frame', 999.00, 50, 1, 'phone,tech', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500'),
('Aero Buds Pro', 'Spatial audio wireless buds', 199.00, 100, 1, 'audio,tech', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500'),
('Nebula Laptop', 'Ultra-thin OLED laptop', 1299.00, 20, 1, 'pc,tech', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500'),
('Smart Glass V1', 'AR overlay glasses', 450.00, 15, 1, 'vr,tech', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500'),
('Core Tablet', 'Creative touch device', 599.00, 40, 1, 'tablet,tech', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500'),
('Nano Drone', '4K aerial camera', 350.00, 10, 1, 'drone,tech', 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=500'),
('Volt Hub', 'Fastest wireless charger', 45.00, 200, 1, 'accessory,tech', 'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=500'),
('Echo Speaker', 'Omni-directional sound', 120.00, 80, 1, 'audio,home', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500'),
('Pulse Watch', 'Advanced heart tracking', 250.00, 50, 1, 'watch,tech', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'),
('Stream Mic', 'Studio quality condenser', 180.00, 30, 1, 'audio,pro', 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500'),

-- Fashion
('Vegan Leather Boots', 'Sustainable winter boots', 180.00, 60, 2, 'shoes,eco', 'https://images.unsplash.com/photo-1520639889410-d65c3ef0dfbb?w=500'),
('Silk Blazer', 'Pure Italian silk', 400.00, 20, 2, 'luxury,style', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500'),
('Wool Overcoat', 'Classic slim fit', 350.00, 15, 2, 'winter,style', 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500'),
('Cashmere Scarf', 'Premium soft wool', 80.00, 100, 2, 'luxury,style', 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=500'),
('Denim V2', 'Raw selvedge denim', 150.00, 45, 2, 'casual,style', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500'),
('Linen Shirt', 'Breathable summer fit', 70.00, 90, 2, 'casual,summer', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500'),
('Designer Belt', 'Hand-stitched leather', 120.00, 30, 2, 'luxury,accessory', 'https://images.unsplash.com/photo-1624222247344-550fb8ec505d?w=500'),
('Urban Hoodie', 'Heavyweight cotton', 90.00, 120, 2, 'casual,street', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500'),
('Gold Locket', '18k minimalist gold', 299.00, 10, 2, 'luxury,jewel', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500'),
('Canvas Tote', 'Durable travel bag', 55.00, 200, 2, 'bag,travel', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500'),

-- Gaming
('Titan Gaming Chair', 'Ergonomic racing design', 499.00, 25, 3, 'chair,pro', 'https://images.unsplash.com/photo-1598550476439-6847785fce6b?w=500'),
('Mech Keyboard', 'Clicky RGB mechanical', 160.00, 40, 3, 'pc,rgb', 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=500'),
('Pro Mouse', 'Ultralight 20k DPI', 90.00, 80, 3, 'pc,mouse', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500'),
('VR Headset', '4K standalone VR', 599.00, 10, 3, 'vr,tech', 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=500'),
('G-Sync Monitor', '144Hz 1ms curved', 450.00, 15, 3, 'pc,monitor', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500'),
('Console X', 'Fastest console ever', 499.00, 5, 3, 'console,pro', 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=500'),
('Gaming Pad', 'Custom pro controller', 75.00, 100, 3, 'console,pad', 'https://images.unsplash.com/photo-1592840331052-16e15c2c6f95?w=500'),
('RGB Case', 'Tempered glass airflow', 140.00, 30, 3, 'pc,case', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500'),
('GPU Turbo', '8K ready graphics', 999.00, 3, 3, 'pc,power', 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500'),
('Headset Pro', 'Noise-cancelling mic', 130.00, 50, 3, 'audio,pro', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500'),

-- Home Luxury
('Glass Chandelier', 'Modern geometric glass', 750.00, 5, 4, 'light,luxury', 'https://images.unsplash.com/photo-1542728928-1413eeae4d92?w=500'),
('Smart Table', 'Fridge + Speaker table', 899.00, 8, 4, 'tech,furniture', 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=500'),
('Velvet Sofa', 'Mid-century royal blue', 1200.00, 4, 4, 'furniture,luxury', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500'),
('Neon Lamp', 'Custom neon desktop light', 60.00, 40, 4, 'decor,rgb', 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=500'),
('Marble Vase', 'Solid white marble', 150.00, 20, 4, 'decor,art', 'https://images.unsplash.com/photo-1581404917879-53e19259fdda?w=500'),
('Silk Bedding', '100% pure mulberry', 350.00, 15, 4, 'luxury,home', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500'),
('Designer Rug', 'Hand-woven abstract', 600.00, 10, 4, 'decor,luxury', 'https://images.unsplash.com/photo-1575414003591-ece8d0416c7a?w=500'),
('Aroma Diffuser', 'Minimalist ceramic', 45.00, 100, 4, 'decor,relax', 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=500'),
('Gold Mirror', 'Sunburst wall mirror', 220.00, 12, 4, 'decor,gold', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500'),
('Abstract Art', 'Acrylic on canvas', 400.00, 5, 4, 'art,luxury', 'https://images.unsplash.com/photo-1554188248-986adbb73be4?w=500'),

-- Books
('The Ocean Soul', 'Nature photo collection', 85.00, 30, 5, 'photo,nature', 'https://images.unsplash.com/photo-1518998053574-53f026304502?w=500'),
('The Art of Coding', 'Mastering architecture', 45.00, 150, 5, 'tech,pro', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500'),
('The Silent Peak', 'Award-winning mystery', 22.00, 180, 5, 'mystery,fiction', 'https://images.unsplash.com/photo-1543004629-141a445693b2?w=500'),
('Future Shock', 'Decade of tech trends', 30.00, 200, 5, 'future,trends', 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=500'),
('Design Systems', 'Building interfaces', 55.00, 80, 5, 'design,tech', 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=500'),
('Sci-Fi Epic', 'Traveler of the stars', 25.00, 300, 5, 'fiction,stars', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500'),
('Gourmet Master', 'World cooking guide', 65.00, 50, 5, 'cook,hobby', 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=500'),
('Mindful Life', 'Modern meditation', 20.00, 400, 5, 'life,health', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500'),
('Startup Book', 'Building the unicorn', 40.00, 100, 5, 'business,tech', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=500');

-- Remove duplicate products (keeps lowest id per name)
DELETE p1 FROM products p1
INNER JOIN products p2 ON LOWER(TRIM(p1.name)) = LOWER(TRIM(p2.name)) AND p1.id > p2.id;
