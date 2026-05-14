package fr.uga.miage.l3.models.domain;

import lombok.Data;

import java.util.Set;

@Data
public class Equipe {
    private Long id;
    private String nom;
    private Set<Livreur> livreurs;
    private Camion camion;
}
