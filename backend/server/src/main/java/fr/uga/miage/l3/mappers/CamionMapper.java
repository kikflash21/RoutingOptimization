package fr.uga.miage.l3.mappers;

import fr.uga.miage.l3.endpoints.response.CamionResponse;
import fr.uga.miage.l3.models.CamionEntity;
import fr.uga.miage.l3.models.domain.Camion;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper
public interface CamionMapper {

    Camion toCamion(CamionEntity entity);

    List<Camion> toCamions(List<CamionEntity> entities);

    CamionResponse toResponse(Camion camion);

    List<CamionResponse> toResponses(List<Camion> camion);


}
