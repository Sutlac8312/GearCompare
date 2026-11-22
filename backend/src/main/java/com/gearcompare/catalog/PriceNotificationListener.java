package com.gearcompare.catalog;

import com.gearcompare.admin.OfferPriceChanged;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class PriceNotificationListener {
    private final NotificationQueries notifications;

    public PriceNotificationListener(NotificationQueries notifications) {
        this.notifications = notifications;
    }

    @EventListener
    public void onPriceChanged(OfferPriceChanged event) {
        // A notification is generated only for an active alert whose target is met.
        // INSERT IGNORE plus the schema's unique event key keeps retries idempotent.
        notifications.createNotifications(event);
    }
}
