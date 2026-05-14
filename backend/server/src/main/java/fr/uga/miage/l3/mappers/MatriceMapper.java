package fr.uga.miage.l3.mappers;

import fr.uga.miage.l3.endpoints.response.MatriceResponse;
import fr.uga.miage.l3.models.MatriceDistanceEntity;
import fr.uga.miage.l3.models.domain.Matrice;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Set;

@Mapper(componentModel = "spring")
public interface MatriceMapper {

    @Mapping(source = "idCommandeDepart", target = "id.idCommandeDepart")
    @Mapping(source = "idCommandeArrivee", target = "id.idCommandeArrivee")
    MatriceDistanceEntity toEntity(Matrice matrice);

    @Mapping(source = "id.idCommandeDepart", target = "idCommandeDepart")
    @Mapping(source = "id.idCommandeArrivee", target = "idCommandeArrivee")
    Matrice toMatrice(MatriceDistanceEntity entity);

    Set<Matrice> toMatrices(Set<MatriceDistanceEntity> entities);

    @Mapping(source = "idCommandeDepart", target = "id.idCommandeDepart")
    @Mapping(source = "idCommandeArrivee", target = "id.idCommandeArrivee")
    MatriceResponse toResponse(Matrice matrice);

    Set<MatriceResponse> toResponses(Set<Matrice> matrices);
}