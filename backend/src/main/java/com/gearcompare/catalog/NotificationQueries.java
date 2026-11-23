package com.gearcompare.catalog;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

import com.gearcompare.admin.OfferPriceChanged;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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

    public record AlertView(long alertId, String product, BigDecimal targetPrice, Instant createdAt, Instant updatedAt) {}

    public record NotificationView(long notificationId, long alertId, String product, String store,
            BigDecimal price, BigDecimal targetPrice, Instant createdAt, Instant readAt) {}

    public List<AlertView> findAlerts(long userId) {
        return jdbc.query("""
                SELECT a.alert_id, p.slug, a.target_price, a.created_at, a.updated_at
                FROM price_alert a JOIN product p ON p.product_id = a.product_id
                WHERE a.user_id = ? AND a.disabled_at IS NULL
                ORDER BY a.updated_at DESC
                """, (row, index) -> new AlertView(row.getLong("alert_id"), row.getString("slug"),
                row.getBigDecimal("target_price"), row.getTimestamp("created_at").toInstant(),
                row.getTimestamp("updated_at").toInstant()), userId);
    }

    public List<NotificationView> findAllNotifications(long userId) {
        return jdbc.query("""
                SELECT n.notification_id, n.alert_id, p.slug, s.name, ph.price,
                    n.target_at_event, n.created_at, n.read_at
                FROM notification n
                JOIN price_alert a ON a.alert_id = n.alert_id
                JOIN product p ON p.product_id = a.product_id
                JOIN price_history ph ON ph.offer_id = n.offer_id AND ph.recorded_at = n.price_recorded_at
                JOIN offer o ON o.offer_id = n.offer_id
                JOIN store s ON s.store_id = o.store_id
                WHERE a.user_id = ?
                ORDER BY n.created_at DESC
                """, (row, index) -> new NotificationView(row.getLong("notification_id"),
                row.getLong("alert_id"), row.getString("slug"), row.getString("name"),
                row.getBigDecimal("price"), row.getBigDecimal("target_at_event"),
                row.getTimestamp("created_at").toInstant(), row.getTimestamp("read_at") == null ? null
                        : row.getTimestamp("read_at").toInstant()), userId);
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

    @Transactional
    public void createPriceAlert(long userId, String productSlug, BigDecimal targetPrice) {
        if (targetPrice == null || targetPrice.signum() <= 0 ||
                targetPrice.compareTo(BigDecimal.valueOf(10_000_000)) > 0 || targetPrice.stripTrailingZeros().scale() > 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        // Serialize alert changes with offer writes for the same product.
        long productId = jdbc.queryForList("SELECT product_id FROM product WHERE slug = ? FOR UPDATE", Long.class, productSlug)
                .stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        var previous = jdbc.query("""
                SELECT alert_id, target_price, disabled_at FROM price_alert
                WHERE user_id = ? AND product_id = ?
                FOR UPDATE
                """, (row, index) -> new StoredAlert(row.getLong("alert_id"), row.getBigDecimal("target_price"),
                row.getTimestamp("disabled_at") == null), userId, productId).stream().findFirst().orElse(null);
        if (previous == null) {
            jdbc.update("INSERT INTO price_alert (user_id, product_id, target_price) VALUES (?, ?, ?)",
                    userId, productId, targetPrice);
        } else if (!previous.active() || previous.target().compareTo(targetPrice) != 0) {
            jdbc.update("UPDATE price_alert SET target_price = ?, disabled_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE alert_id = ?",
                    targetPrice, previous.id());
        }
        BigDecimal priorTarget = previous != null && previous.active() ? previous.target() : null;
        if (priorTarget == null || targetPrice.compareTo(priorTarget) > 0) {
            notifyForCurrentOffer(userId, productId, priorTarget);
        }
    }

    private void notifyForCurrentOffer(long userId, long productId, BigDecimal priorTarget) {
        jdbc.update("""
                INSERT INTO notification (alert_id, offer_id, price_recorded_at, target_at_event)
                SELECT a.alert_id, o.offer_id, o.price_updated_at, a.target_price
                FROM price_alert a
                JOIN offer o ON o.product_id = a.product_id
                WHERE a.user_id = ? AND a.product_id = ? AND o.current_price <= a.target_price
                  AND (? IS NULL OR o.current_price > ?)
                ORDER BY o.current_price, o.offer_id
                LIMIT 1
                ON DUPLICATE KEY UPDATE notification_id = notification.notification_id
                """, userId, productId, priorTarget, priorTarget);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void createNotifications(OfferPriceChanged event) {
        jdbc.update("""
                INSERT INTO notification (alert_id, offer_id, price_recorded_at, target_at_event)
                SELECT alert_id, ?, ?, target_price
                FROM price_alert
                WHERE product_id = ? AND disabled_at IS NULL AND target_price >= ?
                  AND (? IS NULL OR ? > target_price)
                ON DUPLICATE KEY UPDATE notification_id = notification.notification_id
                """, event.offerId(), Timestamp.from(event.recordedAt()), event.productId(), event.price(),
                event.previousPrice(), event.previousPrice());
    }

    @Transactional
    public int disablePriceAlert(long alertId, long userId) {
        if (jdbc.queryForList("""
                SELECT product_id FROM product
                WHERE product_id = (SELECT product_id FROM price_alert WHERE alert_id = ? AND user_id = ?)
                FOR UPDATE
                """, Long.class, alertId, userId).isEmpty()) return 0;
        return jdbc.update("""
                UPDATE price_alert SET disabled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE alert_id = ? AND user_id = ?
                """, alertId, userId);
    }

    private record StoredAlert(long id, BigDecimal target, boolean active) {}
}
