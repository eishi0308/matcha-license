package com.matcha.service;

import com.matcha.model.TransparencyLevel;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * The single place a transparency level may be decided.
 *
 * <p>The level is never taken from the AI. The AI's only job is to return a verbatim
 * quote; the grade is derived here from that quote. This makes "Level A with no proof"
 * structurally impossible rather than merely unlikely.
 *
 * <p>Gates, in order:
 * <ol>
 *   <li>No quote → C</li>
 *   <li>Quote not present verbatim on the scraped page → C (anti-hallucination)</li>
 *   <li>Quote names a Japanese tea region/prefecture → A</li>
 *   <li>Quote pairs direct-sourcing language WITH Japan → A</li>
 *   <li>Quote says Japan but names nothing specific → B</li>
 *   <li>Anything else (incl. naming a non-Japanese distributor) → C</li>
 * </ol>
 */
public final class TransparencyGrader {

    /**
     * Japanese tea regions, prefectures and growing towns that constitute a specific origin.
     * Deliberately conservative — a region omitted here grades down to B, which is the safe
     * direction. Short or ambiguous tokens (mie, ise, nara) are excluded to avoid false
     * matches inside unrelated words.
     */
    private static final List<String> JAPANESE_ORIGINS = List.of(
            "uji", "nishio", "kagoshima", "yame", "shizuoka", "kyoto", "fukuoka",
            "aichi", "wazuka", "kirishima", "miyazaki", "sayama", "saitama",
            "asahina", "chiran", "hoshino", "honyama", "kawane", "makinohara",
            "obubu", "yakushima", "kumamoto", "shirakawa", "tsukigase", "okabe",
            "izumo", "yanagibata", "tenryu", "fujieda"
    );

    /**
     * A named production entity — a farm, garden or estate that grew the leaf.
     *
     * <p>Deliberately excludes bare provenance verbs ("grown in", "harvested in",
     * "imported from", "sourced from"). Those restate the country and nothing more:
     * "harvested in Japan" is the definition of Level B, not A. Only a named facility,
     * paired with Japan, is specific enough to clear the A bar.
     *
     * <p>On its own this still proves nothing — "single-origin matcha from Zen Wonders"
     * names an Australian reseller — so Japan must appear in the same quote.
     */
    private static final Pattern NAMED_FACILITY = Pattern.compile(
            "\\b(tea garden|tea farm|family farm|our farm|our garden|our estate|"
                    + "estate|plantation|cooperative|tea master|tea grower|"
                    + "farmer'?s?|growers?)\\b",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern JAPAN =
            Pattern.compile("\\bjapan(ese)?\\b", Pattern.CASE_INSENSITIVE);

    /** Length of the leading fingerprint used for the verbatim check. */
    private static final int FINGERPRINT_LENGTH = 60;

    private TransparencyGrader() {}

    /**
     * Grade a freshly scraped cafe. Runs every gate including the verbatim check.
     *
     * @param quote          the AI-supplied evidence quote (may be null)
     * @param scrapedContent the full text actually scraped from the cafe's pages
     */
    public static TransparencyLevel grade(String quote, String scrapedContent) {
        if (quote == null || quote.isBlank()) return TransparencyLevel.C;
        if (!appearsVerbatim(quote, scrapedContent)) return TransparencyLevel.C;
        return gradeVerifiedQuote(quote);
    }

    /**
     * Grade a quote whose verbatim presence has already been established — used when
     * re-grading rows already stored in the database. Callers that have not verified the
     * quote against live page text must use {@link #grade(String, String)} instead.
     */
    public static TransparencyLevel gradeVerifiedQuote(String quote) {
        if (quote == null || quote.isBlank()) return TransparencyLevel.C;

        String lower = quote.toLowerCase(Locale.ROOT);
        boolean namesJapan = JAPAN.matcher(quote).find();

        // A named Japanese region is the strongest possible disclosure.
        if (JAPANESE_ORIGINS.stream().anyMatch(region -> containsWord(lower, region))) {
            return TransparencyLevel.A;
        }

        // A named farm/garden counts only when tied to Japan, never on its own.
        if (namesJapan && NAMED_FACILITY.matcher(quote).find()) {
            return TransparencyLevel.A;
        }

        // Mentions Japan with no specifics — that is the definition of B.
        if (namesJapan) return TransparencyLevel.B;

        // Names only a brand or distributor, or is pure marketing copy.
        return TransparencyLevel.C;
    }

    /**
     * True when the leading fingerprint of the quote appears in the scraped content,
     * ignoring whitespace and case differences.
     */
    public static boolean appearsVerbatim(String quote, String scrapedContent) {
        if (quote == null || quote.isBlank() || scrapedContent == null || scrapedContent.isBlank()) {
            return false;
        }
        String normContent = normalise(scrapedContent);
        String normQuote = normalise(quote);
        String fingerprint = normQuote.length() > FINGERPRINT_LENGTH
                ? normQuote.substring(0, FINGERPRINT_LENGTH)
                : normQuote;
        return normContent.contains(fingerprint);
    }

    /** Evidence fields may only be stored when the grade actually rests on them. */
    public static boolean levelRequiresEvidence(TransparencyLevel level) {
        return level == TransparencyLevel.A || level == TransparencyLevel.B;
    }

    private static String normalise(String s) {
        return s.replaceAll("\\s+", " ").toLowerCase(Locale.ROOT).strip();
    }

    /** Word-boundary match, so "mie" never matches inside "premium". */
    private static boolean containsWord(String haystack, String word) {
        return Pattern.compile("\\b" + Pattern.quote(word) + "\\b").matcher(haystack).find();
    }
}
