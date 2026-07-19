package medtrack_backend.Repositories;

import medtrack_backend.Entities.HistoriqueAppareil;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HistoriqueAppareilRepository extends JpaRepository<HistoriqueAppareil, Long> {
}