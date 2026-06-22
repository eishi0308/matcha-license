package com.matcha.repository;

import com.matcha.model.Cafe;
import com.matcha.model.TransparencyLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CafeRepository extends JpaRepository<Cafe, String> {

    List<Cafe> findByCity(String city);

    List<Cafe> findByLevel(TransparencyLevel level);

    List<Cafe> findByCityAndLevel(String city, TransparencyLevel level);

    List<Cafe> findByCityIgnoreCase(String city);

    boolean existsByNameAndCity(String name, String city);
}
