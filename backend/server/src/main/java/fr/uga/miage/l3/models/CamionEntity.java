package fr.uga.miage.l3.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CamionEntity {
    @Id
    private String plaque ;

    private Float volume ;

    private Boolean estDisponible;

    private Float poidsMax;

    @OneToOne
    @JoinColumn(name = "equipe_id")
    private EquipeEntity equipe;
}
