-- Sentetik test verisi: 100 ürün × 5 mağaza × 500 gün = 250.000 fiyat kaydı.
-- Katalog ile fiyat/hesap şemaları kurulduktan sonra dosyayı SQL script olarak çalıştırın.
USE gearcompare_v2;
SET NAMES utf8mb4;
SET @seed_previous_time_zone = @@session.time_zone;
SET time_zone = '+00:00';

DROP TEMPORARY TABLE IF EXISTS gc_seed_numbers, gc_seed_products, gc_seed_offers;

CREATE TEMPORARY TABLE gc_seed_numbers (
    n SMALLINT PRIMARY KEY
) ENGINE = InnoDB;

INSERT INTO gc_seed_numbers (n)
WITH RECURSIVE day_numbers AS (
    SELECT 0 AS n
    UNION ALL
    SELECT n + 1 FROM day_numbers WHERE n < 499
)
SELECT n FROM day_numbers;

CREATE TEMPORARY TABLE gc_seed_products (
    n SMALLINT PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    category_code VARCHAR(255) NOT NULL,
    image_url VARCHAR(255) NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_as_cs;

INSERT INTO gc_seed_products (n, slug, category_code, image_url)
SELECT n + 1,
       CONCAT('gc-demo-', LPAD(n + 1, 3, '0')),
       ELT(MOD(n, 6) + 1, 'electro', 'acoustic', 'classical', 'bass', 'amp', 'pedal'),
       CONCAT('assets/', ELT(MOD(n, 6) + 1, 'strat', 'acoustic', 'classical', 'bass', 'katana', 'overdrive'), '.jpg')
FROM gc_seed_numbers
WHERE n < 100;

CREATE TEMPORARY TABLE gc_seed_offers (
    product_id BIGINT NOT NULL,
    store_id BIGINT NOT NULL,
    last_price DECIMAL(12,2) NOT NULL,
    last_day DATETIME NOT NULL,
    phase SMALLINT NOT NULL,
    PRIMARY KEY (product_id, store_id)
) ENGINE = InnoDB;

START TRANSACTION;

INSERT INTO brand (name)
VALUES ('GC Demo 1'), ('GC Demo 2'), ('GC Demo 3'), ('GC Demo 4')
ON DUPLICATE KEY UPDATE name = brand.name;

INSERT INTO category (code, name, product_type)
VALUES ('electro', 'Elektro gitar', 'GUITAR'), ('acoustic', 'Akustik gitar', 'GUITAR'),
       ('classical', 'Klasik gitar', 'GUITAR'), ('bass', 'Bas gitar', 'GUITAR'),
       ('amp', 'Amfi', 'AMPLIFIER'), ('pedal', 'Efekt pedalı', 'PEDAL')
ON DUPLICATE KEY UPDATE code = category.code;

INSERT INTO product (brand_id, category_id, product_type, model_name, slug, description, image_url)
SELECT b.brand_id, c.category_id, c.product_type,
       CONCAT(c.name, ' ', LPAD(s.n, 3, '0')), s.slug,
       'Fiyat geçmişi testi için üretilmiş sentetik ürün.', s.image_url
FROM gc_seed_products s
JOIN category c ON c.code = s.category_code
JOIN brand b ON b.name = CONCAT('GC Demo ', MOD(s.n - 1, 4) + 1)
WHERE NOT EXISTS (SELECT 1 FROM product p WHERE p.slug = s.slug);

INSERT INTO guitar (product_id, string_count, body_wood, fret_count, scale_length_mm, electronics_type)
SELECT p.product_id, IF(s.category_code = 'bass', 4, 6),
       IF(s.category_code IN ('electro', 'bass'), 'Kızılağaç', 'Maun'),
       IF(s.category_code = 'classical', 19, 20 + MOD(s.n, 5)),
       CASE s.category_code WHEN 'bass' THEN 864 WHEN 'classical' THEN 650 ELSE 648 END,
       IF(s.category_code IN ('electro', 'bass'), 'PASSIVE', 'NONE')
FROM gc_seed_products s
JOIN product p ON p.slug = s.slug AND p.product_type = 'GUITAR'
WHERE NOT EXISTS (SELECT 1 FROM guitar g WHERE g.product_id = p.product_id);

INSERT INTO guitar_pickup (product_id, pickup_no, position, pickup_type)
SELECT g.product_id, 1, 'BRIDGE', IF(s.category_code = 'bass', 'Split-coil', 'Humbucker')
FROM gc_seed_products s
JOIN product p ON p.slug = s.slug
JOIN guitar g ON g.product_id = p.product_id
WHERE s.category_code IN ('electro', 'bass')
  AND NOT EXISTS (SELECT 1 FROM guitar_pickup gp WHERE gp.product_id = g.product_id AND gp.pickup_no = 1);

INSERT INTO amplifier (product_id, amp_type, form_factor, rated_power_w, channel_count, has_headphone_out)
SELECT p.product_id, IF(MOD(s.n DIV 6, 2) = 0, 'MODELING', 'SOLID_STATE'),
       'COMBO', ELT(MOD(s.n DIV 6, 4) + 1, 15, 25, 50, 100), 2, TRUE
FROM gc_seed_products s
JOIN product p ON p.slug = s.slug AND p.product_type = 'AMPLIFIER'
WHERE NOT EXISTS (SELECT 1 FROM amplifier a WHERE a.product_id = p.product_id);

INSERT INTO amplifier_speaker (product_id, diameter_in, quantity)
SELECT a.product_id, IF(a.rated_power_w <= 25, 8, 12), 1
FROM gc_seed_products s
JOIN product p ON p.slug = s.slug
JOIN amplifier a ON a.product_id = p.product_id AND a.form_factor = 'COMBO'
WHERE NOT EXISTS (SELECT 1 FROM amplifier_speaker speaker WHERE speaker.product_id = a.product_id);

INSERT INTO pedal (product_id, effect_type, signal_type, input_mode, output_mode, adapter_supply_type, adapter_voltage_v)
SELECT p.product_id, ELT(MOD(s.n DIV 6, 3) + 1, 'OVERDRIVE', 'DELAY', 'REVERB'),
       IF(MOD(s.n DIV 6, 3) = 0, 'ANALOG', 'DIGITAL'), 'MONO', 'MONO', 'DC', 9
FROM gc_seed_products s
JOIN product p ON p.slug = s.slug AND p.product_type = 'PEDAL'
WHERE NOT EXISTS (SELECT 1 FROM pedal effect WHERE effect.product_id = p.product_id);

INSERT INTO store (name)
SELECT CONCAT('GC Demo Mağaza ', n + 1)
FROM gc_seed_numbers
WHERE n < 5
ON DUPLICATE KEY UPDATE name = store.name;

-- Ürünün oluşturulduğu UTC gününü kullanarak tekrar çalıştırmada tarihleri sabit tut.
INSERT INTO gc_seed_offers (product_id, store_id, last_price, last_day, phase)
SELECT p.product_id, s.store_id,
       CASE p.product_type WHEN 'GUITAR' THEN 12000 WHEN 'AMPLIFIER' THEN 8000 ELSE 2500 END
           + 73.37 * demo.n + 187.50 * (store_number.n + 1),
       DATE(p.created_at), MOD(7 * demo.n + 11 * store_number.n, 23)
FROM gc_seed_products demo
JOIN product p ON p.slug = demo.slug
CROSS JOIN gc_seed_numbers store_number
JOIN store s ON s.name = CONCAT('GC Demo Mağaza ', store_number.n + 1)
WHERE store_number.n < 5;

INSERT INTO offer (product_id, store_id, current_price, price_updated_at)
SELECT seed.product_id, seed.store_id, seed.last_price, seed.last_day
FROM gc_seed_offers seed
WHERE NOT EXISTS (
    SELECT 1 FROM offer o WHERE o.product_id = seed.product_id AND o.store_id = seed.store_id
);

-- n = 0 için fiyat, offer.current_price ile birebir eşleşir.
INSERT INTO price_history (offer_id, recorded_at, price)
SELECT o.offer_id, DATE_SUB(seed.last_day, INTERVAL days.n DAY),
       seed.last_price - 0.65 * days.n + 7.25 * (MOD(19 * days.n + seed.phase, 23) - seed.phase)
FROM gc_seed_offers seed
JOIN offer o ON o.product_id = seed.product_id AND o.store_id = seed.store_id
CROSS JOIN gc_seed_numbers days
WHERE NOT EXISTS (
    SELECT 1 FROM price_history h
    WHERE h.offer_id = o.offer_id AND h.recorded_at = DATE_SUB(seed.last_day, INTERVAL days.n DAY)
);

COMMIT;

SELECT COUNT(DISTINCT seed.product_id) AS urun_sayisi,
       COUNT(DISTINCT seed.store_id) AS magaza_sayisi,
       COUNT(DISTINCT o.offer_id) AS teklif_sayisi,
       COUNT(*) AS fiyat_kaydi_sayisi
FROM gc_seed_offers seed
JOIN offer o ON o.product_id = seed.product_id AND o.store_id = seed.store_id
JOIN price_history h ON h.offer_id = o.offer_id
CROSS JOIN gc_seed_numbers days
WHERE h.recorded_at = DATE_SUB(seed.last_day, INTERVAL days.n DAY);

DROP TEMPORARY TABLE gc_seed_numbers, gc_seed_products, gc_seed_offers;
SET time_zone = @seed_previous_time_zone;
