package medtrack_backend.Repositories;

import medtrack_backend.Entities.Vente;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VenteRepository extends JpaRepository<Vente, Long> {
}