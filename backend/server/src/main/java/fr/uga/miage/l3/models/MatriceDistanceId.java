package fr.uga.miage.l3.models;
import jakarta.persistence.*;
import lombok.*;
@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatriceDistanceId {
    @Column(name = "id_commande_depart")
    private Long idCommandeDepart;

    @Column(name = "id_commande_arrivee")
    private Long idCommandeArrivee;
}
