package com.shopping;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import java.util.*;

@Component
public class ProductDuplicateCleaner implements ApplicationRunner {
    private final ProductRepository productRepository;

    public ProductDuplicateCleaner(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<Product> all = productRepository.findAll();
        Map<String, Product> kept = new LinkedHashMap<>();
        List<Product> duplicates = new ArrayList<>();

        for (Product p : all) {
            String key = p.getName() == null ? "" : p.getName().trim().toLowerCase();
            if (kept.containsKey(key)) {
                duplicates.add(p);
            } else {
                kept.put(key, p);
            }
        }

        if (!duplicates.isEmpty()) {
            productRepository.deleteAll(duplicates);
            System.out.println("Removed " + duplicates.size() + " duplicate product(s) from database.");
        }
    }
}
