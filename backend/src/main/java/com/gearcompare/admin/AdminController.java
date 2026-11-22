package com.gearcompare.admin;

import java.util.List;

import com.gearcompare.account.Accounts;
import com.gearcompare.catalog.PricingQueries;
import jakarta.servlet.http.HttpServletRequest;

import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.CannotCreateTransactionException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final Accounts accounts;
    private final AdminCatalog catalog;
    private final OfferWrites offers;

    public AdminController(Accounts accounts, AdminCatalog catalog, OfferWrites offers) {
        this.accounts = accounts;
        this.catalog = catalog;
        this.offers = offers;
    }

    @GetMapping("/stores")
    public List<PricingQueries.Store> stores(HttpServletRequest request) {
        accounts.requireAdmin(request);
        return catalog.stores();
    }

    @PostMapping(value = "/stores", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> addStore(HttpServletRequest request, @RequestBody AdminCatalog.StoreInput input) {
        accounts.requireAdmin(request);
        catalog.addStore(input);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/products", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> addProduct(HttpServletRequest request, @RequestBody AdminCatalog.ProductInput input) {
        accounts.requireAdmin(request);
        catalog.addProduct(input);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(value = "/offers", consumes = MediaType.APPLICATION_JSON_VALUE)
    public OfferWrites.Outcome saveOffer(HttpServletRequest request, @RequestBody OfferWrites.Input input) {
        accounts.requireAdmin(request);
        return offers.save(input);
    }

    @ExceptionHandler(DuplicateKeyException.class)
    public ResponseEntity<Void> duplicate() {
        return ResponseEntity.status(HttpStatus.CONFLICT).build();
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Void> invalid() {
        return ResponseEntity.badRequest().build();
    }

    @ExceptionHandler({DataAccessException.class, CannotCreateTransactionException.class})
    public ResponseEntity<Void> unavailable() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }
}
