package com.gearcompare.admin;

import java.math.BigDecimal;
import java.time.Instant;

public record OfferPriceChanged(long offerId, long productId, long storeId,
                                BigDecimal previousPrice, BigDecimal price, Instant recordedAt) {}
