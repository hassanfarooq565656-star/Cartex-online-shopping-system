package com.shopping;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PaymentService {
    private final ConcurrentHashMap<String, PendingBankPayment> pendingBank = new ConcurrentHashMap<>();

    static class PendingBankPayment {
        Long userId;
        String bank;
        BigDecimal amount;
        long createdAt;
    }

    String generatePsid() {
        return "CTX-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()
                + "-" + (100000 + (int) (Math.random() * 900000));
    }

    String initBankPayment(Long userId, String bank, BigDecimal amount) {
        String psid = generatePsid();
        PendingBankPayment p = new PendingBankPayment();
        p.userId = userId;
        p.bank = bank;
        p.amount = amount;
        p.createdAt = System.currentTimeMillis();
        pendingBank.put(psid, p);
        return psid;
    }

    public PendingBankPayment validateAndConsumePsid(String psid, Long userId) {
        PendingBankPayment p = pendingBank.remove(psid);
        if (p == null || !p.userId.equals(userId)) return null;
        if (System.currentTimeMillis() - p.createdAt > 30 * 60 * 1000) return null;
        return p;
    }
}
