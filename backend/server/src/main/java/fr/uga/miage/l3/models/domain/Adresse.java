package fr.uga.miage.l3.models.domain;

import lombok.Data;

@Data
public class Adresse {
    private Long id;
    private int numeroRue;
    private String rue;
    private String codePostale;
    private String ville;
    private boolean estDepot;
    private Coordonnees coordonnees;
}
