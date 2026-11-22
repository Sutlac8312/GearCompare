package com.gearcompare.catalog;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationQueries queries;

    public NotificationController(NotificationQueries queries) {
        this.queries = queries;
    }

    @GetMapping("/eligible")
    public List<NotificationQueries.PriceAlert> eligibleAlerts(
            @RequestParam long productId,
            @RequestParam BigDecimal price) {
        return queries.findEligibleAlerts(productId, price);
    }

    @GetMapping("/{alertId}")
    public List<NotificationQueries.Notification> notifications(@PathVariable long alertId) {
        return queries.findNotifications(alertId);
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Void> markRead(@PathVariable long notificationId) {
        queries.markNotificationRead(notificationId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/alerts")
    public ResponseEntity<Void> createAlert(@RequestBody PriceAlertRequest request) {
        queries.createPriceAlert(request.userId(), request.productId(), request.targetPrice());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PatchMapping("/alerts/{alertId}/disable")
    public ResponseEntity<Void> disableAlert(
            @PathVariable long alertId,
            @RequestBody DisableAlertRequest request) {
        queries.disablePriceAlert(alertId, request.userId());
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler({DataAccessException.class, CannotCreateTransactionException.class})
    public ResponseEntity<Void> notificationsUnavailable() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }

    public record PriceAlertRequest(long userId, long productId, BigDecimal targetPrice) {}

    public record DisableAlertRequest(long userId) {}
}
