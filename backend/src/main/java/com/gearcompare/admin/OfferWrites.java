package com.gearcompare.admin;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import com.gearcompare.catalog.PricingQueries;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OfferWrites {
    private static final BigDecimal MAX_PRICE = BigDecimal.valueOf(10_000_000);

    private final JdbcTemplate jdbc;
    private final PricingQueries pricing;
    private final ApplicationEventPublisher events;
    private final SimpleJdbcInsert insertOffer;

    public OfferWrites(JdbcTemplate jdbc, PricingQueries pricing, ApplicationEventPublisher events) {
        this.jdbc = jdbc;
        this.pricing = pricing;
        this.events = events;
        insertOffer = new SimpleJdbcInsert(jdbc).withTableName("offer")
            .usingColumns("product_id", "store_id", "current_price", "price_updated_at")
            .usingGeneratedKeyColumns("offer_id").withoutTableColumnMetaDataAccess();
    }

    @Transactional
    public Outcome save(Input input) {
        BigDecimal price = price(input.price());
        String slug = AdminCatalog.text(input.product(), 255, true);
        long productId = jdbc.queryForList("SELECT product_id FROM product WHERE slug = ? FOR UPDATE", Long.class, slug)
            .stream().findFirst().orElseThrow(AdminCatalog::invalid);
        if (jdbc.queryForList("SELECT store_id FROM store WHERE store_id = ? FOR SHARE", Long.class, input.storeId()).isEmpty()) {
            throw AdminCatalog.invalid();
        }
        var previous = pricing.findOfferForUpdate(productId, input.storeId());
        if (previous != null && previous.currentPrice().compareTo(price) == 0) return Outcome.UNCHANGED;

        Instant recordedAt = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        if (previous != null && !recordedAt.isAfter(previous.priceUpdatedAt())) {
            recordedAt = previous.priceUpdatedAt().plusSeconds(1);
        }
        Timestamp timestamp = Timestamp.from(recordedAt);
        long offerId;
        if (previous == null) {
            offerId = insertOffer.executeAndReturnKey(Map.of(
                "product_id", productId, "store_id", input.storeId(),
                "current_price", price, "price_updated_at", timestamp
            )).longValue();
        } else {
            offerId = previous.offerId();
            jdbc.update("UPDATE offer SET current_price = ?, price_updated_at = ? WHERE offer_id = ?", price, timestamp, offerId);
        }
        jdbc.update("INSERT INTO price_history (offer_id, recorded_at, price) VALUES (?, ?, ?)", offerId, timestamp, price);
        events.publishEvent(new OfferPriceChanged(offerId, productId, input.storeId(),
            previous == null ? null : previous.currentPrice(), price, recordedAt));
        return previous == null ? Outcome.CREATED : Outcome.UPDATED;
    }

    private static BigDecimal price(BigDecimal value) {
        if (value == null || value.signum() <= 0 || value.compareTo(MAX_PRICE) > 0 || value.stripTrailingZeros().scale() > 2) {
            throw AdminCatalog.invalid();
        }
        return value.setScale(2, RoundingMode.UNNECESSARY);
    }

    public record Input(String product, long storeId, BigDecimal price) {}

    public enum Outcome { CREATED, UPDATED, UNCHANGED }
}
