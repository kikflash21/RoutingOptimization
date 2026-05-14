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
public class ClientEntity extends PersonneEntity {

    @OneToMany(mappedBy = "client")
    private List<CommandeEntity> commandes;
}
