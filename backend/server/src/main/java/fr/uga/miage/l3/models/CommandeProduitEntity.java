package fr.uga.miage.l3.models;

import jakarta.persistence.*;
import lombok.*;
@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommandeProduitEntity {

        @Id
        private Long id;

        @ManyToOne
        @JoinColumn(name = "commande_id")
        private CommandeEntity commande;

        @ManyToOne
        @JoinColumn(name = "produit_ref")
        private ProduitEntity produit;

        private Integer quantite;

        private Boolean optionMontage;
    }

