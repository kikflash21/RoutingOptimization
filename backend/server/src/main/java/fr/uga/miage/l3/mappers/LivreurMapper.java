package fr.uga.miage.l3.mappers;

import fr.uga.miage.l3.endpoints.request.LivreurRequest;
import fr.uga.miage.l3.endpoints.response.LivreurResponse;
import fr.uga.miage.l3.models.LivreurEntity;
import fr.uga.miage.l3.models.domain.Livreur;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper
public interface LivreurMapper {

    Livreur toLivreur(LivreurEntity livreurEntity);

    List<Livreur> toLivreurs(List<LivreurEntity> livreurEntities);

    LivreurResponse toResponse(Livreur livreur);

    List<LivreurResponse> toResponses(List<Livreur> livreurs);
}
