package com.shopping;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private BigDecimal totalAmount;
    private BigDecimal discountApplied;
    private LocalDateTime orderDate;
    private String paymentMethod;
    private String bankName;
    private String psid;
    private String deliveryFullName;
    private String deliveryAddress;
    private String deliveryPhone;
    private String deliveryCity;

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "order_id")
    private List<OrderItem> items;

    @PrePersist
    protected void onCreate() {
        orderDate = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public BigDecimal getDiscountApplied() { return discountApplied; }
    public LocalDateTime getOrderDate() { return orderDate; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getBankName() { return bankName; }
    public String getPsid() { return psid; }
    public String getDeliveryFullName() { return deliveryFullName; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public String getDeliveryPhone() { return deliveryPhone; }
    public String getDeliveryCity() { return deliveryCity; }
    public List<OrderItem> getItems() { return items; }

    public void setId(Long id) { this.id = id; }
    public void setUser(User user) { this.user = user; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public void setDiscountApplied(BigDecimal discount) { this.discountApplied = discount; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public void setPsid(String psid) { this.psid = psid; }
    public void setDeliveryFullName(String deliveryFullName) { this.deliveryFullName = deliveryFullName; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
    public void setDeliveryPhone(String deliveryPhone) { this.deliveryPhone = deliveryPhone; }
    public void setDeliveryCity(String deliveryCity) { this.deliveryCity = deliveryCity; }
    public void setItems(List<OrderItem> items) { this.items = items; }
}
