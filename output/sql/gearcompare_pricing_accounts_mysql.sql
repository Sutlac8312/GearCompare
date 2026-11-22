-- Katalog tabloları kurulduktan sonra fiyat ve hesap tablolarını ekler.
USE gearcompare_v2;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS store (
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
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS offer (
    offer_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    product_id BIGINT NOT NULL,
    store_id BIGINT NOT NULL,
    current_price DECIMAL(12,2) NOT NULL,
    price_updated_at TIMESTAMP NOT NULL,

    CONSTRAINT chk_offer_price
        CHECK (current_price > 0),

    UNIQUE KEY uq_offer_product_store (product_id, store_id),
    KEY idx_offer_product_price (product_id, current_price),

    FOREIGN KEY (product_id)
        REFERENCES product(product_id),

    FOREIGN KEY (store_id)
        REFERENCES store(store_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS price_history (
    offer_id BIGINT NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    price DECIMAL(12,2) NOT NULL,

    CONSTRAINT chk_history_price
        CHECK (price > 0),

    PRIMARY KEY (offer_id, recorded_at),
    FOREIGN KEY (offer_id) REFERENCES offer(offer_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS app_user (
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
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS favorite (
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    added_at TIMESTAMP NOT NULL,

    PRIMARY KEY (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES app_user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(product_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS price_alert (
    alert_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    target_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    disabled_at TIMESTAMP NULL,

    CONSTRAINT chk_alert_price
        CHECK (target_price > 0),

    UNIQUE KEY uq_alert_user_product (user_id, product_id),
    KEY idx_alert_product_target (product_id, target_price, disabled_at),

    FOREIGN KEY (user_id)
        REFERENCES app_user(user_id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES product(product_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS notification (
    notification_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    alert_id BIGINT NOT NULL,
    offer_id BIGINT NOT NULL,
    price_recorded_at TIMESTAMP NOT NULL,
    target_at_event DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,

    CONSTRAINT chk_notification_target
        CHECK (target_at_event > 0),

    UNIQUE KEY uq_notification_event (alert_id, offer_id, price_recorded_at),
    KEY idx_notification_alert_created (alert_id, created_at),

    FOREIGN KEY (alert_id)
        REFERENCES price_alert(alert_id)
        ON DELETE CASCADE,

    FOREIGN KEY (offer_id, price_recorded_at)
        REFERENCES price_history(offer_id, recorded_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
