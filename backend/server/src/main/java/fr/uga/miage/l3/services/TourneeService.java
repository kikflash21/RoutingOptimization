package fr.uga.miage.l3.services;

import fr.uga.miage.l3.component.TourneeComponent;
import fr.uga.miage.l3.endpoints.request.TourneeRequest;
import fr.uga.miage.l3.exceptions.rest.BadRequestRestException;
import fr.uga.miage.l3.models.domain.Tournee;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TourneeService {

    private final TourneeComponent tourneeComponent;

    public Tournee saveTournee(TourneeRequest request) {

        if (request == null || request.commandeIds() == null || request.commandeIds().isEmpty()) {
            throw new BadRequestRestException("La liste des commandes est vide.");
        }
        if (request.equipeId() == null) {
            throw new BadRequestRestException("Equipe obligatoire pour enregistrer une tournée.");
        }

        final float duree = request.duree();
        final LocalDateTime debut = LocalDateTime.now();
        final LocalDateTime fin = debut.plusSeconds(Math.max(0L, (long) duree));


        return tourneeComponent.saveTournee(
                request.equipeId(),
                new java.util.ArrayList<>(request.commandeIds()),
                duree,
                debut,
                fin
        );
    }

    public List<Tournee> getAllTournee() {
        return tourneeComponent.getAllTournee();
    }

    public void deleteTournee(Long id) {
        tourneeComponent.deleteTournee(id);
    }

    public Tournee updateTournee(Long id, TourneeRequest request) {
        if (request == null || request.commandeIds() == null || request.commandeIds().isEmpty()) {
            throw new BadRequestRestException("La liste des commandes est vide.");
        }
        return tourneeComponent.updateTournee(id, new java.util.ArrayList<>(request.commandeIds()), request.duree());
    }
}