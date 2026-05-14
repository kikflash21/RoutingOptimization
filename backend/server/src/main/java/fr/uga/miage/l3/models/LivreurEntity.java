package fr.uga.miage.l3.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivreurEntity extends  PersonneEntity{

    private Boolean estDisponible ;

    @ManyToOne
    @Min(1)
    private EquipeEntity equipe;
}
