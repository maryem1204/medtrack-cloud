package medtrack_backend.controllers;

import medtrack_backend.Entities.*;
import medtrack_backend.Repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/alertes")
public class AlerteController {
    @Autowired private AlerteRepository repo;
    @Autowired private MaintenanceRepository maintenanceRepo;

    @GetMapping public List<Alerte> getAll() { return repo.findAll(); }

    @PostMapping public Alerte create(@RequestBody Alerte a) { return repo.save(a); }

    @PutMapping("/{id}")
    public ResponseEntity<Alerte> update(@PathVariable Long id, @RequestBody Alerte updated) {
        return repo.findById(id).map(existing -> {
            existing.setStatut(updated.getStatut());
            return ResponseEntity.ok(repo.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Génère (ou met à jour) les alertes réelles à partir des maintenances planifiées urgentes/en retard
    @PostMapping("/generer")
    public List<Alerte> genererAlertes() {
        List<Maintenance> planifiees = maintenanceRepo.findAll().stream()
                .filter(m -> m.getStatut() == StatutMaintenance.PLANIFIEE)
                .toList();

        List<Alerte> existantes = repo.findAll();

        for (Maintenance m : planifiees) {
            if (m.getAppareil() == null || m.getDatePrevue() == null) continue;
            long joursRestants = LocalDate.now().until(m.getDatePrevue()).getDays();
            boolean urgente = joursRestants <= 7;
            if (!urgente) continue;

            String type = joursRestants < 0 ? "MAINTENANCE_RETARD" : "MAINTENANCE_URGENTE";

            boolean dejaExistante = existantes.stream().anyMatch(a ->
                    a.getAppareil() != null &&
                            a.getAppareil().getId().equals(m.getAppareil().getId()) &&
                            a.getType().equals(type) &&
                            "ACTIVE".equals(a.getStatut())
            );

            if (!dejaExistante) {
                Alerte a = new Alerte();
                a.setAppareil(m.getAppareil());
                a.setType(type);
                a.setDateDeclenchement(LocalDate.now());
                a.setStatut("ACTIVE");
                repo.save(a);
            }
        }
        return repo.findAll();
    }
}