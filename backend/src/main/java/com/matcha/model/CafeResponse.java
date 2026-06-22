package com.matcha.model;

import java.util.Arrays;
import java.util.List;

/**
 * DTO returned to the frontend — matches the TypeScript Cafe interface exactly.
 */
public class CafeResponse {

    public String id;
    public String name;
    public String city;
    public String suburb;
    public String address;
    public Double lat;
    public Double lng;
    public String level;
    public String type;
    public String tagline;
    public String description;
    public EvidenceResponse evidence;
    public String instagram;
    public String website;
    public String priceRange;
    public List<String> specialties;
    public String coverColor;

    public static class EvidenceResponse {
        public String quote;
        public String source;
        public String sourceLabel;
        public String verifiedDate;

        public EvidenceResponse(String quote, String source, String sourceLabel, String verifiedDate) {
            this.quote = quote;
            this.source = source;
            this.sourceLabel = sourceLabel;
            this.verifiedDate = verifiedDate;
        }
    }

    public static CafeResponse from(Cafe cafe) {
        CafeResponse dto = new CafeResponse();
        dto.id = cafe.getId();
        dto.name = cafe.getName();
        dto.city = cafe.getCity();
        dto.suburb = cafe.getSuburb();
        dto.address = cafe.getAddress();
        dto.lat = cafe.getLat();
        dto.lng = cafe.getLng();
        dto.level = cafe.getLevel() != null ? cafe.getLevel().name() : null;
        dto.type = cafe.getType();
        dto.tagline = cafe.getTagline();
        dto.description = cafe.getDescription();
        dto.instagram = cafe.getInstagram();
        dto.website = cafe.getWebsite();
        dto.priceRange = cafe.getPriceRange();
        dto.coverColor = cafe.getCoverColor();

        dto.specialties = cafe.getSpecialties() != null && !cafe.getSpecialties().isBlank()
                ? Arrays.asList(cafe.getSpecialties().split(","))
                : List.of();

        if (cafe.getEvidenceQuote() != null) {
            dto.evidence = new EvidenceResponse(
                    cafe.getEvidenceQuote(),
                    cafe.getEvidenceSource(),
                    cafe.getEvidenceSourceLabel(),
                    cafe.getEvidenceVerifiedDate()
            );
        }

        return dto;
    }
}
