package fr.uga.miage.l3.services;

import fr.uga.miage.l3.component.MatriceComponent;
import fr.uga.miage.l3.endpoints.request.MatriceRequest;
import fr.uga.miage.l3.models.domain.Matrice;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MatriceService {

    private final MatriceComponent matriceComponent;

    public void saveMatrice(MatriceRequest request) {
        List<Long> ids = request.idsCommandes();
        List<List<Double>> durations = request.durations();

        List<Matrice> matricesDuDomaine = new ArrayList<>();

        for (int i = 0; i < ids.size(); i++) {
            for (int j = 0; j < ids.size(); j++) {

                if (i == j) continue;

                Matrice m = new Matrice(
                        ids.get(i),
                        ids.get(j),
                        durations.get(i).get(j)
                );

                matricesDuDomaine.add(m);
            }
        }

        matriceComponent.saveMatrices(matricesDuDomaine);
    }

    public Set<Matrice> getMatrices(List<Long> ListeId){
        return matriceComponent.getMatrices(ListeId);
    }
}