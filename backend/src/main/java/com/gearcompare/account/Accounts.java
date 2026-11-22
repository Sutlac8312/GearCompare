package com.gearcompare.account;

import java.util.Locale;
import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class Accounts {
    private static final String USER_ID = "gearcompare.userId";
    private final JdbcTemplate jdbc;

    public Accounts(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<User> current(HttpServletRequest request) {
        var session = request.getSession(false);
        if (session == null || !(session.getAttribute(USER_ID) instanceof Long id)) return Optional.empty();
        return jdbc.query("SELECT user_id, email, role FROM app_user WHERE user_id = ?",
            (row, index) -> new User(row.getString("user_id"), row.getString("email"), row.getString("role")), id)
            .stream().findFirst();
    }

    public long requireUser(HttpServletRequest request) {
        return Long.parseLong(current(request).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED)).id());
    }

    public void requireAdmin(HttpServletRequest request) {
        var user = current(request).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (!"ADMIN".equals(user.role())) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }

    User register(HttpServletRequest request, String email, String password) {
        var normalized = normalizedEmail(email);
        validatePassword(password);
        try {
            jdbc.update("INSERT INTO app_user (email, password_hash) VALUES (?, ?)", normalized, Passwords.hash(password));
        } catch (DuplicateKeyException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT);
        }
        return signIn(request, credentials(normalized).orElseThrow().user());
    }

    User login(HttpServletRequest request, String email, String password) {
        var normalized = normalizedEmail(email);
        validatePassword(password);
        var account = credentials(normalized).orElse(null);
        if (!Passwords.matches(password, account == null ? null : account.hash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return signIn(request, account.user());
    }

    void logout(HttpServletRequest request) {
        var session = request.getSession(false);
        if (session != null) session.invalidate();
    }

    private User signIn(HttpServletRequest request, User user) {
        logout(request);
        request.getSession().setAttribute(USER_ID, Long.valueOf(user.id()));
        return user;
    }

    private Optional<Credentials> credentials(String email) {
        return jdbc.query("SELECT user_id, email, role, password_hash FROM app_user WHERE email = ?",
            (row, index) -> new Credentials(
                new User(row.getString("user_id"), row.getString("email"), row.getString("role")),
                row.getString("password_hash")), email).stream().findFirst();
    }

    private static String normalizedEmail(String email) {
        if (email == null || email.length() > 120 || !email.strip().matches("[^\\s@]+@[^\\s@]+")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        return email.strip().toLowerCase(Locale.ROOT);
    }

    private static void validatePassword(String password) {
        if (password == null || password.length() < 8 || password.length() > 128) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
    }

    public record User(String id, String email, String role) {}

    private record Credentials(User user, String hash) {}
}
