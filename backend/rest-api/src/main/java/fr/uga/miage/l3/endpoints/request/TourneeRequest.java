package fr.uga.miage.l3.endpoints.request;

import lombok.Builder;

import java.util.List;

@Builder
public record TourneeRequest(
        List<Long> commandeIds,
        float duree,
        Long equipeId) {


}
