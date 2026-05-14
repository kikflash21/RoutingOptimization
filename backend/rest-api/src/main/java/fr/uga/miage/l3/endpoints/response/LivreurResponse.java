package fr.uga.miage.l3.endpoints.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivreurResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String numeroTelephone;
    private String email;
    private AdresseResponse adresse;
    private boolean estDisponible;

}
