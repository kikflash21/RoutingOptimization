package fr.uga.miage.l3.models.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Matrice {
    private Long idCommandeDepart;
    private Long idCommandeArrivee;
    private Double duree;
}