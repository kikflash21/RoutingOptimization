package fr.uga.miage.l3.models;
import jakarta.persistence.*;
import lombok.*;
@Embeddable
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Coordonnees {
    private Double latitude;

    private Double longitude;
}
