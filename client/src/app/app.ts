// ═══════════════════════════════════════════════════════════════════
//  IMPORTS
// ═══════════════════════════════════════════════════════════════════

import { Component, computed, HostListener, inject, signal, Signal } from '@angular/core';
import { LeafletModule } from '@bluehalo/ngx-leaflet';
import { LatLngTuple, Layer, MapOptions, polyline } from 'leaflet';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, PercentPipe } from '@angular/common';

import { CommandeResponse } from './data/commande';
import { EntrepotResponse } from './data/entrepot';
import { MatrixResponse } from './data/adresse';
import { CamionResponse } from './data/camion';
import { EquipeResponse } from './data/equipe';
import { LivreurResponse } from './data/livreur';
import { TourneeResponse } from './data/tournee';

import { GlobalOptimizationResult } from './services/OptimizationService';
import { OptimizationResult } from './services/OptimizationResult';
import { Clusterer } from 'k-medoids';
import { kmeans } from 'ml-kmeans';
import haversineDistance from 'haversine-distance';
import { Cluster } from './services/ClusteringService';
import { Carto } from './services/carto';
import { CostService, TripCost } from './services/CostService';
import { MatriceStorageService } from './services/MatriceStorageService';
import { GreedyService, GreedyClusterResult } from './services/GreedyService';
import { getCrossMarker, getDepotMarker, getMarker } from './utils/marker';
//import { orsKey } from './services/orsKey';
import { environment } from '../environments/environment';

import {
  AlgorithmType,
  ALGORITHM_LABELS,
  ALL_ALGORITHMS,
  isGreedyFamily,
  WizardStep,
  WIZARD_STEPS,
  WIZARD_STEPS_META,
  WizardStepMeta,
  AlgoComparison,
  EditableCluster,
  AssignedStats,
} from './models/algorithm.types';

import {
  ORS_MATRIX_CHUNK_SIZE,
  ORS_MATRIX_DELAY_MS,
  ORS_MATRIX_MAX_RETRIES,
  ORS_OPTIMIZATION_MAX_JOBS,
  MAP_OPTIONS,
  BASE_TILE_LAYER,
  CLUSTER_COLORS,
  COLOR_DEPOT,
  COLOR_UNASSIGNED,
  COLOR_NEUTRAL,
  STAT_COLOR_EXCELLENT,
  STAT_COLOR_GOOD,
  STAT_COLOR_WARNING,
  STAT_COLOR_DANGER,
  STAT_THRESHOLD_EXCELLENT,
  STAT_THRESHOLD_GOOD,
  STAT_THRESHOLD_WARNING,
  DEFAULT_MAX_TIME_SECONDS,
  COMMANDES_PAGE_SIZE,
} from './models/constants';

// Re-export for template usage
export { AlgorithmType, ALGORITHM_LABELS };

// ═══════════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════════

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, LeafletModule, DecimalPipe, PercentPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {

  // ─── SERVICES ────────────────────────────────────────────────────

  private readonly _srvCarto       = inject(Carto);
  private readonly _srvCost        = inject(CostService);
  private readonly _srvMatrixCache = inject(MatriceStorageService);
  private readonly _srvGreedy      = inject(GreedyService);

  // ─── ENUM ACCESS FOR TEMPLATE ───────────────────────────────────

  protected readonly AlgorithmType = AlgorithmType;

  // ─── WIZARD ──────────────────────────────────────────────────────

  protected readonly wizardStep      = signal<WizardStep>('configuration');
  protected readonly wizardSteps     = WIZARD_STEPS_META;
  protected readonly loading         = signal(false);
  protected readonly loadingMessage  = signal('');

  // ─── STATE: DOMAIN DATA ──────────────────────────────────────────

  protected readonly _tournees           = signal<TourneeResponse[]>([]);
  protected readonly _commandes          = signal<readonly CommandeResponse[]>([]);
  protected readonly _entrepot           = signal<EntrepotResponse | null>(null);
  protected readonly _matrixResponse     = signal<MatrixResponse | undefined>(undefined);
  protected readonly _matrixIds          = signal<number[]>([]);
  protected readonly _selectedCommandes  = signal<Set<number>>(new Set());
  protected readonly _commandesCache     = signal<Map<number, CommandeResponse>>(new Map());

  protected readonly _camions            = signal<CamionResponse[]>([]);
  protected readonly _livreurs           = signal<LivreurResponse[]>([]);
  protected readonly _equipes            = signal<EquipeResponse[]>([]);
  protected readonly _selectedEquipeIds  = signal<Set<number>>(new Set());

  // ─── STATE: OPTIMIZATION RESULTS ─────────────────────────────────

  protected readonly _globalOptimizationResult = signal<GlobalOptimizationResult | undefined>(undefined);
  protected readonly algoComparisons           = signal<AlgoComparison[]>([]);
  protected readonly selectedAlgos             = signal<Set<AlgorithmType>>(new Set(ALL_ALGORITHMS));
  protected readonly activeResultView          = signal<AlgorithmType>(AlgorithmType.KMedoids);

  // ─── STATE: MAP & VISU ───────────────────────────────────────────

  private readonly _visibleDeliveryPersons = signal<Set<number>>(new Set());
  public readonly _showMarkers             = signal<boolean>(true);
  protected readonly showMap               = signal(false);
  protected readonly showResultMap         = signal(true);

  // ─── STATE: COST PARAMS ──────────────────────────────────────────

  protected readonly costParams = signal(this._srvCost.getDefaultParams());

  // ─── STATE: MATRIX CACHE ─────────────────────────────────────────

  protected readonly matrixCached = signal(false);

  // ─── STATE: TOURNEE EDITING (legacy) ─────────────────────────────

  protected readonly editingTourneeId    = signal<number | null>(null);
  protected readonly editingCommandeIds  = signal<number[]>([]);

  // ─── STATE: EDITABLE CLUSTERS ────────────────────────────────────

  protected readonly _editableClusters      = signal<EditableCluster[] | null>(null);
  protected readonly _editingClusterIdx     = signal<number | null>(null);
  protected readonly _editingClusterDirty   = signal(false);
  protected readonly _editingClusterRoute   = signal<ReadonlyArray<LatLngTuple> | null>(null);

  // ─── STATE: COMPARE MODE (drag-scroll) ───────────────────────────

  protected readonly _compareMode = signal(false);
  private _dragScrollEl: HTMLElement | null = null;
  private _dragStartX = 0;
  private _dragStartScroll = 0;
  private _isDragging = false;

  // ─── STATE: UI / PAGINATION ──────────────────────────────────────

  readonly searchQuery   = signal('');
  readonly statutFilter  = signal('');
  readonly currentPage   = signal(0);
  readonly maxTimeValue  = signal(DEFAULT_MAX_TIME_SECONDS);
  readonly showCompareModal = signal(false);
  readonly pageSize      = COMMANDES_PAGE_SIZE;

  // ─── CANCEL MECHANISM ────────────────────────────────────────────

  private _cancelled = false;

  // ─── MAP OPTIONS ─────────────────────────────────────────────────

  protected readonly options: MapOptions = MAP_OPTIONS;

  // ─── COMPUTED: MAP LAYERS ────────────────────────────────────────

  protected readonly layers: Signal<Layer[]>;

  // ─── COMPUTED: PAGINATION ────────────────────────────────────────

  readonly filteredCommandes = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const s = this.statutFilter();
    return this._commandes().filter(cmd => {
      const matchSearch = !q
        || `${cmd.prenomClient} ${cmd.nomClient}`.toLowerCase().includes(q)
        || cmd.adresseComplete?.toLowerCase().includes(q);
      const matchStatut = !s || cmd.statut === s;
      return matchSearch && matchStatut;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredCommandes().length / this.pageSize)),
  );

  readonly paginatedCommandes = computed(() => {
    const page = Math.min(this.currentPage(), this.totalPages() - 1);
    return this.filteredCommandes().slice(page * this.pageSize, (page + 1) * this.pageSize);
  });

  // ─── TEMPLATE-BOUND HELPERS ──────────────────────────────────────

  protected readonly reduceDist = (sum: number, c: TripCost) => sum + c.distanceKm;
  protected readonly reduceFuel = (sum: number, c: TripCost) => sum + c.fuelLiters;

  // ═══════════════════════════════════════════════════════════════════
  //  CONSTRUCTOR
  // ═══════════════════════════════════════════════════════════════════

  constructor() {
    this.layers = computed<Layer[]>(() => this.computeLayers());

    this.refreshCommandes();
    this.refreshRessources();
    this.refreshTournees();
    this.getEntrepot()
      .then(e => this._entrepot.set(e))
      .catch(err => console.error('Erreur chargement entrepôt:', err));
  }

  // ═══════════════════════════════════════════════════════════════════
  //  MAP LAYER COMPUTATION
  // ═══════════════════════════════════════════════════════════════════

  private computeLayers(): Layer[] {
    const editingIdx = this._editingClusterIdx();
    const editableClusters = this._editableClusters();
    const selectedIds = this._selectedCommandes();
    const allCmds = this._commandes();
    const depot = this._entrepot();

    const depotMarker: Layer[] = this.buildDepotMarker(depot);

    // Cluster edit mode: all markers clickable
    if (editingIdx !== null && editableClusters) {
      return this.buildEditModeLayersForCluster(editingIdx, editableClusters, allCmds, selectedIds, depotMarker);
    }

    // Normal mode
    return this.buildNormalModeLayers(editableClusters, allCmds, selectedIds, depot, depotMarker);
  }

  private buildDepotMarker(depot: EntrepotResponse | null): Layer[] {
    if (!depot || depot.latitude == null || depot.longitude == null) return [];
    return [getDepotMarker({ lat: depot.latitude, lng: depot.longitude }, COLOR_DEPOT)];
  }

  private buildEditModeLayersForCluster(
    editingIdx: number,
    editableClusters: EditableCluster[],
    allCmds: readonly CommandeResponse[],
    selectedIds: Set<number>,
    depotMarker: Layer[],
  ): Layer[] {
    const assignedToEditing = new Set(editableClusters[editingIdx]?.commandeIds ?? []);
    const assignedToOthers = new Map<number, number>();
    editableClusters.forEach((cl, i) => {
      if (i !== editingIdx) cl.commandeIds.forEach(id => assignedToOthers.set(id, i));
    });

    const markers: Layer[] = this._showMarkers()
      ? allCmds
          .filter(c => selectedIds.has(c.id))
          .map(c => {
            let color: string;
            let tooltip: string;
            if (assignedToEditing.has(c.id)) {
              color = this.getClusterColor(editingIdx);
              tooltip = '✕ Retirer de cette tournée';
            } else if (assignedToOthers.has(c.id)) {
              color = this.getClusterColor(assignedToOthers.get(c.id)!);
              tooltip = '→ Déplacer vers cette tournée';
            } else {
              color = COLOR_UNASSIGNED;
              tooltip = '+ Ajouter à cette tournée';
            }
            const m = assignedToEditing.has(c.id) || assignedToOthers.has(c.id)
              ? getMarker({ lat: c.latitude, lng: c.longitude }, color, true)
              : getCrossMarker({ lat: c.latitude, lng: c.longitude }, COLOR_UNASSIGNED);
            m.bindTooltip(tooltip, { permanent: false, direction: 'top', className: 'map-cmd-tooltip' });
            m.on('click', () => this.onMapCommandeClick(c.id));
            return m;
          })
      : [];

    const editRoute = this._editingClusterRoute();
    const editRouteLayers: Layer[] = editRoute && editRoute.length > 0
      ? [polyline([...editRoute], { color: this.getClusterColor(editingIdx), weight: 5, opacity: .9 })]
      : [];

    return [BASE_TILE_LAYER, ...editRouteLayers, ...markers, ...depotMarker];
  }

  private buildNormalModeLayers(
    editableClusters: EditableCluster[] | null,
    allCmds: readonly CommandeResponse[],
    selectedIds: Set<number>,
    depot: EntrepotResponse | null,
    depotMarker: Layer[],
  ): Layer[] {
    const activeView = this.activeResultView();

    const assignedIds = new Set<number>();
    if (editableClusters) {
      editableClusters.forEach(cl => cl.commandeIds.forEach(id => assignedIds.add(id)));
    }

    const commandeMarkers: Layer[] = this._showMarkers()
      ? allCmds
          .filter(c => selectedIds.has(c.id))
          .map(c => {
            const isAssigned = assignedIds.size === 0 || assignedIds.has(c.id);
            return isAssigned
              ? getMarker({ lat: c.latitude, lng: c.longitude }, COLOR_NEUTRAL)
              : getCrossMarker({ lat: c.latitude, lng: c.longitude }, COLOR_UNASSIGNED);
          })
      : [];

    const routeLayers = this.buildRouteLayers(activeView, depot);

    return [BASE_TILE_LAYER, ...routeLayers, ...commandeMarkers, ...depotMarker];
  }

  private buildRouteLayers(activeView: AlgorithmType, depot: EntrepotResponse | null): Layer[] {
    if (isGreedyFamily(activeView)) {
      return this.buildGreedyRouteLayers(activeView, depot);
    }
    return this.buildOptimizedRouteLayers();
  }

  private buildGreedyRouteLayers(activeView: AlgorithmType, depot: EntrepotResponse | null): Layer[] {
    const comp = this.algoComparisons().find(c => c.type === activeView);
    if (!comp) return [];

    const visible = this._visibleDeliveryPersons();
    const isVisible = (idx: number) => visible.has(idx + 1);

    if (comp.greedyRoutes && comp.greedyRoutes.length > 0) {
      return comp.greedyRoutes
        .map((route, idx) => ({ route, idx }))
        .filter(({ idx }) => isVisible(idx))
        .map(({ route, idx }) =>
          polyline([...route], { color: this.getClusterColor(idx), weight: 4 }),
        );
    }

    if (comp.greedyResult) {
      return comp.greedyResult
        .map((cr, idx) => ({ cr, idx }))
        .filter(({ idx }) => isVisible(idx))
        .map(({ cr, idx }) => {
          const points = this.buildGreedyPolylinePoints(cr, depot);
          return polyline(points, { color: this.getClusterColor(idx), weight: 4 });
        });
    }

    return [];
  }

  private buildOptimizedRouteLayers(): Layer[] {
    const visibleRoutes = this.getVisibleRoutes();
    return visibleRoutes.map(r =>
      polyline([...r.route], { color: this.getClusterColor(r.deliveryPerson), weight: 4 }),
    );
  }

  private buildGreedyPolylinePoints(cr: GreedyClusterResult, depot: EntrepotResponse | null): LatLngTuple[] {
    const points: LatLngTuple[] = cr.route.orderedAddresses.map(a => [a.latitude, a.longitude] as LatLngTuple);
    if (depot && points.length > 0) {
      points.unshift([depot.latitude, depot.longitude]);
      points.push([depot.latitude, depot.longitude]);
    }
    return points;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  WIZARD NAVIGATION
  // ═══════════════════════════════════════════════════════════════════

  @HostListener('document:keydown.enter', ['$event'])
  protected onEnterKey(event: Event): void {
    if (this.loading()) return;
    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    event.preventDefault();
    this.nextStep();
  }

  @HostListener('document:keydown.delete', ['$event'])
  @HostListener('document:keydown.backspace', ['$event'])
  protected onDeleteKey(event: Event): void {
    if (this.loading()) return;
    const tag = (event.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    event.preventDefault();
    this.prevStep();
  }

  protected goToStep(step: WizardStep): void {
    this.wizardStep.set(step);
  }

  protected nextStep(): void {
    const idx = WIZARD_STEPS.indexOf(this.wizardStep());
    if (idx >= WIZARD_STEPS.length - 1) return;

    if (this.wizardStep() === 'configuration') {
      this.launchOptimization();
      return;
    }

    this.wizardStep.set(WIZARD_STEPS[idx + 1]);
  }

  protected prevStep(): void {
    const idx = WIZARD_STEPS.indexOf(this.wizardStep());
    if (idx > 0) this.wizardStep.set(WIZARD_STEPS[idx - 1]);
  }

  protected getStepIndex(step: WizardStep): number {
    return WIZARD_STEPS.indexOf(step);
  }

  protected isStepCompleted(step: WizardStep): boolean {
    switch (step) {
      case 'configuration': return this.algoComparisons().length > 0;
      case 'resultats':     return this._globalOptimizationResult() !== undefined;
      case 'tournees':      return this._tournees().length > 0;
      default:              return false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  TOURNÉES CRUD
  // ═══════════════════════════════════════════════════════════════════

  protected async refreshTournees(): Promise<void> {
    try {
      const response = await fetch('/api/tournee');
      if (!response.ok) throw new Error('Erreur serveur');
      const data: TourneeResponse[] = await response.json();
      this._tournees.set(data);

      const allCmdIds = new Set<number>();
      data.forEach(t => t.commandeIdsOrdonnees?.forEach(id => allCmdIds.add(id)));

      if (allCmdIds.size > 0) {
        const idsParam = Array.from(allCmdIds).join(',');
        const cmdResp = await fetch(`/api/commande/batch?ids=${encodeURIComponent(idsParam)}`);
        if (cmdResp.ok) {
          const cmds: CommandeResponse[] = await cmdResp.json();
          const map = new Map(this._commandesCache());
          cmds.forEach(c => map.set(c.id, c));
          this._commandesCache.set(map);
        }
      }
    } catch (error) {
      console.error('Erreur chargement tournées:', error);
    }
  }

  protected getCommandeDetails(id: number): CommandeResponse | undefined {
    return this._commandesCache().get(id) || this._commandes().find(c => c.id === id);
  }

  protected async deleteExistingTournee(id: number): Promise<void> {
    if (!confirm('Voulez-vous vraiment supprimer cette tournée ?')) return;
    try {
      const response = await fetch(`/api/tournee/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Erreur serveur (${response.status}) ${errBody}`);
      }
      this._tournees.update(tournees => tournees.filter(t => t.id !== id));
    } catch (error) {
      console.error('Erreur suppression tournée:', error);
      alert('Erreur lors de la suppression de la tournée.');
    }
  }

  protected async deleteAllTournees(): Promise<void> {
    const tournees = this._tournees();
    if (tournees.length === 0) return;
    if (!confirm(`Supprimer toutes les ${tournees.length} tournées ?`)) return;
    this.loading.set(true);
    this.loadingMessage.set('Suppression en cours...');
    try {
      for (const t of tournees) {
        const res = await fetch(`/api/tournee/${t.id}`, { method: 'DELETE' });
        if (!res.ok) console.warn(`Erreur suppression tournée ${t.id}`);
      }
      this._tournees.set([]);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la suppression.');
    } finally {
      this.loading.set(false);
      this.loadingMessage.set('');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  COMMANDES
  // ═══════════════════════════════════════════════════════════════════

  protected async refreshCommandes(): Promise<void> {
    try {
      const response = await fetch('/api/commande/statut/EN_COURS_DE_TRAITEMENT');
      if (!response.ok) throw new Error('Erreur serveur');
      const data: CommandeResponse[] = await response.json();
      this._commandes.set(data);
      this._selectedCommandes.set(new Set(data.map(c => c.id)));
      this.invalidateMatrixState();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement des commandes.');
    }
  }

  protected quickSelectCommandes(count: number): void {
    const cmds = this._commandes();
    const ids = cmds.slice(0, Math.min(count, cmds.length)).map(c => c.id);
    this._selectedCommandes.set(new Set(ids));
    this.invalidateMatrixState();
  }

  protected async getEntrepot(): Promise<EntrepotResponse> {
    const response = await fetch('/api/adresse/entrepot');
    if (!response.ok) throw new Error('Erreur serveur');
    return await response.json();
  }

  // ═══════════════════════════════════════════════════════════════════
  //  RESOURCES (CAMIONS / LIVREURS / EQUIPES)
  // ═══════════════════════════════════════════════════════════════════

  protected async refreshRessources(): Promise<void> {
    try {
      const [camionsRes, livreursRes, equipesRes] = await Promise.all([
        fetch('/api/camion'),
        fetch('/api/livreur'),
        fetch('/api/equipe'),
      ]);
      if (!camionsRes.ok || !livreursRes.ok || !equipesRes.ok) {
        throw new Error('Erreur chargement ressources');
      }
      this._camions.set(await camionsRes.json());
      this._livreurs.set(await livreursRes.json());
      this._equipes.set(await equipesRes.json());
    } catch (error) {
      console.error('Erreur chargement ressources:', error);
      alert('Erreur lors du chargement camions/livreurs/equipes.');
    }
  }

  protected getCamionDetails(plaque?: string | null): CamionResponse | undefined {
    if (!plaque) return undefined;
    return this._camions().find(c => c.plaque === plaque);
  }

  protected getAssignedLivreurIds(): Set<number> {
    const assigned = new Set<number>();
    for (const equipe of this._equipes()) {
      for (const id of equipe.livreurIds ?? []) {
        assigned.add(id);
      }
    }
    return assigned;
  }

  protected isLivreurAlreadyAssigned(livreurId: number): boolean {
    return this.getAssignedLivreurIds().has(livreurId);
  }

  protected getAssignedEquipeNameForLivreur(livreurId: number): string | undefined {
    const equipe = this._equipes().find(e => (e.livreurIds ?? []).includes(livreurId));
    return equipe?.nom;
  }

  protected toggleEquipeSelection(id: number): void {
    this._selectedEquipeIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  protected isEquipeSelected(id: number): boolean {
    return this._selectedEquipeIds().has(id);
  }

  protected getSelectedEquipesOrdered(): EquipeResponse[] {
    const selected = this._selectedEquipeIds();
    return this._equipes().filter(e => selected.has(e.id));
  }

  protected getEquipeForCluster(clusterIndex: number): EquipeResponse | undefined {
    return this.getSelectedEquipesOrdered()[clusterIndex];
  }

  protected getLivreurNamesForEquipe(equipe?: EquipeResponse): string {
    if (!equipe || !equipe.livreurIds || equipe.livreurIds.length === 0) return '-';
    const byId = new Map(this._livreurs().map(l => [l.id, `${l.prenom} ${l.nom}`]));
    return equipe.livreurIds.map(id => byId.get(id) ?? `#${id}`).join(', ');
  }

  protected getLivreurById(livreurId: number): LivreurResponse | undefined {
    return this._livreurs().find(l => l.id === livreurId);
  }

  protected isEquipeOperational(equipe: EquipeResponse): boolean {
    const camion = this.getCamionDetails(equipe.camionPlaque);
    if (!camion || !camion.estDisponible) return false;
    for (const livreurId of equipe.livreurIds ?? []) {
      const livreur = this.getLivreurById(livreurId);
      if (!livreur || !livreur.estDisponible) return false;
    }
    return true;
  }

  private validateSelectedEquipesAvailability(): boolean {
    const selectedEquipes = this.getSelectedEquipesOrdered();
    const invalidTeams = selectedEquipes.filter(e => !this.isEquipeOperational(e));
    if (invalidTeams.length === 0) return true;
    const invalidNames = invalidTeams.map(e => e.nom).join(', ');
    alert(`Impossible de générer la matrice: équipes indisponibles (${invalidNames}). Vérifie la disponibilité des camions et livreurs.`);
    return false;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  MATRICE
  // ═══════════════════════════════════════════════════════════════════

  protected async generateMatrix(): Promise<void> {
    if (!this.validateSelectedEquipesAvailability()) return;

    const allCmds = this._commandes();
    const selectedIds = Array.from(this._selectedCommandes());
    const cmdsToUse = selectedIds.length > 0 ? allCmds.filter(c => selectedIds.includes(c.id)) : [...allCmds];

    if (cmdsToUse.length === 0) { alert('Aucune commande sélectionnée ou disponible'); return; }

    const ids = cmdsToUse.map(c => c.id);

    // Try cache first (local then shared backend cache)
    const cached = await this._srvMatrixCache.loadShared(ids);
    if (cached) {
      this.applyCachedMatrix(cached.matrix, ids, cmdsToUse);
      this.matrixCached.set(true);
      return;
    }

    const locations = cmdsToUse.map(c => [c.longitude, c.latitude] as [number, number]);

    try {
      this.loading.set(true);
      this.loadingMessage.set('Génération de la matrice de distances...');

      const fullMatrix = await this.fetchFullMatrix(locations);

      const matrix = this.buildMatrixResponse(fullMatrix, locations);
      this._matrixResponse.set(matrix);
      this._matrixIds.set(ids);
      this._srvMatrixCache.save(ids, fullMatrix);
      this.matrixCached.set(true);
    } catch (e) {
      if (e instanceof Error && e.message === '__CANCELLED__') {
        console.log('Matrix generation cancelled');
        return;
      }
      console.error('Erreur matrice:', e);
      alert('Erreur lors de la génération de la matrice.');
    } finally {
      this.loading.set(false);
      this.loadingMessage.set('');
    }
  }

  private async fetchFullMatrix(locations: [number, number][]): Promise<number[][]> {
    const n = locations.length;
    const fullMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

    const chunks = this.buildChunkIndices(n, ORS_MATRIX_CHUNK_SIZE);

    let callCount = 0;
    const totalCalls = chunks.length * chunks.length;
    this._cancelled = false;

    for (let ci = 0; ci < chunks.length; ci++) {
      for (let cj = 0; cj < chunks.length; cj++) {
        if (this._cancelled) throw new Error('__CANCELLED__');
        if (callCount > 0) {
          await new Promise(resolve => setTimeout(resolve, ORS_MATRIX_DELAY_MS));
        }
        callCount++;
        this.loadingMessage.set(`Matrice : appel ${callCount}/${totalCalls}...`);

        const sourcesGlobal = chunks[ci];
        const destinationsGlobal = chunks[cj];

        const body = { locations, metrics: ['duration'], sources: sourcesGlobal, destinations: destinationsGlobal };
        const result = await this.fetchMatrixChunkWithRetry(body, ci, cj);
        const subMatrix: number[][] = result.durations;

        for (let si = 0; si < sourcesGlobal.length; si++) {
          for (let dj = 0; dj < destinationsGlobal.length; dj++) {
            fullMatrix[sourcesGlobal[si]][destinationsGlobal[dj]] = subMatrix[si][dj];
          }
        }
      }
    }

    return fullMatrix;
  }

  private buildChunkIndices(n: number, chunkSize: number): number[][] {
    const chunks: number[][] = [];
    for (let i = 0; i < n; i += chunkSize) {
      chunks.push(
        Array.from({ length: Math.min(chunkSize, n - i) }, (_, j) => i + j),
      );
    }
    return chunks;
  }

  private buildMatrixResponse(fullMatrix: number[][], locations: [number, number][]): MatrixResponse {
    return {
      durations: fullMatrix,
      sources: locations.map(loc => ({ location: loc, snapped_distance: 0 })),
      destinations: locations.map(loc => ({ location: loc, snapped_distance: 0 })),
      metadata: {
        attribution: 'openrouteservice.org | OpenStreetMap contributors',
        service: 'matrix',
        timestamp: Date.now(),
        query: { locations, profile: 'driving-car', profileName: 'driving-car', responseType: 'json' },
        engine: { version: 'reconstructed', build_date: new Date().toISOString(), graph_date: new Date().toISOString(), osm_date: new Date().toISOString() },
      },
    };
  }

  private applyCachedMatrix(fullMatrix: number[][], ids: number[], cmdsToUse: readonly CommandeResponse[]): void {
    const locations = cmdsToUse.map(c => [c.longitude, c.latitude] as [number, number]);
    this._matrixResponse.set(this.buildMatrixResponse(fullMatrix, locations));
    this._matrixIds.set(ids);
  }

  protected clearMatrixCache(): void {
    this._srvMatrixCache.clearAll();
    this.matrixCached.set(false);
  }

  private invalidateMatrixState(): void {
    this._matrixResponse.set(undefined);
    this._matrixIds.set([]);
    this.matrixCached.set(this.hasCacheForCurrentCommandSelection());
    // Probe shared backend cache asynchronously so an identical matrix from another
    // browser session is detected without requiring the user to regenerate.
    void this.probeSharedMatrixCache();
  }

  protected hasCacheForCurrentCommandSelection(): boolean {
    const ids = this.getSelectedCommandIdsForMatrix();
    return ids.length > 0 && this._srvMatrixCache.load(ids) !== null;
  }

  private async probeSharedMatrixCache(): Promise<void> {
    const ids = this.getSelectedCommandIdsForMatrix();
    if (ids.length === 0 || this._srvMatrixCache.load(ids) !== null) return;
    const remote = await this._srvMatrixCache.loadShared(ids);
    if (remote && this.idsEqualCurrentSelection(ids)) {
      this.matrixCached.set(true);
    }
  }

  private idsEqualCurrentSelection(ids: number[]): boolean {
    const current = this.getSelectedCommandIdsForMatrix();
    if (current.length !== ids.length) return false;
    const a = [...current].sort((x, y) => x - y);
    const b = [...ids].sort((x, y) => x - y);
    return a.every((v, i) => v === b[i]);
  }

  private getSelectedCommandIdsForMatrix(): number[] {
    const selectedIds = this._selectedCommandes();
    const allCmds = this._commandes();
    const cmdsToUse = selectedIds.size > 0 ? allCmds.filter(c => selectedIds.has(c.id)) : [...allCmds];
    return cmdsToUse.map(c => c.id);
  }

  private async fetchMatrixChunkWithRetry(body: unknown, ci: number, cj: number): Promise<{ durations: number[][] }> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= ORS_MATRIX_MAX_RETRIES; attempt++) {
      try {
        const response = await fetch('https://api.openrouteservice.org/v2/matrix/driving-car', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: environment.orsKey },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`Erreur ORS: ${response.status} [chunk ${ci},${cj}]${errBody ? ` - ${errBody}` : ''}`);
        }
        return await response.json();
      } catch (error) {
        lastError = error;
        if (attempt >= ORS_MATRIX_MAX_RETRIES) break;
        const retryDelayMs = ORS_MATRIX_DELAY_MS * (attempt + 2);
        console.warn(`Retry chunk [${ci},${cj}] tentative ${attempt + 1}/${ORS_MATRIX_MAX_RETRIES} dans ${retryDelayMs}ms`, error);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      }
    }
    throw lastError instanceof Error ? lastError : new Error(`Echec ORS chunk [${ci},${cj}]`);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  LAUNCH (unified: matrix → algorithms)
  // ═══════════════════════════════════════════════════════════════════

  protected async launchOptimization(): Promise<void> {
    if (this._selectedCommandes().size === 0) { alert('Sélectionne au moins une commande.'); return; }
    if (this._selectedEquipeIds().size === 0) { alert('Sélectionne au moins une équipe.'); return; }
    if (this.selectedAlgos().size === 0) { alert('Sélectionne au moins un algorithme.'); return; }

    // Step 1: generate matrix (if not already done for these commands)
    await this.generateMatrix();
    if (!this._matrixResponse()) return; // generation failed or cancelled

    // Step 2: run algorithms
    this.algoComparisons.set([]);
    this._globalOptimizationResult.set(undefined);
    await this.runAlgorithms();
  }

  protected selectEquipesBySlider(count: number): void {
    const equipes = this._equipes().filter(e => this.isEquipeOperational(e));
    const ids = equipes.slice(0, Math.min(count, equipes.length)).map(e => e.id);
    this._selectedEquipeIds.set(new Set(ids));
  }

  protected getOperationalEquipeCount(): number {
    return this._equipes().filter(e => this.isEquipeOperational(e)).length;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  ALGORITHMS
  // ═══════════════════════════════════════════════════════════════════

  protected async runAlgorithms(): Promise<void> {
    const matrix = this._matrixResponse();
    const ids = this._matrixIds();
    const depot = this._entrepot();

    if (!matrix || !ids || ids.length === 0) { alert("Générez d'abord la matrice"); return; }
    if (!depot) { alert('Entrepôt non chargé'); return; }

    const teamCount = this._selectedEquipeIds().size;
    if (teamCount === 0) { alert('Sélectionne au moins une équipe.'); return; }

    const algos = this.selectedAlgos();
    const comparisons: AlgoComparison[] = [...this.algoComparisons()];

    this.loading.set(true);
    this._cancelled = false;

    try {
      for (const algo of ALL_ALGORITHMS) {
        if (!algos.has(algo) || comparisons.find(c => c.type === algo)) continue;
        if (this._cancelled) throw new Error('__CANCELLED__');

        const comparison = await this.executeAlgorithm(algo, teamCount, matrix, ids, depot);
        comparisons.push(comparison);
      }

      this.algoComparisons.set(comparisons);
      this.activateFirstResult(comparisons);
      this.buildEditableClusters();
      this.wizardStep.set('resultats');
    } catch (e) {
      if (e instanceof Error && e.message === '__CANCELLED__') {
        console.log('Algorithm execution cancelled');
        return;
      }
      console.error('Erreur algorithmes:', e);
      alert("Erreur lors de l'exécution des algorithmes.");
    } finally {
      this.loading.set(false);
      this.loadingMessage.set('');
    }
  }

  protected async runSingleAlgo(algoType: AlgorithmType): Promise<void> {
    if (this.isAlgoRan(algoType)) return;
    const matrix = this._matrixResponse();
    const ids = this._matrixIds();
    const depot = this._entrepot();
    if (!matrix || !ids || ids.length === 0 || !depot) return;

    const teamCount = this._selectedEquipeIds().size;
    if (teamCount === 0) { alert('Sélectionne au moins une équipe.'); return; }

    this.loading.set(true);
    this._cancelled = false;

    try {
      const comparison = await this.executeAlgorithm(algoType, teamCount, matrix, ids, depot);
      this.algoComparisons.update(arr => [...arr, comparison]);

      if (comparison.result) {
        this._globalOptimizationResult.set(comparison.result);
        this.showAllDeliveryPersons();
      } else if (comparison.greedyResult) {
        this._visibleDeliveryPersons.set(new Set(comparison.greedyResult.map((_, i) => i + 1)));
      }
      this.activeResultView.set(algoType);
      this.buildEditableClusters();
    } catch (e) {
      if (e instanceof Error && e.message === '__CANCELLED__') return;
      console.error('Erreur algo:', e);
      alert("Erreur lors de l'exécution.");
    } finally {
      this.loading.set(false);
      this.loadingMessage.set('');
    }
  }

  /**
   * Unified algorithm execution — dispatches to the right strategy by type.
   */
  private async executeAlgorithm(
    algo: AlgorithmType,
    teamCount: number,
    matrix: MatrixResponse,
    ids: number[],
    depot: EntrepotResponse,
  ): Promise<AlgoComparison> {
    switch (algo) {
      case AlgorithmType.KMedoids:
        return this.executeOptimizationAlgo(algo, () => this.runKmedoids(teamCount, this.maxTimeValue()));

      case AlgorithmType.KMeans:
        return this.executeOptimizationAlgo(algo, () => this.runKmeans(teamCount, this.maxTimeValue()));

      case AlgorithmType.Greedy:
        return this.executeGreedyAlgo(algo, teamCount, matrix, ids, depot, false);

      case AlgorithmType.TwoOpt:
        return this.executeGreedyAlgo(algo, teamCount, matrix, ids, depot, true);
    }
  }

  /** Execute a cluster+ORS optimization algo (K-Medoids or K-Means). */
  private async executeOptimizationAlgo(
    algo: AlgorithmType,
    runFn: () => Promise<GlobalOptimizationResult>,
  ): Promise<AlgoComparison> {
    this.loadingMessage.set(`Exécution ${ALGORITHM_LABELS[algo]}...`);
    const start = performance.now();
    const result = await runFn();
    const elapsed = performance.now() - start;
    const costs = result.clusterResults.map(cr =>
      this._srvCost.estimateTripCost(cr.totalDuration, cr.totalDistance)
    );
    return {
      name: ALGORITHM_LABELS[algo],
      type: algo,
      result,
      computeTimeMs: Math.round(elapsed),
      costs,
      totalCost: costs.reduce((s, c) => s + c.totalCost, 0),
    };
  }

  /** Execute a greedy-family algo (Greedy or 2-Opt). Uses K-Means geographic clustering. */
  private async executeGreedyAlgo(
    algo: AlgorithmType,
    teamCount: number,
    matrix: MatrixResponse,
    ids: number[],
    depot: EntrepotResponse,
    useTwoOpt: boolean,
  ): Promise<AlgoComparison> {
    this.loadingMessage.set(`Exécution ${ALGORITHM_LABELS[algo]}...`);
    const start = performance.now();
    const clusters = this.buildClustersKMeans(teamCount);
    const clusterParams = clusters.map(c => ({ id: c.id, adresses: c.adresses }));
    const depotCoords = { latitude: depot.latitude, longitude: depot.longitude };

    const greedyResult = useTwoOpt
      ? this._srvGreedy.solveWithTwoOpt(clusterParams, depotCoords, matrix.durations, ids, this.maxTimeValue())
      : this._srvGreedy.solveGreedy(clusterParams, depotCoords, matrix.durations, ids, this.maxTimeValue());

    this.loadingMessage.set(`Tracé des itinéraires ${ALGORITHM_LABELS[algo]} sur routes...`);
    const { routes: greedyRoutes, summaries } = await this.computeRoadFollowingRoutesWithSummary(greedyResult, depot);

    const elapsed = performance.now() - start;

    // Use real road distances/durations from ORS Directions for accurate cost
    const costs = greedyResult.map((cr, i) => {
      const summary = summaries[i];
      if (summary && summary.distance > 0) {
        return this._srvCost.estimateTripCost(summary.duration, summary.distance);
      }
      // Fallback: estimate from haversine if ORS failed
      const fallbackDuration = (cr.route.totalDistance / 1000 / 35) * 3600;
      return this._srvCost.estimateTripCost(fallbackDuration, cr.route.totalDistance);
    });

    return {
      name: ALGORITHM_LABELS[algo],
      type: algo,
      greedyResult,
      greedyRoutes,
      greedySummaries: summaries,
      computeTimeMs: Math.round(elapsed),
      costs,
      totalCost: costs.reduce((s, c) => s + c.totalCost, 0),
    };
  }

  /** Compute real road-following routes from ORS Directions for each greedy cluster, with distance/duration summaries. */
  private async computeRoadFollowingRoutesWithSummary(
    greedyResult: GreedyClusterResult[],
    depot: EntrepotResponse,
  ): Promise<{ routes: ReadonlyArray<LatLngTuple>[]; summaries: { duration: number; distance: number }[] }> {
    const routes: ReadonlyArray<LatLngTuple>[] = [];
    const summaries: { duration: number; distance: number }[] = [];
    for (const gr of greedyResult) {
      if (this._cancelled) break;
      if (gr.route.orderedAddresses.length === 0) {
        routes.push([]);
        summaries.push({ duration: 0, distance: 0 });
        continue;
      }

      const locs = this.buildDepotWrappedLocations(gr.route.orderedAddresses, depot);
      try {
        const result = await this._srvCarto.getDirectionsWithSummaryChunked(locs);
        routes.push(result.route);
        summaries.push({ duration: result.duration, distance: result.distance });
      } catch {
        // Fallback: straight-line trace
        routes.push(this.buildStraightLineFallback(gr.route.orderedAddresses, depot));
        summaries.push({ duration: 0, distance: 0 });
      }
    }
    return { routes, summaries };
  }

  /** Build [lng,lat] locations array starting and ending at depot. */
  private buildDepotWrappedLocations(
    addresses: readonly { longitude: number; latitude: number }[],
    depot: { longitude: number; latitude: number },
  ): [number, number][] {
    return [
      [depot.longitude, depot.latitude],
      ...addresses.map(a => [a.longitude, a.latitude] as [number, number]),
      [depot.longitude, depot.latitude],
    ];
  }

  /** Fallback straight lines when ORS Directions fails. */
  private buildStraightLineFallback(
    addresses: readonly { longitude: number; latitude: number }[],
    depot: { longitude: number; latitude: number },
  ): LatLngTuple[] {
    return [
      [depot.latitude, depot.longitude] as LatLngTuple,
      ...addresses.map(a => [a.latitude, a.longitude] as LatLngTuple),
      [depot.latitude, depot.longitude] as LatLngTuple,
    ];
  }

  private activateFirstResult(comparisons: AlgoComparison[]): void {
    const firstWithRoutes = comparisons.find(c => c.result);
    if (firstWithRoutes?.result) {
      this._globalOptimizationResult.set(firstWithRoutes.result);
      this.showAllDeliveryPersons();
      this.activeResultView.set(firstWithRoutes.type);
    } else if (comparisons.length > 0) {
      const first = comparisons[0];
      this.activeResultView.set(first.type);
      if (first.greedyResult) {
        this._visibleDeliveryPersons.set(new Set(first.greedyResult.map((_, i) => i + 1)));
      }
    }
  }

  // ─── CLUSTERING ──────────────────────────────────────────────────

  private buildClusters(nbVehicules: number): Cluster[] {
    const matrix = this._matrixResponse()!;
    const cmds = this._commandes();
    const ids = this._matrixIds();

    const elements = ids.map(id => {
      const c = cmds.find(x => x.id === id)!;
      return [c.longitude, c.latitude] as [number, number];
    });

    const distanceFn = (a: number[], b: number[]) => {
      const idxA = elements.findIndex(e => e[0] === a[0] && e[1] === a[1]);
      const idxB = elements.findIndex(e => e[0] === b[0] && e[1] === b[1]);
      return matrix.durations[idxA][idxB];
    };

    const clusterer = Clusterer.getInstance<number[]>(elements, nbVehicules, distanceFn);
    const clusteredPoints = clusterer.getClusteredData();

    const byCoordQueue = new Map<string, CommandeResponse[]>();
    for (const cmd of cmds) {
      const key = `${cmd.longitude.toFixed(7)}|${cmd.latitude.toFixed(7)}`;
      const queue = byCoordQueue.get(key);
      if (queue) queue.push(cmd);
      else byCoordQueue.set(key, [cmd]);
    }

    return clusteredPoints.map((points, idx) => {
      const clusterCmds = points.map(pt => {
        const key = `${pt[0].toFixed(7)}|${pt[1].toFixed(7)}`;
        const queue = byCoordQueue.get(key);
        return queue && queue.length > 0 ? queue.shift()! : undefined;
      }).filter((c): c is CommandeResponse => !!c);

      return {
        id: idx,
        adresses: clusterCmds.map(c => ({
          id: c.id,
          latitude: c.latitude,
          longitude: c.longitude,
          name: c.adresseComplete ?? '',
          postCode: '',
          city: '',
        })),
        center: { latitude: 0, longitude: 0 },
        size: clusterCmds.length,
      };
    });
  }

  private buildClustersKMeans(nbClusters: number): Cluster[] {
    // K-Means uses geographic (Haversine) distance via ml-kmeans library
    const cmds = this._commandes();
    const ids = this._matrixIds();
    const items = ids.map(id => {
      const c = cmds.find(x => x.id === id)!;
      return { lat: c.latitude, lng: c.longitude, cmd: c };
    });

    // Use haversine distance function for geographic clustering
    const geoDist = (p: number[], q: number[]): number =>
      haversineDistance({ latitude: p[0], longitude: p[1] }, { latitude: q[0], longitude: q[1] });

    const points = items.map(item => [item.lat, item.lng]);
    const result = kmeans(points, nbClusters, {
      initialization: 'kmeans++',
      distanceFunction: geoDist,
      maxIterations: 100,
    });

    return Array.from({ length: nbClusters }, (_, k) => {
      const clusterCmds = items.filter((_, i) => result.clusters[i] === k).map(item => item.cmd);
      const centroid = result.centroids[k] ?? [0, 0];
      return {
        id: k,
        adresses: clusterCmds.map(c => ({
          id: c.id,
          latitude: c.latitude,
          longitude: c.longitude,
          name: c.adresseComplete ?? '',
          postCode: '',
          city: '',
        })),
        center: { latitude: centroid[0], longitude: centroid[1] },
        size: clusterCmds.length,
      };
    });
  }

  // ─── ORS OPTIMIZATION ───────────────────────────────────────────

  private async runKmedoids(nbVehicules: number, maxTime: number): Promise<GlobalOptimizationResult> {
    const clusters = this.buildClusters(nbVehicules);
    const depot = this._entrepot()!;
    return this.optimizeFromClusters(clusters, { latitude: depot.latitude, longitude: depot.longitude }, maxTime);
  }

  private async runKmeans(nbVehicules: number, maxTime: number): Promise<GlobalOptimizationResult> {
    const clusters = this.buildClustersKMeans(nbVehicules);
    const depot = this._entrepot()!;
    return this.optimizeFromClusters(clusters, { latitude: depot.latitude, longitude: depot.longitude }, maxTime);
  }

  private async optimizeFromClusters(
    clusters: Cluster[],
    parking: { latitude: number; longitude: number },
    maxTime: number,
  ): Promise<GlobalOptimizationResult> {
    const clusterResults: GlobalOptimizationResult['clusterResults'] = [];
    let apiCallCount = 0;

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const subOptimizations: OptimizationResult[] = [];
      let routes: ReadonlyArray<ReadonlyArray<LatLngTuple>> = [];
      let remainingTime = maxTime;
      let realDuration = 0;
      let realDistance = 0;

      const adresseChunks = this.chunkArray(cluster.adresses, ORS_OPTIMIZATION_MAX_JOBS);

      for (const chunk of adresseChunks) {
        const optimizedChunks = await this.optimizeChunkWithFallback(chunk, parking, remainingTime);

        for (const optimization of optimizedChunks) {
          apiCallCount++;
          subOptimizations.push(optimization);

          // Use getDirectionsWithSummaryChunked to get real distance/duration
          for (const r of optimization.routes) {
            const locs = r.steps.map(s => s.location);
            try {
              const result = await this._srvCarto.getDirectionsWithSummaryChunked(locs);
              routes = [...routes, result.route];
              realDuration += result.duration;
              realDistance += result.distance;
            } catch {
              const fallback = locs.map(c => [c[1], c[0]] as LatLngTuple);
              routes = [...routes, fallback];
              // Fallback to VROOM duration
              realDuration += r.duration;
            }
          }

          const chunkDuration = optimization.routes.reduce((s, r) => s + r.duration, 0);
          remainingTime = Math.max(0, remainingTime - chunkDuration);
        }
      }

      clusterResults.push({
        deliveryPerson: i + 1,
        cluster,
        subOptimizations,
        routes,
        totalDuration: realDuration,
        totalDistance: realDistance,
        totalStops: 0,
      });
    }

    return { clusterResults, totalVehicles: clusters.length, totalAPIcalls: apiCallCount };
  }

  private async optimizeChunkWithFallback(
    adresses: readonly import('./data/adresse').Adresse[],
    parking: { latitude: number; longitude: number },
    maxTime: number,
  ): Promise<OptimizationResult[]> {
    try {
      const optimization = await this._srvCarto.optimize({
        nbVehicules: 1,
        maxTimePerVehicule: maxTime,
        adresses,
        parking: { id: 0, latitude: parking.latitude, longitude: parking.longitude, name: '', postCode: '', city: '' },
      });
      return [optimization];
    } catch (error: unknown) {
      const msg = String(
        (error as Record<string, unknown> & { error?: { error?: string } })?.error?.error
        ?? (error as { message?: string })?.message
        ?? '',
      );
      const status = (error as { status?: number })?.status;
      const mustSplit = msg.includes('Too many locations')
        || msg.includes('3500 routes')
        || status === 413
        || status === 500;

      if (!mustSplit || adresses.length <= 1) throw error;

      const mid = Math.ceil(adresses.length / 2);
      const left = adresses.slice(0, mid);
      const right = adresses.slice(mid);
      const leftOpts = await this.optimizeChunkWithFallback(left, parking, maxTime);
      const rightOpts = await this.optimizeChunkWithFallback(right, parking, maxTime);
      return [...leftOpts, ...rightOpts];
    }
  }

  private chunkArray<T>(arr: readonly T[], chunkSize: number): T[][] {
    if (arr.length <= chunkSize) return [[...arr]];
    const result: T[][] = [];
    const copy = [...arr];
    while (copy.length > 0) {
      result.push(copy.splice(0, chunkSize));
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  SAVE TOURNÉES
  // ═══════════════════════════════════════════════════════════════════

  protected async saveTournee(): Promise<void> {
    const clusters = this._editableClusters();
    if (!clusters || clusters.length === 0) {
      alert("Lancez d'abord un algorithme.");
      return;
    }
    const selectedEquipes = this.getSelectedEquipesOrdered();
    if (selectedEquipes.length === 0) {
      alert('Sélectionne des équipes avant de sauvegarder.');
      return;
    }
    if (selectedEquipes.length !== clusters.length) {
      alert(`Il faut ${clusters.length} équipe(s) sélectionnée(s) — une par tournée.`);
      return;
    }

    this.loading.set(true);
    this.loadingMessage.set('Sauvegarde des tournées...');

    try {
      for (let i = 0; i < clusters.length; i++) {
        const cluster = clusters[i];
        const equipe = selectedEquipes[i];
        const commandeIds = cluster.commandeIds.filter(id => typeof id === 'number' && !isNaN(id));
        if (commandeIds.length === 0) {
          throw new Error(`Aucune commande valide pour le cluster ${i + 1}.`);
        }
        const request = { commandeIds, duree: cluster.duree, equipeId: equipe.id };
        const response = await fetch('/api/tournee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        });
        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`Erreur serveur (${response.status})${errBody ? ` - ${errBody}` : ''}`);
        }
      }
      await this.refreshTournees();
      this.wizardStep.set('tournees');
    } catch (e) {
      console.error('Erreur sauvegarde:', e);
      alert('Erreur lors de la sauvegarde des tournées.');
    } finally {
      this.loading.set(false);
      this.loadingMessage.set('');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  TOURNÉE EDITING (legacy)
  // ═══════════════════════════════════════════════════════════════════

  protected startEditTournee(tournee: TourneeResponse): void {
    this.editingTourneeId.set(tournee.id);
    this.editingCommandeIds.set([...(tournee.commandeIdsOrdonnees || [])]);
  }

  protected cancelEditTournee(): void {
    this.editingTourneeId.set(null);
    this.editingCommandeIds.set([]);
  }

  protected moveCommandeUp(index: number): void {
    if (index <= 0) return;
    this.editingCommandeIds.update(ids => {
      const arr = [...ids];
      [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
      return arr;
    });
  }

  protected moveCommandeDown(index: number): void {
    this.editingCommandeIds.update(ids => {
      if (index >= ids.length - 1) return ids;
      const arr = [...ids];
      [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
      return arr;
    });
  }

  protected removeCommandeFromEdit(index: number): void {
    this.editingCommandeIds.update(ids => ids.filter((_, i) => i !== index));
  }

  protected async saveEditTournee(): Promise<void> {
    const tourneeId = this.editingTourneeId();
    if (!tourneeId) return;

    const ids = this.editingCommandeIds();
    if (ids.length === 0) {
      alert('La tournée doit contenir au moins une commande.');
      return;
    }

    this.loading.set(true);
    this.loadingMessage.set('Mise à jour de la tournée...');

    try {
      const tournee = this._tournees().find(t => t.id === tourneeId);
      const request = {
        commandeIds: ids,
        duree: tournee?.dureeTotal ?? 0,
        equipeId: tournee?.equipeId ?? 0,
      };
      const response = await fetch(`/api/tournee/${tourneeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Erreur serveur (${response.status}) ${errBody}`);
      }
      this.cancelEditTournee();
      await this.refreshTournees();
    } catch (e) {
      console.error('Erreur mise à jour tournée:', e);
      alert('Erreur lors de la mise à jour.');
    } finally {
      this.loading.set(false);
      this.loadingMessage.set('');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  VISUALIZATION
  // ═══════════════════════════════════════════════════════════════════

  private getVisibleRoutes(): { route: ReadonlyArray<LatLngTuple>; deliveryPerson: number }[] {
    const result = this._globalOptimizationResult();
    const visible = this._visibleDeliveryPersons();
    if (!result) return [];
    return result.clusterResults
      .filter(cr => visible.has(cr.deliveryPerson))
      .flatMap(cr => cr.routes.map(r => ({ route: r, deliveryPerson: cr.deliveryPerson - 1 })));
  }

  protected showAllDeliveryPersons(): void {
    const res = this._globalOptimizationResult();
    if (res) this._visibleDeliveryPersons.set(new Set(res.clusterResults.map(cr => cr.deliveryPerson)));
  }

  protected toggleMarkers(): void { this._showMarkers.update(v => !v); }

  protected toggleAlgo(algo: AlgorithmType): void {
    this.selectedAlgos.update(set => {
      const next = new Set(set);
      if (next.has(algo)) next.delete(algo); else next.add(algo);
      return next;
    });
  }

  protected isAlgoSelected(algo: AlgorithmType): boolean {
    return this.selectedAlgos().has(algo);
  }

  protected isAlgoRan(algo: AlgorithmType): boolean {
    return this.algoComparisons().some(c => c.type === algo);
  }

  protected cancelOperation(): void {
    this._cancelled = true;
    this.loading.set(false);
    this.loadingMessage.set('');
  }

  protected switchResultTab(type: AlgorithmType): void {
    this.activeResultView.set(type);
    const comp = this.algoComparisons().find(c => c.type === type);
    if (comp?.result) {
      this._globalOptimizationResult.set(comp.result);
      this.showAllDeliveryPersons();
    } else if (isGreedyFamily(type) && comp?.greedyResult) {
      this._visibleDeliveryPersons.set(new Set(comp.greedyResult.map((_, i) => i + 1)));
    }
    this.buildEditableClusters();
  }

  protected async applyKmedoids(_nbVehicules: number, maxTime: number): Promise<void> {
    const teamCount = this._selectedEquipeIds().size;
    if (teamCount === 0) {
      alert("Sélectionne au moins une équipe pour l'optimisation.");
      return;
    }
    this.loading.set(true);
    this.loadingMessage.set('Clustering K-Medoids + optimisation des routes...');
    try {
      const result = await this.runKmedoids(teamCount, maxTime);
      this._globalOptimizationResult.set(result);
      this.showAllDeliveryPersons();
    } catch (e) {
      console.error('Erreur K-Medoids:', e);
      alert("Erreur lors de l'optimisation.");
    } finally {
      this.loading.set(false);
      this.loadingMessage.set('');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  //  EDITABLE CLUSTERS (résultats step)
  // ═══════════════════════════════════════════════════════════════════

  private buildEditableClusters(): void {
    const activeView = this.activeResultView();
    const comp = this.algoComparisons().find(c => c.type === activeView);
    if (!comp) { this._editableClusters.set(null); return; }

    let clusters: EditableCluster[];

    if (comp.editableClusters) {
      clusters = comp.editableClusters.map(ec => ({ ...ec, commandeIds: [...ec.commandeIds] }));
    } else if (comp.greedyResult) {
      clusters = comp.greedyResult.map((gr, i) => ({
        commandeIds: gr.route.orderedAddresses
          .map(a => a.id)
          .filter((id): id is number => id != null),
        duree: comp.greedySummaries?.[i]?.duration ?? 0,
      }));
    } else if (comp.result) {
      clusters = comp.result.clusterResults.map(cr => {
        const routedIds = this.extractRoutedCommandeIds(cr.subOptimizations);
        return {
          commandeIds: routedIds.length > 0
            ? routedIds
            : cr.cluster.adresses
                .map(a => a.id)
                .filter((id): id is number | undefined => id != null) as number[],
          duree: cr.totalDuration,
        };
      });
    } else {
      this._editableClusters.set(null);
      return;
    }

    this._editableClusters.set(clusters);
    this._editingClusterIdx.set(null);
  }

  /** Extract routed commande IDs from ORS optimization steps. */
  private extractRoutedCommandeIds(subOptimizations: OptimizationResult[]): number[] {
    const ids: number[] = [];
    for (const opt of subOptimizations) {
      for (const route of opt.routes) {
        for (const step of route.steps) {
          if (step.type === 'job' && typeof step.id === 'number') {
            ids.push(step.id);
          }
        }
      }
    }
    return ids;
  }

  protected startEditCluster(idx: number): void {
    this._editingClusterIdx.set(idx);
    this._editingClusterDirty.set(false);
    this._editingClusterRoute.set(null);
  }

  protected async stopEditCluster(): Promise<void> {
    this._editingClusterIdx.set(null);
    this._editingClusterDirty.set(false);
    this._editingClusterRoute.set(null);

    const clusters = this._editableClusters();
    const depot = this._entrepot();
    const activeView = this.activeResultView();
    if (!clusters || !depot) return;

    this.loading.set(true);
    this.loadingMessage.set('Recalcul des tracés et statistiques...');
    try {
      if (isGreedyFamily(activeView)) {
        await this.recalcGreedyClusters(clusters, depot, activeView);
      } else {
        await this.recalcOptimizedClusters(clusters, depot, activeView);
      }
    } catch (e) {
      console.error('Erreur recalcul tracés:', e);
    } finally {
      this.loading.set(false);
      this.loadingMessage.set('');
    }
  }

  private async recalcGreedyClusters(
    clusters: EditableCluster[],
    depot: EntrepotResponse,
    activeView: AlgorithmType,
  ): Promise<void> {
    const updatedClusters = [...clusters];
    const newRoutes: ReadonlyArray<LatLngTuple>[] = [];
    const newCosts: TripCost[] = [];
    const newSummaries: { duration: number; distance: number }[] = [];

    for (let i = 0; i < clusters.length; i++) {
      const cl = clusters[i];
      const cmds = cl.commandeIds
        .map(id => this.getCommandeDetails(id))
        .filter((c): c is CommandeResponse => !!c);

      if (cmds.length === 0) {
        newRoutes.push([]);
        newCosts.push(this._srvCost.estimateTripCost(0, 0));
        newSummaries.push({ duration: 0, distance: 0 });
        updatedClusters[i] = { ...cl, duree: 0 };
        continue;
      }

      const locs = this.buildDepotWrappedLocations(cmds, depot);
      try {
        const { route, duration, distance } = await this._srvCarto.getDirectionsWithSummaryChunked(locs);
        newRoutes.push(route);
        updatedClusters[i] = { ...cl, duree: duration };
        newCosts.push(this._srvCost.estimateTripCost(duration, distance));
        newSummaries.push({ duration, distance });
      } catch {
        newRoutes.push(cmds.map(c => [c.latitude, c.longitude] as LatLngTuple));
        newCosts.push(this._srvCost.estimateTripCost(cl.duree, cl.duree * 10));
        newSummaries.push({ duration: cl.duree, distance: 0 });
      }
    }

    this._editableClusters.set(updatedClusters);
    this.algoComparisons.update(arr => arr.map(c =>
      c.type === activeView ? {
        ...c,
        greedyRoutes: newRoutes,
        greedySummaries: newSummaries,
        costs: newCosts,
        totalCost: newCosts.reduce((s, t) => s + t.totalCost, 0),
        editableClusters: updatedClusters.map(ec => ({ ...ec, commandeIds: [...ec.commandeIds] })),
      } : c,
    ));
  }

  private async recalcOptimizedClusters(
    clusters: EditableCluster[],
    depot: EntrepotResponse,
    activeView: AlgorithmType,
  ): Promise<void> {
    const comp = this.algoComparisons().find(c => c.type === activeView);
    if (!comp?.result) return;

    const updatedClusters = [...clusters];
    const newClusterResults: GlobalOptimizationResult['clusterResults'] = [];
    const newCosts: TripCost[] = [];

    for (let i = 0; i < comp.result.clusterResults.length; i++) {
      const cr = comp.result.clusterResults[i];
      const cl = clusters[i];
      if (!cl) { newClusterResults.push(cr); newCosts.push(comp.costs[i]); continue; }

      const cmds = cl.commandeIds
        .map(id => this.getCommandeDetails(id))
        .filter((c): c is CommandeResponse => !!c);

      if (cmds.length === 0) {
        newClusterResults.push({ ...cr, routes: [], totalDuration: 0 });
        newCosts.push(this._srvCost.estimateTripCost(0));
        updatedClusters[i] = { ...cl, duree: 0 };
        continue;
      }

      const locs = this.buildDepotWrappedLocations(cmds, depot);
      try {
        const { route, duration, distance } = await this._srvCarto.getDirectionsWithSummaryChunked(locs);
        newClusterResults.push({ ...cr, routes: [route], totalDuration: duration });
        updatedClusters[i] = { ...cl, duree: duration };
        newCosts.push(this._srvCost.estimateTripCost(duration, distance));
      } catch {
        newClusterResults.push(cr);
        newCosts.push(this._srvCost.estimateTripCost(cl.duree));
      }
    }

    this._editableClusters.set(updatedClusters);
    const updatedResult = { ...comp.result, clusterResults: newClusterResults };
    this._globalOptimizationResult.set(updatedResult);
    this.algoComparisons.update(arr => arr.map(c =>
      c.type === activeView ? {
        ...c,
        result: updatedResult,
        costs: newCosts,
        totalCost: newCosts.reduce((s, t) => s + t.totalCost, 0),
        editableClusters: updatedClusters.map(ec => ({ ...ec, commandeIds: [...ec.commandeIds] })),
      } : c,
    ));
  }

  protected async recalcEditingClusterRoute(): Promise<void> {
    const idx = this._editingClusterIdx();
    const clusters = this._editableClusters();
    const depot = this._entrepot();
    if (idx === null || !clusters || !depot) return;

    const cmdIds = clusters[idx].commandeIds;
    const cmds = cmdIds.map(id => this.getCommandeDetails(id)).filter((c): c is CommandeResponse => !!c);
    if (cmds.length === 0) { this._editingClusterRoute.set(null); return; }

    this.loading.set(true);
    this.loadingMessage.set('Recalcul du tracé...');
    try {
      const locs = this.buildDepotWrappedLocations(cmds, depot);
      const { route } = await this._srvCarto.getDirectionsWithSummaryChunked(locs);
      this._editingClusterRoute.set(route as LatLngTuple[]);
      this._editingClusterDirty.set(false);
    } catch {
      alert('Erreur lors du recalcul du tracé.');
    } finally {
      this.loading.set(false);
      this.loadingMessage.set('');
    }
  }

  // ─── CLUSTER COMMAND MANIPULATION ────────────────────────────────

  protected moveClusterCmdUp(clsIdx: number, cmdIdx: number): void {
    if (cmdIdx <= 0) return;
    this._editableClusters.update(clusters => {
      if (!clusters) return clusters;
      const next = clusters.map(c => ({ ...c, commandeIds: [...c.commandeIds] }));
      const arr = next[clsIdx].commandeIds;
      [arr[cmdIdx - 1], arr[cmdIdx]] = [arr[cmdIdx], arr[cmdIdx - 1]];
      return next;
    });
  }

  protected moveClusterCmdDown(clsIdx: number, cmdIdx: number): void {
    this._editableClusters.update(clusters => {
      if (!clusters) return clusters;
      const next = clusters.map(c => ({ ...c, commandeIds: [...c.commandeIds] }));
      const arr = next[clsIdx].commandeIds;
      if (cmdIdx >= arr.length - 1) return clusters;
      [arr[cmdIdx], arr[cmdIdx + 1]] = [arr[cmdIdx + 1], arr[cmdIdx]];
      return next;
    });
  }

  protected removeFromCluster(clsIdx: number, cmdIdx: number): void {
    this._editableClusters.update(clusters => {
      if (!clusters) return clusters;
      const next = clusters.map(c => ({ ...c, commandeIds: [...c.commandeIds] }));
      next[clsIdx].commandeIds.splice(cmdIdx, 1);
      return next;
    });
    this._editingClusterDirty.set(true);
    this._editingClusterRoute.set(null);
  }

  protected onMapCommandeClick(cmdId: number): void {
    const idx = this._editingClusterIdx();
    if (idx === null) return;
    this._editableClusters.update(clusters => {
      if (!clusters) return clusters;
      const next = clusters.map(c => ({ ...c, commandeIds: [...c.commandeIds] }));
      const isInCurrent = next[idx].commandeIds.includes(cmdId);
      if (isInCurrent) {
        next[idx].commandeIds = next[idx].commandeIds.filter(id => id !== cmdId);
      } else {
        for (let i = 0; i < next.length; i++) {
          if (i !== idx) next[i].commandeIds = next[i].commandeIds.filter(id => id !== cmdId);
        }
        next[idx].commandeIds.push(cmdId);
      }
      return next;
    });
    this._editingClusterDirty.set(true);
    this._editingClusterRoute.set(null);
  }

  // ═══════════════════════════════════════════════════════════════════
  //  COMPARE MODE (drag-scroll)
  // ═══════════════════════════════════════════════════════════════════

  protected onCompareDragStart(e: MouseEvent): void {
    const el = e.currentTarget as HTMLElement;
    this._dragScrollEl = el;
    this._dragStartX = e.clientX;
    this._dragStartScroll = el.scrollLeft;
    this._isDragging = true;
    el.style.cursor = 'grabbing';
    el.style.userSelect = 'none';
  }

  @HostListener('document:mousemove', ['$event'])
  protected onCompareDragMove(e: MouseEvent): void {
    if (!this._isDragging || !this._dragScrollEl) return;
    e.preventDefault();
    const dx = e.clientX - this._dragStartX;
    this._dragScrollEl.scrollLeft = this._dragStartScroll - dx;
  }

  @HostListener('document:mouseup')
  protected onCompareDragEnd(): void {
    if (!this._isDragging) return;
    this._isDragging = false;
    if (this._dragScrollEl) {
      this._dragScrollEl.style.cursor = 'grab';
      this._dragScrollEl.style.userSelect = '';
    }
    this._dragScrollEl = null;
  }

  // ═══════════════════════════════════════════════════════════════════
  //  COMMANDE SELECTIONS
  // ═══════════════════════════════════════════════════════════════════

  protected toggleAllCommandes(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this._selectedCommandes.set(new Set(this._commandes().map(c => c.id)));
    } else {
      this._selectedCommandes.set(new Set());
    }
    this.invalidateMatrixState();
  }

  protected isCommandeSelected(id: number): boolean {
    return this._selectedCommandes().has(id);
  }

  protected toggleSelection(id: number): void {
    this._selectedCommandes.update(set => {
      const newSet = new Set(set);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      return newSet;
    });
    this.invalidateMatrixState();
  }

  // ═══════════════════════════════════════════════════════════════════
  //  GETTERS / FORMATTERS
  // ═══════════════════════════════════════════════════════════════════

  protected globalOptimizationResult(): GlobalOptimizationResult | undefined {
    return this._globalOptimizationResult();
  }

  protected getTotalDeliveries(): number {
    const result = this._globalOptimizationResult();
    if (!result) return 0;
    return result.clusterResults.reduce((total, cr) => total + this.getDeliveriesCount(cr), 0);
  }

  protected getTotalDuration(): number {
    const result = this._globalOptimizationResult();
    if (!result) return 0;
    return result.clusterResults.reduce((total, cr) => total + cr.totalDuration, 0);
  }

  protected getClusterDuration(idx: number): number {
    const clusters = this._editableClusters();
    if (clusters && clusters[idx]) return clusters[idx].duree;
    const comp = this.algoComparisons().find(c => c.type === this.activeResultView());
    if (comp?.result?.clusterResults[idx]) return comp.result.clusterResults[idx].totalDuration;
    if (comp?.greedySummaries?.[idx]) return comp.greedySummaries[idx].duration;
    return 0;
  }

  protected getTotalDurationFromClusters(): number {
    const clusters = this._editableClusters();
    if (clusters) return clusters.reduce((sum, c) => sum + c.duree, 0);
    return this.getTotalDuration();
  }

  protected formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  }

  protected formatSeconds(val: number): string {
    const h = Math.floor(val / 3600);
    const m = Math.floor((val % 3600) / 60);
    return h > 0 ? `${h}h${m > 0 ? m.toString().padStart(2, '0') : ''}` : `${m}min`;
  }

  protected formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return `${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} le ${d.toLocaleDateString('fr-FR')}`;
  }

  protected isDeliveryPersonVisible(deliveryPerson: number): boolean {
    return this._visibleDeliveryPersons().has(deliveryPerson);
  }

  protected toggleDeliveryPerson(deliveryPerson: number): void {
    this._visibleDeliveryPersons.update(set => {
      const newSet = new Set(set);
      if (newSet.has(deliveryPerson)) newSet.delete(deliveryPerson); else newSet.add(deliveryPerson);
      return newSet;
    });
  }

  /** 0-based cluster index → consistent chart/map color */
  protected getClusterColor(clsIdx: number): string {
    return CLUSTER_COLORS[clsIdx % CLUSTER_COLORS.length];
  }

  /** Back-compat: deliveryPerson is 1-based */
  protected getDeliveryPersonColor(deliveryPerson: number): string {
    return this.getClusterColor(deliveryPerson - 1);
  }

  protected getLayersForComparison(type: AlgorithmType): Layer[] {
    const comp = this.algoComparisons().find(c => c.type === type);
    const depot = this._entrepot();
    const allCmds = this._commandes();
    const selectedIds = this._selectedCommandes();

    const depotMarker = this.buildDepotMarker(depot);

    const markers: Layer[] = this._showMarkers()
      ? allCmds
          .filter(c => selectedIds.has(c.id))
          .map(c => getMarker({ lat: c.latitude, lng: c.longitude }, COLOR_NEUTRAL))
      : [];

    if (!comp) return [BASE_TILE_LAYER, ...markers, ...depotMarker];

    let routeLayers: Layer[] = [];

    if (isGreedyFamily(type)) {
      if (comp.greedyRoutes && comp.greedyRoutes.length > 0) {
        routeLayers = comp.greedyRoutes.map((route, idx) =>
          polyline([...route], { color: this.getClusterColor(idx), weight: 3, opacity: .9 }),
        );
      } else if (comp.greedyResult) {
        routeLayers = comp.greedyResult.map((cr, idx) => {
          const points = this.buildGreedyPolylinePoints(cr, depot);
          return polyline(points, { color: this.getClusterColor(idx), weight: 3, opacity: .9 });
        });
      }
    } else if (comp.result) {
      routeLayers = comp.result.clusterResults.flatMap(cr =>
        cr.routes.map(r => polyline([...r], { color: this.getClusterColor(cr.deliveryPerson - 1), weight: 3, opacity: .9 })),
      );
    }

    return [BASE_TILE_LAYER, ...routeLayers, ...markers, ...depotMarker];
  }

  protected getDeliveriesCount(clusterResult: GlobalOptimizationResult['clusterResults'][number]): number {
    return clusterResult.subOptimizations.reduce((total, opt) =>
      total + opt.routes.reduce((routeTotal, route) =>
        routeTotal + route.steps.filter(s => s.type === 'job').length, 0,
      ), 0,
    );
  }

  protected getNextButtonLabel(): string {
    if (this.wizardStep() === 'configuration') return '🚀 Lancer l\u2019optimisation';
    return 'Suivant →';
  }

  protected isNextDisabled(): boolean {
    if (this.getStepIndex(this.wizardStep()) >= this.wizardSteps.length - 1) return true;
    if (this.wizardStep() === 'configuration') {
      return this.selectedAlgos().size === 0
          || this._selectedCommandes().size === 0
          || this._selectedEquipeIds().size === 0;
    }
    return false;
  }

  protected getCostTooltip(comp: AlgoComparison): string {
    const params = this._srvCost.getDefaultParams();
    return `Calcul du coût:\n• Carburant: ${params.fuelPricePerLiter} €/L\n• Conso: ${params.consumptionPer100km} L/100km\n• Distance totale: ${comp.costs.reduce((s, c) => s + c.distanceKm, 0).toFixed(1)} km\n• Carburant total: ${comp.costs.reduce((s, c) => s + c.fuelLiters, 0).toFixed(1)} L`;
  }

  // ─── STATS ───────────────────────────────────────────────────────

  protected getUnassignedCount(): number {
    const clusters = this._editableClusters();
    if (!clusters) return 0;
    const assigned = new Set(clusters.flatMap(c => c.commandeIds));
    let count = 0;
    for (const id of this._selectedCommandes()) {
      if (!assigned.has(id)) count++;
    }
    return count;
  }

  protected getAssignedStats(): AssignedStats {
    const total = this._selectedCommandes().size;

    const clusters = this._editableClusters();
    if (clusters) {
      const assigned = new Set(clusters.flatMap(c => c.commandeIds)).size;
      return { assigned, total, rate: total > 0 ? assigned / total : 0 };
    }

    const comp = this.algoComparisons().find(c => c.type === this.activeResultView());
    if (!comp) return { assigned: 0, total, rate: 0 };

    let assigned = 0;
    if (comp.result) {
      assigned = comp.result.clusterResults.reduce((sum, cr) =>
        sum + this.getDeliveriesCount(cr), 0);
    } else if (comp.greedyResult) {
      assigned = comp.greedyResult.reduce((sum, gr) => sum + gr.route.orderedAddresses.length, 0);
    }

    return { assigned, total, rate: total > 0 ? assigned / total : 0 };
  }

  protected getStatColor(rate: number): string {
    if (rate >= STAT_THRESHOLD_EXCELLENT) return STAT_COLOR_EXCELLENT;
    if (rate >= STAT_THRESHOLD_GOOD) return STAT_COLOR_GOOD;
    if (rate >= STAT_THRESHOLD_WARNING) return STAT_COLOR_WARNING;
    return STAT_COLOR_DANGER;
  }

  protected getTotalDurationForComp(comp: AlgoComparison): number {
    if (comp.greedySummaries) {
      return comp.greedySummaries.reduce((s, sm) => s + sm.duration, 0);
    }
    if (comp.result) {
      return comp.result.clusterResults.reduce((s, cr) => s + cr.totalDuration, 0);
    }
    return 0;
  }

  protected getAssignedStatsForComp(comp: AlgoComparison): AssignedStats {
    const total = this._selectedCommandes().size;
    // Use editable clusters when available for the active view — reflects live edits
    const ec = this._editableClusters();
    const activeView = this.activeResultView();
    let assigned = 0;
    if (ec && activeView === comp.type) {
      assigned = ec.reduce((s, cl) => s + cl.commandeIds.length, 0);
    } else if (comp.result) {
      assigned = comp.result.clusterResults.reduce((sum, cr) =>
        sum + this.getDeliveriesCount(cr), 0);
    } else if (comp.greedyResult) {
      assigned = comp.greedyResult.reduce((sum, gr) => sum + gr.route.orderedAddresses.length, 0);
    }
    return { assigned, total, rate: total > 0 ? assigned / total : 0 };
  }

  /** Helper: assigned count for a comparison entry. */
  protected getAssignedCountForComp(comp: AlgoComparison): number {
    return this.getAssignedStatsForComp(comp).assigned;
  }

  /** Value per delivered package (guards against division by zero). */
  protected perDelivered(value: number, comp: AlgoComparison): number {
    const assigned = this.getAssignedCountForComp(comp);
    return assigned > 0 ? value / assigned : value;
  }

  protected isBestValue(metric: 'cost' | 'distance' | 'duration' | 'fuel' | 'computeTime', comp: AlgoComparison): boolean {
    const comparisons = this.algoComparisons();
    if (comparisons.length < 2) return false;

    const getValue = (c: AlgoComparison): number => {
      switch (metric) {
        case 'cost': return c.totalCost;
        case 'distance': return c.costs.reduce((s, t) => s + t.distanceKm, 0);
        case 'duration': return this.getTotalDurationForComp(c);
        case 'fuel': return c.costs.reduce((s, t) => s + t.fuelLiters, 0);
        case 'computeTime': return c.computeTimeMs;
      }
    };

    const val = getValue(comp);
    // Avoid crowning winners qui livrent trop peu : exige au moins 80% du meilleur taux d'affectation
    if (metric !== 'computeTime') {
      const assignedCounts = comparisons.map(c => this.getAssignedCountForComp(c));
      const maxAssigned = Math.max(...assignedCounts, 0);
      const minEligible = maxAssigned * 0.8;
      if (this.getAssignedCountForComp(comp) < minEligible) return false;
    }

    return val > 0 && comparisons.every(c => getValue(c) >= val);
  }

  /**
   * Composite score (0–100) for an algorithm.
   * Ranks each algo across 6 weighted metrics. Affectation rate is weighted 3×
   * because delivering all packages is the primary business objective.
   * For each metric the algo earns 1 point per rival it beats or ties,
   * then points are weighted and normalised to 0–100.
   */
  protected getAlgoScore(comp: AlgoComparison): number {
    const comparisons = this.algoComparisons();
    if (comparisons.length < 2) return 100;

    const n = comparisons.length;
    const compIdx = comparisons.indexOf(comp);
    if (compIdx < 0) return 0;

    // weight: how many "votes" each metric gets (affectation ×3)
    const metricSets: { values: number[]; lowerIsBetter: boolean; weight: number }[] = [
      { values: comparisons.map(c => this.perDelivered(c.totalCost, c)), lowerIsBetter: true, weight: 1 },
      { values: comparisons.map(c => this.perDelivered(this.getTotalDurationForComp(c), c)), lowerIsBetter: true, weight: 1 },
      { values: comparisons.map(c => this.perDelivered(c.costs.reduce((s, t) => s + t.distanceKm, 0), c)), lowerIsBetter: true, weight: 1 },
      { values: comparisons.map(c => this.perDelivered(c.costs.reduce((s, t) => s + t.fuelLiters, 0), c)), lowerIsBetter: true, weight: 1 },
      { values: comparisons.map(c => this.getAssignedStatsForComp(c).rate), lowerIsBetter: false, weight: 3 },
      { values: comparisons.map(c => c.computeTimeMs), lowerIsBetter: true, weight: 1 },
    ];

    let totalPoints = 0;
    let maxPoints = 0;

    for (const { values, lowerIsBetter, weight } of metricSets) {
      const myVal = values[compIdx];
      let metricPoints = 0;
      for (let i = 0; i < n; i++) {
        if (i === compIdx) continue;
        if (lowerIsBetter ? myVal <= values[i] : myVal >= values[i]) metricPoints++;
      }
      totalPoints += metricPoints * weight;
      maxPoints += (n - 1) * weight;
    }

    return maxPoints > 0 ? Math.round(totalPoints / maxPoints * 100) : 100;
  }

  protected isBestScore(comp: AlgoComparison): boolean {
    const comparisons = this.algoComparisons();
    if (comparisons.length < 2) return false;
    const score = this.getAlgoScore(comp);
    return score > 0 && comparisons.every(c => this.getAlgoScore(c) <= score);
  }

  protected getClusterCommandeCount(idx: number): number {
    return this._editableClusters()?.[idx]?.commandeIds.length ?? 0;
  }

  // ─── PAGINATION ──────────────────────────────────────────────────

  onSearch(value: string) {
    this.searchQuery.set(value);
    this.currentPage.set(0);
  }

  prevPage() { this.currentPage.update(p => Math.max(0, p - 1)); }
  nextPage() { this.currentPage.update(p => Math.min(this.totalPages() - 1, p + 1)); }
}
