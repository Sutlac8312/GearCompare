package com.gearcompare.catalog;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataAccessException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
public class CatalogController {
    private final CatalogQueries queries;

    public CatalogController(CatalogQueries queries) {
        this.queries = queries;
    }

    @GetMapping
    public List<CatalogProduct> products() {
        return queries.findAll();
    }

    @GetMapping("/{slug}")
    public ResponseEntity<CatalogProduct> product(@PathVariable String slug) {
        return ResponseEntity.of(queries.findBySlug(slug));
    }

    @ExceptionHandler({DataAccessException.class, CannotCreateTransactionException.class})
    public ResponseEntity<Void> catalogUnavailable() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }
}
