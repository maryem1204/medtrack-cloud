package medtrack_backend.Entities;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "alertes")
public class Alerte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "appareil_id")
    private Appareil appareil;

    private String type; // ex: "CALIBRATION_PROCHE"

    private LocalDate dateDeclenchement;

    private String statut; // ACTIVE, TRAITEE

    public Alerte() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Appareil getAppareil() { return appareil; }
    public void setAppareil(Appareil appareil) { this.appareil = appareil; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public LocalDate getDateDeclenchement() { return dateDeclenchement; }
    public void setDateDeclenchement(LocalDate dateDeclenchement) { this.dateDeclenchement = dateDeclenchement; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
}
