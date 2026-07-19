package medtrack_backend.Entities;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "ventes")
public class Vente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "appareil_id")
    private Appareil appareil;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;

    private LocalDate dateVente;

    private Double montant;

    public Vente() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Appareil getAppareil() { return appareil; }
    public void setAppareil(Appareil appareil) { this.appareil = appareil; }
    public Client getClient() { return client; }
    public void setClient(Client client) { this.client = client; }
    public LocalDate getDateVente() { return dateVente; }
    public void setDateVente(LocalDate dateVente) { this.dateVente = dateVente; }
    public Double getMontant() { return montant; }
    public void setMontant(Double montant) { this.montant = montant; }
}