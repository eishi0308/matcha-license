package com.matcha.controller;

import com.matcha.model.CafeResponse;
import com.matcha.service.CafeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cafes")
public class CafeController {

    @Autowired
    private CafeService cafeService;

    /**
     * GET /api/cafes
     * GET /api/cafes?city=Sydney
     * GET /api/cafes?city=Melbourne&level=A
     */
    @GetMapping
    public ResponseEntity<List<CafeResponse>> getCafes(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String level
    ) {
        return ResponseEntity.ok(cafeService.findAll(city, level));
    }

    /**
     * GET /api/cafes/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<CafeResponse> getCafe(@PathVariable String id) {
        return cafeService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/cafes/stats
     * Returns counts per transparency level and per city.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(cafeService.getStats());
    }

    /**
     * POST /api/cafes/cleanup-evidence
     * Re-scrapes all cafe websites and removes hallucinated evidence quotes.
     */
    @PostMapping("/cleanup-evidence")
    public ResponseEntity<Map<String, Object>> cleanupEvidence() {
        return ResponseEntity.ok(cafeService.cleanupEvidenceQuotes());
    }

    /**
     * POST /api/cafes/discover
     * Triggers the full Overpass → scrape → Claude pipeline.
     * This is a long-running operation — expect 5–15 minutes.
     */
    @PostMapping("/discover")
    public ResponseEntity<Map<String, Object>> discoverCafes() {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            int count = cafeService.discoverAndSave();
            result.put("status", "success");
            result.put("discovered", count);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("status", "error");
            result.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(result);
        }
    }
}
