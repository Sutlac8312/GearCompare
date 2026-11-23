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
        notifications.createNotifications(event);
    }
}
