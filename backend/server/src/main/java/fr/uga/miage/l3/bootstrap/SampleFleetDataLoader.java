package fr.uga.miage.l3.bootstrap;

import fr.uga.miage.l3.models.AdresseEntity;
import fr.uga.miage.l3.models.CamionEntity;
import fr.uga.miage.l3.models.Coordonnees;
import fr.uga.miage.l3.models.EquipeEntity;
import fr.uga.miage.l3.models.LivreurEntity;
import fr.uga.miage.l3.repository.AdresseRepository;
import fr.uga.miage.l3.repository.CamionRepository;
import fr.uga.miage.l3.repository.EquipeRepository;
import fr.uga.miage.l3.repository.LivreurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class SampleFleetDataLoader implements CommandLineRunner {

    private final CamionRepository camionRepository;
    private final LivreurRepository livreurRepository;
    private final AdresseRepository adresseRepository;
    private final EquipeRepository equipeRepository;

    @Override
    public void run(String... args) {
        seedCamions();
        seedLivreurs(12);
        seedEquipes();
    }

    private void seedEquipes() {
        // Ne pas recréer si des équipes existent déjà
        if (!equipeRepository.findAll().isEmpty()) return;

        List<CamionEntity> camions = camionRepository.findAll();
        List<LivreurEntity> livreurs = livreurRepository.findAll();
        if (camions.isEmpty() || livreurs.size() < 2) return;

        int count = Math.min(camions.size(), livreurs.size() / 2);

        for (int i = 0; i < count; i++) {
            CamionEntity camion = camions.get(i);
            if (camion.getEquipe() != null) continue;

            EquipeEntity equipe = EquipeEntity.builder()
                    .id((long) (i + 1))
                    .nom("Équipe " + (i + 1))
                    .build();
            equipe = equipeRepository.save(equipe);

            camion.setEquipe(equipe);
            camionRepository.save(camion);

            List<LivreurEntity> assigned = new ArrayList<>();
            for (int j = i * 2; j < i * 2 + 2 && j < livreurs.size(); j++) {
                LivreurEntity livreur = livreurs.get(j);
                if (livreur.getEquipe() == null) {
                    livreur.setEquipe(equipe);
                    assigned.add(livreurRepository.save(livreur));
                }
            }

            equipe.setLivreurs(assigned);
            equipe.setCamion(camion);
            equipeRepository.save(equipe);
        }
    }

    private void seedCamions() {
        List<CamionEntity> defaults = List.of(
                CamionEntity.builder().plaque("AA-101-AA").volume(20f).poidsMax(1200f).estDisponible(true).build(),
                CamionEntity.builder().plaque("AA-102-AA").volume(22f).poidsMax(1300f).estDisponible(true).build(),
                CamionEntity.builder().plaque("AA-103-AA").volume(24f).poidsMax(1400f).estDisponible(true).build(),
                CamionEntity.builder().plaque("AA-104-AA").volume(26f).poidsMax(1500f).estDisponible(true).build(),
                CamionEntity.builder().plaque("AA-105-AA").volume(28f).poidsMax(1600f).estDisponible(true).build(),
                CamionEntity.builder().plaque("AA-106-AA").volume(30f).poidsMax(1700f).estDisponible(true).build()
        );

        for (CamionEntity camion : defaults) {
            if (!camionRepository.existsById(camion.getPlaque())) {
                camionRepository.save(camion);
            }
        }
    }

    private void seedLivreurs(int targetCount) {
        int current = livreurRepository.findAll().size();
        if (current >= targetCount) return;

        long nextLivreurId = livreurRepository.findAll().stream().mapToLong(LivreurEntity::getId).max().orElse(0L) + 1;
        long nextAdresseId = adresseRepository.findAll().stream().mapToLong(AdresseEntity::getId).max().orElse(0L) + 1;

        for (int i = current; i < targetCount; i++) {
            AdresseEntity adresse = AdresseEntity.builder()
                    .id(nextAdresseId++)
                    .numeroRue(10 + i)
                    .rue("Rue des Livreurs")
                    .codePostale("38000")
                    .ville("Grenoble")
                    .estDepot(false)
                    .coordonnees(new Coordonnees(45.17 + (i * 0.001), 5.72 + (i * 0.001)))
                    .build();
            adresseRepository.save(adresse);

            LivreurEntity livreur = new LivreurEntity();
            livreur.setId(nextLivreurId++);
            livreur.setNom("LivreurNom" + (i + 1));
            livreur.setPrenom("LivreurPrenom" + (i + 1));
            livreur.setNumeroTelephone(String.format("07%08d", (i + 1)));
            livreur.setEmail("livreur" + (i + 1) + "@example.com");
            livreur.setAdresse(adresse);
            livreur.setEstDisponible(true);
            livreurRepository.save(livreur);
        }
    }
}

