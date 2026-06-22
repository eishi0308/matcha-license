package com.matcha.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Discovers matcha cafes in a city using the Google Places API (New — v1).
 *
 * Requires a Google Cloud API key with "Places API (New)" enabled.
 * Set via: GOOGLE_PLACES_API_KEY environment variable
 *          or google.places.api.key in application.properties
 */
@Service
public class GooglePlacesService {

    @Value("${google.places.api.key:}")
    private String apiKey;

    private static final String SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
    private static final String FIELD_MASK  =
            "places.id,places.displayName,places.formattedAddress," +
            "places.location,places.websiteUri,places.types,places.rating";

    private final HttpClient    httpClient    = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(30)).build();
    private final ObjectMapper  objectMapper  = new ObjectMapper();

    public record PlaceInfo(
            String googleId,
            String name,
            String website,
            String instagram,   // null — Google Places does not return Instagram
            Double lat,
            Double lng,
            String suburb,
            String address
    ) {}

    /**
     * Search for matcha cafes near the given city centre using multiple query terms.
     * Results from all queries are deduplicated by Google Place ID.
     */
    public List<PlaceInfo> searchMatchaCafes(String cityName, double lat, double lng) throws Exception {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                "Google Places API key not configured. " +
                "Set GOOGLE_PLACES_API_KEY as an environment variable " +
                "or google.places.api.key in application.properties."
            );
        }

        // Multiple queries to maximise coverage
        String[] queries = {
            "matcha cafe " + cityName + " Australia",
            "matcha latte " + cityName + " Australia",
            "japanese matcha " + cityName + " Australia",
            "matcha bar " + cityName + " Australia",
        };

        Set<String>     seenIds = new HashSet<>();
        List<PlaceInfo> results = new ArrayList<>();

        for (String query : queries) {
            System.out.printf("[GooglePlaces] Searching: \"%s\"%n", query);
            List<PlaceInfo> batch = searchWithQuery(query, lat, lng);
            for (PlaceInfo p : batch) {
                if (seenIds.add(p.googleId())) {
                    results.add(p);
                }
            }
            Thread.sleep(500); // avoid hammering the API
        }

        System.out.printf("[GooglePlaces] Total unique places found in %s: %d%n", cityName, results.size());
        return results;
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private List<PlaceInfo> searchWithQuery(String query, double lat, double lng) throws Exception {
        List<PlaceInfo> results   = new ArrayList<>();
        String          pageToken = null;
        int             maxPages  = 3; // up to 60 results (20 per page)

        for (int page = 0; page < maxPages; page++) {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("textQuery", query);
            body.put("maxResultCount", 20);
            body.put("languageCode", "en");

            // Bias results towards the city centre
            ObjectNode locationBias = body.putObject("locationBias");
            ObjectNode circle       = locationBias.putObject("circle");
            ObjectNode center       = circle.putObject("center");
            center.put("latitude",  lat);
            center.put("longitude", lng);
            circle.put("radius", 20000.0); // 20 km

            if (pageToken != null) {
                body.put("pageToken", pageToken);
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(SEARCH_URL))
                    .header("Content-Type",   "application/json")
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", FIELD_MASK)
                    .timeout(Duration.ofSeconds(30))
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                System.err.printf("[GooglePlaces] Error %d: %s%n", response.statusCode(), response.body());
                break;
            }

            JsonNode root   = objectMapper.readTree(response.body());
            JsonNode places = root.get("places");

            if (places == null || !places.isArray() || places.isEmpty()) break;

            for (JsonNode place : places) {
                PlaceInfo info = parsePlaceInfo(place);
                if (info != null) results.add(info);
            }

            pageToken = root.has("nextPageToken") ? root.get("nextPageToken").asText() : null;
            if (pageToken == null) break;

            Thread.sleep(2000); // Google requires a delay between paginated requests
        }

        return results;
    }

    private PlaceInfo parsePlaceInfo(JsonNode place) {
        try {
            String id      = place.get("id").asText();
            String name    = place.get("displayName").get("text").asText();
            double lat     = place.get("location").get("latitude").asDouble();
            double lng     = place.get("location").get("longitude").asDouble();
            String address = place.has("formattedAddress") ? place.get("formattedAddress").asText() : "";
            String website = place.has("websiteUri")       ? place.get("websiteUri").asText()       : null;
            String suburb  = extractSuburb(address);

            return new PlaceInfo(id, name, website, null, lat, lng, suburb, address);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Australian addresses look like: "123 King St, Newtown NSW 2042, Australia"
     * Extract the suburb (second comma-segment, before state/postcode).
     */
    private String extractSuburb(String address) {
        if (address == null || address.isBlank()) return "";
        String[] parts = address.split(",");
        if (parts.length >= 2) {
            return parts[1].trim()
                    .replaceAll("\\s+[A-Z]{2,3}\\s+\\d{4}.*", "") // remove "NSW 2042"
                    .trim();
        }
        return "";
    }
}
