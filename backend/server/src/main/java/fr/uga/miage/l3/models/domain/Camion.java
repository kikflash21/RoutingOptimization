package fr.uga.miage.l3.models.domain;

import lombok.Data;

@Data
public class Camion {
    private String plaque;
    private float volume;
    private boolean estDisponible;
    private float poidsMax;
}
