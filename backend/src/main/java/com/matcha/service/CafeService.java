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
                }

                // Find which specific page the quote was found on
                String exactSourceUrl = findQuoteSourcePage(analysis, scrapeResult);

                if (analysis != null && !analysis.servesMatcha() && !place.name().toLowerCase().contains("matcha")) {
                    // AI confirmed it does NOT serve matcha — skip
                    sleep(500);
                    continue;
                }

                System.out.printf("[Discovery] → Matcha confirmed! Saving...%n");

                Cafe cafe = buildDiscoveredCafe(place, city.name(), analysis, verifiedDate, exactSourceUrl, content, scrapeResult);
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

    private Cafe buildDiscoveredCafe(GooglePlacesService.PlaceInfo place, String city, OpenAiService.CafeAnalysis analysis, String verifiedDate, String exactSourceUrl, String scrapedContent, ScraperService.ScrapeResult scrapeResult) {
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
            // The AI's own level is discarded. The grade is derived from evidence that
            // survives every gate, so a level can never outrun the proof behind it.
            // The page text is searched too, so a weak quote cannot cap the grade.
            TransparencyGrader.Evidence evidence =
                    TransparencyGrader.decide(analysis.evidenceQuote(), scrapedContent);
            TransparencyLevel level = evidence == null ? TransparencyLevel.C : evidence.level();

            cafe.setLevel(level);
            cafe.setType(analysis.type() != null ? analysis.type() : "cafe");
            cafe.setSpecialties(analysis.specialties() != null ? String.join(",", analysis.specialties()) : "");
            cafe.setCoverColor(coverColorForLevel(level.name()));

            if (TransparencyGrader.levelRequiresEvidence(level)) {
                // Level and evidence are written together — never one without the other.
                cafe.setEvidenceQuote(evidence.quote());
                String src = locateQuotePage(evidence.quote(), scrapeResult);
                if (src == null) src = exactSourceUrl != null ? exactSourceUrl : place.website();
                if (src != null && src.length() > 250) src = src.substring(0, 250);
                cafe.setEvidenceSource(src);
                cafe.setEvidenceSourceLabel("Official Website");
                cafe.setEvidenceVerifiedDate(verifiedDate);
                cafe.setTagline(analysis.tagline() != null ? analysis.tagline() : "");
                cafe.setDescription(analysis.description() != null ? analysis.description() : "");
            } else {
                // No qualifying evidence: keep no quote, and no AI prose that might imply
                // a sourcing claim the cafe never actually made.
                cafe.setTagline("");
                cafe.setDescription("");
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
        // Audit every record that CLAIMS a disclosure (A or B) plus every record that holds a
        // quote at any level. The old filter looked only at rows that already had a quote,
        // which made an unsupported Level A invisible to the very pass meant to catch it.
        List<Cafe> cafes = cafeRepository.findAll().stream()
                .filter(c -> TransparencyGrader.levelRequiresEvidence(c.getLevel())
                        || (c.getEvidenceQuote() != null && !c.getEvidenceQuote().isBlank()))
                .toList();

        int verified = 0, fixed = 0, skipped = 0;

        for (Cafe cafe : cafes) {
            // No quote but claiming A or B — unsupported by construction. Downgrade without
            // needing a network call at all.
            if (cafe.getEvidenceQuote() == null || cafe.getEvidenceQuote().isBlank()) {
                System.out.printf("[Cleanup] Level %s with no evidence — downgrading '%s' to C%n",
                        cafe.getLevel(), cafe.getName());
                demoteToC(cafe);
                fixed++;
                continue;
            }

            String url = cafe.getEvidenceSource() != null ? cafe.getEvidenceSource() : cafe.getWebsite();
            if (url == null || url.isBlank()) { skipped++; continue; }
            if (!url.startsWith("http")) url = "https://" + url;

            try {
                ScraperService.ScrapeResult scrapeResult = scraperService.scrapeWithTracking(url);
                if (scrapeResult == null || scrapeResult.combinedText().isBlank()) { skipped++; continue; }

                String quote = cafe.getEvidenceQuote();

                // Gate 2 — the quote must still exist on the live page.
                if (!TransparencyGrader.appearsVerbatim(quote, scrapeResult.combinedText())) {
                    System.out.printf("[Cleanup] Hallucinated quote removed from '%s': \"%s\"%n",
                            cafe.getName(), quote.substring(0, Math.min(80, quote.length())));
                    demoteToC(cafe);
                    fixed++;
                    sleep(500);
                    continue;
                }

                // Gates 3-6 — re-derive the grade from what the quote actually proves.
                TransparencyLevel regraded = TransparencyGrader.gradeVerifiedQuote(quote);

                if (regraded != cafe.getLevel()) {
                    System.out.printf("[Cleanup] Re-graded '%s': %s → %s (\"%s\")%n",
                            cafe.getName(), cafe.getLevel(), regraded,
                            quote.substring(0, Math.min(70, quote.length())));

                    if (regraded == TransparencyLevel.C || regraded == TransparencyLevel.D) {
                        demoteToC(cafe);
                    } else {
                        cafe.setLevel(regraded);
                        cafe.setCoverColor(coverColorForLevel(regraded.name()));
                        cafeRepository.save(cafe);
                    }
                    fixed++;
                    sleep(500);
                    continue;
                }

                // Grade holds — refresh the source URL to the exact page carrying the quote.
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
     * Re-scrape stored cafes and re-derive both level and evidence from what is on the
     * site today.
     *
     * <p>Distinct from {@link #cleanupEvidenceQuotes()}, which can only ever demote: it
     * re-checks the quote already stored and never asks whether the page proves more.
     * This pass searches the page text directly, so a cafe whose disclosure was missed
     * at discovery time can be promoted on the evidence it actually publishes.
     *
     * <p>Level D is preserved unless the site now supports A or B — "not enough
     * information" is a distinct state, not a weaker C.
     *
     * @param levelFilter only regrade cafes at this level, or null for all
     * @param dryRun      when true, nothing is written; the proposed changes are returned
     * @param limit       maximum cafes to process, 0 for no limit
     */
    public Map<String, Object> regrade(String levelFilter, boolean dryRun, int limit) {
        List<Cafe> targets = cafeRepository.findAll().stream()
                .filter(c -> levelFilter == null || levelFilter.isBlank()
                        || c.getLevel() == TransparencyLevel.valueOf(levelFilter.toUpperCase()))
                .sorted(Comparator.comparing(Cafe::getId))
                .limit(limit > 0 ? limit : Long.MAX_VALUE)
                .toList();

        List<Map<String, Object>> changes = new ArrayList<>();
        int unchanged = 0, skipped = 0;

        for (Cafe cafe : targets) {
            String url = startUrl(cafe);
            if (url == null) { skipped++; continue; }

            ScraperService.ScrapeResult scraped;
            try {
                scraped = scraperService.scrapeWithTracking(url);
            } catch (Exception e) {
                System.out.printf("[Regrade] Could not scrape '%s': %s%n", cafe.getName(), e.getMessage());
                skipped++;
                continue;
            }
            if (scraped == null || scraped.combinedText().isBlank()) { skipped++; continue; }

            TransparencyGrader.Evidence evidence =
                    TransparencyGrader.decide(cafe.getEvidenceQuote(), scraped.combinedText());
            TransparencyLevel proposed = evidence == null ? TransparencyLevel.C : evidence.level();

            // "Insufficient information" is not the same claim as "no disclosure".
            if (cafe.getLevel() == TransparencyLevel.D && !TransparencyGrader.levelRequiresEvidence(proposed)) {
                unchanged++;
                sleep(300);
                continue;
            }

            String newQuote = evidence == null ? null : evidence.quote();
            boolean levelSame = proposed == cafe.getLevel();
            boolean quoteSame = Objects.equals(newQuote, cafe.getEvidenceQuote());
            if (levelSame && quoteSame) { unchanged++; sleep(300); continue; }

            String sourcePage = locateQuotePage(newQuote, scraped);
            Map<String, Object> change = new LinkedHashMap<>();
            change.put("id", cafe.getId());
            change.put("name", cafe.getName());
            change.put("from", cafe.getLevel().name());
            change.put("to", proposed.name());
            change.put("direction", proposed.compareTo(cafe.getLevel()) < 0 ? "PROMOTE"
                    : proposed.compareTo(cafe.getLevel()) > 0 ? "DEMOTE" : "QUOTE-ONLY");
            change.put("oldQuote", cafe.getEvidenceQuote());
            change.put("newQuote", newQuote);
            change.put("sourcePage", sourcePage != null ? sourcePage : url);
            change.put("pagesScraped", scraped.pageTexts().size());
            changes.add(change);

            if (!dryRun) applyRegrade(cafe, proposed, newQuote, sourcePage != null ? sourcePage : url);
            sleep(300);
        }

        System.out.printf("[Regrade] %s — %d changes, %d unchanged, %d skipped%n",
                dryRun ? "DRY RUN" : "APPLIED", changes.size(), unchanged, skipped);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("dryRun", dryRun);
        result.put("examined", targets.size());
        result.put("changed", changes.size());
        result.put("unchanged", unchanged);
        result.put("skipped", skipped);
        result.put("changes", changes);
        return result;
    }

    private void applyRegrade(Cafe cafe, TransparencyLevel level, String quote, String sourcePage) {
        if (!TransparencyGrader.levelRequiresEvidence(level)) {
            demoteToC(cafe);
            return;
        }
        cafe.setLevel(level);
        cafe.setCoverColor(coverColorForLevel(level.name()));
        cafe.setEvidenceQuote(quote);
        cafe.setEvidenceSource(sourcePage.length() > 250 ? sourcePage.substring(0, 250) : sourcePage);
        cafe.setEvidenceSourceLabel("Official Website");
        cafe.setEvidenceVerifiedDate(LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM yyyy")));
        cafeRepository.save(cafe);
    }

    /**
     * Always start from the site root so the crawler sees the full navigation and can
     * rank pages itself. Stored websites are sometimes a deep link — starting from
     * "jsytea.com.au/pages/contact" reached two pages, because a contact page links
     * almost nowhere.
     */
    private String startUrl(Cafe cafe) {
        String w = cafe.getWebsite();
        if (w == null || w.isBlank()) return null;
        String full = w.startsWith("http") ? w : "https://" + w;
        try {
            java.net.URI u = java.net.URI.create(full);
            if (u.getHost() != null) {
                return (u.getScheme() != null ? u.getScheme() : "https") + "://" + u.getHost();
            }
        } catch (Exception ignored) {
            // fall through to the stored value
        }
        return full;
    }

    /**
     * Find which specific page the evidence quote was found on.
     * Returns the exact subpage URL, or the homepage URL if found there, or null.
     */
    private String findQuoteSourcePage(OpenAiService.CafeAnalysis analysis, ScraperService.ScrapeResult scrapeResult) {
        return analysis == null ? null : locateQuotePage(analysis.evidenceQuote(), scrapeResult);
    }

    /** Which scraped page carries this quote, by leading fingerprint. Null if none does. */
    private String locateQuotePage(String quote, ScraperService.ScrapeResult scrapeResult) {
        if (quote == null || quote.isBlank() || scrapeResult == null) return null;
        String fingerprint = quote.replaceAll("\\s+", " ").toLowerCase().strip();
        fingerprint = fingerprint.length() > 60 ? fingerprint.substring(0, 60) : fingerprint;
        for (Map.Entry<String, String> entry : scrapeResult.pageTexts().entrySet()) {
            String normPage = entry.getValue().replaceAll("\\s+", " ").toLowerCase();
            if (normPage.contains(fingerprint)) return entry.getKey();
        }
        return null;
    }

    /**
     * Strip a cafe back to Level C: no quote, no source, no AI prose that might imply a
     * sourcing claim the cafe never made. Used whenever evidence fails any gate.
     */
    private void demoteToC(Cafe cafe) {
        cafe.setLevel(TransparencyLevel.C);
        cafe.setCoverColor(coverColorForLevel("C"));
        cafe.setEvidenceQuote(null);
        cafe.setEvidenceSource(null);
        cafe.setEvidenceSourceLabel(null);
        cafe.setEvidenceVerifiedDate(null);
        cafe.setDescription(null);
        cafe.setTagline(null);
        cafeRepository.save(cafe);
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
