package fr.uga.miage.l3.models.domain;

import lombok.Data;

@Data
public abstract class Personne {
    private Long id;
    private String nom;
    private String prenom;
    private String numeroTelephone;
    private String email;
    private Adresse adresse;
}
