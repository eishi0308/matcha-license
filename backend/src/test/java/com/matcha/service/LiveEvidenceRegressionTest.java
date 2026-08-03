package com.matcha.service;

import com.matcha.model.TransparencyLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The evidence every published Level A and Level B record is currently standing on,
 * copied verbatim from the live table.
 *
 * <p>Tightening a gate to stop the Level C bucket being promoted on stock matcha copy
 * risks pulling the floor out from under grades already on the site. Each quote below
 * must keep the grade it is published under, so a regression is caught here rather than
 * by a reader finding a cafe silently downgraded.
 */
class LiveEvidenceRegressionTest {

    /** Level A: names a region, a compound region-product, or a Japanese producer. */
    private static final String[] LEVEL_A = {
            // 11:11 Sweet Lanecove
            "A premium matcha drink made with 100% pure Uji matcha from Japan, blended with almond milk and coconut milk for a rich, clean flavor without any additives.",
            // 15cenchi Japanese Cheesecake Darling Square
            "We have sourced a \"single-origin\" matcha from Yame, located in the historic tea-producing region of Fukuoka Prefecture, Japan.",
            // 15cenchi Japanese cheesecake The Galeries
            "single origin \"yame\" matcha basque experience the delectable textures of our 15cm cheesecake, infused with the exquisite flavor of umami-rich matcha green tea. We have sourced a \"single-origin\" matcha from Yame, located in the historic tea-producing region of Fukuoka Prefecture, Japan. Yame matcha, renowned for...",
            // A3 (Central Park)
            "Signature Uji Matcha Latte",
            // Angela\u2019s Bakery
            "finished off with highest quality smooth silky Uji Matcha ganache",
            // Bamboo Lane Rhodes Central
            "Using only the finest Uji matcha, Cha No Wa delivers a rich, aromatic experience that celebrates the purity and elegance of Japanese tea culture.",
            // Cafe Cre Asion
            "See our newly stocked Matcha items from Izumo city Shimane Japan.",
            // Cha Haus Prahran market
            "Grown in the misty mountain valleys of Yame, Fukuoka, this premium matcha is celebrated for its rich umami, gentle sweetness, and vibrant green color.",
            // Chaffic Haymarket
            "CHAFFIC Uji Matcha Latte",
            // Chatime Bondi Junction
            "This is premium Japanese matcha, stone-milled from 100% single-origin Tencha leaves grown in Nishio, one of the world\u2019s most respected matcha regions.",
            // Cre Asion
            "See our newly stocked Matcha items from Izumo city Shimane Japan.",
            // Dulcet Cafe
            "Koyamaen Matcha Shokupan",
            // Dulcet Cafe St Peters
            "Koyamaen Matcha Shokupan",
            // Gotcha
            "Gotcha\u2019s Matcha Series uses Uji matcha powder to elevate your matcha experience.",
            // Gotcha Fresh Tea - Sydney Fish Market
            "Gotcha\u2019s Matcha Series uses Uji matcha powder to elevate your matcha experience.",
            // Gotcha Fresh Tea - The Glen
            "Gotcha\u2019s Matcha Series uses Uji matcha powder to elevate your matcha experience.",
            // Gotcha Fresh Tea x Brioche - M-City Clayton
            "Matcha Series Gotcha\u2019s Matcha Series uses Uji matcha powder to elevate your matcha experience.",
            // Joli
            "KYOTO MADE WITH FRESH COCONUT RED BEAN PASTE+MOCHI+MATCHA COCONUT JELLY (Contains Dairy & Caffeine)",
            // Kahii
            "We proudly source our ceremonial-grade matcha directly from Shizuoka, one of Japan\u2019s most esteemed tea-growing regions.",
            // Kumo Desserts Melbourne
            "First harvest matcha latte UJI MATCHA",
            // MachiMachi
            "Shizuoka Matcha Latte with Panna Cotta",
            // Matcha Maiden
            "Premium organic matcha sourced from Uji, Kyoto.",
            // Matcha Mate 100
            "Sourced from Kyoto, Japan, this first-harvest blend is crafted for those who want a reliable, high-quality staple in their collection.",
            // Matcha Yu Tea - Premium Japanese Green Tea
            "First harvest, single cultivar Matcha from Kagoshima.",
            // Milksha Sydney
            "We source the high quality matcha powder from Uji Japan.",
            // OOOZY
            "Every recipe is developed through weeks of testing, sourcing the finest global ingredients \u2014 ceremonial matcha from Uji, authentic Filipino ube, and fresh local berries.",
            // Pop Up - Matcha Mate
            "Sourced from Kyoto, Japan, this first-harvest blend is crafted for those who want a reliable, high-quality staple in their collection.",
            // SAMU MATCHA HOUSE
            "STONE MILLED CHAJI MATCHA KYOTO PREFECTURE JAPAN",
            // Simply Native
            "Sourced across Japan, with a focus on Uji and a handful of smaller regions where climate and soil create a more distinctive expression.",
            // T Totaler
            "First harvest in the Spring.\u00a0\u00a0 \u00a0 Our Ceremonial matcha from Kagoshima is a blend of the following cultivators to create the perfect matcha:\u00a0 Yabukita - known for its rich, sweet flavour and elegant aroma\u00a0",
            // Taka Tea Garden
            "GREEN TEA BUY GREEN TEA PREMIUM JAPANESE MATCHA IN SYDNEY AUSTRALIA The Best Green Tea in Australia Matcha Ujicha",
            // Uji Matcha Tea by Premium Health Japan
            "Specialists in authentic Uji matcha \u2014 smooth ceremonial blends, rare single cultivars, and signature hand-picked releases \u2014 sourced in Uji and select regions across Japan, then milled and packed in Japan.",
            // itteki - Matcha + Coffee Warehouse (Toorak)
            "From shaded tea farms in Japan \u1f1ef\u1f1f5 Matcha begins as tencha, grown under shade in regions like Uji and Shizuoka, boosting umami, colour, and L-theanine.",
            // itteki- Matcha + Coffee + Sandwich + Cakes (Southbank)
            "From shaded tea farms in Japan \u1f1ef\u1f1f5 Matcha begins as tencha, grown under shade in regions like Uji and Shizuoka, boosting umami, colour, and L-theanine.",
            // itteki\u2014Matcha + Coffee + Sandwiches (SouthYarra)
            "From shaded tea farms in Japan \u1f1ef\u1f1f5 Matcha begins as tencha, grown under shade in regions like Uji and Shizuoka, boosting umami, colour, and L-theanine.",
            // machi machi
            "Shizuoka Matcha Latte with Panna Cotta",
            // machi machi
            "Shizuoka Matcha Latte with Panna Cotta",
            // machi machi Chatswood Chase
            "Shizuoka Matcha Latte with Panna Cotta",
            // machi machi Glen Waverley
            "Shizuoka Matcha Latte with Panna Cotta",
            // machi machi Rhodes
            "Shizuoka Matcha Latte with Panna Cotta",
            // machi machi Springvale
            "Shizuoka Matcha Latte with Panna Cotta",
            // miau mall The Glen - The Authentic Japanese Store
            "Matcha Powder Featured Kamitsujien Uji Matcha From",
            // teafy \u00ae
            "Our matcha comes from our co-ownned farm in Shizuoka.",
    };

    /** Level B: establishes the matcha is Japanese, names nothing more specific. */
    private static final String[] LEVEL_B = {
            // JSY Tea Chadstone
            "Japanese Blended Tea Play Now Featured This Season \u30102026 first flush\u3011Japanese Organic Matcha  Powder  Green Tea Powder 50g",
            // LUPICIA Fresh Tea
            "We offer high-grade ceremonial organic matcha from Japan, including  Matcha Kurama 20g Tin and Matcha Satsuma 20g Tin.",
            // OMI 380\u200b
            "Using premium Japan-grown Matcha, our drinks and sweets offer a harmonious balance of tradition and modern indulgence.",
            // OMI Chatswood
            "Using premium Japan-grown Matcha, our drinks and sweets offer a harmonious balance of tradition and modern indulgence.",
            // Oh! Matcha Chatswood Chase
            "Our Matcha and other teas are grow and harvested in Japan.",
            // Oh!Matcha
            "Our Matcha and other teas are grow and harvested in Japan.",
    };

    @Test
    @DisplayName("No published Level A record loses its grade")
    void levelAHolds() {
        for (String quote : LEVEL_A) {
            assertEquals(TransparencyLevel.A, TransparencyGrader.gradeVerifiedQuote(quote),
                    "would demote a published Level A: " + quote);
        }
    }

    @Test
    @DisplayName("No published Level B record loses its grade")
    void levelBHolds() {
        for (String quote : LEVEL_B) {
            assertEquals(TransparencyLevel.B, TransparencyGrader.gradeVerifiedQuote(quote),
                    "would demote a published Level B: " + quote);
        }
    }

    // ── What the Level C sweep must not promote ───────────────────────

    @Test
    @DisplayName("A definition of matcha is not a disclosure about this cafe's matcha")
    void stockMatchaCopyStaysC() {
        String[] lore = {
                "Matcha is a traditional Japanese green tea that has captured the hearts of health "
                        + "enthusiastsand tea lovers worldwide, thanks to its unique cultivation and "
                        + "processing methods.",
                "What is matcha? Matcha is a finely ground powder of green tea leaves from Japan.",
                "Matcha has been used in the Japanese tea ceremony for centuries.",
                "Matcha originated in Japan and dates back to the twelfth century.",
        };
        for (String passage : lore) {
            assertEquals(TransparencyLevel.C, TransparencyGrader.gradeVerifiedQuote(passage),
                    "encyclopedia copy must not read as sourcing: " + passage);
            assertNull(TransparencyGrader.decide(null, passage),
                    "page scan must not promote on it either: " + passage);
        }
    }

    @Test
    @DisplayName("A cafe describing its own drink as Japanese matcha is still Level B")
    void ownProductClaimSurvives() {
        String menu = "Strawberry Cold Foam Matcha Childhood nostalgia meets wellness: creamy "
                + "strawberry foam over healthy Japanese Matcha";
        TransparencyGrader.Evidence e = TransparencyGrader.decide(null, menu);
        assertNotNull(e, "the cafe is claiming its own matcha is Japanese");
        assertEquals(TransparencyLevel.B, e.level());
    }

    @Test
    @DisplayName("Lore on the page does not suppress a real disclosure elsewhere on it")
    void loreDoesNotMaskRealEvidence() {
        String page = "Matcha is a traditional Japanese green tea prized for centuries. "
                + "Our matcha is sourced from Uji, Kyoto and stone-milled to order.";
        assertEquals(TransparencyLevel.A, TransparencyGrader.decide(null, page).level());
    }

    // ── False positives the first full Level C sweep produced ─────────────────
    // Every string below is the exact evidence a 454-site dry run proposed promoting
    // on. They are kept as tests because each one was a promotion the site would have
    // published as a sourcing disclosure.

    @Test
    @DisplayName("Japan as atmosphere, cuisine or décor is not a sourcing claim")
    void culturalFramingStaysC() {
        String[] framing = {
                "Book now \u2192 Explore Food & Drinks Japanese-inspired cafe menu, coffee, matcha and more.",
                "With caf\u00e9s in Ringwood East and Deepdene, we bring together specialty coffee, "
                        + "ceremonial matcha, handcrafted pastries, and seasonal creations inspired by "
                        + "Japan\u2019s quiet beauty.",
                "Issho Cafe Tokyo vibes, premium Matcha, Japanese sweets, and savoury bites",
                "Cafe Kentaro takes the idea of Japanese fusion and pushes the limits a little further, "
                        + "the Katsu Sandwich and some of our dishes have become local favourites",
                "A bold reinterpretation of indulgence and ritual, EUCA Matcha Black Forest Dark "
                        + "Stracciatella is where Japanese refinement meets Italian classic tradition.",
                "By night, explore a curated wine and sake experience with dishes inspired by onigiri "
                        + "and Japanese-style grilling, thoughtfully paired with everything from matcha "
                        + "to natural wine.",
                "The Cafe Green Bay delivers sushi, matcha green tea, doburi dishes",
                "(Small/Large) (Matcha, strawberry or chocolate) shaved ice with sweet red bean and "
                        + "mochi, kiniko High Tea Japanese High Tea",
        };
        for (String passage : framing) {
            assertNull(TransparencyGrader.decide(null, passage),
                    "atmosphere is not sourcing: " + passage);
        }
    }

    @Test
    @DisplayName("A catalogue or navigation bar listing Japanese teas is not a disclosure")
    void productListingsStayC() {
        String[] listings = {
                "Oolong Ti Kwan Yin White Tea Herbal & Fruit Tea Fruit Tea Herbal Tea Organic Herbal "
                        + "Herbalist Blends Japanese Tea Bancha Genmaicha Gyokuro Houjicha Matcha Sencha",
                "Snacks & Sweets KAMEDA Kaki No Tane Without Peanuts 100g MORINAGA Assorted Hi Chew 94g "
                        + "GLICO Pocky Chocolate Almond Crush 2 Bags NESTLE Kitkat Itoen Matcha Chocolate 10pcs",
                "Learn about more The spirit of \u201cOmotenashi\u201d and matcha Introducing the "
                        + "marvelous Japanese food culture to people not just in Japan, but around the world",
        };
        for (String passage : listings) {
            assertNull(TransparencyGrader.decide(null, passage),
                    "a product list states no origin: " + passage);
        }
    }

    @Test
    @DisplayName("A region stated for another tea on the page is not the matcha's origin")
    void regionBelongingToLeafTeaRejected() {
        String haiku = "We are proud to stock our own branded Haiku Matcha, Hojicha and Genmaicha "
                + "powders. Matcha is our best, most popular tea. We source the finest, premium and "
                + "organic Matcha, ensuring its rich antioxidants are intact and pure. Our Carefully "
                + "Selected Range Of Japanese Teas. We stock a range of premium tea from Shizuoka, "
                + "Mt Fuji, in leaf form from Sencha, Genmaicha and Hojicha.";
        TransparencyGrader.Evidence e = TransparencyGrader.decide(null, haiku);
        assertTrue(e == null || e.level() != TransparencyLevel.A,
                "Shizuoka is stated for the leaf teas, not the matcha; got: " + e);

        assertNull(TransparencyGrader.decide(null,
                        "Single origin 1st spring harvested sencha green tea from Uji Kyoto"),
                "Uji belongs to the sencha");
    }

    @Test
    @DisplayName("An origin named for matcha and another tea together still counts")
    void coordinatedProductsShareTheOrigin() {
        String hikari = "Our matcha and hojicha travels from Kyoto as our partners - Kurasu and "
                + "Yugen, Kyoto, are sourcing and roasting the best single origin teas from small "
                + "local farms in Kyoto";
        assertEquals(TransparencyLevel.A, TransparencyGrader.decide(null, hikari).level(),
                "the origin is claimed for both teas at once");
    }

    @Test
    @DisplayName("Real Level C promotions still come through")
    void genuinePromotionsSurvive() {
        assertEquals(TransparencyLevel.A, TransparencyGrader.decide(null,
                "Our matcha hails from the Yame region in Fukuoka, Japan, where misty mornings and "
                        + "cool valleys create the perfect tea-growing conditions.").level());
        assertEquals(TransparencyLevel.A, TransparencyGrader.decide(null,
                "Our source comes from Yame in Fukuoka prefecture and Uji, Kyoto, both of the top "
                        + "matcha -producing areas in Japan.").level());
        assertEquals(TransparencyLevel.A, TransparencyGrader.decide(null,
                "AUD/per Quick shop Marukyu Koyamaen - Matcha \"Yugen\" Tin").level());
        assertEquals(TransparencyLevel.B, TransparencyGrader.decide(null,
                "Strawberry Cold Foam Matcha creamy strawberry foam over healthy Japanese Matcha").level());
        assertEquals(TransparencyLevel.B, TransparencyGrader.decide(null,
                "Indulge in the exquisite combination of rich, earthy flavours of Japanese matcha "
                        + "green tea and our house blend white chocolate.").level());
    }

    // ── False positives the browser-rendered sweep produced ───────────────────

    @Test
    @DisplayName("A prefecture famous for beef is not the matcha's origin")
    void placeNameOnFoodRejected() {
        String izakaya = "UPGRADE TO A5 Miyazaki Steak With Vegetables DESSERT MATCHA "
                + "PANNA COTTA SAKE PAIRINGS Upgrade your experiance";
        TransparencyGrader.Evidence e = TransparencyGrader.decide(null, izakaya);
        assertTrue(e == null || e.level() != TransparencyLevel.A,
                "Miyazaki is the beef, not the matcha; got: " + e);

        String gyukatsu = "Warabi Mochi 16 Layer Matcha & Genmaicha Cake Reservations Visit Us "
                + "Gyukatsu Kyoto Katsugyu Sydney Level 2.01/252 Pitt St";
        TransparencyGrader.Evidence g = TransparencyGrader.decide(null, gyukatsu);
        assertTrue(g == null || g.level() != TransparencyLevel.A,
                "Kyoto is in the restaurant's name; got: " + g);
    }

    @Test
    @DisplayName("'Japanese teas and matcha' lists two things, it does not source one")
    void conjunctionBreaksTheModifier() {
        String ytb = "Choose from 30-minute guided sessions exploring Japanese teas and matcha, "
                + "a tea & cheese pairing, oyster shucking 101, or a hands-on pastry workshop.";
        assertNull(TransparencyGrader.decide(null, ytb),
                "a tasting session is not a sourcing statement");
    }

    @Test
    @DisplayName("Sourcing statements found only by the browser still grade correctly")
    void renderedDisclosuresSurvive() {
        assertEquals(TransparencyLevel.A, TransparencyGrader.decide(null,
                "Matcha sourced from a Japanese farm in Uji, Kyoto.").level());
        assertEquals(TransparencyLevel.A, TransparencyGrader.decide(null,
                "Our matcha is grown in Uji Kyoto.").level());
        assertEquals(TransparencyLevel.A, TransparencyGrader.decide(null,
                "Matcha Sake Highball Kagoshima matcha, yuzushu, honey, soda").level(),
                "a cocktail listing a region for its matcha still discloses it");
        assertEquals(TransparencyLevel.A, TransparencyGrader.decide(null,
                "From our rich tonkotsu broth simmered for hours, to our ceremonial-grade "
                        + "matcha sourced from Uji, we believe the details make the difference.").level(),
                "ramen on the same page must not suppress a real matcha origin");
        assertEquals(TransparencyLevel.B, TransparencyGrader.decide(null,
                "House made soft serve ice cream with 100% Japanese pure matcha.").level());
    }

    @Test
    @DisplayName("An Instagram bio's evidence is quoted without the login header")
    void instagramChromeTrimmed() {
        String profile = "Log In Sign Up matchaya_sydney 7,265 followers 47 following MATCHA-YA "
                + "Japanese Matcha Dessert Cafe Darling square Sydney Japanese Cafe "
                + "Authentic Kyoto Uji Matcha";
        TransparencyGrader.Evidence e = TransparencyGrader.decide(null, profile);
        assertNotNull(e);
        assertEquals(TransparencyLevel.A, e.level());
        assertFalse(e.quote().toLowerCase().startsWith("log in"),
                "the login prompt is not evidence: " + e.quote());
        assertTrue(profile.contains(e.quote()), "the quote must stay verbatim from the page");
    }
}
