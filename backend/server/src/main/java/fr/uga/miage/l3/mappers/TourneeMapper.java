package fr.uga.miage.l3.mappers;

import fr.uga.miage.l3.endpoints.request.TourneeRequest;
import fr.uga.miage.l3.endpoints.response.TourneeResponse;
import fr.uga.miage.l3.models.EquipeEntity;
import fr.uga.miage.l3.models.TourneeEntity;
import fr.uga.miage.l3.models.domain.Camion;
import fr.uga.miage.l3.models.domain.Commande;
import fr.uga.miage.l3.models.domain.Equipe;
import fr.uga.miage.l3.models.domain.Livreur;
import fr.uga.miage.l3.models.domain.Tournee;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper
public interface TourneeMapper {

    @Mapping(source = "commandes", target = "commandesOrdonnees")
    @Mapping(source = "equipe", target = "equipe", qualifiedByName = "equipeWithoutCollections")
    Tournee toTournee(TourneeEntity entity);

    List<Tournee> toTournee(List<TourneeEntity> entities);

    @Mapping(source = "commandesOrdonnees", target = "commandes")
    TourneeEntity toEntity(Tournee tournee);

    @Mapping(source = "duree", target = "dureeTotal")
    @Mapping(source = "equipe.id", target = "equipeId")
    @Mapping(source = "equipe.nom", target = "equipeNom")
    @Mapping(source = "equipe.camion.plaque", target = "camionPlaque")
    @Mapping(source = "commandesOrdonnees", target = "commandeIdsOrdonnees")
    //@Mapping(source = "equipe.livreurs", target = "livreurIds")
    TourneeResponse toResponse(Tournee tournee);

    List<TourneeResponse> toResponse(List<Tournee> tournees);

    Tournee toTournee(TourneeRequest request);

    default Long mapCommandeToId(Commande commande) {
        if (commande == null) return null;
        return commande.getId();
    }

    default Long mapLivreurToId(Livreur livreur) {
        if (livreur == null) return null;
        return livreur.getId();
    }

    @Named("equipeWithoutCollections")
    default Equipe equipeWithoutCollections(EquipeEntity e) {
        if (e == null) return null;
        Equipe equipe = new Equipe();
        equipe.setId(e.getId());
        equipe.setNom(e.getNom());
        if (e.getCamion() != null) {
            Camion camion = new Camion();
            camion.setPlaque(e.getCamion().getPlaque());
            camion.setVolume(e.getCamion().getVolume());
            camion.setPoidsMax(e.getCamion().getPoidsMax());
            equipe.setCamion(camion);
        }
        return equipe;
    }
}