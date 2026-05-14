package fr.uga.miage.l3.endpoints.response;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdresseResponse {
    private Long id;
    private Integer numeroRue;
    private String rue;
    private String codePostale ;
    private  String ville ;
    private Boolean estDepot;
    private Double latitude;
    private Double longitude;
}
