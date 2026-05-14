package fr.uga.miage.l3.component;

import fr.uga.miage.l3.exceptions.technical.NotFoundEntrepotException;
import fr.uga.miage.l3.mappers.AdresseMapper;
import fr.uga.miage.l3.models.domain.Adresse;
import fr.uga.miage.l3.repository.AdresseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdresseComponent {
    private final AdresseRepository adresseRepository;
    private final AdresseMapper adresseMapper;

    public Adresse getEntrepot() throws NotFoundEntrepotException {
        return adresseMapper.toAdresse(adresseRepository
                .findByEstDepotTrue()
                .orElseThrow(() -> new NotFoundEntrepotException("Entrepot introuvable")));
    }

}
