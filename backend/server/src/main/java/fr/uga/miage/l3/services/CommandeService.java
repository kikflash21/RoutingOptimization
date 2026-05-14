package fr.uga.miage.l3.services;

import fr.uga.miage.l3.component.CommandeComponent;
import fr.uga.miage.l3.enums.Statut;
import fr.uga.miage.l3.exceptions.rest.NotFoundCommandesRestExcption;
import fr.uga.miage.l3.models.domain.Commande;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CommandeService {
    private final CommandeComponent commandeComponent;


    public List<Commande> getCommandesByIds(Set<Long> ids) {
        try {
            return commandeComponent.getCommandesByIds(ids);
        } catch (Exception e) {
            throw new NotFoundCommandesRestExcption(e.getMessage());
        }
    }

    public List<Commande> getCommandesByStatut(Statut statut) {
        try {
            return commandeComponent.getCommandesByStatut(String.valueOf(statut));
        } catch (Exception e) {
            throw new NotFoundCommandesRestExcption(e.getMessage());
        }
    }

}
