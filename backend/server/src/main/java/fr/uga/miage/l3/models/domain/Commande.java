package fr.uga.miage.l3.models.domain;

import fr.uga.miage.l3.endpoints.response.CommandProduitResponse;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Data
public class Commande {
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
