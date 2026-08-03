package com.matcha.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Profile identification, exercised against the shapes actually stored in the cafes
 * table — where a large share of records carry an Instagram profile in the website
 * column, complete with the share token Instagram appends to a copied link.
 */
class ScraperServiceTest {

    private final ScraperService scraper = new ScraperService();

    @Test
    @DisplayName("A share token is not part of the username")
    void shareTokenStripped() {
        assertEquals("https://www.instagram.com/ellisbellycafe/",
                scraper.instagramProfileUrl("www.instagram.com/ellisbellycafe?igsh=MTJiNmhzYmV4aG5qYQ=="));
    }

    @Test
    @DisplayName("Handles resolve the same however they were written down")
    void handleFormsAgree() {
        String expected = "https://www.instagram.com/matchacafe/";
        assertEquals(expected, scraper.instagramProfileUrl("@matchacafe"));
        assertEquals(expected, scraper.instagramProfileUrl("matchacafe"));
        assertEquals(expected, scraper.instagramProfileUrl("instagram.com/matchacafe"));
        assertEquals(expected, scraper.instagramProfileUrl("www.instagram.com/matchacafe/"));
        assertEquals(expected, scraper.instagramProfileUrl("https://www.instagram.com/matchacafe/"));
    }

    @Test
    @DisplayName("A profile filed as a website is recognised as one")
    void profileUrlsDetected() {
        assertTrue(scraper.isInstagramUrl("https://www.instagram.com/somecafe"));
        assertTrue(scraper.isInstagramUrl("https://instagram.com/somecafe"));
        assertFalse(scraper.isInstagramUrl("https://ohmatcha.com.au"));
        assertFalse(scraper.isInstagramUrl("https://notinstagram.com/somecafe"));
        assertFalse(scraper.isInstagramUrl(null));
    }

    @Test
    @DisplayName("Nothing identifiable yields no URL rather than a broken one")
    void blankHandles() {
        assertNull(scraper.instagramProfileUrl(null));
        assertNull(scraper.instagramProfileUrl(""));
        assertNull(scraper.instagramProfileUrl("https://www.instagram.com/"));
    }
}
