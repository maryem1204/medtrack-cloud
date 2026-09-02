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

    @Enumerated(EnumType.STRING)
    private TypeAlerte type;

    private LocalDate dateDeclenchement;

    @Enumerated(EnumType.STRING)
    private StatutAlerte statut;

    @ManyToOne
    @JoinColumn(name = "maintenance_id")
    private Maintenance maintenance;

    public Alerte() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Appareil getAppareil() { return appareil; }
    public void setAppareil(Appareil appareil) { this.appareil = appareil; }
    public TypeAlerte getType() { return type; }
    public void setType(TypeAlerte type) { this.type = type; }
    public LocalDate getDateDeclenchement() { return dateDeclenchement; }
    public void setDateDeclenchement(LocalDate dateDeclenchement) { this.dateDeclenchement = dateDeclenchement; }
    public StatutAlerte getStatut() { return statut; }
    public void setStatut(StatutAlerte statut) { this.statut = statut; }
    public Maintenance getMaintenance() { return maintenance; }
    public void setMaintenance(Maintenance maintenance) { this.maintenance = maintenance; }
}