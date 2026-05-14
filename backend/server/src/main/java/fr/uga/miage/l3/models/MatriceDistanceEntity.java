package fr.uga.miage.l3.models;

import jakarta.persistence.*;
import lombok.*;

import java.util.Set;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatriceDistanceEntity {
    @EmbeddedId
    private MatriceDistanceId id;

    private Double duree;

    private Double distance;
}
