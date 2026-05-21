package com.shopping;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class GrokApiVerifier implements ApplicationRunner {

    private final GrokService grokService;
    private final GeminiService geminiService;

    public GrokApiVerifier(GrokService grokService, GeminiService geminiService) {
        this.grokService = grokService;
        this.geminiService = geminiService;
    }

    @Override
    public void run(ApplicationArguments args) {
        System.out.println("========== CARTEX API KEYS ==========");
        System.out.println("Gemini (recommendations): " + (geminiService.isConfigured() ? "OK" : "NOT SET — see CONFIG.md"));
        System.out.println("Grok/Groq (support chat):  " + (grokService.isConfigured() ? "OK" : "NOT SET — see CONFIG.md"));
        System.out.println("Status endpoint: http://localhost:8080/api/status");
        System.out.println("=====================================");
    }
}
