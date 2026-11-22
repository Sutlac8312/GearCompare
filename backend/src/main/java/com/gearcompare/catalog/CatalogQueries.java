package com.gearcompare.catalog;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class CatalogQueries {
    private static final String PRODUCT_QUERY = """
        SELECT p.product_id, p.slug, b.name AS brand, p.model_name, c.code AS category,
               c.name AS category_name, p.product_type, p.description, p.image_url, p.manufacturer_url
        FROM product p
        JOIN brand b ON b.brand_id = p.brand_id
        JOIN category c ON c.category_id = p.category_id AND c.product_type = p.product_type
        """;
    private static final Map<String, String> SPEC_TABLES = Map.of(
        "GUITAR", "guitar", "AMPLIFIER", "amplifier", "PEDAL", "pedal"
    );

    private final NamedParameterJdbcTemplate jdbc;

    public CatalogQueries(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public List<CatalogProduct> findAll() {
        return readProducts(jdbc.queryForList(PRODUCT_QUERY + " ORDER BY p.product_id", Map.of()));
    }

    @Transactional(readOnly = true)
    public Optional<CatalogProduct> findBySlug(String slug) {
        var rows = jdbc.queryForList(PRODUCT_QUERY + " WHERE p.slug = :slug", Map.of("slug", slug));
        return readProducts(rows).stream().findFirst();
    }

    public int addFavorite(long userId, long productId) {
        return jdbc.update("""
                INSERT INTO favorite (user_id, product_id, added_at)
                VALUES (:userId, :productId, CURRENT_TIMESTAMP)
                """, Map.of("userId", userId, "productId", productId));
    }

    public int removeFavorite(long userId, long productId) {
        return jdbc.update("""
                DELETE FROM favorite
                WHERE user_id = :userId
                AND product_id = :productId
                """, Map.of("userId", userId, "productId", productId));
    }

    private List<CatalogProduct> readProducts(List<Map<String, Object>> products) {
        var idsByType = new HashMap<String, List<Long>>();
        for (var product : products) {
            idsByType.computeIfAbsent((String) product.get("product_type"), type -> new ArrayList<>())
                .add(productId(product));
        }

        var specs = new HashMap<Long, Map<String, Object>>();
        for (var type : idsByType.entrySet()) {
            // Table names come from the fixed type map. Product IDs are bound parameters.
            var sql = "SELECT * FROM " + SPEC_TABLES.get(type.getKey()) + " WHERE product_id IN (:ids)";
            for (var row : jdbc.queryForList(sql, Map.of("ids", type.getValue()))) {
                specs.put(productId(row), technicalFields(row));
            }
        }

        var pickups = readDetails(
            "SELECT * FROM guitar_pickup WHERE product_id IN (:ids) ORDER BY product_id, pickup_no",
            idsByType.getOrDefault("GUITAR", List.of())
        );
        var speakers = readDetails(
            "SELECT * FROM amplifier_speaker WHERE product_id IN (:ids) ORDER BY product_id, diameter_in",
            idsByType.getOrDefault("AMPLIFIER", List.of())
        );

        return products.stream().map(product -> {
            long id = productId(product);
            return new CatalogProduct(
                (String) product.get("slug"), (String) product.get("brand"), (String) product.get("model_name"),
                (String) product.get("category"), (String) product.get("category_name"), (String) product.get("product_type"),
                (String) product.get("description"), (String) product.get("image_url"), (String) product.get("manufacturer_url"),
                specs.getOrDefault(id, Map.of()), pickups.getOrDefault(id, List.of()), speakers.getOrDefault(id, List.of())
            );
        }).toList();
    }

    private Map<Long, List<Map<String, Object>>> readDetails(String sql, List<Long> ids) {
        var details = new HashMap<Long, List<Map<String, Object>>>();
        if (ids.isEmpty()) return details;

        for (var row : jdbc.queryForList(sql, Map.of("ids", ids))) {
            details.computeIfAbsent(productId(row), id -> new ArrayList<>()).add(technicalFields(row));
        }
        return details;
    }

    private static long productId(Map<String, Object> row) {
        return ((Number) row.get("product_id")).longValue();
    }

    private static Map<String, Object> technicalFields(Map<String, Object> row) {
        var fields = new LinkedHashMap<String, Object>();
        row.forEach((key, value) -> {
            if (value == null || key.equals("product_id") || key.equals("product_type")) return;
            if ((key.startsWith("has_") || key.equals("supports_battery")) && value instanceof Number number) {
                fields.put(key, number.intValue() != 0);
            } else {
                fields.put(key, value);
            }
        });
        return fields;
    }
}
