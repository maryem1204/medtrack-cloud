package medtrack_backend.Repositories;

import medtrack_backend.Entities.Alerte;
import medtrack_backend.Entities.StatutAlerte;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlerteRepository extends JpaRepository<Alerte, Long> {
    boolean existsByMaintenance_IdAndStatut(Long maintenanceId, StatutAlerte statut);
}