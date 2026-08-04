package com.matcha.service;

import com.matcha.model.TransparencyLevel;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * The two evidence channels must reach the same verdict on the same words.
 *
 * <p>A cafe is graded from an analyser-chosen quote, from a scan of its page text, or from
 * both — and {@link TransparencyGrader#decide} prefers the analyser's on a tie. For a long
 * time the two ran different rules, so which grade a cafe got depended on which channel
 * happened to speak. Tightening the page scan alone did not fix it; it inverted it, and
 * "Single origin 1st spring harvested sencha green tea from Uji Kyoto" went on reaching
 * Level A through the channel that had been left loose.
 *
 * <p>These cases are the ones that exposed each gap, kept as a standing check that the two
 * ladders stay in step.
 */
class ChannelParityTest {

    /** Every sentence must grade identically whichever channel carries it. */
    private void bothChannelsAgree(String sentence, TransparencyLevel expected) {
        assertEquals(expected, TransparencyGrader.gradeVerifiedQuote(sentence),
                "analyser channel disagrees on: " + sentence);

        TransparencyGrader.Evidence fromText = TransparencyGrader.decide(null, sentence);
        TransparencyLevel textLevel = fromText == null ? TransparencyLevel.C : fromText.level();
        assertEquals(expected, textLevel, "page-scan channel disagrees on: " + sentence);

        TransparencyGrader.Evidence together = TransparencyGrader.decide(sentence, sentence);
        TransparencyLevel bothLevel = together == null ? TransparencyLevel.C : together.level();
        assertEquals(expected, bothLevel, "the two channels combined disagree on: " + sentence);
    }

    @Test
    @DisplayName("A region belonging to another tea is refused by both channels")
    void regionForAnotherTea() {
        bothChannelsAgree("Single origin 1st spring harvested sencha green tea from Uji Kyoto",
                TransparencyLevel.C);
        bothChannelsAgree("We stock a range of premium tea from Shizuoka, Mt Fuji, in leaf form "
                + "from Sencha, Genmaicha and Hojicha.", TransparencyLevel.C);
    }

    @Test
    @DisplayName("A country stated for another product is refused by both channels")
    void countryForAnotherProduct() {
        bothChannelsAgree("Origin: Japan", TransparencyLevel.C);
        bothChannelsAgree("This premium Japanese Green Tea blended with Matcha powder has the "
                + "aroma of Genmai (popped rice) and a mild flavour of Sencha.", TransparencyLevel.C);
    }

    @Test
    @DisplayName("A definition of matcha is refused by both channels")
    void definitionIsNotEvidence() {
        bothChannelsAgree("Matcha is a traditional Japanese green tea that has captured the "
                + "hearts of health enthusiasts worldwide.", TransparencyLevel.C);
    }

    @Test
    @DisplayName("Real disclosures reach the same level through both channels")
    void genuineDisclosuresAgree() {
        bothChannelsAgree("Our matcha hails from the Yame region in Fukuoka, Japan.",
                TransparencyLevel.A);
        bothChannelsAgree("Matcha sourced from a Japanese farm in Uji, Kyoto.",
                TransparencyLevel.A);
        bothChannelsAgree("For matcha lovers, we serve authentic Japanese matcha imported "
                + "directly from Japan.", TransparencyLevel.B);
    }

    @Test
    @DisplayName("A quote naming no other tea keeps its grade")
    void soleProductQuotesUnaffected() {
        assertEquals(TransparencyLevel.A, TransparencyGrader.gradeVerifiedQuote(
                "Sourced from Kyoto, Japan, this first-harvest blend is crafted for those who "
                        + "want a reliable, high-quality staple in their collection."));
        assertEquals(TransparencyLevel.A, TransparencyGrader.gradeVerifiedQuote(
                "Sourced across Japan, with a focus on Uji and a handful of smaller regions "
                        + "where climate and soil create a more distinctive expression."));
    }
}
