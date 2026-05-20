package com.shopping;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class GrokApiVerifier implements ApplicationRunner {
    private final GrokService grokService;

    public GrokApiVerifier(GrokService grokService) {
        this.grokService = grokService;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (grokService.isConfigured()) {
            System.out.println("[GROK] API configured — support chat and greetings enabled.");
        } else {
            System.err.println("[GROK] API key not set. Add grok.api.key in application.properties or env.");
            System.err.println("       Support chat will use fallback responses.");
        }
    }
}
