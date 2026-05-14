package fr.uga.miage.l3.endpoints.request;

import lombok.Builder;

import java.util.List;

@Builder
public record EquipeRequest(
        String nom,
        String camionPlaque,
        List<Long> livreurIds) {

}
