package fr.uga.miage.l3.models;

import fr.uga.miage.l3.enums.Statut;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.*;
import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommandeEntity {
    @Id
    private Long id;

    @Enumerated(EnumType.STRING)
    private Statut statut;

    private LocalDateTime dateCommande ;

    @ManyToOne(fetch = FetchType.LAZY)
    @NotFound(action = NotFoundAction.IGNORE) // if bad FK points to wrong table, ignore instead of failing hydration
    private ClientEntity client;

    @OneToOne(fetch = FetchType.LAZY)
    private AdresseEntity adresse;

    @OneToMany( cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<CommandeProduitEntity> ligneCommandes;

    @ManyToOne
    @JoinColumn(name = "tournee_entity_id")
    private TourneeEntity tournee;

    private Integer ordreDansTournee;
}
