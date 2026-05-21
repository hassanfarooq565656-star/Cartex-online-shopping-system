package com.shopping;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserPublicDto {
    private Long id;
    private String username;
    private String email;

    public static UserPublicDto from(User user) {
        UserPublicDto dto = new UserPublicDto();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.email = user.getEmail();
        return dto;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
}
