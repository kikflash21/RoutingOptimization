package fr.uga.miage.l3.models;
import jakarta.persistence.*;
import lombok.*;


import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipeEntity {
    @Id
    private Long id ;

    @Column(name="nom",nullable = false)
    private String nom ;

    @OneToMany(mappedBy = "equipe")
    private List<LivreurEntity> livreurs;

    @OneToOne(mappedBy = "equipe")
    private CamionEntity camion ;

    @OneToOne(mappedBy = "equipe")
    private TourneeEntity tournee;
}
