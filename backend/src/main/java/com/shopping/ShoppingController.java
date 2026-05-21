package com.shopping;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ShoppingController {

    @Autowired private ProductRepository productRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private CartItemRepository cartItemRepository;
    @Autowired private PaymentService paymentService;
    @Autowired private GeminiService geminiService;
    @Autowired private GrokService grokService;
    @Autowired private AppConfig appConfig;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()
                || user.getPassword() == null || user.getPassword().isBlank()
                || user.getUsername() == null || user.getUsername().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name, email, and password are required."));
        }
        if (userRepository.findByEmail(user.getEmail().trim().toLowerCase()) != null) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "An account with this email already exists."));
        }
        user.setEmail(user.getEmail().trim().toLowerCase());
        user.setUsername(user.getUsername().trim());
        User saved = userRepository.save(user);
        return ResponseEntity.ok(UserPublicDto.from(saved));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        if (user.getEmail() == null || user.getPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required."));
        }
        User found = userRepository.findByEmail(user.getEmail().trim().toLowerCase());
        if (found != null && found.getPassword().equals(user.getPassword())) {
            return ResponseEntity.ok(UserPublicDto.from(found));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password."));
    }

    @GetMapping("/products")
    public List<Product> getProducts() { return productRepository.findAll(); }

    @GetMapping("/categories")
    public List<Category> getCategories() {
        List<Category> all = categoryRepository.findAll();
        Map<String, Category> unique = new LinkedHashMap<>();
        for (Category c : all) {
            String name = c.getName() == null ? "" : c.getName().trim().toLowerCase();
            if (!unique.containsKey(name)) {
                unique.put(name, c);
            }
        }
        return new ArrayList<>(unique.values());
    }

    @PostMapping("/orders")
    public Order placeOrder(@RequestBody Order order) { return orderRepository.save(order); }

    @GetMapping("/users/{userId}/is-first-order")
    public boolean isFirstOrder(@PathVariable Long userId) {
        return orderRepository.countByUser_Id(userId) == 0;
    }

    @GetMapping("/records/{userId}")
    public ResponseEntity<?> getRecords(@PathVariable Long userId) {
        if (userRepository.findById(userId).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found."));
        }
        return ResponseEntity.ok(orderRepository.findByUser_IdOrderByOrderDateDesc(userId));
    }

    @GetMapping("/cart/guest")
    public ResponseEntity<?> getCartGuest() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "authenticated", false,
                "appName", "CARTEX",
                "message", "Sign in to view your cart and checkout securely.",
                "loginHint", "Already registered? Log in to access your cart.",
                "registerHint", "New to CARTEX? Create a free account to start shopping."
        ));
    }

    @GetMapping("/cart/{userId}")
    public ResponseEntity<?> getCart(@PathVariable Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        return ResponseEntity.ok(buildCartResponse(userOpt.get()));
    }

    @PostMapping("/cart/{userId}/items")
    public ResponseEntity<?> addCartItem(@PathVariable Long userId, @RequestBody Map<String, Object> body) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        
        Long productId = Long.valueOf(body.get("productId").toString());
        int addQty = body.containsKey("quantity") ? Integer.parseInt(body.get("quantity").toString()) : 1;
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Product not found."));
        }

        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, productId).orElse(null);
        if (item == null) {
            item = new CartItem();
            item.setUserId(userId);
            item.setProductId(productId);
            item.setQuantity(addQty);
        } else {
            item.setQuantity(item.getQuantity() + addQty);
        }
        cartItemRepository.save(item);
        return ResponseEntity.ok(buildCartResponse(user));
    }

    @PutMapping("/cart/{userId}/items/{productId}")
    public ResponseEntity<?> updateCartItem(@PathVariable Long userId, @PathVariable Long productId, @RequestBody Map<String, Object> body) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        
        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, productId).orElse(null);
        if (item == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        
        int qty = Integer.parseInt(body.get("quantity").toString());
        if (qty <= 0) cartItemRepository.delete(item);
        else {
            item.setQuantity(qty);
            cartItemRepository.save(item);
        }
        return ResponseEntity.ok(buildCartResponse(user));
    }

    @DeleteMapping("/cart/{userId}/items/{productId}")
    public ResponseEntity<?> removeCartItem(@PathVariable Long userId, @PathVariable Long productId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        
        cartItemRepository.findByUserIdAndProductId(userId, productId).ifPresent(cartItemRepository::delete);
        return ResponseEntity.ok(buildCartResponse(user));
    }

    @Transactional
    @PostMapping("/cart/{userId}/clear")
    public ResponseEntity<?> clearCart(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        
        cartItemRepository.deleteByUserId(userId);
        return ResponseEntity.ok(buildCartResponse(user));
    }

    @GetMapping("/payment/{userId}")
    public ResponseEntity<?> getPaymentOptions(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        
        Map<String, Object> cart = buildCartResponse(user);
        Map<String, Object> response = new LinkedHashMap<>(cart);
        response.put("methods", List.of(
                Map.of("id", "bank", "label", "Online Pay", "description", "Pay via UBL or HBL bank transfer"),
                Map.of("id", "cod", "label", "Cash on Delivery", "description", "Pay when your order arrives")
        ));
        response.put("banks", List.of("UBL", "HBL"));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/payment/bank/init")
    public ResponseEntity<?> initBankPayment(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        String bank = body.get("bank").toString().trim().toUpperCase();
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        
        Map<String, Object> cart = buildCartResponse(user);
        BigDecimal total = new BigDecimal(cart.get("total").toString());
        String psid = paymentService.initBankPayment(userId, bank, total);
        return ResponseEntity.ok(Map.of("psid", psid, "bank", bank, "amount", total));
    }

    @Transactional
    @PostMapping("/payment/bank/complete")
    public ResponseEntity<?> completeBankPayment(@RequestBody Map<String, Object> body) {
        return processBankPaymentComplete(body);
    }

    @Transactional
    @PostMapping("/payment/bank/confirm")
    public ResponseEntity<?> confirmBankPayment(@RequestBody Map<String, Object> body) {
        return processBankPaymentComplete(body);
    }

    private ResponseEntity<?> processBankPaymentComplete(Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        String psid = str(body.get("psid"));
        String bank = str(body.get("bank")).toUpperCase();
        if (psid.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "PSID is required."));
        }
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        if (paymentService.validateAndConsumePsid(psid, userId) == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired PSID. Generate a new one."));
        }

        Order order = placeOrderFromCart(user, "Online Pay", bank, psid, null, null, null, null);
        if (order == null) return ResponseEntity.badRequest().body(Map.of("message", "Your cart is empty."));
        return ResponseEntity.ok(Map.of("success", true, "orderId", order.getId(), "paymentMethod", "Online Pay"));
    }

    @Transactional
    @PostMapping("/payment/cod/complete")
    public ResponseEntity<?> cashOnDelivery(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        String fullName = str(body.get("fullName"));
        String address = str(body.get("address"));
        String phone = str(body.get("phone"));
        String city = str(body.get("city"));
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        
        Order order = placeOrderFromCart(user, "Cash on Delivery", null, null, fullName, address, phone, city);
        if (order == null) return ResponseEntity.badRequest().body(Map.of("message", "Your cart is empty."));
        return ResponseEntity.ok(Map.of("success", true, "orderId", order.getId(), "paymentMethod", "Cash on Delivery"));
    }

    @GetMapping("/payment/bank/success-message")
    public ResponseEntity<?> bankPaymentSuccessMessage() {
        return ResponseEntity.ok(Map.of("title", "Thank You!", "line1", "Payment received.", "type", "bank"));
    }

    @GetMapping("/payment/cod/success-message")
    public ResponseEntity<?> codSuccessMessage() {
        return ResponseEntity.ok(Map.of("title", "Congratulations!", "line1", "Order placed.", "type", "cod"));
    }

    @GetMapping("/ai/greet/{userId}")
    public ResponseEntity<?> aiGreet(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        
        String timeOfDay = grokService.timeOfDayGreeting();
        String aiGreeting = grokService.supportGreeting(user.getUsername());
        String simpleGreeting = "Good " + timeOfDay + ", " + user.getUsername() + "!";
        
        return ResponseEntity.ok(Map.of("greeting", aiGreeting, "simpleGreeting", simpleGreeting, "timeOfDay", timeOfDay, "username", user.getUsername()));
    }

    @PostMapping("/support/chat/{userId}")
    public ResponseEntity<?> supportChat(@PathVariable Long userId, @RequestBody Map<String, Object> body) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        
        String question = str(body.get("message"));
        if (question.isBlank()) return ResponseEntity.badRequest().build();

        if ("non-latin".equalsIgnoreCase(grokService.detectLanguage(question))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please use Latin characters."));
        }

        List<Product> products = productRepository.findAll();
        String reply = grokService.answerSupportQuestion(user, question, products);
        return ResponseEntity.ok(Map.of("reply", reply, "assistant", "CARTEX Support"));
    }

    @GetMapping("/ai/recommend/{userId}")
    public ResponseEntity<?> aiRecommend(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();

        List<Product> allProducts = productRepository.findAll();
        List<Product> pool = allProducts.stream()
                .filter(p -> p.getImageUrl() != null && !p.getImageUrl().isBlank())
                .toList();

        List<Map<String, Object>> recommended = new ArrayList<>();
        String message = "Picked for you:";

        if (geminiService.isConfigured() && !pool.isEmpty()) {
            List<Order> pastOrders = orderRepository.findByUser_IdOrderByOrderDateDesc(userId);
            Set<Long> orderedIds = new HashSet<>();
            for (Order o : pastOrders) {
                if (o.getItems() != null) {
                    for (OrderItem oi : o.getItems()) {
                        if (oi.getProductId() != null) orderedIds.add(oi.getProductId());
                    }
                }
            }
            List<Product> candidates = pool.stream()
                    .filter(p -> !orderedIds.contains(p.getId()))
                    .limit(12)
                    .toList();
            if (candidates.isEmpty()) candidates = pool.stream().limit(12).toList();

            String names = candidates.stream()
                    .map(p -> p.getId() + ":" + p.getName())
                    .reduce((a, b) -> a + ", " + b)
                    .orElse("");

            String prompt = "User " + user.getUsername() + " shops at CARTEX. Pick exactly 4 product IDs from this list "
                    + "that best match general shopping interests. Reply ONLY as comma-separated IDs, no text: " + names;

            String aiPick = geminiService.generateText(prompt);
            if (aiPick != null) {
                for (String part : aiPick.split("[,\\s]+")) {
                    if (recommended.size() >= 4) break;
                    try {
                        long pid = Long.parseLong(part.replaceAll("[^0-9]", ""));
                        pool.stream().filter(p -> p.getId() == pid).findFirst()
                                .ifPresent(p -> recommended.add(productToMap(p)));
                    } catch (NumberFormatException ignored) { }
                }
                if (!recommended.isEmpty()) {
                    message = "AI picked for you:";
                }
            }
        }

        if (recommended.isEmpty()) {
            List<Product> source = new ArrayList<>(pool.isEmpty() ? allProducts : pool);
            Collections.shuffle(source);
            for (int i = 0; i < Math.min(4, source.size()); i++) {
                recommended.add(productToMap(source.get(i)));
            }
        }

        return ResponseEntity.ok(Map.of("message", message, "products", recommended));
    }

    // --- ADMIN ENDPOINTS ---

    private boolean isAdmin(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        return user != null && appConfig.isAdminEmail(user.getEmail());
    }

    @GetMapping("/admin/stats/{userId}")
    public ResponseEntity<?> getAdminStats(@PathVariable Long userId) {
        if (!isAdmin(userId)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> userOrderData = new ArrayList<>();
        
        for (User u : users) {
            if (appConfig.isAdminEmail(u.getEmail())) continue;
            List<Order> orders = orderRepository.findByUser_IdOrderByOrderDateDesc(u.getId());
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("username", u.getUsername());
            map.put("email", u.getEmail());
            map.put("orders", orders);
            userOrderData.add(map);
        }
        return ResponseEntity.ok(userOrderData);
    }

    @PostMapping("/admin/products/{userId}")
    public ResponseEntity<?> adminAddProduct(@PathVariable Long userId, @RequestBody Product product) {
        if (!isAdmin(userId)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        try {
            if (product.getCategory() != null && product.getCategory().getId() != null) {
                product.setCategory(categoryRepository.findById(product.getCategory().getId()).orElse(null));
            }
            Product saved = productRepository.save(product);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            System.err.println("[ADMIN ERROR] Failed to save product: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Database Error: " + e.getMessage()));
        }
    }

    @DeleteMapping("/admin/products/{userId}/{productId}")
    public ResponseEntity<?> adminDeleteProduct(@PathVariable Long userId, @PathVariable Long productId) {
        if (!isAdmin(userId)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        try {
            productRepository.deleteById(productId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            System.err.println("[ADMIN ERROR] Failed to delete product: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Cannot delete product. It might be linked to existing orders."));
        }
    }

    // --- HELPERS ---

    private Order placeOrderFromCart(User user, String paymentMethod, String bank, String psid,
            String deliveryName, String deliveryAddress, String deliveryPhone, String deliveryCity) {
        Map<String, Object> cartData = buildCartResponse(user);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> items = (List<Map<String, Object>>) cartData.get("items");
        if (items.isEmpty()) return null;

        Order order = new Order();
        order.setUser(user);
        order.setTotalAmount(new BigDecimal(cartData.get("total").toString()));
        order.setDiscountApplied(new BigDecimal(cartData.get("discount").toString()));
        order.setPaymentMethod(paymentMethod);
        order.setBankName(bank);
        order.setPsid(psid);
        order.setDeliveryFullName(deliveryName);
        order.setDeliveryAddress(deliveryAddress);
        order.setDeliveryPhone(deliveryPhone);
        order.setDeliveryCity(deliveryCity);

        List<OrderItem> ois = new ArrayList<>();
        for (Map<String, Object> item : items) {
            OrderItem oi = new OrderItem();
            oi.setProductId(Long.valueOf(item.get("productId").toString()));
            oi.setQuantity((Integer) item.get("quantity"));
            oi.setPriceAtPurchase((BigDecimal) item.get("price"));
            ois.add(oi);
        }
        order.setItems(ois);
        orderRepository.save(order);
        cartItemRepository.deleteByUserId(user.getId());
        return order;
    }

    private Map<String, Object> buildCartResponse(User user) {
        List<CartItem> cartItems = cartItemRepository.findByUserId(user.getId());
        List<Map<String, Object>> items = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (CartItem ci : cartItems) {
            Product p = productRepository.findById(ci.getProductId()).orElse(null);
            if (p == null) continue;
            BigDecimal lineTotal = p.getPrice().multiply(BigDecimal.valueOf(ci.getQuantity()));
            subtotal = subtotal.add(lineTotal);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("productId", p.getId());
            row.put("name", p.getName());
            row.put("price", p.getPrice());
            row.put("quantity", ci.getQuantity());
            row.put("imageUrl", p.getImageUrl());
            row.put("lineTotal", lineTotal.setScale(2, RoundingMode.HALF_UP));
            items.add(row);
        }

        boolean firstOrder = orderRepository.countByUser_Id(user.getId()) == 0;
        BigDecimal discount = firstOrder ? subtotal.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal total = subtotal.subtract(discount).setScale(2, RoundingMode.HALF_UP);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("userId", user.getId());
        response.put("username", user.getUsername());
        response.put("items", items);
        response.put("subtotal", subtotal.setScale(2, RoundingMode.HALF_UP));
        response.put("discount", discount);
        response.put("total", total);
        response.put("isFirstOrder", firstOrder);
        return response;
    }

    private Map<String, Object> productToMap(Product p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("name", p.getName());
        m.put("price", p.getPrice());
        m.put("imageUrl", p.getImageUrl());
        m.put("category", p.getCategory() != null ? p.getCategory().getName() : "");
        return m;
    }

    private String str(Object o) { return o == null ? "" : o.toString().trim(); }
}
