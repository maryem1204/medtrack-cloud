package medtrack_backend.controllers;

import medtrack_backend.Entities.Appareil;
import medtrack_backend.Entities.HistoriqueAppareil;
import medtrack_backend.Entities.Maintenance;
import medtrack_backend.Repositories.AppareilRepository;
import medtrack_backend.Repositories.HistoriqueAppareilRepository;
import medtrack_backend.Repositories.MaintenanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/public/scan")
public class ScanController {
    @Autowired private AppareilRepository appareilRepo;
    @Autowired private HistoriqueAppareilRepository historiqueRepo;
    @Autowired private MaintenanceRepository maintenanceRepo;

    @GetMapping("/{id}")
    public ResponseEntity<?> scanner(@PathVariable Long id) {
        Appareil appareil = appareilRepo.findById(id).orElse(null);
        if (appareil == null) return ResponseEntity.notFound().build();

        List<HistoriqueAppareil> historique = historiqueRepo.findAll().stream()
                .filter(h -> h.getAppareil() != null && h.getAppareil().getId().equals(id))
                .toList();

        List<Maintenance> maintenances = maintenanceRepo.findAll().stream()
                .filter(m -> m.getAppareil() != null && m.getAppareil().getId().equals(id))
                .toList();

        return ResponseEntity.ok(new ScanResponse(appareil, historique, maintenances));
    }

    record ScanResponse(Appareil appareil, List<HistoriqueAppareil> historique, List<Maintenance> maintenances) {}
}