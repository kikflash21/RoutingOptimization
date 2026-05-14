package fr.uga.miage.l3.bootstrap;

import fr.uga.miage.l3.enums.Statut;
import fr.uga.miage.l3.models.AdresseEntity;
import fr.uga.miage.l3.models.ClientEntity;
import fr.uga.miage.l3.models.CommandeEntity;
import fr.uga.miage.l3.models.CommandeProduitEntity;
import fr.uga.miage.l3.models.Coordonnees;
import fr.uga.miage.l3.models.ProduitEntity;
import fr.uga.miage.l3.repository.AdresseRepository;
import fr.uga.miage.l3.repository.ClientRepository;
import fr.uga.miage.l3.repository.CommandeRepository;
import fr.uga.miage.l3.repository.ProduitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class SampleCommandesDataLoader implements CommandLineRunner {

    private static final int TARGET_COMMANDES = 400;
    private static final String DEFAULT_CITY = "Grenoble";
    private static final String DEFAULT_POSTCODE = "38000";
    private static final String VALIDATED_POINTS_RESOURCE = "datasets/validated_points.csv";
    private static final Pattern NUMBER_PREFIX_PATTERN = Pattern.compile("^\\s*(\\d+)[\\s,;-]+(.+)$");

    private final CommandeRepository commandeRepository;
    private final ClientRepository clientRepository;
    private final AdresseRepository adresseRepository;
    private final ProduitRepository produitRepository;

    @Override
    public void run(String... args) {
        int currentCount = commandeRepository.findAllByStatut(Statut.EN_COURS_DE_TRAITEMENT).size();
        if (currentCount >= TARGET_COMMANDES) {
            return;
        }

        ensureDepotAdresse();
        List<ProduitEntity> produits = ensureProduits();
        List<ValidatedPoint> validatedPoints = loadValidatedPoints();
        if (validatedPoints.isEmpty()) {
            throw new IllegalStateException("Aucun point valide charge depuis " + VALIDATED_POINTS_RESOURCE);
        }

        long nextCommandeId = nextCommandeId();
        long nextClientId = nextClientId();
        long nextAdresseId = nextAdresseId();
        long nextLigneCommandeId = nextLigneCommandeId();

        int toCreate = TARGET_COMMANDES - currentCount;
        Random random = new Random(42L);

        for (int i = 0; i < toCreate; i++) {
            ValidatedPoint point = validatedPoints.get(i % validatedPoints.size());
            AdresseEntity adresse = buildAdresseFromPoint(nextAdresseId++, point);
            adresseRepository.save(adresse);

            ClientEntity client = buildClient(nextClientId++, i, adresse);
            clientRepository.save(client);

            CommandeEntity commande = buildCommande(nextCommandeId++, client, adresse, random);

            ProduitEntity produit = produits.get(random.nextInt(produits.size()));
            CommandeProduitEntity ligne = CommandeProduitEntity.builder()
                    .id(nextLigneCommandeId++)
                    .commande(commande)
                    .produit(produit)
                    .quantite(1 + random.nextInt(3))
                    .optionMontage(random.nextBoolean())
                    .build();

            commande.setLigneCommandes(List.of(ligne));
            commandeRepository.save(commande);
        }
    }

    private void ensureDepotAdresse() {
        if (adresseRepository.findByEstDepotTrue().isPresent()) {
            return;
        }

        long depotId = nextAdresseId();
        AdresseEntity depot = AdresseEntity.builder()
                .id(depotId)
                .numeroRue(1)
                .rue("Avenue Centrale")
                .codePostale(DEFAULT_POSTCODE)
                .ville(DEFAULT_CITY)
                .estDepot(true)
                .coordonnees(new Coordonnees(45.188529, 5.724524))
                .build();
        adresseRepository.save(depot);
    }

    private List<ProduitEntity> ensureProduits() {
        List<ProduitEntity> existing = produitRepository.findAll();
        if (!existing.isEmpty()) {
            return existing;
        }

        List<ProduitEntity> defaults = List.of(
                ProduitEntity.builder().reference("P-100").nom("Table").prix(99.0f).poids(22.0f).stock(500).largeur(120f).hauteur(75f).tempsDeMontage(900).estMontable(true).build(),
                ProduitEntity.builder().reference("P-101").nom("Chaise").prix(35.0f).poids(7.0f).stock(500).largeur(45f).hauteur(90f).tempsDeMontage(300).estMontable(true).build(),
                ProduitEntity.builder().reference("P-102").nom("Canape").prix(499.0f).poids(55.0f).stock(200).largeur(210f).hauteur(80f).tempsDeMontage(1200).estMontable(true).build(),
                ProduitEntity.builder().reference("P-103").nom("Lampe").prix(25.0f).poids(2.0f).stock(800).largeur(25f).hauteur(45f).tempsDeMontage(120).estMontable(false).build(),
                ProduitEntity.builder().reference("P-104").nom("Commode").prix(220.0f).poids(40.0f).stock(300).largeur(100f).hauteur(85f).tempsDeMontage(1000).estMontable(true).build()
        );
        return produitRepository.saveAll(defaults);
    }

    private AdresseEntity buildAdresseFromPoint(long id, ValidatedPoint point) {
        int numeroRue = 1;
        String rue = point.name();
        Matcher matcher = NUMBER_PREFIX_PATTERN.matcher(point.name());
        if (matcher.matches()) {
            numeroRue = Integer.parseInt(matcher.group(1));
            rue = matcher.group(2);
        }

        return AdresseEntity.builder()
                .id(id)
                .numeroRue(numeroRue)
                .rue(rue)
                .codePostale(point.postCode().isBlank() ? DEFAULT_POSTCODE : point.postCode())
                .ville(point.city().isBlank() ? DEFAULT_CITY : point.city())
                .estDepot(false)
                .coordonnees(new Coordonnees(point.latitude(), point.longitude()))
                .build();
    }

    private List<ValidatedPoint> loadValidatedPoints() {
        InputStream inputStream = Thread.currentThread()
                .getContextClassLoader()
                .getResourceAsStream(VALIDATED_POINTS_RESOURCE);
        if (inputStream == null) {
            throw new IllegalStateException("Fichier introuvable: " + VALIDATED_POINTS_RESOURCE);
        }

        List<ValidatedPoint> points = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            boolean headerSkipped = false;
            while ((line = reader.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.isEmpty()) continue;
                if (!headerSkipped && trimmed.toLowerCase().startsWith("latitude;longitude;")) {
                    headerSkipped = true;
                    continue;
                }

                String[] parts = trimmed.split(";", -1);
                if (parts.length < 5) continue;

                try {
                    double latitude = Double.parseDouble(parts[0]);
                    double longitude = Double.parseDouble(parts[1]);
                    points.add(new ValidatedPoint(
                            latitude,
                            longitude,
                            parts[2].trim(),
                            parts[3].trim(),
                            parts[4].trim()
                    ));
                } catch (NumberFormatException ignored) {
                    // Ignore invalid line.
                }
            }
        } catch (IOException e) {
            throw new IllegalStateException("Erreur lecture " + VALIDATED_POINTS_RESOURCE, e);
        }
        return points;
    }

    private ClientEntity buildClient(long id, int index, AdresseEntity adresse) {
        ClientEntity client = new ClientEntity();
        client.setId(id);
        client.setNom("ClientNom" + (index + 1));
        client.setPrenom("ClientPrenom" + (index + 1));
        client.setNumeroTelephone(String.format("06%08d", (index + 1) % 100000000));
        client.setEmail("client" + (index + 1) + "@example.com");
        client.setAdresse(adresse);
        return client;
    }

    private CommandeEntity buildCommande(long id, ClientEntity client, AdresseEntity adresse, Random random) {
        CommandeEntity commande = new CommandeEntity();
        commande.setId(id);
        commande.setClient(client);
        commande.setAdresse(adresse);
        commande.setStatut(Statut.EN_COURS_DE_TRAITEMENT);
        commande.setDateCommande(LocalDateTime.now().minusDays(random.nextInt(15)).minusMinutes(random.nextInt(1440)));
        return commande;
    }

    private long nextCommandeId() {
        return commandeRepository.findAll().stream()
                .mapToLong(CommandeEntity::getId)
                .max()
                .orElse(0L) + 1;
    }

    private long nextClientId() {
        return clientRepository.findAll().stream()
                .mapToLong(ClientEntity::getId)
                .max()
                .orElse(0L) + 1;
    }

    private long nextAdresseId() {
        return adresseRepository.findAll().stream()
                .mapToLong(AdresseEntity::getId)
                .max()
                .orElse(0L) + 1;
    }

    private long nextLigneCommandeId() {
        return commandeRepository.findAll().stream()
                .flatMap(c -> c.getLigneCommandes() == null ? java.util.stream.Stream.empty() : c.getLigneCommandes().stream())
                .mapToLong(CommandeProduitEntity::getId)
                .max()
                .orElse(0L) + 1;
    }

    private record ValidatedPoint(
            double latitude,
            double longitude,
            String name,
            String postCode,
            String city
    ) {}
}
