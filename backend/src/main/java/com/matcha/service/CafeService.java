package com.matcha.service;

import com.matcha.model.Cafe;
import com.matcha.model.CafeResponse;
import com.matcha.model.TransparencyLevel;
import com.matcha.repository.CafeRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class CafeService {

    @Autowired
    private CafeRepository cafeRepository;

    @Autowired
    private GooglePlacesService googlePlacesService;

    @Autowired
    private ScraperService scraperService;

    @Autowired
    private OpenAiService openAiService;

    @Value("${google.places.api.key:}")
    private String googlePlacesApiKey;

    private volatile boolean discovering = false;

    public boolean isDiscovering() { return discovering; }

    // ── Startup ───────────────────────────────────────────────────────────────

    @PostConstruct
    public void initialize() {
        // If Google Places API key is set, run full discovery in the background
        if (googlePlacesApiKey != null && !googlePlacesApiKey.isBlank()) {
            System.out.println("[CafeService] Google Places API key detected — starting background discovery...");
            discovering = true;
            Thread thread = new Thread(() -> {
                try {
                    int found = discoverAndSave();
                    System.out.printf("[CafeService] Background discovery complete — %d new cafes added.%n", found);
                } catch (Exception e) {
                    System.err.println("[CafeService] Background discovery failed: " + e.getMessage());
                } finally {
                    discovering = false;
                }
            }, "cafe-discovery-thread");
            thread.setDaemon(true);
            thread.start();
        } else {
            System.out.println("[CafeService] No Google Places API key — skipping discovery. Set GOOGLE_PLACES_API_KEY to enable.");
        }
    }

    // ── Query methods ─────────────────────────────────────────────────────────

    public List<CafeResponse> findAll(String city, String level) {
        List<Cafe> cafes;

        if (city != null && !city.isBlank() && level != null && !level.isBlank()) {
            TransparencyLevel lvl = TransparencyLevel.valueOf(level.toUpperCase());
            cafes = cafeRepository.findByCityAndLevel(city, lvl);
        } else if (city != null && !city.isBlank()) {
            cafes = cafeRepository.findByCityIgnoreCase(city);
        } else if (level != null && !level.isBlank()) {
            cafes = cafeRepository.findByLevel(TransparencyLevel.valueOf(level.toUpperCase()));
        } else {
            cafes = cafeRepository.findAll();
        }

        List<CafeResponse> responses = new ArrayList<>();
        for (Cafe c : cafes) responses.add(CafeResponse.from(c));
        return responses;
    }

    public Optional<CafeResponse> findById(String id) {
        return cafeRepository.findById(id).map(CafeResponse::from);
    }

    public Map<String, Object> getStats() {
        List<Cafe> all = cafeRepository.findAll();
        Map<String, Long> byLevel = new LinkedHashMap<>();
        byLevel.put("A", all.stream().filter(c -> c.getLevel() == TransparencyLevel.A).count());
        byLevel.put("B", all.stream().filter(c -> c.getLevel() == TransparencyLevel.B).count());
        byLevel.put("C", all.stream().filter(c -> c.getLevel() == TransparencyLevel.C).count());
        byLevel.put("D", all.stream().filter(c -> c.getLevel() == TransparencyLevel.D).count());

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", (long) all.size());
        stats.put("byLevel", byLevel);
        stats.put("sydney", all.stream().filter(c -> "Sydney".equals(c.getCity())).count());
        stats.put("melbourne", all.stream().filter(c -> "Melbourne".equals(c.getCity())).count());
        stats.put("discovering", discovering);
        return stats;
    }

    // ── Discovery pipeline ────────────────────────────────────────────────────

    /**
     * Run the full discovery pipeline:
     * 1. Query Overpass for cafes in Sydney and Melbourne
     * 2. For each with a website, scrape it for matcha mentions
     * 3. Send to Claude for transparency analysis
     * 4. Save new cafes to database
     *
     * @return count of newly discovered cafes
     */
    public int discoverAndSave() throws Exception {
        record CityConfig(String name, double lat, double lng) {}
        List<CityConfig> cities = List.of(
                new CityConfig("Sydney",    -33.8688, 151.2093),
                new CityConfig("Melbourne", -37.8136, 144.9631)
        );

        int discovered = 0;
        String verifiedDate = LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM yyyy"));

        for (CityConfig city : cities) {
            System.out.printf("[Discovery] Searching Google Places for matcha cafes in %s...%n", city.name());
            List<GooglePlacesService.PlaceInfo> places = googlePlacesService.searchMatchaCafes(city.name(), city.lat(), city.lng());
            System.out.printf("[Discovery] Found %d places in %s%n", places.size(), city.name());

            for (GooglePlacesService.PlaceInfo place : places) {
                // Skip if already in DB
                if (cafeRepository.existsByNameAndCity(place.name(), city.name())) continue;

                // Scrape website + Instagram, combine into one content block
                StringBuilder combined = new StringBuilder();

                if (place.website() != null) {
                    System.out.printf("[Discovery] Scraping website: %s%n", place.website());
                    String websiteContent = scraperService.scrape(place.website());
                    if (websiteContent != null) combined.append(websiteContent);
                }

                if (place.instagram() != null) {
                    String igContent = scraperService.scrapeInstagram(place.instagram());
                    if (igContent != null) combined.append(" ").append(igContent);
                }

                String content = combined.toString().strip();

                // Skip if no matcha content and name doesn't mention matcha
                if (!scraperService.mentionsMatcha(content) && !place.name().toLowerCase().contains("matcha")) {
                    sleep(500);
                    continue;
                }

                System.out.printf("[Discovery] → Matcha found! Sending to Claude...%n");
                OpenAiService.CafeAnalysis analysis = null;
                if (!content.isBlank()) {
                    analysis = openAiService.analyze(place.name(), place.website(), content);
                }

                if (analysis == null || !analysis.servesMatcha()) {
                    // Name contains matcha but AI couldn't confirm — save as C
                    if (place.name().toLowerCase().contains("matcha")) {
                        Cafe cafe = buildDiscoveredCafe(place, city.name(), null, verifiedDate);
                        cafeRepository.save(cafe);
                        discovered++;
                    }
                    sleep(1000);
                    continue;
                }

                Cafe cafe = buildDiscoveredCafe(place, city.name(), analysis, verifiedDate);
                cafeRepository.save(cafe);
                discovered++;
                System.out.printf("[Discovery] → Saved '%s' as Level %s%n", place.name(), cafe.getLevel());

                sleep(2000); // be polite to websites
            }

            sleep(3000); // pause between cities
        }

        System.out.printf("[Discovery] Done. Discovered %d new cafes.%n", discovered);
        return discovered;
    }

    private Cafe buildDiscoveredCafe(GooglePlacesService.PlaceInfo place, String city, OpenAiService.CafeAnalysis analysis, String verifiedDate) {
        long count = cafeRepository.count();
        String prefix = city.substring(0, 3).toLowerCase();
        String id = prefix + "-disc-" + String.format("%03d", count + 1);

        Cafe cafe = new Cafe();
        cafe.setId(id);
        cafe.setName(place.name());
        cafe.setCity(city);
        cafe.setSuburb(place.suburb() != null ? place.suburb() : "");
        cafe.setAddress(place.address() != null ? place.address() : "");
        cafe.setLat(place.lat());
        cafe.setLng(place.lng());
        cafe.setInstagram(place.instagram());
        cafe.setPriceRange("$$");

        if (analysis != null) {
            cafe.setLevel(analysis.level() != null ? TransparencyLevel.valueOf(analysis.level()) : TransparencyLevel.C);
            cafe.setType(analysis.type() != null ? analysis.type() : "cafe");
            cafe.setTagline(analysis.tagline() != null ? analysis.tagline() : "");
            cafe.setDescription(analysis.description() != null ? analysis.description() : "");
            cafe.setSpecialties(analysis.specialties() != null ? String.join(",", analysis.specialties()) : "");
            cafe.setCoverColor(coverColorForLevel(analysis.level()));

            if (analysis.evidenceQuote() != null) {
                cafe.setEvidenceQuote(analysis.evidenceQuote());
                cafe.setEvidenceSource(place.website());
                cafe.setEvidenceSourceLabel("Official Website");
                cafe.setEvidenceVerifiedDate(verifiedDate);
            }
        } else {
            cafe.setLevel(TransparencyLevel.C);
            cafe.setType("cafe");
            cafe.setTagline("");
            cafe.setDescription("");
            cafe.setSpecialties("");
            cafe.setCoverColor("#9ca3af");
        }

        if (place.website() != null) {
            cafe.setWebsite(place.website().replaceFirst("^https?://", "").replaceAll("/$", ""));
        }

        return cafe;
    }

    private String coverColorForLevel(String level) {
        if (level == null) return "#9ca3af";
        return switch (level) {
            case "A" -> "#2e6027";
            case "B" -> "#3a7a30";
            case "C" -> "#9ca3af";
            default  -> "#d1d5db";
        };
    }

    private void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException ignored) {}
    }

}
