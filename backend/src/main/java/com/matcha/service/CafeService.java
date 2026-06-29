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
        long count = cafeRepository.count();

        if (count > 0) {
            // DB already has data — load instantly, no discovery needed
            System.out.printf("[CafeService] Database has %d cafes — ready instantly. Use POST /api/cafes/discover to refresh.%n", count);
            return;
        }

        // Empty DB — run full discovery for the first time
        if (googlePlacesApiKey != null && !googlePlacesApiKey.isBlank()) {
            System.out.println("[CafeService] Empty database — starting first-time discovery...");
            discovering = true;
            Thread thread = new Thread(() -> {
                try {
                    int found = discoverAndSave();
                    System.out.printf("[CafeService] First-time discovery complete — %d cafes added.%n", found);
                } catch (Exception e) {
                    System.err.println("[CafeService] Discovery failed: " + e.getMessage());
                } finally {
                    discovering = false;
                }
            }, "cafe-discovery-thread");
            thread.setDaemon(true);
            thread.start();
        } else {
            System.out.println("[CafeService] No Google Places API key — skipping discovery.");
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

                ScraperService.ScrapeResult scrapeResult = null;
                if (place.website() != null) {
                    System.out.printf("[Discovery] Scraping website: %s%n", place.website());
                    scrapeResult = scraperService.scrapeWithTracking(place.website());
                    if (scrapeResult != null) combined.append(scrapeResult.combinedText());
                }

                if (place.instagram() != null) {
                    String igContent = scraperService.scrapeInstagram(place.instagram());
                    if (igContent != null) combined.append(" ").append(igContent);
                }

                String content = combined.toString().strip();

                // Google already filtered for matcha via search query — trust it.
                // Only skip if AI explicitly says it does NOT serve matcha (and name has no matcha either).
                OpenAiService.CafeAnalysis analysis = null;
                if (!content.isBlank()) {
                    System.out.printf("[Discovery] → Sending to OpenAI for analysis...%n");
                    analysis = openAiService.analyze(place.name(), place.website(), content);
                    analysis = verifyQuote(analysis, content);
                }

                // Find which specific page the quote was found on
                String exactSourceUrl = findQuoteSourcePage(analysis, scrapeResult);

                if (analysis != null && !analysis.servesMatcha() && !place.name().toLowerCase().contains("matcha")) {
                    // AI confirmed it does NOT serve matcha — skip
                    sleep(500);
                    continue;
                }

                System.out.printf("[Discovery] → Matcha confirmed! Saving...%n");

                Cafe cafe = buildDiscoveredCafe(place, city.name(), analysis, verifiedDate, exactSourceUrl);
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

    private Cafe buildDiscoveredCafe(GooglePlacesService.PlaceInfo place, String city, OpenAiService.CafeAnalysis analysis, String verifiedDate, String exactSourceUrl) {
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
                String src = exactSourceUrl != null ? exactSourceUrl : place.website();
                if (src != null && src.length() > 250) src = src.substring(0, 250);
                cafe.setEvidenceSource(src);
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
            String w = place.website().replaceFirst("^https?://", "").replaceAll("/$", "");
            cafe.setWebsite(w.length() > 250 ? w.substring(0, 250) : w);
        }

        return cafe;
    }

    /**
     * Scrub all existing cafes: re-scrape their website, verify the stored evidence quote
     * actually appears verbatim. If not found, clear the quote and downgrade level to C.
     * Returns a summary map with counts of fixed, verified, and skipped cafes.
     */
    public Map<String, Object> cleanupEvidenceQuotes() {
        List<Cafe> cafes = cafeRepository.findAll().stream()
                .filter(c -> c.getEvidenceQuote() != null && !c.getEvidenceQuote().isBlank())
                .toList();

        int verified = 0, fixed = 0, skipped = 0;

        for (Cafe cafe : cafes) {
            String url = cafe.getEvidenceSource() != null ? cafe.getEvidenceSource() : cafe.getWebsite();
            if (url == null || url.isBlank()) { skipped++; continue; }
            if (!url.startsWith("http")) url = "https://" + url;

            try {
                ScraperService.ScrapeResult scrapeResult = scraperService.scrapeWithTracking(url);
                if (scrapeResult == null || scrapeResult.combinedText().isBlank()) { skipped++; continue; }

                String normContent = scrapeResult.combinedText().replaceAll("\\s+", " ").toLowerCase();
                String quote = cafe.getEvidenceQuote();
                String fingerprint = quote.replaceAll("\\s+", " ").toLowerCase().strip();
                fingerprint = fingerprint.length() > 60 ? fingerprint.substring(0, 60) : fingerprint;

                if (normContent.contains(fingerprint)) {
                    // Update source URL to the exact page where the quote was found
                    String exactPage = findQuoteSourcePage(
                        new OpenAiService.CafeAnalysis(true, cafe.getLevel().name(), quote, null, null, List.of(), null),
                        scrapeResult
                    );
                    if (exactPage != null && !exactPage.equals(cafe.getEvidenceSource())) {
                        cafe.setEvidenceSource(exactPage.length() > 250 ? exactPage.substring(0, 250) : exactPage);
                        cafeRepository.save(cafe);
                        System.out.printf("[Cleanup] Updated source URL for '%s': %s%n", cafe.getName(), exactPage);
                    }
                    verified++;
                } else {
                    System.out.printf("[Cleanup] Hallucinated quote removed from '%s': \"%s\"%n", cafe.getName(), quote.substring(0, Math.min(80, quote.length())));
                    cafe.setEvidenceQuote(null);
                    cafe.setEvidenceSource(null);
                    cafe.setEvidenceSourceLabel(null);
                    cafe.setEvidenceVerifiedDate(null);
                    cafe.setLevel(TransparencyLevel.C);
                    cafe.setCoverColor("#9ca3af");
                    cafe.setDescription(null); // remove AI description that may reference unverified sourcing
                    cafe.setTagline(null);
                    cafeRepository.save(cafe);
                    fixed++;
                }
                sleep(500);
            } catch (Exception e) {
                System.out.printf("[Cleanup] Could not scrape '%s': %s%n", cafe.getName(), e.getMessage());
                skipped++;
            }
        }

        // Also clear descriptions on C/D cafes that still reference specific Japanese origins
        // (these were demoted but descriptions weren't cleared in the first pass)
        List<String> originKeywords = List.of("uji", "yame", "kagoshima", "nishio", "shizuoka", "kyoto",
                "fukuoka", "izumo", "single-origin", "single origin", "directly from");
        int descFixed = 0;
        for (Cafe cafe : cafeRepository.findAll()) {
            if (cafe == null) continue;
            if (cafe.getLevel() != TransparencyLevel.C && cafe.getLevel() != TransparencyLevel.D) continue;
            if (cafe.getDescription() == null) continue;
            String descLower = cafe.getDescription().toLowerCase();
            if (originKeywords.stream().anyMatch(descLower::contains)) {
                cafe.setDescription(null);
                cafe.setTagline(null);
                cafeRepository.save(cafe);
                descFixed++;
                System.out.printf("[Cleanup] Cleared misleading description from '%s'%n", cafe.getName());
            }
        }

        System.out.printf("[Cleanup] Done. Verified: %d, Fixed: %d, Desc cleared: %d, Skipped: %d%n", verified, fixed, descFixed, skipped);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("verified", verified);
        result.put("fixed", fixed);
        result.put("descriptionsCleaned", descFixed);
        result.put("skipped", skipped);
        return result;
    }

    /**
     * Find which specific page the evidence quote was found on.
     * Returns the exact subpage URL, or the homepage URL if found there, or null.
     */
    private String findQuoteSourcePage(OpenAiService.CafeAnalysis analysis, ScraperService.ScrapeResult scrapeResult) {
        if (analysis == null || analysis.evidenceQuote() == null || scrapeResult == null) return null;
        String fingerprint = analysis.evidenceQuote().replaceAll("\\s+", " ").toLowerCase().strip();
        fingerprint = fingerprint.length() > 60 ? fingerprint.substring(0, 60) : fingerprint;
        for (Map.Entry<String, String> entry : scrapeResult.pageTexts().entrySet()) {
            String normPage = entry.getValue().replaceAll("\\s+", " ").toLowerCase();
            if (normPage.contains(fingerprint)) return entry.getKey();
        }
        return null;
    }

    /**
     * Verify the AI-returned evidence quote actually exists in the scraped content.
     * If not found, null out the quote and downgrade level to C to prevent hallucinated evidence.
     */
    private OpenAiService.CafeAnalysis verifyQuote(OpenAiService.CafeAnalysis analysis, String scrapedContent) {
        if (analysis == null || analysis.evidenceQuote() == null) return analysis;

        // Normalise both strings for comparison (collapse whitespace, lowercase)
        String normContent = scrapedContent.replaceAll("\\s+", " ").toLowerCase();
        String normQuote   = analysis.evidenceQuote().replaceAll("\\s+", " ").toLowerCase().strip();

        // Check if a significant portion of the quote appears verbatim
        // Use first 60 chars of the quote as a fingerprint (long enough to avoid false positives)
        String fingerprint = normQuote.length() > 60 ? normQuote.substring(0, 60) : normQuote;

        if (!normContent.contains(fingerprint)) {
            System.out.printf("[Verify] Evidence quote NOT found in scraped content — removing quote and downgrading level to C.%n");
            System.out.printf("[Verify] Hallucinated quote was: \"%s\"%n", analysis.evidenceQuote());
            return new OpenAiService.CafeAnalysis(
                    analysis.servesMatcha(),
                    "C",
                    null,
                    analysis.tagline(),
                    analysis.description(),
                    analysis.specialties(),
                    analysis.type()
            );
        }

        return analysis;
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
