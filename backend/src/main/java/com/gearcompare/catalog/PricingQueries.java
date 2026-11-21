package com.gearcompare.catalog;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PricingQueries {
    private final JdbcTemplate jdbc;

    public PricingQueries(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Offer> findOffers() {
        return jdbc.query("""
            SELECT o.offer_id, p.slug, o.store_id, s.name, s.website, o.current_price
            FROM offer o
            JOIN product p ON p.product_id = o.product_id
            JOIN store s ON s.store_id = o.store_id
            ORDER BY p.product_id, o.current_price, o.offer_id
            """, (row, index) -> new Offer(
                row.getString("offer_id"), row.getString("slug"),
                new Store(row.getString("store_id"), row.getString("name"), row.getString("website")),
                row.getBigDecimal("current_price")
            ));
    }

    public List<PricePoint> findHistory(long offerId) {
        return jdbc.query("""
            SELECT recorded_at, price
            FROM (
                SELECT recorded_at, price
                FROM price_history
                WHERE offer_id = ?
                ORDER BY recorded_at DESC
                LIMIT 90
            ) recent
            ORDER BY recorded_at
            """, (row, index) -> new PricePoint(
                row.getTimestamp("recorded_at").toInstant(), row.getBigDecimal("price")
            ), offerId);
    }

    public record Offer(String id, String product, Store store, BigDecimal price) {}

    public record Store(String id, String name, String website) {}

    public record PricePoint(Instant date, BigDecimal price) {}
}
