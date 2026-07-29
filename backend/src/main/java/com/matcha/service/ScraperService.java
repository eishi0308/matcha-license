package com.matcha.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Scrapes cafe websites and Instagram profiles for matcha sourcing content.
 *
 * Website scraping:
 *   - Fetches the homepage
 *   - Finds internal links to content pages (About, Menu, Our Story, etc.)
 *   - Scrapes up to MAX_SUBPAGES additional pages
 *   - Returns combined plain text
 *
 * Instagram scraping:
 *   - Fetches the public profile page
 *   - Extracts bio from meta tags (og:description, description)
 *   - Note: Instagram often blocks scrapers — this works on a best-effort basis
 */
@Service
public class ScraperService {

    private static final int    MAX_TEXT_LENGTH = 30_000;
    private static final int    TIMEOUT_MS      = 12_000;
    private static final int    MAX_SUBPAGES    = 10;
    private static final int    MAX_CANDIDATES  = 40;

    /**
     * Path keywords ranked by how likely the page is to carry a sourcing disclosure.
     * Sourcing/about pages beat product listings, which beat generic menu pages.
     * Matched against the URL <em>path only</em> — matching the whole URL made every
     * link on a domain like "takateagarden.com.au" or "ohmatcha.com.au" score alike,
     * which silently reduced page selection to "first three links in the nav bar".
     */
    private static final Map<String, Integer> PATH_KEYWORD_SCORES = new LinkedHashMap<>();
    static {
        PATH_KEYWORD_SCORES.put("sourcing",   10);
        PATH_KEYWORD_SCORES.put("origin",     10);
        PATH_KEYWORD_SCORES.put("our-story",   8);
        PATH_KEYWORD_SCORES.put("about",       8);
        PATH_KEYWORD_SCORES.put("story",       7);
        PATH_KEYWORD_SCORES.put("philosophy",  7);
        PATH_KEYWORD_SCORES.put("values",      6);
        PATH_KEYWORD_SCORES.put("ingredient",  6);
        PATH_KEYWORD_SCORES.put("matcha",      9);
        PATH_KEYWORD_SCORES.put("tea",         5);
        PATH_KEYWORD_SCORES.put("product",     3);
        PATH_KEYWORD_SCORES.put("collection",  3);
        PATH_KEYWORD_SCORES.put("shop",        2);
        PATH_KEYWORD_SCORES.put("menu",        2);
    }

    /**
     * Paths that never carry sourcing information. Excluded outright so they can
     * never consume one of the MAX_SUBPAGES slots.
     */
    private static final List<String> PATH_BLOCKLIST = List.of(
            "my-account", "account", "login", "signin", "sign-in", "register",
            "cart", "checkout", "wishlist", "privacy", "terms", "shipping",
            "returns", "refund", "contact", "faq", "gift-card", "search",
            "recycle", "blog/page", "/tag/", "/author/", "wp-admin", "customer"
    );

    /** Words that make a text window worth keeping when the page must be trimmed. */
    private static final Pattern RELEVANT =
            Pattern.compile("matcha|source|sourc|origin|japan|grown|harvest|farm|garden|tea",
                    Pattern.CASE_INSENSITIVE);

    // ── Public API ─────────────────────────────────────────────────────────────

    /** Result of scrapeWithTracking — combined text plus per-page breakdown. */
    public record ScrapeResult(String combinedText, Map<String, String> pageTexts) {}

    /**
     * Same as scrape() but also returns a map of {pageUrl → pageText} so callers
     * can identify which specific page a quote came from.
     * Current scraping logic is identical — this just tracks page sources.
     */
    public ScrapeResult scrapeWithTracking(String url) {
        Document homepage = fetchDocument(url);
        if (homepage == null) return null;

        // Collect links BEFORE stripping chrome: nav, header and footer are exactly where
        // "About", "Our Story" and "Sourcing" live. Stripping first made those pages
        // unreachable, so the crawler could only ever follow links embedded in body copy.
        List<String> subpageUrls = findContentSubpages(homepage, url);

        homepage.select("script, style, nav, footer, header, noscript, iframe, svg").remove();
        String homeText = homepage.body().text();

        Map<String, String> pageTexts = new LinkedHashMap<>();
        pageTexts.put(url, homeText);

        int scraped = 0;
        for (String subUrl : subpageUrls) {
            if (scraped >= MAX_SUBPAGES) break;
            Document subDoc = fetchDocument(subUrl);
            if (subDoc == null) continue;
            subDoc.select("script, style, nav, footer, header, noscript, iframe, svg").remove();
            pageTexts.put(subUrl, subDoc.body().text());
            scraped++;
            sleep(500);
        }

        StringBuilder combined = new StringBuilder();
        pageTexts.values().forEach(t -> combined.append(t).append(" "));
        String text = combined.toString().replaceAll("\\s+", " ").strip();

        return new ScrapeResult(trimToBudget(text), pageTexts);
    }

    /**
     * Scrape a website URL: homepage + relevant sub-pages.
     * Returns combined plain text, or null if the site is unreachable.
     */
    public String scrape(String url) {
        Document homepage = fetchDocument(url);
        if (homepage == null) return null;

        // Find sub-pages first — nav, header and footer carry most of a site's
        // internal links, and are removed in the next step.
        List<String> subpageUrls = findContentSubpages(homepage, url);

        // Remove navigation, footer, header — keep content
        homepage.select("script, style, nav, footer, header, noscript, iframe, svg").remove();

        StringBuilder combined = new StringBuilder(homepage.body().text());

        int scraped = 0;
        for (String subUrl : subpageUrls) {
            if (scraped >= MAX_SUBPAGES) break;
            Document subDoc = fetchDocument(subUrl);
            if (subDoc == null) continue;
            subDoc.select("script, style, nav, footer, header, noscript, iframe, svg").remove();
            combined.append(" ").append(subDoc.body().text());
            scraped++;
            sleep(500);
        }

        String text = combined.toString().replaceAll("\\s+", " ").strip();
        return trimToBudget(text);
    }

    /**
     * Scrape an Instagram public profile for bio text.
     * Accepts handles like "@matchacafe", "matchacafe", or full URLs.
     * Returns bio text or null if blocked / not found.
     */
    public String scrapeInstagram(String handle) {
        if (handle == null || handle.isBlank()) return null;

        String username = normaliseInstagramHandle(handle);
        String url      = "https://www.instagram.com/" + username + "/";

        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .header("Accept",          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Accept-Language", "en-US,en;q=0.9")
                    .header("Accept-Encoding", "gzip, deflate, br")
                    .timeout(TIMEOUT_MS)
                    .get();

            // Instagram embeds profile data in meta tags
            String ogDesc   = doc.select("meta[property=og:description]").attr("content");
            String metaDesc = doc.select("meta[name=description]").attr("content");

            StringBuilder bio = new StringBuilder();
            if (!ogDesc.isBlank())   bio.append(ogDesc).append(" ");
            if (!metaDesc.isBlank()) bio.append(metaDesc);

            String result = bio.toString().strip();
            if (result.isEmpty()) return null;

            System.out.printf("[Scraper] Instagram @%s: %s%n", username, result.substring(0, Math.min(80, result.length())));
            return result;

        } catch (Exception e) {
            System.out.printf("[Scraper] Instagram blocked or unavailable for @%s: %s%n", username, e.getMessage());
            return null;
        }
    }

    public boolean mentionsMatcha(String text) {
        return text != null && text.toLowerCase().contains("matcha");
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private Document fetchDocument(String url) {
        try {
            return Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .timeout(TIMEOUT_MS)
                    .followRedirects(true)
                    .get();
        } catch (Exception e) {
            System.out.printf("[Scraper] Failed to fetch %s: %s%n", url, e.getMessage());
            return null;
        }
    }

    /**
     * Find internal links to content pages, ordered strongest-first.
     *
     * <p>Two things this deliberately does <em>not</em> do, both of which previously
     * hid genuine sourcing disclosures:
     * <ul>
     *   <li>Keywords are matched against the URL <b>path</b>, never the whole URL. On a
     *       domain containing a keyword ("ohmatcha.com.au", "jsytea.com.au") every link
     *       matched, so selection collapsed to document order — nav bar first.</li>
     *   <li>Candidates are <b>ranked</b>, not taken in document order. A "/sourcing" page
     *       linked from the footer now outranks "/my-account" linked from the header.</li>
     * </ul>
     */
    private List<String> findContentSubpages(Document doc, String baseUrl) {
        String baseHost = extractDomain(baseUrl);
        if (baseHost.isBlank()) return List.of();

        // Highest score wins; ties keep document order via LinkedHashMap insertion.
        Map<String, Integer> scored = new LinkedHashMap<>();
        Set<String> seen = new LinkedHashSet<>();

        for (Element link : doc.select("a[href]")) {
            if (scored.size() >= MAX_CANDIDATES) break;

            String href = link.absUrl("href").split("#")[0];
            if (href.isBlank() || !href.startsWith("http")) continue;
            if (!sameSite(href, baseHost))                  continue;
            if (href.equals(baseUrl))                       continue;
            if (!seen.add(href))                            continue;

            String path = pathOf(href);
            if (path.isBlank())                             continue;
            if (PATH_BLOCKLIST.stream().anyMatch(path::contains)) continue;

            int score = 0;
            for (Map.Entry<String, Integer> e : PATH_KEYWORD_SCORES.entrySet()) {
                if (path.contains(e.getKey())) score = Math.max(score, e.getValue());
            }
            if (score > 0) scored.put(href, score);
        }

        return scored.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue(Comparator.reverseOrder()))
                .map(Map.Entry::getKey)
                .toList();
    }

    /**
     * True when the link belongs to the same registrable site.
     * A substring test ({@code href.contains(domain)}) accepted third-party URLs that
     * merely embed the domain — {@code web.archive.org/web/2019/http://example.com}
     * being the case that matters here, since it injects years-old content as if live.
     */
    private boolean sameSite(String href, String baseHost) {
        String host = extractDomain(href);
        return !host.isBlank() && (host.equals(baseHost)
                || host.endsWith("." + baseHost)
                || baseHost.endsWith("." + host));
    }

    private String pathOf(String url) {
        try {
            String p = URI.create(url).getPath();
            return p == null ? "" : p.toLowerCase();
        } catch (Exception e) {
            return "";
        }
    }

    private String extractDomain(String url) {
        try {
            String host = URI.create(url).getHost();
            return host != null ? host.toLowerCase().replaceFirst("^www\\.", "") : "";
        } catch (Exception e) {
            return "";
        }
    }

    /**
     * Trim to MAX_TEXT_LENGTH while preserving passages that could carry a sourcing
     * claim. Head-first truncation discarded the evidence outright on large sites —
     * on the sites audited it removed up to 82% of the text, taking named origins
     * (Yame, Shizuoka, Kyoto) with it while leaving only a generic "from Japan" line
     * behind for the analyser to quote.
     */
    private String trimToBudget(String text) {
        if (text.length() <= MAX_TEXT_LENGTH) return text;

        // Keep a window around every relevant mention, in order, until the budget is spent.
        final int window = 600;
        StringBuilder kept = new StringBuilder();
        var matcher = RELEVANT.matcher(text);
        int cursor = 0;

        while (matcher.find() && kept.length() < MAX_TEXT_LENGTH) {
            int start = Math.max(cursor, matcher.start() - window / 2);
            int end   = Math.min(text.length(), matcher.end() + window);
            if (end <= cursor) continue;
            start = Math.max(start, cursor);
            int room = MAX_TEXT_LENGTH - kept.length();
            if (end - start > room) end = start + room;
            kept.append(text, start, end).append(' ');
            cursor = end;
        }

        // Nothing relevant found — fall back to a plain head slice.
        if (kept.length() == 0) return text.substring(0, MAX_TEXT_LENGTH);
        return kept.toString().strip();
    }

    private String normaliseInstagramHandle(String handle) {
        return handle
                .replaceAll("^@", "")
                .replaceAll("(?i)^https?://(www\\.)?instagram\\.com/", "")
                .replaceAll("/$", "")
                .trim();
    }

    private void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException ignored) {}
    }
}
