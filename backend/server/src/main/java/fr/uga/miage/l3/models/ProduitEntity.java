package fr.uga.miage.l3.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProduitEntity {
    @Id
    private String reference ;

    private String nom ;

    private Float prix ;

    private Float poids ;

    private Integer  stock ;

    private Float largeur;

    private Float hauteur;

    private Integer tempsDeMontage ;

    private Boolean estMontable ;
}
