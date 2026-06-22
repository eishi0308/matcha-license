package com.matcha.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class OverpassService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    public record PlaceInfo(
            String name,
            String website,
            String instagram,
            Double lat,
            Double lng,
            String suburb,
            String address
    ) {}

    /**
     * Query Overpass API for cafes and restaurants within a radius of the given city center.
     */
    public List<PlaceInfo> searchCafes(String cityName, double lat, double lng) throws Exception {
        int radiusMeters = 8000;
        String query = String.format("""
                [out:json][timeout:120];
                (
                  node["amenity"="cafe"](around:%d,%f,%f);
                  node["amenity"="restaurant"](around:%d,%f,%f);
                );
                out body;
                """, radiusMeters, lat, lng, radiusMeters, lat, lng);

        String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://overpass-api.de/api/interpreter"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .timeout(Duration.ofSeconds(130))
                .POST(HttpRequest.BodyPublishers.ofString("data=" + encoded))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Overpass API error: " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode elements = root.get("elements");

        List<PlaceInfo> results = new ArrayList<>();
        if (elements == null || !elements.isArray()) return results;

        for (JsonNode el : elements) {
            JsonNode tags = el.get("tags");
            if (tags == null) continue;

            String name = tags.has("name") ? tags.get("name").asText() : null;
            if (name == null || name.isBlank()) continue;

            String website  = tags.has("website")            ? tags.get("website").asText()            : null;
            String instagram = tags.has("contact:instagram") ? tags.get("contact:instagram").asText()  : null;
            double elLat    = el.get("lat").asDouble();
            double elLon    = el.get("lon").asDouble();
            String suburb   = tags.has("addr:suburb")        ? tags.get("addr:suburb").asText()        : cityName + " CBD";
            String address  = buildAddress(tags);

            results.add(new PlaceInfo(name, website, instagram, elLat, elLon, suburb, address));
        }

        return results;
    }

    private String buildAddress(JsonNode tags) {
        StringBuilder sb = new StringBuilder();
        if (tags.has("addr:housenumber")) sb.append(tags.get("addr:housenumber").asText()).append(" ");
        if (tags.has("addr:street"))      sb.append(tags.get("addr:street").asText()).append(", ");
        if (tags.has("addr:suburb"))      sb.append(tags.get("addr:suburb").asText()).append(" ");
        if (tags.has("addr:state"))       sb.append(tags.get("addr:state").asText());
        return sb.toString().trim();
    }
}
