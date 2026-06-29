package com.matcha.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class OpenAiService {

    @Value("${openai.api.key:}")
    private String apiKey;

    private final HttpClient   httpClient   = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(30)).build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public record CafeAnalysis(
            boolean servesMatcha,
            String level,
            String evidenceQuote,
            String tagline,
            String description,
            List<String> specialties,
            String type
    ) {}

    /**
     * Send scraped website content to GPT-4o and get a structured matcha transparency analysis.
     */
    public CafeAnalysis analyze(String cafeName, String website, String content) {
        if (apiKey == null || apiKey.isBlank()) {
            System.out.println("[OpenAI] No API key set — skipping AI analysis.");
            return null;
        }

        try {
            String prompt = buildPrompt(cafeName, website, content);

            ObjectNode requestBody = objectMapper.createObjectNode();
            requestBody.put("model", "gpt-4o");
            requestBody.put("max_tokens", 1024);

            ArrayNode messages = requestBody.putArray("messages");
            ObjectNode message = messages.addObject();
            message.put("role", "user");
            message.put("content", prompt);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                    .header("Content-Type",  "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                System.err.printf("[OpenAI] API error %d: %s%n", response.statusCode(), response.body());
                return null;
            }

            JsonNode responseNode = objectMapper.readTree(response.body());
            String text = responseNode.get("choices").get(0).get("message").get("content").asText().strip();

            return parseAnalysis(text);

        } catch (Exception e) {
            System.err.printf("[OpenAI] Error analyzing %s: %s%n", cafeName, e.getMessage());
            return null;
        }
    }

    private String buildPrompt(String cafeName, String website, String content) {
        return """
                Analyze this cafe's website content. Determine if they serve matcha and how transparent they are about sourcing.

                Cafe: %s
                Website: %s

                Content:
                %s

                Respond with ONLY valid JSON — no explanation, no markdown:
                {
                  "servesMatcha": true,
                  "level": "A",
                  "evidenceQuote": "VERBATIM copy-paste from the Content above that proves the level, or null",
                  "tagline": "one short sentence describing their matcha offering, or null",
                  "description": "two sentences about their matcha program, or null",
                  "specialties": ["Matcha Latte", "Hojicha"],
                  "type": "cafe"
                }

                Level guide (assign based ONLY on evidence in the content):
                A = Names specific Japanese prefecture (Uji, Nishio, Kagoshima, Yame, etc.) or a specific farm/supplier
                B = Mentions "Japanese matcha" generally but no region or farm
                C = Serves matcha but zero sourcing information disclosed
                D = Not enough information to classify (but does serve matcha)
                null = Does not serve matcha at all

                CRITICAL RULES for evidenceQuote:
                - It MUST be copied word-for-word from the Content above. Do NOT paraphrase, rewrite, or invent.
                - If you cannot find an exact verbatim passage in the Content supporting level A or B, set evidenceQuote to null and use level C instead.
                - Never fabricate or summarize text for evidenceQuote.

                Type options: "specialty", "cafe", "dessert", "chain"
                """.formatted(cafeName, website, content);
    }

    private CafeAnalysis parseAnalysis(String text) throws Exception {
        int start = text.indexOf('{');
        int end   = text.lastIndexOf('}') + 1;
        if (start == -1 || end == 0) return null;

        JsonNode result = objectMapper.readTree(text.substring(start, end));

        boolean servesMatcha = result.has("servesMatcha") && result.get("servesMatcha").asBoolean();
        String level         = getStringOrNull(result, "level");
        String evidenceQuote = getStringOrNull(result, "evidenceQuote");
        String tagline       = getStringOrNull(result, "tagline");
        String description   = getStringOrNull(result, "description");
        String type          = result.has("type") ? result.get("type").asText("cafe") : "cafe";

        List<String> specialties = new ArrayList<>();
        if (result.has("specialties") && result.get("specialties").isArray()) {
            for (JsonNode item : result.get("specialties")) {
                specialties.add(item.asText());
            }
        }

        return new CafeAnalysis(servesMatcha, level, evidenceQuote, tagline, description, specialties, type);
    }

    private String getStringOrNull(JsonNode node, String field) {
        if (!node.has(field) || node.get(field).isNull()) return null;
        String val = node.get(field).asText().strip();
        return val.isEmpty() || val.equals("null") ? null : val;
    }
}
