package fr.uga.miage.l3.endpoints.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CommandProduitResponse {
    private String nomProduit;
    private Integer quantite;
    private Float prixUnitaire;
}
