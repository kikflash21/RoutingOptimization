package fr.uga.miage.l3.component;

import fr.uga.miage.l3.exceptions.rest.BadRequestRestException;
import fr.uga.miage.l3.exceptions.rest.NotFoundElementRestException;
import fr.uga.miage.l3.mappers.TourneeMapper;
import fr.uga.miage.l3.models.CommandeEntity;
import fr.uga.miage.l3.models.EquipeEntity;
import fr.uga.miage.l3.models.TourneeEntity;
import fr.uga.miage.l3.models.domain.Tournee;
import fr.uga.miage.l3.models.domain.Commande;
import fr.uga.miage.l3.models.domain.Equipe;
import fr.uga.miage.l3.models.domain.Camion;
import fr.uga.miage.l3.repository.CommandeRepository;
import fr.uga.miage.l3.repository.EquipeRepository;
import fr.uga.miage.l3.repository.TourneeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class TourneeComponent {

    private final TourneeRepository tourneeRepository;
    private final EquipeRepository equipeRepository;
    private final CommandeRepository commandeRepository;
    private final TourneeMapper tourneeMapper;

    @Transactional
    public Tournee saveTournee(Long equipeId, List<Long> commandeIds, float duree, LocalDateTime debut, LocalDateTime fin) {
        log.info("[saveTournee] START equipeId={}, commandeIds={}, duree={}", equipeId, commandeIds, duree);

        EquipeEntity equipe = equipeRepository.findById(equipeId)
                .orElseThrow(() -> new BadRequestRestException("Equipe introuvable: " + equipeId));

        TourneeEntity entity = tourneeRepository.findByEquipe(equipe).orElseGet(TourneeEntity::new);
        log.info("[saveTournee] Found/created TourneeEntity id={}", entity.getId());

        entity.setDebutTournee(debut);
        entity.setFinTournee(fin);
        entity.setDuree(duree);
        entity.setEquipe(equipe);

        if (entity.getId() != null) {
            Long existingId = entity.getId();
            commandeRepository.clearTourneeByTourneeId(existingId);
            entity = tourneeRepository.findById(existingId).orElseThrow();
            entity.setDebutTournee(debut);
            entity.setFinTournee(fin);
            entity.setDuree(duree);
            entity.setEquipe(equipe);
            entity = tourneeRepository.saveAndFlush(entity);
            log.info("[saveTournee] Cleared old commandes for tournee {}", entity.getId());
        } else {
            entity = tourneeRepository.saveAndFlush(entity);
            log.info("[saveTournee] Saved new entity, id={}", entity.getId());
        }

        for (int i = 0; i < commandeIds.size(); i++) {
            CommandeEntity cmd = commandeRepository.findById(commandeIds.get(i))
                    .orElseThrow(() -> new BadRequestRestException("Commande introuvable"));
            cmd.setTournee(entity);
            cmd.setOrdreDansTournee(i);
            entity.getCommandes().add(cmd);
        }
        log.info("[saveTournee] Added {} commandes, saving", commandeIds.size());
        entity = tourneeRepository.saveAndFlush(entity);
        log.info("[saveTournee] Final save OK, tournee id={}, commandes={}", entity.getId(), entity.getCommandes().size());

        return tourneeMapper.toTournee(entity);
    }

    @Transactional(readOnly = true)
    public List<Tournee> getAllTournee() {
        List<TourneeEntity> entities = tourneeRepository.findAll();
        return entities.stream().map(this::mapLightweightTournee).toList();
    }

    private Tournee mapLightweightTournee(TourneeEntity e) {
        Tournee t = new Tournee();
        t.setId(e.getId());
        t.setDebutTournee(e.getDebutTournee());
        t.setFinTournee(e.getFinTournee());
        t.setDuree((double) e.getDuree());

        Equipe equipe = null;
        if (e.getEquipe() != null) {
            equipe = new Equipe();
            equipe.setId(e.getEquipe().getId());
            equipe.setNom(e.getEquipe().getNom());
            if (e.getEquipe().getCamion() != null) {
                Camion camion = new Camion();
                camion.setPlaque(e.getEquipe().getCamion().getPlaque());
                camion.setVolume(e.getEquipe().getCamion().getVolume());
                camion.setPoidsMax(e.getEquipe().getCamion().getPoidsMax());
                camion.setEstDisponible(e.getEquipe().getCamion().getEstDisponible());
                equipe.setCamion(camion);
            }
        }
        t.setEquipe(equipe);

        List<Long> ids = commandeRepository.findIdsByTourneeId(e.getId());
        List<Commande> commandes = ids.stream().map(id -> {
            Commande c = new Commande();
            c.setId(id);
            return c;
        }).toList();
        t.setCommandesOrdonnees(commandes);
        return t;
    }

    @Transactional
    public Tournee updateTournee(Long tourneeId, List<Long> commandeIds, float duree) {
        TourneeEntity entity = tourneeRepository.findById(tourneeId)
                .orElseThrow(() -> new BadRequestRestException("Tournée introuvable: " + tourneeId));

        entity.setDuree(duree);

        commandeRepository.clearTourneeByTourneeId(tourneeId);
        entity = tourneeRepository.findById(tourneeId).orElseThrow();
        entity.setDuree(duree);
        entity = tourneeRepository.saveAndFlush(entity);

        for (int i = 0; i < commandeIds.size(); i++) {
            CommandeEntity cmd = commandeRepository.findById(commandeIds.get(i))
                    .orElseThrow(() -> new BadRequestRestException("Commande introuvable"));
            cmd.setTournee(entity);
            cmd.setOrdreDansTournee(i);
            entity.getCommandes().add(cmd);
        }
        entity = tourneeRepository.saveAndFlush(entity);

        return tourneeMapper.toTournee(entity);
    }

    @Transactional
    public void deleteTournee(Long tourneeId) {
        TourneeEntity tournee = tourneeRepository.findById(tourneeId)
                .orElseThrow(() -> new NotFoundElementRestException("Tournée introuvable"));

        if (tournee.getEquipe() != null) {
            tournee.setEquipe(null);
            tournee = tourneeRepository.saveAndFlush(tournee);
        }

        commandeRepository.clearTourneeByTourneeId(tourneeId);
        tournee = tourneeRepository.findById(tourneeId).orElseThrow();
        tourneeRepository.delete(tournee);
    }
}