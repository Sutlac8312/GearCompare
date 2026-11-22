USE gearcompare_v2;
-- GearCompare ara raporu, sayfa 8-11 | MySQL 8.0.16+ / InnoDB
-- Çalıştırmadan önce hedef veritabanını seçin (USE veritabani_adi).
-- Bu dosya sekiz tabloyu ve tablolar arası teknik kuralları kurar.
-- PRODUCT ve uygun alt tür satırı uygulamada aynı işlemde yazılmalıdır.
-- Alt tür INSERT'lerinde product_type otomatik oluştuğu için sütunu atlayın.

SET NAMES utf8mb4;

-- Sayfa 8: BRAND, CATEGORY, PRODUCT

CREATE TABLE brand (
    brand_id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,

    PRIMARY KEY (brand_id),
    UNIQUE KEY uq_brand_normalized_name ((LOWER(TRIM(name)))),
    CONSTRAINT chk_brand_name_nonempty CHECK (CHAR_LENGTH(TRIM(name)) > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_as_cs;

CREATE TABLE category (
    category_id SMALLINT NOT NULL AUTO_INCREMENT,
    code VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    product_type ENUM('GUITAR', 'AMPLIFIER', 'PEDAL') NOT NULL,

    PRIMARY KEY (category_id),
    UNIQUE KEY uq_category_code (code),
    UNIQUE KEY uq_category_name (name),
    UNIQUE KEY uq_category_id_type (category_id, product_type),
    CONSTRAINT chk_category_code_nonempty CHECK (CHAR_LENGTH(TRIM(code)) > 0),
    CONSTRAINT chk_category_name_nonempty CHECK (CHAR_LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_category_product_type
        CHECK (product_type IN ('GUITAR', 'AMPLIFIER', 'PEDAL'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_as_cs;

CREATE TABLE product (
    product_id BIGINT NOT NULL AUTO_INCREMENT,
    brand_id BIGINT NOT NULL,
    category_id SMALLINT NOT NULL,
    product_type ENUM('GUITAR', 'AMPLIFIER', 'PEDAL') NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT NULL,
    image_url TEXT NULL,
    manufacturer_url TEXT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (product_id),
    UNIQUE KEY uq_product_id_type (product_id, product_type),
    UNIQUE KEY uq_product_slug (slug),
    UNIQUE KEY uq_product_brand_category_model
        (brand_id, category_id, (LOWER(TRIM(model_name)))),
    CONSTRAINT fk_product_brand FOREIGN KEY (brand_id)
        REFERENCES brand (brand_id) ON DELETE RESTRICT,
    CONSTRAINT fk_product_category_type FOREIGN KEY (category_id, product_type)
        REFERENCES category (category_id, product_type) ON DELETE RESTRICT,
    CONSTRAINT chk_product_model_nonempty CHECK (CHAR_LENGTH(TRIM(model_name)) > 0),
    CONSTRAINT chk_product_slug_nonempty CHECK (CHAR_LENGTH(TRIM(slug)) > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_as_cs;

-- Sayfa 9: GUITAR, GUITAR_PICKUP
-- Alt tür kodu sabittir. Birleşik FK, yanlış türde ürüne bağlanmayı önler.

CREATE TABLE guitar (
    product_id BIGINT NOT NULL,
    product_type ENUM('GUITAR', 'AMPLIFIER', 'PEDAL')
        GENERATED ALWAYS AS ('GUITAR') STORED NOT NULL,
    string_count SMALLINT NOT NULL,
    string_material TEXT NULL,
    body_style TEXT NULL,
    body_wood TEXT NULL,
    top_wood TEXT NULL,
    back_wood TEXT NULL,
    side_wood TEXT NULL,
    neck_wood TEXT NULL,
    fingerboard_wood TEXT NULL,
    scale_length_mm DECIMAL(6,2) NULL,
    fret_count SMALLINT NULL,
    nut_width_mm DECIMAL(5,2) NULL,
    bridge_type TEXT NULL,
    bridge_material TEXT NULL,
    electronics_type ENUM('NONE', 'PASSIVE', 'ACTIVE', 'MIXED') NULL,

    PRIMARY KEY (product_id),
    CONSTRAINT fk_guitar_product_type FOREIGN KEY (product_id, product_type)
        REFERENCES product (product_id, product_type) ON DELETE CASCADE,
    CONSTRAINT chk_guitar_string_count CHECK (string_count > 0),
    CONSTRAINT chk_guitar_scale_length CHECK (scale_length_mm > 0),
    CONSTRAINT chk_guitar_fret_count CHECK (fret_count >= 0),
    CONSTRAINT chk_guitar_nut_width CHECK (nut_width_mm > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_as_cs;

CREATE TABLE guitar_pickup (
    product_id BIGINT NOT NULL,
    pickup_no SMALLINT NOT NULL,
    position ENUM('NECK', 'MIDDLE', 'BRIDGE', 'UNDER_SADDLE', 'BODY', 'OTHER') NULL,
    pickup_type TEXT NOT NULL,
    model_name TEXT NULL,

    PRIMARY KEY (product_id, pickup_no),
    CONSTRAINT fk_guitar_pickup_guitar FOREIGN KEY (product_id)
        REFERENCES guitar (product_id) ON DELETE CASCADE,
    CONSTRAINT chk_guitar_pickup_no CHECK (pickup_no > 0),
    CONSTRAINT chk_guitar_pickup_type_nonempty CHECK (CHAR_LENGTH(TRIM(pickup_type)) > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_as_cs;

-- Sayfa 10: AMPLIFIER, AMPLIFIER_SPEAKER

CREATE TABLE amplifier (
    product_id BIGINT NOT NULL,
    product_type ENUM('GUITAR', 'AMPLIFIER', 'PEDAL')
        GENERATED ALWAYS AS ('AMPLIFIER') STORED NOT NULL,
    amp_type ENUM('TUBE', 'SOLID_STATE', 'MODELING', 'HYBRID') NOT NULL,
    form_factor ENUM('COMBO', 'HEAD') NOT NULL,
    rated_power_w DECIMAL(7,2) NOT NULL,
    channel_count SMALLINT NULL,
    has_power_scaling BOOLEAN NULL,
    has_effects_loop BOOLEAN NULL,
    has_headphone_out BOOLEAN NULL,
    has_line_out BOOLEAN NULL,
    has_usb BOOLEAN NULL,
    has_footswitch_input BOOLEAN NULL,
    width_mm DECIMAL(6,2) NULL,
    depth_mm DECIMAL(6,2) NULL,
    height_mm DECIMAL(6,2) NULL,
    weight_kg DECIMAL(6,2) NULL,

    PRIMARY KEY (product_id),
    CONSTRAINT fk_amplifier_product_type FOREIGN KEY (product_id, product_type)
        REFERENCES product (product_id, product_type) ON DELETE CASCADE,
    CONSTRAINT chk_amplifier_power CHECK (rated_power_w > 0),
    CONSTRAINT chk_amplifier_channels CHECK (channel_count > 0),
    CONSTRAINT chk_amplifier_flags CHECK (
        has_power_scaling IN (0, 1)
        AND has_effects_loop IN (0, 1)
        AND has_headphone_out IN (0, 1)
        AND has_line_out IN (0, 1)
        AND has_usb IN (0, 1)
        AND has_footswitch_input IN (0, 1)
    ),
    CONSTRAINT chk_amplifier_measurements CHECK (
        width_mm > 0 AND depth_mm > 0 AND height_mm > 0 AND weight_kg > 0
    )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_as_cs;

CREATE TABLE amplifier_speaker (
    product_id BIGINT NOT NULL,
    diameter_in DECIMAL(4,2) NOT NULL,
    quantity SMALLINT NOT NULL,

    PRIMARY KEY (product_id, diameter_in),
    CONSTRAINT fk_amplifier_speaker_amplifier FOREIGN KEY (product_id)
        REFERENCES amplifier (product_id) ON DELETE CASCADE,
    CONSTRAINT chk_amplifier_speaker_diameter CHECK (diameter_in > 0),
    CONSTRAINT chk_amplifier_speaker_quantity CHECK (quantity > 0)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_as_cs;

-- Sayfa 11: PEDAL

CREATE TABLE pedal (
    product_id BIGINT NOT NULL,
    product_type ENUM('GUITAR', 'AMPLIFIER', 'PEDAL')
        GENERATED ALWAYS AS ('PEDAL') STORED NOT NULL,
    effect_type ENUM(
        'OVERDRIVE', 'DISTORTION', 'FUZZ', 'DELAY', 'REVERB', 'MODULATION',
        'DYNAMICS', 'EQ', 'MULTI_EFFECT', 'OTHER'
    ) NOT NULL,
    signal_type ENUM('ANALOG', 'DIGITAL', 'HYBRID') NULL,
    bypass_type ENUM('TRUE_BYPASS', 'BUFFERED', 'SWITCHABLE') NULL,
    input_mode ENUM('MONO', 'STEREO') NULL,
    output_mode ENUM('MONO', 'STEREO') NULL,
    adapter_supply_type ENUM('AC', 'DC') NULL,
    adapter_voltage_v DECIMAL(5,2) NULL,
    current_draw_ma INT NULL,
    dc_polarity ENUM('CENTER_NEGATIVE', 'CENTER_POSITIVE') NULL,
    supports_battery BOOLEAN NULL,
    battery_type TEXT NULL,
    has_expression_in BOOLEAN NULL,
    has_tap_tempo BOOLEAN NULL,
    width_mm DECIMAL(6,2) NULL,
    depth_mm DECIMAL(6,2) NULL,
    height_mm DECIMAL(6,2) NULL,
    weight_g DECIMAL(7,2) NULL,

    PRIMARY KEY (product_id),
    CONSTRAINT fk_pedal_product_type FOREIGN KEY (product_id, product_type)
        REFERENCES product (product_id, product_type) ON DELETE CASCADE,
    CONSTRAINT chk_pedal_power CHECK (adapter_voltage_v > 0 AND current_draw_ma > 0),
    CONSTRAINT chk_pedal_dc_polarity CHECK (
        dc_polarity IS NULL OR adapter_supply_type <=> 'DC'
    ),
    CONSTRAINT chk_pedal_battery_type CHECK (
        battery_type IS NULL OR supports_battery <=> TRUE
    ),
    CONSTRAINT chk_pedal_flags CHECK (
        supports_battery IN (0, 1) AND has_expression_in IN (0, 1) AND has_tap_tempo IN (0, 1)
    ),
    CONSTRAINT chk_pedal_measurements CHECK (
        width_mm > 0 AND depth_mm > 0 AND height_mm > 0 AND weight_g > 0
    )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_as_cs;


-- ---------------------------------------------------------------

CREATE TABLE STORE (
    store_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    website VARCHAR(2048),

    CONSTRAINT chk_store_name
        CHECK (TRIM(name) <> ''),

    CONSTRAINT chk_store_website
        CHECK (
            website IS NULL OR
            website REGEXP '^https?://'
        ),

    UNIQUE KEY uq_store_name (name)
);

CREATE TABLE OFFER (
    offer_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    store_id BIGINT NOT NULL,
    current_price DECIMAL(12,2) NOT NULL,
    price_updated_at TIMESTAMP NOT NULL,

    CONSTRAINT chk_offer_price
        CHECK (current_price > 0),

    UNIQUE KEY uq_offer_product_store
        (product_id, store_id),

    FOREIGN KEY (product_id)
        REFERENCES PRODUCT(product_id),

    FOREIGN KEY (store_id)
        REFERENCES STORE(store_id)
);


CREATE TABLE PRICE_HISTORY (
offer_id BIGINT NOT NULL,
recorded_at TIMESTAMP NOT NULL,
price DECIMAL(12,2) NOT NULL,

CONSTRAINT chk_history_price
        CHECK (price > 0),

PRIMARY KEY(offer_id, recorded_at),
FOREIGN KEY(offer_id) REFERENCES OFFER(offer_id)
);



CREATE TABLE APP_USER (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    role VARCHAR(12) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_user_role
        CHECK (role IN ('USER', 'ADMIN')),

    CONSTRAINT chk_user_email
        CHECK (TRIM(email) <> ''),

    UNIQUE KEY uq_user_email (email)
);


CREATE TABLE FAVORITE(
user_id BIGINT NOT NULL,
product_id BIGINT NOT NULL,
added_at TIMESTAMP NOT NULL,

PRIMARY KEY(user_id, product_id),
FOREIGN KEY(user_id) REFERENCES APP_USER(user_id) ON DELETE CASCADE ,
FOREIGN KEY(product_id) REFERENCES PRODUCT(product_id)
);


CREATE TABLE PRICE_ALERT (
    alert_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    target_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    disabled_at TIMESTAMP NULL,

    CONSTRAINT chk_alert_price
        CHECK (target_price > 0),

    UNIQUE KEY uq_alert_user_product
        (user_id, product_id),

    FOREIGN KEY (user_id)
        REFERENCES APP_USER(user_id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES PRODUCT(product_id)
);


CREATE TABLE NOTIFICATION (
    notification_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    alert_id BIGINT NOT NULL,
    offer_id BIGINT NOT NULL,
    price_recorded_at TIMESTAMP NOT NULL,
    target_at_event DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,

    CONSTRAINT chk_notification_target
        CHECK (target_at_event > 0),

    UNIQUE KEY uq_notification_event
        (alert_id, offer_id, price_recorded_at),

    FOREIGN KEY (alert_id)
        REFERENCES PRICE_ALERT(alert_id)
        ON DELETE CASCADE,

    FOREIGN KEY (offer_id, price_recorded_at)
        REFERENCES PRICE_HISTORY(offer_id, recorded_at)
);


CREATE INDEX idx_offer_product_price
ON OFFER(product_id, current_price);

CREATE INDEX idx_alert_product_target
ON PRICE_ALERT(product_id, target_price, disabled_at);

CREATE INDEX idx_notification_alert_created
ON NOTIFICATION(alert_id, created_at);


-- CHECK kısıtları başka bir tabloyu okuyamadığı için bu iki kural tetikleyicilerde uygulanır.

DELIMITER $$

CREATE TRIGGER trg_guitar_pickup_bi
BEFORE INSERT ON guitar_pickup
FOR EACH ROW
BEGIN
    DECLARE parent_electronics VARCHAR(7);

    SELECT electronics_type INTO parent_electronics
    FROM guitar
    WHERE product_id = NEW.product_id
    FOR SHARE;

    IF parent_electronics = 'NONE' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Elektroniksiz gitara manyetik eklenemez.';
    END IF;
END$$

CREATE TRIGGER trg_guitar_pickup_bu
BEFORE UPDATE ON guitar_pickup
FOR EACH ROW
BEGIN
    DECLARE parent_electronics VARCHAR(7);

    SELECT electronics_type INTO parent_electronics
    FROM guitar
    WHERE product_id = NEW.product_id
    FOR SHARE;

    IF parent_electronics = 'NONE' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Elektroniksiz gitara manyetik bağlanamaz.';
    END IF;
END$$

CREATE TRIGGER trg_guitar_bu
BEFORE UPDATE ON guitar
FOR EACH ROW
BEGIN
    IF NEW.electronics_type = 'NONE' AND EXISTS (
        SELECT 1 FROM guitar_pickup WHERE product_id = OLD.product_id FOR SHARE
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Manyetik kayıtları bulunan gitar NONE yapılamaz.';
    END IF;
END$$

CREATE TRIGGER trg_amplifier_speaker_bi
BEFORE INSERT ON amplifier_speaker
FOR EACH ROW
BEGIN
    DECLARE parent_form VARCHAR(5);

    SELECT form_factor INTO parent_form
    FROM amplifier
    WHERE product_id = NEW.product_id
    FOR SHARE;

    IF parent_form = 'HEAD' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'HEAD amfiye dahili hoparlör eklenemez.';
    END IF;
END$$

CREATE TRIGGER trg_amplifier_speaker_bu
BEFORE UPDATE ON amplifier_speaker
FOR EACH ROW
BEGIN
    DECLARE parent_form VARCHAR(5);

    SELECT form_factor INTO parent_form
    FROM amplifier
    WHERE product_id = NEW.product_id
    FOR SHARE;

    IF parent_form = 'HEAD' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'HEAD amfiye dahili hoparlör bağlanamaz.';
    END IF;
END$$

CREATE TRIGGER trg_amplifier_bu
BEFORE UPDATE ON amplifier
FOR EACH ROW
BEGIN
    IF NEW.form_factor = 'HEAD' AND EXISTS (
        SELECT 1 FROM amplifier_speaker WHERE product_id = OLD.product_id FOR SHARE
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Dahili hoparlörü olan amfi HEAD yapılamaz.';
    END IF;
END$$

    
CREATE TRIGGER trg_alert_updated_at
BEFORE UPDATE ON PRICE_ALERT
FOR EACH ROW
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END

DELIMITER ;
