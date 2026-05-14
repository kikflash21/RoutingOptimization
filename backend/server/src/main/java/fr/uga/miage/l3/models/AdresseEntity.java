    package fr.uga.miage.l3.models;

    import jakarta.persistence.*;
    import lombok.*;

    @Entity
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public class AdresseEntity {
        @Id
        @Column(name = "id", nullable = false)
        private Long id;

        private Integer numeroRue;

        private String rue ;

        private String codePostale ;

        private  String ville ;

        private Boolean estDepot;

        @Embedded
        private Coordonnees coordonnees ;
    }
