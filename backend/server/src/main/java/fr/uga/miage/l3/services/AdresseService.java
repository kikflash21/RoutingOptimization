package fr.uga.miage.l3.services;

import fr.uga.miage.l3.component.AdresseComponent;
import fr.uga.miage.l3.exceptions.rest.NotFoundEntrepotRestException;
import fr.uga.miage.l3.exceptions.technical.NotFoundEntrepotException;
import fr.uga.miage.l3.models.domain.Adresse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdresseService {
    private final AdresseComponent adresseComponent;

    public Adresse getEntrepot() {
        try {
            return adresseComponent.getEntrepot();
        } catch (NotFoundEntrepotException e) {
            throw new NotFoundEntrepotRestException(e.getMessage());
        }
    }
}
