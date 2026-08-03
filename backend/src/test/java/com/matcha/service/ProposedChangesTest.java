package com.matcha.service;

import com.matcha.model.TransparencyLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The promotions the Level C sweep actually wrote, re-derived from their own quotes.
 *
 * <p>These 25 cafes were moved off Level C on the strength of the text below. If a change
 * to the gates would stop that text proving what it was published as proving, the grades
 * on the site have quietly stopped matching the rules that produced them, and this fails.
 *
 * <p>Two further proposals were refused at the door — a Shizuoka mention that belonged to
 * a shop's leaf teas, and a genmaicha blend described as Japanese — both recorded by an
 * earlier build whose gates were looser. They are covered by
 * {@link LiveEvidenceRegressionTest} instead.
 */
class ProposedChangesTest {

    private final List<String> disagreements = new ArrayList<>();

    private void check(String id, String quote, TransparencyLevel published) {
        TransparencyGrader.Evidence e = TransparencyGrader.decide(null, quote);
        TransparencyLevel actual = e == null ? TransparencyLevel.C : e.level();
        if (actual != published) {
            disagreements.add(id + ": published as " + published + ", grader now says " + actual
                    + " for \"" + quote.substring(0, Math.min(90, quote.length())) + "\"");
        }
    }

    @Test
    @DisplayName("Every published Level C promotion still follows from its evidence")
    void appliedPromotionsStillHold() {
            check("mel-disc-420", "Our matcha and hojicha travels from Kyoto as our partners - Kurasu and Yugen, Kyoto, are sourcing and roasting the best single origin teas from small local farms in Kyoto, later hand-whisked and carefully prepared into every matcha and hojicha drink you enjoy here at Hikari.", TransparencyLevel.A);
            check("mel-disc-437", "UJI MATCHA First harvest matcha latte", TransparencyLevel.A);
            check("mel-disc-508", "milk & Vanilla Cold Foam Creamy Peanut Butter Hot Chocolate Our Classic Hot Chocolate infused with rich, creamy Peanut Butter Strawberry Cold Foam Matcha Childhood nostalgia meets wellness: creamy strawberry foam over healthy Japanese Matcha Lime & Avocado Crostini Creamy Hass Avocado with fresh Lime,", TransparencyLevel.B);
            check("mel-disc-517", "AUD/per Quick shop Marukyu Koyamaen - Matcha \"Yugen\" Tin", TransparencyLevel.A);
            check("mel-disc-530", "Marukyu Koyamaen - Matcha Powder 20g - Unkaku / \u4e38\u4e45\u5c0f\u5c71\u5712 \u62b9\u8336 \u96f2\u9db4", TransparencyLevel.A);
            check("mel-disc-690", "Taste the difference withMatcha Latte Ingredients list:Uji Matcha Powder, Fresh Milk, Sugarcane Flavour profile:Creamy, Milky Allergens Information:Contains Dairy, Alternative Milk Options Available: Soy and Oat Mil", TransparencyLevel.A);
            check("mel-disc-714", "Japanese Blended Tea Play Now Featured This Season \u30102026 first flush\u3011Japanese Organic Matcha Powder Green Tea Powder 50g", TransparencyLevel.B);
            check("mel-disc-950", "At harvest, only the y oungest, most tender leaves are selected, then steamed, dried, de-stemmed, de-veined, and stone- milled into an ultra-fine powder.T2's matcha c omes from Shizuoka prefecture, one of Japan's most respected tea-growing regions.", TransparencyLevel.A);
            check("mel-disc-974", "Japanese Blended Tea Play Now Featured This Season \u30102026 first flush\u3011Japanese Organic Matcha Powder Green Tea Powder 50g", TransparencyLevel.B);
            check("syd-disc-025", "Our source comes from Yame in Fukuoka prefecture and Uji, Kyoto, both of the top matcha -producing areas in Japan.", TransparencyLevel.A);
            check("syd-disc-052", "Our matcha hails from the Yame region in Fukuoka, Japan, where misty mornings and cool valleys create the perfect tea-growing conditions.", TransparencyLevel.A);
            check("syd-disc-055", "Matcha Our matcha hails from the Yame region in Fukuoka, Japan, where misty mornings and cool valleys create the perfect tea-growing conditions.", TransparencyLevel.A);
            check("syd-disc-075", "Our matcha hails from the Yame region in Fukuoka, Japan, where misty mornings and cool valleys create the perfect tea-growing conditions. Hand-harvested by the Eshima family at Miryoku En, this single origin matcha is smooth, vibrant, and naturally sweet \u2014 true Japanese craftsmanship in every cup.", TransparencyLevel.A);
            check("syd-disc-076", "Matcha Our matcha hails from the Yame region in Fukuoka, Japan, where misty mornings and cool valleys create the perfect tea-growing conditions. Hand-harvested by the Eshima family at Miryoku En, this single origin matcha is smooth, vibrant, and naturally sweet \u2014 true Japanese craftsmanship in every cup.", TransparencyLevel.A);
            check("syd-disc-137", "Our matcha hails from the Yame region in Fukuoka, Japan, where misty mornings and cool valleys create the perfect tea-growing conditions. Hand-harvested by the Eshima family at Miryoku En, this single origin matcha is smooth, vibrant, and naturally sweet \u2014 true Japanese craftsmanship in every cup.", TransparencyLevel.A);
            check("syd-disc-159", "At harvest, only the y oungest, most tender leaves are selected, then steamed, dried, de-stemmed, de-veined, and stone- milled into an ultra-fine powder.T2's matcha c omes from Shizuoka prefecture, one of Japan's most respected tea-growing regions.", TransparencyLevel.A);
            check("syd-disc-174", "Matcha Kakigori Japanese shaved matcha ice, sweetened red bean, dango, vanilla cream, matcha condensed milk.", TransparencyLevel.B);
            check("syd-disc-175", "Matcha Our matcha hails from the Yame region in Fukuoka, Japan, where misty mornings and cool valleys create the perfect tea-growing conditions.", TransparencyLevel.A);
            check("syd-disc-191", "At harvest, only the y oungest, most tender leaves are selected, then steamed, dried, de-stemmed, de-veined, and stone- milled into an ultra-fine powder.T2's matcha c omes from Shizuoka prefecture, one of Japan's most respected tea-growing regions.", TransparencyLevel.A);
            check("syd-disc-200", "Our matcha hails from the Yame region in Fukuoka, Japan, where misty mornings and cool valleys create the perfect tea-growing conditions.", TransparencyLevel.A);
            check("syd-disc-241", "Indulge in the exquisite combination of rich, earthy flavours of Japanese matcha green tea and our house blend white chocolate.", TransparencyLevel.B);
            check("syd-disc-276", "Our matcha hails from the Yame region in Fukuoka, Japan, where misty mornings and cool valleys create the perfect tea-growing conditions.", TransparencyLevel.A);
            check("syd-disc-307", "At harvest, only the y oungest, most tender leaves are selected, then steamed, dried, de-stemmed, de-veined, and stone- milled into an ultra-fine powder.T2's matcha c omes from Shizuoka prefecture, one of Japan's most respected tea-growing regions.", TransparencyLevel.A);
            check("syd-disc-346", "At harvest, only the y oungest, most tender leaves are selected, then steamed, dried, de-stemmed, de-veined, and stone- milled into an ultra-fine powder.T2's matcha c omes from Shizuoka prefecture, one of Japan's most respected tea-growing regions.", TransparencyLevel.A);
            check("syd-disc-399", "Our matcha hails from the Yame region in Fukuoka, Japan, where misty mornings and cool valleys create the perfect tea-growing conditions.", TransparencyLevel.A);

        assertTrue(disagreements.isEmpty(),
                disagreements.size() + " published grade(s) no longer follow:\n  "
                        + String.join("\n  ", disagreements));
    }
}
