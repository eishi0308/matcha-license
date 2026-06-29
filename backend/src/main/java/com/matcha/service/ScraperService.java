package com.matcha.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    private static final int    MAX_TEXT_LENGTH = 8000;
    private static final int    TIMEOUT_MS      = 12_000;
    private static final int    MAX_SUBPAGES    = 3;

    // URL path segments that suggest a page has relevant sourcing content
    private static final List<String> CONTENT_PATH_KEYWORDS = List.of(
            "about", "our-story", "story", "menu", "matcha", "tea",
            "sourcing", "origin", "ingredient", "philosophy", "values"
    );

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

        homepage.select("script, style, nav, footer, header, noscript, iframe, svg").remove();
        String homeText = homepage.body().text();

        Map<String, String> pageTexts = new LinkedHashMap<>();
        pageTexts.put(url, homeText);

        List<String> subpageUrls = findContentSubpages(homepage, url);
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
        String truncated = text.length() > MAX_TEXT_LENGTH ? text.substring(0, MAX_TEXT_LENGTH) : text;

        return new ScrapeResult(truncated, pageTexts);
    }

    /**
     * Scrape a website URL: homepage + relevant sub-pages.
     * Returns combined plain text, or null if the site is unreachable.
     */
    public String scrape(String url) {
        Document homepage = fetchDocument(url);
        if (homepage == null) return null;

        // Remove navigation, footer, header — keep content
        homepage.select("script, style, nav, footer, header, noscript, iframe, svg").remove();

        StringBuilder combined = new StringBuilder(homepage.body().text());

        // Find content sub-pages and scrape them too
        List<String> subpageUrls = findContentSubpages(homepage, url);
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
        return text.length() > MAX_TEXT_LENGTH ? text.substring(0, MAX_TEXT_LENGTH) : text;
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
     * Find internal links to content pages (About, Menu, Our Story, etc.)
     */
    private List<String> findContentSubpages(Document doc, String baseUrl) {
        String      baseDomain = extractDomain(baseUrl);
        List<String> result    = new ArrayList<>();

        Elements links = doc.select("a[href]");
        for (Element link : links) {
            String href = link.absUrl("href");
            if (href.isBlank() || !href.startsWith("http")) continue;
            if (!href.contains(baseDomain))                  continue;
            if (href.equals(baseUrl))                        continue;

            // Only include links whose path contains a content keyword
            String path  = href.toLowerCase();
            boolean isContent = CONTENT_PATH_KEYWORDS.stream().anyMatch(path::contains);
            if (isContent && !result.contains(href)) {
                result.add(href);
            }
            if (result.size() >= 10) break; // cap candidates
        }

        return result;
    }

    private String extractDomain(String url) {
        try {
            String host = URI.create(url).getHost();
            return host != null ? host.replaceFirst("^www\\.", "") : "";
        } catch (Exception e) {
            return "";
        }
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
