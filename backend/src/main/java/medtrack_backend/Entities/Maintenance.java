package medtrack_backend.Entities;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "maintenances")
public class Maintenance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "appareil_id")
    private Appareil appareil;

    @ManyToOne
    @JoinColumn(name = "technicien_id")
    private Utilisateur technicien;

    private LocalDate datePrevue;

    private LocalDate dateRealisee;

    @Enumerated(EnumType.STRING)
    private TypeMaintenance type;

    @Enumerated(EnumType.STRING)
    private StatutMaintenance statut;

    public Maintenance() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Appareil getAppareil() { return appareil; }
    public void setAppareil(Appareil appareil) { this.appareil = appareil; }
    public Utilisateur getTechnicien() { return technicien; }
    public void setTechnicien(Utilisateur technicien) { this.technicien = technicien; }
    public LocalDate getDatePrevue() { return datePrevue; }
    public void setDatePrevue(LocalDate datePrevue) { this.datePrevue = datePrevue; }
    public LocalDate getDateRealisee() { return dateRealisee; }
    public void setDateRealisee(LocalDate dateRealisee) { this.dateRealisee = dateRealisee; }
    public TypeMaintenance getType() { return type; }
    public void setType(TypeMaintenance type) { this.type = type; }
    public StatutMaintenance getStatut() { return statut; }
    public void setStatut(StatutMaintenance statut) { this.statut = statut; }
}
