-- İlk MySQL bağlantı testi için örnek ürün.
USE gearcompare_v2;
SET NAMES utf8mb4;

START TRANSACTION;

INSERT INTO brand (name)
VALUES ('Fender')
ON DUPLICATE KEY UPDATE brand_id = brand_id;

INSERT INTO category (code, name, product_type)
VALUES ('electro', 'Elektro gitar', 'GUITAR')
ON DUPLICATE KEY UPDATE category_id = category_id;

SET @demo_brand = (SELECT brand_id FROM brand WHERE LOWER(TRIM(name)) = 'fender');
SET @demo_category = (
    SELECT category_id FROM category WHERE code = 'electro' AND product_type = 'GUITAR'
);

INSERT INTO product (brand_id, category_id, product_type, model_name, slug, description, image_url, manufacturer_url)
SELECT @demo_brand, @demo_category, 'GUITAR', 'Player II Stratocaster', 'fender-player-ii',
       '3-Color Sunburst · Gülağacı klavyeli model', 'assets/strat.jpg',
       'https://www.fender.com/products/player-ii-stratocaster'
WHERE @demo_brand IS NOT NULL AND @demo_category IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM product
      WHERE slug = 'fender-player-ii'
         OR (brand_id = @demo_brand AND category_id = @demo_category
             AND LOWER(TRIM(model_name)) = 'player ii stratocaster')
  );

SET @demo_product = IF(ROW_COUNT() = 1, LAST_INSERT_ID(), NULL);

INSERT INTO guitar (
    product_id, string_count, string_material, body_style, body_wood, neck_wood, fingerboard_wood,
    scale_length_mm, fret_count, nut_width_mm, bridge_type, bridge_material, electronics_type
)
SELECT @demo_product, 6, 'Nikel kaplı çelik', 'Masif Stratocaster gövde', 'Kızılağaç',
       'Akçaağaç', 'Gülağacı', 648, 22, 42, 'İki noktalı tremolo', 'Çelik eyerler', 'PASSIVE'
WHERE @demo_product IS NOT NULL;

INSERT INTO guitar_pickup (product_id, pickup_no, position, pickup_type, model_name)
SELECT @demo_product, positions.pickup_no, positions.pickup_position, 'Single-coil', 'Player Series Alnico 5'
FROM (
    SELECT 1 AS pickup_no, 'NECK' AS pickup_position
    UNION ALL SELECT 2, 'MIDDLE'
    UNION ALL SELECT 3, 'BRIDGE'
) AS positions
WHERE @demo_product IS NOT NULL;

COMMIT;
