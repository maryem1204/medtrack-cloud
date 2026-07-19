package medtrack_backend.Entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

@Entity
@Table(name = "appareils")
public class Appareil {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numeroSerie;

    @NotBlank
    private String nom;

    @Enumerated(EnumType.STRING)
    private Categorie categorie;

    private LocalDate dateImport;

    @Enumerated(EnumType.STRING)
    private StatutAppareil statut;

    private String qrCode; // chemin ou contenu encodé du QR code

    @ManyToOne
    @JoinColumn(name = "fournisseur_id")
    private Fournisseur fournisseur;

    public Appareil() {
    }

    // Getters et setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNumeroSerie() { return numeroSerie; }
    public void setNumeroSerie(String numeroSerie) { this.numeroSerie = numeroSerie; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public Categorie getCategorie() { return categorie; }
    public void setCategorie(Categorie categorie) { this.categorie = categorie; }

    public LocalDate getDateImport() { return dateImport; }
    public void setDateImport(LocalDate dateImport) { this.dateImport = dateImport; }

    public StatutAppareil getStatut() { return statut; }
    public void setStatut(StatutAppareil statut) { this.statut = statut; }

    public String getQrCode() { return qrCode; }
    public void setQrCode(String qrCode) { this.qrCode = qrCode; }

    public Fournisseur getFournisseur() { return fournisseur; }
    public void setFournisseur(Fournisseur fournisseur) { this.fournisseur = fournisseur; }
}