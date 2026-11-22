package com.gearcompare.admin;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.gearcompare.catalog.PricingQueries;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.SimpleJdbcInsert;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminCatalog {
    private static final Map<String, String[]> DEFAULT_CATEGORIES = Map.of(
        "electro", new String[]{"Elektro gitar", "GUITAR"}, "acoustic", new String[]{"Akustik gitar", "GUITAR"},
        "classical", new String[]{"Klasik gitar", "GUITAR"}, "bass", new String[]{"Bas gitar", "GUITAR"},
        "amp", new String[]{"Amfi", "AMPLIFIER"}, "pedal", new String[]{"Efekt pedalı", "PEDAL"}
    );
    private static final Map<String, Specification> SPECIFICATIONS = Map.of(
        "GUITAR", new Specification("guitar", Set.of("string_count", "string_material", "body_style", "body_wood",
            "top_wood", "back_wood", "side_wood", "neck_wood", "fingerboard_wood", "scale_length_mm",
            "fret_count", "nut_width_mm", "bridge_type", "bridge_material", "electronics_type"),
            Set.of("string_count")),
        "AMPLIFIER", new Specification("amplifier", Set.of("amp_type", "form_factor", "rated_power_w", "channel_count",
            "has_power_scaling", "has_effects_loop", "has_headphone_out", "has_line_out", "has_usb", "has_footswitch_input",
            "width_mm", "depth_mm", "height_mm", "weight_kg"), Set.of("amp_type", "form_factor", "rated_power_w")),
        "PEDAL", new Specification("pedal", Set.of("effect_type", "signal_type", "bypass_type", "input_mode", "output_mode",
            "adapter_supply_type", "adapter_voltage_v", "current_draw_ma", "dc_polarity", "supports_battery", "battery_type",
            "has_expression_in", "has_tap_tempo", "width_mm", "depth_mm", "height_mm", "weight_g"), Set.of("effect_type"))
    );
    private static final Specification PICKUP = new Specification("guitar_pickup",
        Set.of("pickup_no", "position", "pickup_type", "model_name"), Set.of("pickup_no", "pickup_type"));
    private static final Specification SPEAKER = new Specification("amplifier_speaker",
        Set.of("diameter_in", "quantity"), Set.of("diameter_in", "quantity"));

    private final JdbcTemplate jdbc;
    private final SimpleJdbcInsert insertProduct;

    public AdminCatalog(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
        this.insertProduct = new SimpleJdbcInsert(jdbc).withTableName("product")
            .usingColumns("brand_id", "category_id", "product_type", "model_name", "slug", "description", "manufacturer_url")
            .usingGeneratedKeyColumns("product_id").withoutTableColumnMetaDataAccess();
    }

    public List<PricingQueries.Store> stores() {
        return jdbc.query("SELECT store_id, name, website FROM store ORDER BY name, store_id",
            (row, index) -> new PricingQueries.Store(row.getString("store_id"), row.getString("name"), row.getString("website")));
    }

    public void addStore(StoreInput input) {
        jdbc.update("INSERT INTO store (name, website) VALUES (?, ?)",
            text(input.name(), 70, true), website(input.website(), 200));
    }

    @Transactional
    public void addProduct(ProductInput input) {
        String brand = text(input.brand(), 50, true);
        String model = text(input.model(), 80, true);
        String description = text(input.description(), 500, false);
        String source = website(input.source(), 500);
        var category = category(text(input.category(), 255, true));
        var spec = SPECIFICATIONS.get(category.type());
        var pickups = input.pickups() == null ? List.<Map<String, Object>>of() : input.pickups();
        var speakers = input.speakers() == null ? List.<Map<String, Object>>of() : input.speakers();
        if (input.specs() == null ||
                (!pickups.isEmpty() && (!"GUITAR".equals(category.type()) || "NONE".equals(input.specs().get("electronics_type")))) ||
                (!speakers.isEmpty() && (!"AMPLIFIER".equals(category.type()) || "HEAD".equals(input.specs().get("form_factor"))))) {
            throw invalid();
        }

        jdbc.update("INSERT INTO brand (name) VALUES (?) ON DUPLICATE KEY UPDATE name = brand.name", brand);
        long brandId = jdbc.queryForObject("SELECT brand_id FROM brand WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) FOR SHARE", Long.class, brand);
        var product = new LinkedHashMap<String, Object>();
        product.put("brand_id", brandId);
        product.put("category_id", category.id());
        product.put("product_type", category.type());
        product.put("model_name", model);
        product.put("slug", UUID.randomUUID().toString());
        product.put("description", description);
        product.put("manufacturer_url", source);
        long id = insertProduct.executeAndReturnKey(product).longValue();
        insertSpecification(spec, id, input.specs());
        for (var row : pickups) insertSpecification(PICKUP, id, row);
        for (var row : speakers) insertSpecification(SPEAKER, id, row);
    }

    private Category category(String code) {
        RowMapper<Category> mapper = (row, index) ->
            new Category(row.getInt("category_id"), row.getString("product_type"));
        String sql = "SELECT category_id, product_type FROM category WHERE code = ?";
        var rows = jdbc.query(sql, mapper, code);
        if (!rows.isEmpty()) return rows.get(0);
        var defaults = DEFAULT_CATEGORIES.get(code);
        if (defaults == null) throw invalid();
        jdbc.update("""
            INSERT INTO category (code, name, product_type) VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE code = category.code
            """, code, defaults[0], defaults[1]);
        return jdbc.query(sql + " FOR SHARE", mapper, code).stream().findFirst().orElseThrow(AdminCatalog::invalid);
    }

    private void insertSpecification(Specification spec, long productId, Map<String, Object> fields) {
        if (fields == null || !spec.allowed().containsAll(fields.keySet()) || !fields.keySet().containsAll(spec.required())) {
            throw invalid();
        }
        var values = new LinkedHashMap<String, Object>();
        values.put("product_id", productId);
        fields.forEach((name, value) -> {
            if (value instanceof String string) values.put(name, text(string, 120, true));
            else if (value instanceof Number || value instanceof Boolean) values.put(name, value);
            else throw invalid();
        });
        // Table and column identifiers come from the fixed specification definitions above.
        String placeholders = String.join(", ", java.util.Collections.nCopies(values.size(), "?"));
        jdbc.update("INSERT INTO " + spec.table() + " (" + String.join(", ", values.keySet()) + ") VALUES (" + placeholders + ")",
            values.values().toArray());
    }

    static String text(String raw, int limit, boolean required) {
        String value = raw == null ? "" : raw.strip();
        if (value.length() > limit || (required && value.isEmpty())) throw invalid();
        return value.isEmpty() ? null : value;
    }

    private static String website(String raw, int limit) {
        String value = text(raw, limit, false);
        if (value == null) return null;
        try {
            var uri = URI.create(value);
            if (("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme())) && uri.getHost() != null) {
                return uri.normalize().toASCIIString();
            }
        } catch (IllegalArgumentException e) {
            throw invalid();
        }
        throw invalid();
    }

    static ResponseStatusException invalid() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST);
    }

    public record StoreInput(String name, String website) {}

    public record ProductInput(String brand, String model, String category, String description, String source,
                               Map<String, Object> specs, List<Map<String, Object>> pickups, List<Map<String, Object>> speakers) {}

    private record Category(int id, String type) {}

    private record Specification(String table, Set<String> allowed, Set<String> required) {}
}
