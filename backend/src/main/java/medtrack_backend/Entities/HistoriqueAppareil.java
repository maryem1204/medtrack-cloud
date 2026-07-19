package medtrack_backend.Entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "historique_appareil")
public class HistoriqueAppareil {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "appareil_id")
    private Appareil appareil;

    private String evenement; // ex: "IMPORT", "VENTE", "MAINTENANCE"

    private LocalDateTime date;

    private String auteur;

    public HistoriqueAppareil() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Appareil getAppareil() { return appareil; }
    public void setAppareil(Appareil appareil) { this.appareil = appareil; }
    public String getEvenement() { return evenement; }
    public void setEvenement(String evenement) { this.evenement = evenement; }
    public LocalDateTime getDate() { return date; }
    public void setDate(LocalDateTime date) { this.date = date; }
    public String getAuteur() { return auteur; }
    public void setAuteur(String auteur) { this.auteur = auteur; }
}