package fr.uga.miage.l3.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TourneeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime debutTournee;

    private LocalDateTime finTournee;

    private float duree;

    @OneToOne
    @JoinColumn(name = "equipe_id")
    private EquipeEntity equipe;

    @OneToMany(mappedBy = "tournee")
    @OrderBy("ordreDansTournee ASC")
    @Builder.Default
    private List<CommandeEntity> commandes = new ArrayList<>();
}
