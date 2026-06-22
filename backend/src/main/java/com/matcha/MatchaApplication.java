package com.matcha;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MatchaApplication {
    public static void main(String[] args) {
        SpringApplication.run(MatchaApplication.class, args);
    }
}
