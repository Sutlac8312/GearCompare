package com.gearcompare.account;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.dao.DataAccessException;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
public class AccountController {
    private final Accounts accounts;

    public AccountController(Accounts accounts) {
        this.accounts = accounts;
    }

    @GetMapping("/session")
    public ResponseEntity<Accounts.User> session(HttpServletRequest request) {
        return accounts.current(request)
            .map(user -> ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(user))
            .orElseGet(() -> ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build());
    }

    @PostMapping(value = "/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Accounts.User> register(HttpServletRequest request, @RequestBody Login input) {
        return ResponseEntity.status(HttpStatus.CREATED).cacheControl(CacheControl.noStore())
            .body(accounts.register(request, input.email(), input.password()));
    }

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Accounts.User> login(HttpServletRequest request, @RequestBody Login input) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(accounts.login(request, input.email(), input.password()));
    }

    @DeleteMapping("/session")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        accounts.logout(request);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<Void> unavailable() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
    }

    public record Login(String email, String password) {}
}
