package medtrack_backend.controllers;

import medtrack_backend.Entities.*;
import medtrack_backend.Repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alertes")
public class AlerteController {

    @Autowired private AlerteRepository repo;
    @Autowired private MaintenanceRepository maintenanceRepo;

    @GetMapping public List<Alerte> getAll() { return repo.findAll(); }

    @PostMapping("/generer")
    public ResponseEntity<?> generer() {
        List<Maintenance> planifiees = maintenanceRepo.findByStatut(StatutMaintenance.PLANIFIEE);
        int creees = 0;

        for (Maintenance m : planifiees) {
            long jours = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), m.getDatePrevue());
            boolean concernee = jours <= 7; // urgente ou en retard

            if (!concernee) continue;

            // On ne crée une alerte QUE si aucune alerte ACTIVE n'existe déjà pour CETTE maintenance précise
            boolean dejaAlerte = repo.existsByMaintenance_IdAndStatut(m.getId(), StatutAlerte.ACTIVE);
            if (dejaAlerte) continue;

            Alerte a = new Alerte();
            a.setAppareil(m.getAppareil());
            a.setMaintenance(m);
            a.setType(jours < 0 ? TypeAlerte.MAINTENANCE_RETARD : TypeAlerte.MAINTENANCE_URGENTE);
            a.setStatut(StatutAlerte.ACTIVE);
            a.setDateDeclenchement(LocalDate.now());
            repo.save(a);
            creees++;
        }
        return ResponseEntity.ok(Map.of("alertesCreees", creees));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Alerte alerte = repo.findById(id).orElse(null);
        if (alerte == null) return ResponseEntity.notFound().build();

        String nouveauStatut = body.get("statut");
        if ("TRAITEE".equals(nouveauStatut)) {
            alerte.setStatut(StatutAlerte.TRAITEE);
            repo.save(alerte);

            // 🔑 LA CORRECTION : on clôture aussi la maintenance liée, sinon elle reste "en retard" pour toujours
            if (alerte.getMaintenance() != null) {
                Maintenance m = alerte.getMaintenance();
                m.setStatut(StatutMaintenance.TERMINEE);
                m.setDateRealisee(LocalDate.now());
                maintenanceRepo.save(m);
            }
        }
        return ResponseEntity.ok(alerte);
    }
}