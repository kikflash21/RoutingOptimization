package fr.uga.miage.l3.endpoints.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatriceResponse {
    private MatriceDistanceIdResponse id;
    //private Double distance;
    private Double duree;
}
