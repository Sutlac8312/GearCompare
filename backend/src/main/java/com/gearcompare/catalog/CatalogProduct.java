package com.gearcompare.catalog;

import java.util.List;
import java.util.Map;

public record CatalogProduct(
    String id,
    String brand,
    String model,
    String category,
    String categoryName,
    String productType,
    String description,
    String imageUrl,
    String source,
    Map<String, Object> specs,
    List<Map<String, Object>> pickups,
    List<Map<String, Object>> speakers
) {}
