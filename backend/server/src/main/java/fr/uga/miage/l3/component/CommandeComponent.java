package fr.uga.miage.l3.component;

import fr.uga.miage.l3.enums.Statut;
import fr.uga.miage.l3.exceptions.technical.NotFoundCommandeException;
import fr.uga.miage.l3.mappers.CommandeMapper;
import fr.uga.miage.l3.models.CommandeEntity;
import fr.uga.miage.l3.models.domain.Commande;
import fr.uga.miage.l3.repository.CommandeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class CommandeComponent {
    private final CommandeRepository commandeRepository;
    private final CommandeMapper commandeMapper;

    public List<Commande> getCommandesByIds(Set<Long> ids) throws NotFoundCommandeException {
        List<CommandeEntity> entities = commandeRepository.findAllById(ids);

        if (entities.isEmpty()) {
            throw new NotFoundCommandeException("Aucune commande trouvée pour les IDs fournis");
        }

        return commandeMapper.toCommands(entities);
    }

    public List<Commande> getCommandesByStatut(String statut) throws NotFoundCommandeException {
        var enumStatut = Statut.valueOf(statut);

        List<CommandeEntity> entities = commandeRepository.findAllByStatut(enumStatut);

        if (entities.isEmpty()) {
            throw new NotFoundCommandeException("Aucune commande trouvée avec le statut : " + statut);
        }

        return commandeMapper.toCommands(entities);
    }
}