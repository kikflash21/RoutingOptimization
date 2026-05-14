package fr.uga.miage.l3.endpoints.request;

import lombok.Builder;


@Builder
public record CamionRequest(
        String plaque,
        Float volume,
        Float poidsMax,
        Boolean estDisponible
) {
}