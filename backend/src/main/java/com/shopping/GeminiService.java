package com.shopping;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key:}")
    private String apiKey;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank()
                && !apiKey.startsWith("YOUR_");
    }

    public String generateText(String prompt) {
        if (!isConfigured() || prompt == null || prompt.isBlank()) return null;
        try {
            String body = mapper.writeValueAsString(Map.of(
                    "contents", new Object[]{
                            Map.of("parts", new Object[]{Map.of("text", prompt)})
                    }
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                System.err.println("[GEMINI] HTTP " + response.statusCode());
                return null;
            }

            JsonNode text = mapper.readTree(response.body())
                    .path("candidates").path(0)
                    .path("content").path("parts").path(0)
                    .path("text");
            return text.isMissingNode() ? null : text.asText().trim();
        } catch (Exception e) {
            System.err.println("[GEMINI] " + e.getMessage());
            return null;
        }
    }
}
