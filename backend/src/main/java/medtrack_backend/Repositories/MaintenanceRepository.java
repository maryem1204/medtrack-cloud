package medtrack_backend.Repositories;

import medtrack_backend.Entities.Maintenance;
import medtrack_backend.Entities.StatutMaintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MaintenanceRepository extends JpaRepository<Maintenance, Long> {
    List<Maintenance> findByAppareilId(Long appareilId);
    List<Maintenance> findByStatut(StatutMaintenance statut);
}