package com.gearcompare.catalog;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class NotificationQueries {

    private final JdbcTemplate jdbc;

    public NotificationQueries(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public record PriceAlert(
            long alertId,
            long userId,
            long productId,
            BigDecimal targetPrice,
            Instant createdAt,
            Instant updatedAt,
            Instant disabledAt) {
    }

    public record Notification(
            long notificationId,
            long alertId,
            long offerId,
            Instant priceRecordedAt,
            BigDecimal targetAtEvent,
            Instant createdAt,
            Instant readAt) {
    }

    public List<PriceAlert> findEligibleAlerts(long productId, BigDecimal price) {
        return jdbc.query("""
                SELECT alert_id, user_id, product_id, target_price,
                    created_at, updated_at, disabled_at
                FROM price_alert
                WHERE product_id = ?
                AND target_price >= ?
                AND disabled_at IS NULL
                """,
                (row, index) -> new PriceAlert(
                        row.getLong("alert_id"),
                        row.getLong("user_id"),
                        row.getLong("product_id"),
                        row.getBigDecimal("target_price"),
                        row.getTimestamp("created_at").toInstant(),
                        row.getTimestamp("updated_at").toInstant(),
                        row.getTimestamp("disabled_at") == null
                                ? null
                                : row.getTimestamp("disabled_at").toInstant()),
                productId, price);
    }

    public List<Notification> findNotifications(long alertId, long userId) {
        return jdbc.query("""
                SELECT n.notification_id, n.alert_id, n.offer_id,
                    n.price_recorded_at, n.target_at_event,
                    n.created_at, n.read_at
                FROM notification n
                JOIN price_alert a ON a.alert_id = n.alert_id
                WHERE n.alert_id = ? AND a.user_id = ?
                ORDER BY n.created_at DESC
                """,
                (row, index) -> new Notification(
                        row.getLong("notification_id"),
                        row.getLong("alert_id"),
                        row.getLong("offer_id"),
                        row.getTimestamp("price_recorded_at").toInstant(),
                        row.getBigDecimal("target_at_event"),
                        row.getTimestamp("created_at").toInstant(),
                        row.getTimestamp("read_at") == null
                                ? null
                                : row.getTimestamp("read_at").toInstant()),
                alertId, userId);
    }

    public int markNotificationRead(long notificationId, long userId) {
        return jdbc.update("""
                UPDATE notification n
                JOIN price_alert a ON a.alert_id = n.alert_id
                SET n.read_at = COALESCE(n.read_at, CURRENT_TIMESTAMP)
                WHERE n.notification_id = ? AND a.user_id = ?
                """, notificationId, userId);
    }

    public int createPriceAlert(long userId, long productId, BigDecimal targetPrice) {
        return jdbc.update("""
                INSERT INTO price_alert (
                    user_id,
                    product_id,
                    target_price,
                    created_at,
                    updated_at,
                    disabled_at
                )
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL)
                """, userId, productId, targetPrice);
    }

    public int disablePriceAlert(long alertId, long userId) {
        return jdbc.update("""
                UPDATE price_alert
                SET disabled_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE alert_id = ?
                AND user_id = ?
                """, alertId, userId);
    }
}
