package com.gearcompare.catalog;

import java.math.BigDecimal;
import java.util.List;

import com.gearcompare.account.Accounts;
import jakarta.servlet.http.HttpServletRequest;

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
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationQueries queries;
    private final Accounts accounts;

    public NotificationController(NotificationQueries queries, Accounts accounts) {
        this.queries = queries;
        this.accounts = accounts;
    }

    @GetMapping("/eligible")
    public List<NotificationQueries.PriceAlert> eligibleAlerts(
            @RequestParam long productId,
            @RequestParam BigDecimal price,
            HttpServletRequest request) {
        accounts.requireAdmin(request);
        return queries.findEligibleAlerts(productId, price);
    }

    @GetMapping("/{alertId}")
    public List<NotificationQueries.Notification> notifications(@PathVariable long alertId, HttpServletRequest request) {
        return queries.findNotifications(alertId, accounts.requireUser(request));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Void> markRead(@PathVariable long notificationId, HttpServletRequest request) {
        if (queries.markNotificationRead(notificationId, accounts.requireUser(request)) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/alerts")
    public ResponseEntity<Void> createAlert(@RequestBody PriceAlertRequest input, HttpServletRequest request) {
        queries.createPriceAlert(accounts.requireUser(request), input.productId(), input.targetPrice());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PatchMapping("/alerts/{alertId}/disable")
    public ResponseEntity<Void> disableAlert(
            @PathVariable long alertId,
            HttpServletRequest request) {
        if (queries.disablePriceAlert(alertId, accounts.requireUser(request)) == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler({DataAccessException.class, CannotCreateTransactionException.class})
    public ResponseEntity<Void> notificationsUnavailable() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }

    public record PriceAlertRequest(long productId, BigDecimal targetPrice) {}
}
