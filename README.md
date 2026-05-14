# 🚛 Routing Optimization

**Optimisation des tournées de livraison à l’aide d’algorithmes de clustering (K-means & K-medoids) et de l’API OpenRouteService.**

---

## 📋 Objectif du Projet

L’objectif principal était d’améliorer les itinéraires de livraison en prenant en compte la gestion de la limitation API d’OpenRouteService (ORS). Le projet comprenait les tâches suivantes :

- Générer des jeux de données d'adresses (50, 100, 400 adresses).
- Regrouper intelligemment les adresses (clustering).
- Optimiser les tournées de livraison.
- Comparer les résultats entre deux algorithmes (K-means vs K-medoids).
- Respecter les limitations de l’API ORS pour des distances routières réalistes.

---

## 🛠️ Points Clés

1. **Récupération et préparation des données d'adresses :**
   - Génération des adresses via l’API data.gouv.
   - Parsing des fichiers CSV avec Papaparse pour transformer les données en adresses utilisables.
   - Génération d’une matrice de distances à l’aide de l’API ORS Matrix, stockée localement pour limiter les appels API et améliorer les performances.

2. **Gestion des limites de l’API OpenRouteService :**
   - Matrice découpée en blocs pris en charge par l’API (50×50 maximum).
   - Clustering des adresses pour les sous-problèmes.

3. **Recherche et comparaison des algorithmes de clustering :**
   - Implémentation et test de plusieurs algorithmes de regroupement, tels que **DBSCAN**, **K-means** et **K-medoids**.
   - Sélection de **K-means** pour sa simplicité et sa rapidité et de **K-medoids (PAM)** pour sa précision et son adéquation aux distances routières.

4. **Points forts de K-medoids par rapport à K-means :**
   - Centres toujours basés sur des points réels, meilleure gestion des distances routières.
   - Moins sensible à l'initialisation et plus adapté à notre problématique.
   - Coût en temps plus élevé mais précis grâce à l'utilisation des distances routières calculées par ORS.

5. **Calcul des clusters et optimisation des itinéraires :**
   - Calcul automatique du nombre de clusters basé sur le ratio des adresses et des véhicules disponibles.
   - Découpage intelligent des clusters supérieurs à 50 points pour optimiser les appels API.
   - Fusion finale des segments d’itinéraires pour fournir le meilleur résultat global.

---

## ⚙️ Modélisation et Fonctionnement

1. **Clustering des Adresses :**
   - Clustering par K-means et K-medoids.
   - Gestion adaptative pour ne pas dépasser les 45 adresses par cluster à cause des limitations du système.

2. **Optimisation des Tournées :**
   - Les tournées sont calculées pour chaque cluster via l’API ORS Directions.
   - Découpage optimisé des clusters trop larges pour respecter les limites API.

3. **Calculs des Métriques :**
   - Durée, nombre de stops, distance et appels API calculés pour chaque livrée.
   - Possibilité de générer des statistiques et de comparer les performances détaillées.

4. **Visualisation :**
   - Les résultats sont affichés de manière interactive avec des livreurs, arrêts, trajets et points sur une carte.
   - Possibilité de visualiser ou masquer certaines routes et marqueurs sur la carte.

---

## 📊 Comparatif des Algorithmes Implémentés

| Critère                | K-means                 | K-medoids                |
|------------------------|-------------------------|--------------------------|
| Centres calculés       | Points mathématiques    | Points réels             |
| Adapté à la distance ? | Moyennement             | Totalement               |
| Précision des résultats| Faible                  | Élevée                   |
| Temps de calcul        | Rapide                  | Plus long mais stable    |
| Stabilité              | Variable                | Haute                    |

---

## 📈 Ce que nous avons appris

1. Gérer les limitations d’API (ORS et quotas de requêtes).
2. Manipuler des matrices de distances pour résoudre des problèmes complexes.
3. Implémenter et évaluer des algorithmes de clustering (K-means & K-medoids).
4. Développer et optimiser des solutions prenant en compte les limites métier (comme le nombre de véhicules ou de stops).
5. Présenter une visualisation finale interactive (map + statistiques).

Projet réalisé par groupe 6 étudiants
