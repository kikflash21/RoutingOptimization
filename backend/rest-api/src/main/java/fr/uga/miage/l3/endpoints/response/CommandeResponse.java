package fr.uga.miage.l3.endpoints.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommandeResponse {
    private Long id;
    private String nomClient;
    private String prenomClient;
    private LocalDateTime dateCommande;
    private String statut;


    private Double latitude;
    private Double longitude;
    private String adresseComplete;


    private List<CommandProduitResponse> produits;
}
