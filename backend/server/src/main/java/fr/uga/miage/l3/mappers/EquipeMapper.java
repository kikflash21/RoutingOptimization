package fr.uga.miage.l3.mappers;

import fr.uga.miage.l3.endpoints.response.EquipeResponse;
import fr.uga.miage.l3.models.EquipeEntity;
import fr.uga.miage.l3.models.domain.Equipe;
import fr.uga.miage.l3.models.domain.Livreur;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper
public interface EquipeMapper {

    Equipe toEquipe(EquipeEntity entity);
    List<Equipe> toEquipes(List<EquipeEntity> entities);

    EquipeEntity toEntity(Equipe equipe);

    @Mapping(source = "camion.plaque", target = "camionPlaque")
    @Mapping(source = "livreurs", target = "livreurIds")
    EquipeResponse toResponse(Equipe equipe);

    List<EquipeResponse> toResponse(List<Equipe> equipes);

    default Long mapLivreurToId(Livreur livreur) {
        if (livreur == null) return null;
        return livreur.getId();
    }
}