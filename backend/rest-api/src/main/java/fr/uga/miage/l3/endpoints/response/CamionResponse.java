package fr.uga.miage.l3.endpoints.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CamionResponse {
    private String plaque;
    private Float volume;
    private Float poidsMax;
    private Boolean estDisponible;
    private Long equipeId;
}
