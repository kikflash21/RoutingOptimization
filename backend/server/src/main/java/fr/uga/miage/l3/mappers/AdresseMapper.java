package fr.uga.miage.l3.mappers;

import fr.uga.miage.l3.endpoints.response.AdresseResponse;
import fr.uga.miage.l3.models.AdresseEntity;
import fr.uga.miage.l3.models.domain.Adresse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper
public interface AdresseMapper {

    @Mapping(target = "latitude", source = "coordonnees.latitude")
    @Mapping(target = "longitude", source = "coordonnees.longitude")
    AdresseResponse toResponse(Adresse addresse);

    Adresse toAdresse(AdresseEntity entity);


}
