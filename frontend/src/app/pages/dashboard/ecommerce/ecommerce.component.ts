import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import {
  AppareilService,
  Appareil,
} from "../../../services/appareil/appareil.service";
import {
  FournisseurService,
  Fournisseur,
} from "../../../services/fournisseur/fournisseur.service";
import { ClientService, Client } from "../../../services/client/client.service";
import {
  CommandeService,
  Commande,
} from "../../../services/commande/commande.service";
import {
  MaintenanceService,
  Maintenance,
} from "../../../services/maintenance/maintenance.service";
import { AlerteService, Alerte } from "../../../services/alerte/alerte.service";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

@Component({
  selector: "app-ecommerce",
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./ecommerce.component.html",
})
export class EcommerceComponent implements OnInit, AfterViewChecked {
  @ViewChild("chatScrollContainer") chatContainer!: ElementRef;

  appareils: Appareil[] = [];
  fournisseurs: Fournisseur[] = [];
  clients: Client[] = [];
  commandes: Commande[] = [];
  maintenances: Maintenance[] = [];
  alertes: Alerte[] = [];

  filtreCommande = "Tous";
  chatMessages: ChatMessage[] = [
    {
      role: "assistant",
      content:
        "Bonjour, je suis votre assistant MedTrack. Posez-moi une question sur vos commandes, appareils ou maintenances.",
    },
  ];
  chatInput = "";
  chatLoading = false;
  private shouldScroll = false;

  suggestions = [
    "Combien de commandes en attente ?",
    "Appareils disponibles en stock",
    "Maintenances urgentes cette semaine",
    "Fournisseurs avec des commandes annulées",
  ];

  constructor(
    private appareilService: AppareilService,
    private fournisseurService: FournisseurService,
    private clientService: ClientService,
    private commandeService: CommandeService,
    private maintenanceService: MaintenanceService,
    private alerteService: AlerteService,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.appareilService.getAll().subscribe((d) => (this.appareils = d));
    this.fournisseurService.getAll().subscribe((d) => (this.fournisseurs = d));
    this.clientService.getAll().subscribe((d) => (this.clients = d));
    this.commandeService.getAll().subscribe((d) => (this.commandes = d));
    this.alerteService
      .getAll()
      .subscribe(
        (d) => (this.alertes = d.filter((a) => a.statut === "ACTIVE")),
      );
    this.maintenanceService.getAll().subscribe((d) => (this.maintenances = d));
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom() {
    try {
      const el = this.chatContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {}
  }

  // ── Chatbot ──────────────────────────────────────────────────────────────

  envoyerMessage(texte: string) {
    if (!texte.trim() || this.chatLoading) return;
    this.chatMessages.push({ role: "user", content: texte });
    this.chatInput = "";
    this.chatLoading = true;
    this.shouldScroll = true;

    const historique = this.chatMessages
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));

    this.http
      .post<any>("http://localhost:8080/api/chat", {
        messages: historique,
      })
      .subscribe({
        next: (res) => {
          const reply =
            res.content?.[0]?.text || "Je ne peux pas répondre pour le moment.";
          this.chatMessages.push({ role: "assistant", content: reply });
          this.chatLoading = false;
          this.shouldScroll = true;
        },
        error: () => {
          this.chatMessages.push({
            role: "assistant",
            content: "Une erreur est survenue. Veuillez réessayer.",
          });
          this.chatLoading = false;
          this.shouldScroll = true;
        },
      });
  }

  private construireContexte(): string {
    const statsFournisseurs = this.fournisseurs
      .map((f) => {
        const cmds = this.commandes.filter((c) => c.fournisseur?.id === f.id);
        const annulees = cmds.filter((c) => c.statut === "ANNULEE").length;
        const taux =
          cmds.length > 0 ? Math.round((annulees / cmds.length) * 100) : 0;
        return `${f.nom}: ${cmds.length} commandes, ${taux}% annulées`;
      })
      .join("\n");

    const toutesCommandes = this.commandes
      .map(
        (c) =>
          `${c.reference} | ${c.statut} | fournisseur: ${c.fournisseur?.nom || "N/A"} | ${c.dateCommande}`,
      )
      .join("\n");

    const tousAppareils = this.appareils
      .map((a) => `${a.nom} | catégorie: ${a.categorie} | statut: ${a.statut}`)
      .join("\n");

    const toutesMaintenances = this.maintenances
      .map((m) => {
        const jours = this.joursRestants(m.datePrevue);
        return `${m.appareil?.nom || "N/A"} | ${m.type} | ${m.statut} | ${jours}j restants`;
      })
      .join("\n");

    return `
FOURNISSEURS ET FIABILITÉ:
${statsFournisseurs}

COMMANDES (${this.commandes.length}):
${toutesCommandes}

APPAREILS (${this.appareils.length}):
${tousAppareils}

MAINTENANCES (${this.maintenances.length}):
${toutesMaintenances}

ALERTES ACTIVES (${this.alertes.length})
  `.trim();
  }

  // ── Graphiques ───────────────────────────────────────────────────────────

  donutSegments(): {
    statut: string;
    label: string;
    count: number;
    color: string;
    dash: number;
    offset: number;
  }[] {
    const statutsConfig = [
      { statut: "EN_ATTENTE", label: "En attente", color: "#f59e0b" },
      { statut: "VALIDEE", label: "Validée", color: "#10b981" },
      { statut: "RECUE", label: "Reçue", color: "#3b82f6" },
      { statut: "ANNULEE", label: "Annulée", color: "#ef4444" },
    ];
    const total = this.commandes.length || 1;
    let offset = 25; // démarre à 12h
    return statutsConfig.map((s) => {
      const count = this.commandes.filter((c) => c.statut === s.statut).length;
      const dash = (count / total) * 100;
      const seg = { ...s, count, dash, offset };
      offset -= dash;
      return seg;
    });
  }

  commandesFiltrees(): Commande[] {
    const src = [...this.commandes].sort(
      (a, b) =>
        new Date(b.dateCommande).getTime() - new Date(a.dateCommande).getTime(),
    );
    if (this.filtreCommande === "Tous") return src;
    return src.filter((c) => c.statut === this.filtreCommande);
  }

  maintenancesAVenir(): Maintenance[] {
    return this.maintenances
      .filter((m) => m.statut === "PLANIFIEE")
      .sort(
        (a, b) =>
          new Date(a.datePrevue).getTime() - new Date(b.datePrevue).getTime(),
      );
  }

  joursRestants(date: string): number {
    return Math.ceil(
      (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
  }

  // ── Helpers existants ────────────────────────────────────────────────────

  salutation(): string {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
  }

  dateAujourdhui(): string {
    return new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  countAppareilsByStatut(statut: string): number {
    return this.appareils.filter((a) => a.statut === statut).length;
  }

  countByCategorie(): { categorie: string; count: number }[] {
    const compte: Record<string, number> = {};
    this.appareils.forEach((a) => {
      compte[a.categorie] = (compte[a.categorie] || 0) + 1;
    });
    return Object.entries(compte)
      .map(([categorie, count]) => ({ categorie, count }))
      .sort((a, b) => b.count - a.count);
  }

  maxCategorieCount(): number {
    return Math.max(1, ...this.countByCategorie().map((c) => c.count));
  }

  tauxDisponibilite(): number {
    if (this.appareils.length === 0) return 0;
    return Math.round(
      (this.countAppareilsByStatut("EN_STOCK") / this.appareils.length) * 100,
    );
  }

  countMaintenancesUrgentes(): number {
    return this.maintenances.filter((m) => {
      if (m.statut !== "PLANIFIEE") return false;
      return this.joursRestants(m.datePrevue) <= 7;
    }).length;
  }

  scoreGlobalFournisseurs(): {
    label: string;
    pourcentage: number;
    couleur: string;
  } {
    if (this.fournisseurs.length === 0)
      return { label: "N/A", pourcentage: 0, couleur: "#9ca3af" };
    let totalPts = 0;
    this.fournisseurs.forEach((f) => {
      const cmds = this.commandes.filter((c) => c.fournisseur?.id === f.id);
      if (cmds.length === 0) {
        totalPts += 50;
        return;
      }
      const annulees = cmds.filter((c) => c.statut === "ANNULEE").length;
      const taux = annulees / cmds.length;
      if (taux > 0.3) totalPts += 20;
      else if (cmds.length >= 3 && taux === 0) totalPts += 100;
      else totalPts += 70;
    });
    const moyenne = Math.round(totalPts / this.fournisseurs.length);
    if (moyenne >= 85)
      return { label: "Excellent", pourcentage: moyenne, couleur: "#16a34a" };
    if (moyenne >= 60)
      return { label: "Bon", pourcentage: moyenne, couleur: "#0d8f9e" };
    return { label: "À surveiller", pourcentage: moyenne, couleur: "#dc2626" };
  }

  formatDate(d: string | Date): string {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  statutCommandeLabel(statut: string): string {
    const labels: Record<string, string> = {
      EN_ATTENTE: "En attente",
      VALIDEE: "Validée",
      RECUE: "Reçue",
      ANNULEE: "Annulée",
    };
    return labels[statut] || statut;
  }
}
