
package fr.uga.miage.l3.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
public abstract class PersonneEntity {
    @Id
    private Long id;

    @Column(name = "nom", nullable = false)
    private String nom  ;

    @Column(name = "prenom", nullable = false)
    private String prenom ;

    @Column(name = "numeroTelephone", length = 10)
    private String numeroTelephone ;

    private  String email ;

    @OneToOne
    private AdresseEntity adresse;
}