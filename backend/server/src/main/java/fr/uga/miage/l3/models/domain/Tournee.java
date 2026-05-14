package fr.uga.miage.l3.models.domain;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class Tournee {
    private Long id;
    private LocalDateTime debutTournee;
    private LocalDateTime finTournee;
    private Double duree;
    private Equipe equipe;
    private List<Commande> commandesOrdonnees;
}
