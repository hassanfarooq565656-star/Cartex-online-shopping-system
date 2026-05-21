package com.shopping;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ApiStatusController {

    @Autowired private GeminiService geminiService;
    @Autowired private GrokService grokService;
    @Autowired private AppConfig appConfig;

    @GetMapping("/status")
    public Map<String, Object> status() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("app", "CARTEX");
        body.put("version", "1.0.0");
        body.put("geminiConfigured", geminiService.isConfigured());
        body.put("grokConfigured", grokService.isConfigured());
        body.put("adminEmail", appConfig.getAdminEmail());
        body.put("hints", Map.of(
                "gemini", "Set gemini.api.key in application-local.properties — https://aistudio.google.com/apikey",
                "grok", "Set grok.api.key in application-local.properties — https://console.x.ai/ or Groq gsk_ key",
                "database", "Set spring.datasource.password in application-local.properties"
        ));
        return body;
    }
}
