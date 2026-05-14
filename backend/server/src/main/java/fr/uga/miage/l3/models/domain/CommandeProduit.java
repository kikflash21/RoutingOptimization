package fr.uga.miage.l3.models.domain;

import lombok.Data;

@Data
public class CommandeProduit {
    private Produit produit;
    private int quantite;
    private boolean optionMontage;
}
