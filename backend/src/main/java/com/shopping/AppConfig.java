package com.shopping;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AppConfig {

    @Value("${app.admin.email}")
    private String adminEmail;

    public String getAdminEmail() {
        return adminEmail == null ? "" : adminEmail.trim().toLowerCase();
    }

    public boolean isAdminEmail(String email) {
        if (email == null || email.isBlank()) return false;
        return getAdminEmail().equals(email.trim().toLowerCase());
    }
}
