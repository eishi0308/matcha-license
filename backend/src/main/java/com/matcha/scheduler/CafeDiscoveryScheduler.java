package com.matcha.scheduler;

import com.matcha.service.CafeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically runs the cafe discovery pipeline.
 * Disabled by default — enable by setting schedule.discovery.enabled=true
 * and optionally customise the cron via schedule.discovery.cron.
 *
 * Default schedule: every Sunday at 2am.
 */
@Component
public class CafeDiscoveryScheduler {

    @Autowired
    private CafeService cafeService;

    @Value("${schedule.discovery.enabled:false}")
    private boolean enabled;

    // Runs every Sunday at 02:00 — change via application.properties
    @Scheduled(cron = "${schedule.discovery.cron:0 0 2 * * SUN}")
    public void runDiscovery() {
        if (!enabled) {
            System.out.println("[Scheduler] Discovery is disabled. Set schedule.discovery.enabled=true to enable.");
            return;
        }

        System.out.println("[Scheduler] Starting scheduled cafe discovery...");
        try {
            int count = cafeService.discoverAndSave();
            System.out.printf("[Scheduler] Discovery complete. Found %d new cafes.%n", count);
        } catch (Exception e) {
            System.err.println("[Scheduler] Discovery failed: " + e.getMessage());
        }
    }
}
