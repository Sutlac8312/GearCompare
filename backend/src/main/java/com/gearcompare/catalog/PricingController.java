package com.gearcompare.catalog;

import java.util.List;
import java.time.Instant;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.BadSqlGrammarException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/offers")
public class PricingController {
    private final PricingQueries queries;

    public PricingController(PricingQueries queries) {
        this.queries = queries;
    }

    @GetMapping
    public Offers offers() {
        try {
            return new Offers(true, queries.findOffers());
        } catch (BadSqlGrammarException exception) {
            // MySQL reports a missing table while the pricing schema is still being prepared.
            if (exception.getSQLException().getErrorCode() == 1146) return new Offers(false, List.of());
            throw exception;
        }
    }

    @GetMapping(value = "/{offerId}/history", params = {"!from", "!to"})
    public List<PricingQueries.PricePoint> history(@PathVariable long offerId) {
        return queries.findHistory(offerId);
    }

    @GetMapping(value = "/{offerId}/history", params = {"from", "to"})
    public List<PricingQueries.PricePoint> historyBetween(
            @PathVariable long offerId,
            @RequestParam Instant from,
            @RequestParam Instant to) {
        return queries.findHistoryBetween(offerId, from, to);
    }

    @GetMapping("/product/{productId}")
    public List<PricingQueries.ProductOffer> productOffers(@PathVariable long productId) {
        return queries.findOffersByProduct(productId);
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Void> pricingUnavailable() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }

    public record Offers(boolean available, List<PricingQueries.Offer> offers) {}
}
