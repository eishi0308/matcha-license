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

    // ── Startup ───────────────────────────────────────────────────────────────

    @PostConstruct
    public void initialize() {
        // Always seed the 16 curated cafes immediately so the app is usable right away
        if (cafeRepository.count() == 0) {
            cafeRepository.saveAll(buildSeedCafes());
            System.out.println("[CafeService] Seeded " + cafeRepository.count() + " cafes into database.");
        }

        // If Google Places API key is set, run full discovery in the background
        if (googlePlacesApiKey != null && !googlePlacesApiKey.isBlank()) {
            System.out.println("[CafeService] Google Places API key detected — starting background discovery...");
            Thread thread = new Thread(() -> {
                try {
                    int found = discoverAndSave();
                    System.out.printf("[CafeService] Background discovery complete — %d new cafes added.%n", found);
                } catch (Exception e) {
                    System.err.println("[CafeService] Background discovery failed: " + e.getMessage());
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

    // ── Seed data ──────────────────────────────────────────────────────────────

    private List<Cafe> buildSeedCafes() {
        return List.of(
                // ── SYDNEY ──────────────────────────────────────────────────────
                cafe("syd-001", "Ippodo Tea Co. Sydney", "Sydney", "CBD",
                        "Level 1, 50 Hunter St, Sydney NSW 2000", -33.8667, 151.2090,
                        "A", "specialty", "Direct from Kyoto since 1717",
                        "One of Japan's oldest tea houses, Ippodo imports directly from their Kyoto estate. Every batch is traceable to a specific harvest season.",
                        "Our matcha is sourced exclusively from Uji, Kyoto — the birthplace of Japanese tea culture. Each tin includes the harvest date and garden name.",
                        "https://ippodo-tea.co.jp/en/", "Official Website — About Our Tea", "May 2026",
                        "@ippodotea", "ippodo-tea.co.jp", "$$$", "Koicha,Thin Matcha,Uji Gyokuro", "#2e6027"),

                cafe("syd-002", "Matcha Mylkbar", "Sydney", "Newtown",
                        "312 King St, Newtown NSW 2042", -33.8979, 151.1783,
                        "A", "cafe", "Plant-based matcha, Nishio sourced",
                        "A plant-forward cafe that prominently features their Nishio-prefecture matcha across an extensive all-day menu.",
                        "We use ceremonial-grade matcha sourced directly from Nishio, Aichi — Japan's largest matcha-producing region. Imported quarterly for freshness.",
                        "https://instagram.com/matchamylkbar", "Instagram Bio + Menu Page", "April 2026",
                        "@matchamylkbar", null, "$$", "Matcha Mylk Latte,Matcha Soft Serve,Hojicha", "#3a7a30"),

                cafe("syd-003", "Koi Dessert Bar", "Sydney", "Chippendale",
                        "Shop 1, 49 Kensington St, Chippendale NSW 2008", -33.8855, 151.1996,
                        "A", "dessert", "Award-winning Japanese patisserie",
                        "Pastry chef Dan Hong's renowned dessert bar uses verified Japanese matcha sourced from Uji in their signature tasting menus.",
                        "Our matcha is 100% sourced from Uji, Kyoto. We believe in full transparency — every ingredient we use is traceable to its origin.",
                        "https://koidessertbar.com.au/about", "Official Website — Philosophy", "March 2026",
                        "@koidessertbar", "koidessertbar.com.au", "$$$", "Matcha Opera Cake,Matcha Mille-Feuille,Hojicha Panna Cotta", "#4d9740"),

                cafe("syd-004", "Single O Surry Hills", "Sydney", "Surry Hills",
                        "60 Reservoir St, Surry Hills NSW 2010", -33.8853, 151.2115,
                        "B", "cafe", "Specialty coffee & Japanese matcha",
                        "Beloved Sydney roaster that serves Japanese matcha alongside their specialty coffee — sourcing details available on request but not prominently displayed.",
                        "Our matcha is sourced from Japan and prepared with the same care as our single-origin coffees.",
                        "https://singleo.com.au", "Official Menu Page", "April 2026",
                        "@singleosurry", "singleo.com.au", "$$", "Matcha Latte,Iced Hojicha,Cold Brew", "#6eb35c"),

                cafe("syd-005", "Circa Espresso", "Sydney", "Leichhardt",
                        "118 Marion St, Leichhardt NSW 2040", -33.8836, 151.1573,
                        "B", "cafe", "Neighbourhood cafe with Japanese influences",
                        "Community-favourite cafe that describes their matcha as 'authentic Japanese' on their board, though no prefecture or supplier is named.",
                        "We serve authentic Japanese matcha, carefully selected for its vibrant colour and umami depth.",
                        "https://instagram.com/circaespresso", "Instagram Post — May 2025", "February 2026",
                        "@circaespresso", null, "$", "Matcha Latte,Matcha Croissant,Flat White", "#6eb35c"),

                cafe("syd-006", "Pablo & Rusty's", "Sydney", "CBD",
                        "161 Castlereagh St, Sydney NSW 2000", -33.8714, 151.2073,
                        "C", "chain", "Specialty coffee group",
                        "Popular Sydney coffee chain offering matcha lattes across multiple locations. No public origin disclosure found on website or social media.",
                        null, null, null, null,
                        "@pabloandrustyss", "pabloandrusty.com", "$$", "Matcha Latte,Cold Brew,Espresso", "#9ca3af"),

                cafe("syd-007", "Grounds of Alexandria", "Sydney", "Alexandria",
                        "7A, 2 Huntley St, Alexandria NSW 2015", -33.9117, 151.1940,
                        "C", "cafe", "Sydney's iconic garden cafe",
                        "A Sydney landmark known for its beautiful setting. Serves matcha but provides no public sourcing information on any platform.",
                        null, null, null, null,
                        "@thegrounds", "thegrounds.com.au", "$$", "Matcha Latte,Smashed Avo,Cold Drip", "#9ca3af"),

                cafe("syd-008", "Merry Moo Ice Cream", "Sydney", "Haymarket",
                        "Shop 13, 1 Dixon St, Haymarket NSW 2000", -33.8783, 151.2017,
                        "D", "dessert", "Ice cream with Asian flavours",
                        "Popular dessert spot in Chinatown serving matcha ice cream. No information about matcha sourcing found across any channels.",
                        null, null, null, null,
                        "@merrymooicecream", null, "$", "Matcha Soft Serve,Mochi Ice Cream", "#d1d5db"),

                // ── MELBOURNE ────────────────────────────────────────────────────
                cafe("mel-001", "Matchaful Melbourne", "Melbourne", "Fitzroy",
                        "234 Brunswick St, Fitzroy VIC 3065", -37.7964, 144.9784,
                        "A", "specialty", "Melbourne's first matcha-only bar",
                        "A dedicated matcha bar sourcing exclusively from certified organic farms in Kagoshima, Japan. Full traceability available on their website.",
                        "Every cup we serve uses single-origin organic matcha from our partner farm in Kagoshima Prefecture. We visit the farm annually and publish the harvest report on our website.",
                        "https://matchaful.com.au/our-matcha", "Official Website — Our Matcha", "May 2026",
                        "@matchaful.au", "matchaful.com.au", "$$", "Pure Matcha,Matcha Tiramisu,Ceremonial Cold Brew", "#2e6027"),

                cafe("mel-002", "Shizuku Japanese Patisserie", "Melbourne", "CBD",
                        "29 Crossley St, Melbourne VIC 3000", -37.8120, 144.9680,
                        "A", "dessert", "Kyoto-style wagashi in Melbourne",
                        "Authentic Japanese patisserie run by trained pastry chefs from Kyoto. Matcha sourced from Uji with seasonal harvest notes displayed in-store.",
                        "We import our Uji matcha directly from Kyoto's Nakamura Tokichi — a tea house established in 1854. Our matcha selection changes with each harvest season.",
                        "https://shizuku.com.au/about", "Official Website — Our Story", "April 2026",
                        "@shizukumelbourne", "shizuku.com.au", "$$$", "Matcha Roll Cake,Warabi Mochi,Dorayaki", "#3a7a30"),

                cafe("mel-003", "Sensory Lab", "Melbourne", "CBD",
                        "297 Little Collins St, Melbourne VIC 3000", -37.8145, 144.9633,
                        "A", "specialty", "Science-driven specialty beverages",
                        "Market-leading specialty cafe with a transparent sourcing philosophy across all beverages, including their Japanese matcha program.",
                        "Our ceremonial-grade matcha is sourced directly from Yame, Fukuoka — one of Japan's most prized matcha regions, known for its deep umami and minimal bitterness.",
                        "https://sensorylab.com.au/matcha", "Official Website — Matcha Program", "May 2026",
                        "@sensorylabmelbourne", "sensorylab.com.au", "$$", "Ceremonial Matcha,Matcha Tonic,Yuzu Hojicha", "#4d9740"),

                cafe("mel-004", "Higher Ground", "Melbourne", "CBD",
                        "650 Little Bourke St, Melbourne VIC 3000", -37.8135, 144.9558,
                        "B", "cafe", "Architecturally stunning all-day dining",
                        "One of Melbourne's most photographed spaces. Serves matcha described as 'Japanese' on their menu — no prefecture or supplier detail provided.",
                        "Sourced from Japan — our matcha latte uses ceremonial-grade Japanese matcha for a vibrant, full-bodied flavour.",
                        "https://highergroundmelbourne.com.au/menu", "Official Menu", "March 2026",
                        "@highergroundmelb", "highergroundmelbourne.com.au", "$$", "Matcha Latte,Cold Brew,Banana Bread", "#6eb35c"),

                cafe("mel-005", "Aunty Peg's", "Melbourne", "Cremorne",
                        "60 Cremorne St, Cremorne VIC 3121", -37.8250, 144.9973,
                        "B", "cafe", "Specialty roaster with a matcha program",
                        "Beloved Melbourne roastery known for precision. Their matcha menu references Japanese origins but no specific farm or region is disclosed publicly.",
                        "We've partnered with a Japanese importer to bring authentic matcha to our menu — served at precise temperatures for the best experience.",
                        "https://auntypegs.com.au", "Official Website — Drinks", "February 2026",
                        "@auntypegsmelbourne", "auntypegs.com.au", "$$", "Matcha Latte,Iced Matcha,Filter Coffee", "#6eb35c"),

                cafe("mel-006", "Supernormal", "Melbourne", "CBD",
                        "180 Flinders Ln, Melbourne VIC 3000", -37.8175, 144.9680,
                        "C", "cafe", "Andrew McConnell's CBD institution",
                        "A Melbourne dining icon. Matcha desserts appear on the menu but no sourcing information is publicly disclosed on website, social, or printed menus.",
                        null, null, null, null,
                        "@supernormalmelbourne", "supernormal.net.au", "$$$", "Matcha Soft Serve,Lobster Roll,Steamed Rice", "#9ca3af"),

                cafe("mel-007", "Brunetti Classico", "Melbourne", "Carlton",
                        "380 Lygon St, Carlton VIC 3053", -37.7998, 144.9657,
                        "C", "chain", "Italian patisserie, matcha on the side",
                        "A Carlton institution. Offers matcha soft serve and drinks but no origin information is disclosed.",
                        null, null, null, null,
                        "@brunetteclassico", "brunetti.com.au", "$$", "Matcha Soft Serve,Tiramisu,Cannoli", "#9ca3af"),

                cafe("mel-008", "Seven Seeds", "Melbourne", "Carlton",
                        "114 Berkeley St, Carlton VIC 3053", -37.7988, 144.9600,
                        "D", "cafe", "Pioneering Melbourne specialty coffee",
                        "A legendary Melbourne coffee destination. Added matcha to the menu but has made no public statements about sourcing on any channel.",
                        null, null, null, null,
                        "@sevenseedsmelb", "sevenseeds.com.au", "$$", "Matcha Latte,Single Origin Espresso,Pour Over", "#d1d5db")
        );
    }

    private Cafe cafe(
            String id, String name, String city, String suburb, String address,
            double lat, double lng,
            String level, String type, String tagline, String description,
            String evidenceQuote, String evidenceSource, String evidenceSourceLabel, String evidenceVerifiedDate,
            String instagram, String website, String priceRange, String specialties, String coverColor
    ) {
        Cafe c = new Cafe();
        c.setId(id);
        c.setName(name);
        c.setCity(city);
        c.setSuburb(suburb);
        c.setAddress(address);
        c.setLat(lat);
        c.setLng(lng);
        c.setLevel(TransparencyLevel.valueOf(level));
        c.setType(type);
        c.setTagline(tagline);
        c.setDescription(description);
        c.setEvidenceQuote(evidenceQuote);
        c.setEvidenceSource(evidenceSource);
        c.setEvidenceSourceLabel(evidenceSourceLabel);
        c.setEvidenceVerifiedDate(evidenceVerifiedDate);
        c.setInstagram(instagram);
        c.setWebsite(website);
        c.setPriceRange(priceRange);
        c.setSpecialties(specialties);
        c.setCoverColor(coverColor);
        return c;
    }
}
