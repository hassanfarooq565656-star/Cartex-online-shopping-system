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
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Service
public class GrokService {

    @Value("${grok.api.key:}")
    private String apiKey;

    @Value("${grok.model:grok-3-mini}")
    private String model;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String supportGreeting(String username) {
        String fallback = "Hello " + username + "! I'm your CARTEX support assistant. How can I help you today?";
        if (!isConfigured()) return fallback;

        // Force English strictly with a very high-priority instruction
        String systemPrompt = "You are a professional CARTEX customer support assistant. "
                + "CRITICAL: You MUST respond ONLY in standard English. "
                + "DO NOT use any other language, script, or Romanized Hindi/Urdu (like 'Assalam', 'kesa', 'hai'). "
                + "Keep it professional, warm, and under 18 words.";
        String userPrompt = "Greet the customer " + username + " in professional English and ask how you can help them today.";

        String answer = chat(List.of(
                message("system", systemPrompt),
                message("user", userPrompt)
        ));

        // Basic check: if AI ignored us and used common Hinglish/Urdu words, use fallback
        if (answer != null && isLikelyHinglish(answer)) {
            return fallback;
        }

        return (answer == null || answer.isBlank()) ? fallback : answer;
    }

    public String answerSupportQuestion(User user, String question) {
        return answerSupportQuestion(user, question, null);
    }

    public String answerSupportQuestion(User user, String question, List<Product> products) {
        if (question == null || question.isBlank()) {
            return "Please type your question about CARTEX shopping, cart, payment, or orders.";
        }
        
        String detectedLanguage = detectLanguage(question);
        if ("non-latin".equals(detectedLanguage)) {
            return "Please use Latin characters (English or Romanized Hindi/Urdu like 'kesa ha').";
        }
        
        if (!isConfigured()) {
            return "AI support is currently offline. I can help with CARTEX shopping, payments, and orders.";
        }

        String userContext = user == null
                ? "Guest customer."
                : "Customer: " + user.getUsername() + " (ID: " + user.getId() + ").";

        String productContext = "";
        if (products != null && !products.isEmpty()) {
            StringBuilder sb = new StringBuilder("\nAvailable Products and Prices:\n");
            for (Product p : products) {
                sb.append("- ").append(p.getName())
                  .append(": $").append(p.getPrice());
                if (p.getCategory() != null) {
                    sb.append(" (Category: ").append(p.getCategory().getName()).append(")");
                }
                sb.append("\n");
            }
            productContext = sb.toString();
        }

        String answer = chat(List.of(
                message("system", supportSystemPrompt() + productContext),
                message("user", userContext + "\nQuestion: " + question)
        ));
        
        return (answer == null || answer.isBlank()) 
                ? "I'm here to help with CARTEX. Please tell me more about your request." 
                : answer;
    }

    private String chat(List<Map<String, String>> messages) {
        try {
            String url = "https://api.x.ai/v1/chat/completions";
            String targetModel = model;
            
            if (apiKey != null && apiKey.startsWith("gsk_")) {
                url = "https://api.groq.com/openai/v1/chat/completions";
                if (targetModel.toLowerCase().contains("grok")) {
                    targetModel = "llama-3.3-70b-versatile";
                }
            }

            Map<String, Object> payload = Map.of(
                    "model", targetModel,
                    "messages", messages,
                    "temperature", 0.5,
                    "max_tokens", 250
            );
            String body = mapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .timeout(Duration.ofSeconds(35))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                System.err.println("[AI API ERROR] Status: " + response.statusCode() + " URL: " + url);
                return null;
            }

            JsonNode content = mapper.readTree(response.body())
                    .path("choices")
                    .path(0)
                    .path("message")
                    .path("content");
            return content.isMissingNode() ? null : content.asText().trim();
        } catch (Exception e) {
            System.err.println("[AI API EXCEPTION] " + e.getMessage());
            return null;
        }
    }

    private Map<String, String> message(String role, String content) {
        return Map.of("role", role, "content", content);
    }

    private String supportSystemPrompt() {
        return "You are CARTEX customer support. Help with products, cart, payments (UBL/HBL/COD), and orders. "
                + "CRITICAL: Reply in the EXACT same language and style as the user. "
                + "If they use Romanized Hindi/Urdu (Hinglish/Roman Urdu like 'kesa ha'), you MUST reply in the same Romanized style using Latin letters. "
                + "Be extremely concise and professional. Max 30 words.";
    }

    public String detectLanguage(String text) {
        if (text == null || text.isBlank()) return "en";
        text = text.trim();
        int totalLetters = 0;
        int nonLatin = 0;
        for (char c : text.toCharArray()) {
            if (Character.isLetter(c)) {
                totalLetters++;
                if ((c >= 0x0900 && c <= 0x097F) || (c >= 0x0600 && c <= 0x06FF)) {
                    nonLatin++;
                }
            }
        }
        return (totalLetters > 0 && nonLatin > totalLetters * 0.1) ? "non-latin" : "en";
    }

    public boolean isLikelyHinglish(String text) {
        if (text == null) return false;
        String s = text.toLowerCase();
        String[] patterns = {"kesa","kese","kya","hai","hain","acha","accha","thik","theek","kaise","karo","kar","kaun","kitna","bhai","ap","aap","mein","main","tum","jaldi","shukriya","thanks","assalam","salaam","namaste","ji"};
        for (String p : patterns) if (s.contains(p)) return true;
        return false;
    }

    public String timeOfDayGreeting() {
        int hour = LocalTime.now().getHour();
        if (hour < 12) return "morning";
        if (hour < 17) return "afternoon";
        if (hour < 21) return "evening";
        return "night";
    }
}
