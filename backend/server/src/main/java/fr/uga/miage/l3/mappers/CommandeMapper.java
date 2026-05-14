package fr.uga.miage.l3.mappers;
import fr.uga.miage.l3.endpoints.response.CommandProduitResponse;
import fr.uga.miage.l3.endpoints.response.CommandeResponse;
import fr.uga.miage.l3.models.AdresseEntity;
import fr.uga.miage.l3.models.CommandeEntity;
import fr.uga.miage.l3.models.domain.Commande;
import fr.uga.miage.l3.models.domain.CommandeProduit;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper
public interface CommandeMapper {

    CommandeResponse toResponse(Commande commande);

    @Mapping(target = "latitude", source = "adresse.coordonnees.latitude")
    @Mapping(target = "longitude", source = "adresse.coordonnees.longitude")
    @Mapping(target = "nomClient", source = "client.nom")
    @Mapping(target = "prenomClient", source = "client.prenom")
    @Mapping(target = "produits", source = "ligneCommandes")
    @Mapping(target = "adresseComplete", expression = "java(formatAdresse(entity.getAdresse()))")
    Commande toCommand(CommandeEntity entity);

    default String formatAdresse(AdresseEntity adresse) {
        if (adresse == null) return null;
        return String.format("%d %s, %s %s",
                adresse.getNumeroRue(),
                adresse.getRue(),
                adresse.getCodePostale(),
                adresse.getVille());
    }

    @Mapping(target = "nomProduit", source = "produit.nom")
    CommandProduitResponse toProduitResponse(CommandeProduit ligne);

    List<Commande> toCommands(List<CommandeEntity> entities);
    List<CommandeResponse> toResponses(List<Commande> commandes);
}
