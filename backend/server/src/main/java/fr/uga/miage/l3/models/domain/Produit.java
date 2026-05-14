package fr.uga.miage.l3.models.domain;

import lombok.Data;

@Data
public class Produit {
    private String reference;
    private String nom;
    private float prix;
    private float poids;
    private Integer stock;
    private boolean estMontable;
    private float tempsDeMontage;
    private float largeur;
    private float hauteur;
}
