package com.gearcompare.catalog;

import java.util.List;

import com.gearcompare.account.Accounts;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataAccessException;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
public class CatalogController {
    private final CatalogQueries queries;
    private final Accounts accounts;

    public CatalogController(CatalogQueries queries, Accounts accounts) {
        this.queries = queries;
        this.accounts = accounts;
    }

    @GetMapping
    public List<CatalogProduct> products() {
        return queries.findAll();
    }

    @GetMapping("/{slug}")
    public ResponseEntity<CatalogProduct> product(@PathVariable String slug) {
        return ResponseEntity.of(queries.findBySlug(slug));
    }

      @GetMapping("/favorites")
    public List<String> favorites(HttpServletRequest request) {
        return queries.findFavoriteSlugs(accounts.requireUser(request));
    }

    @PostMapping("/{productId}/favorite")
    public ResponseEntity<Void> addFavorite(
            @PathVariable String productId,
            HttpServletRequest request) {
        queries.addFavorite(accounts.requireUser(request), queries.productId(productId));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{productId}/favorite")
    public ResponseEntity<Void> removeFavorite(
            @PathVariable String productId,
            HttpServletRequest request) {
        queries.removeFavorite(accounts.requireUser(request), queries.productId(productId));
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler({DataAccessException.class, CannotCreateTransactionException.class})
    public ResponseEntity<Void> catalogUnavailable() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }
}
