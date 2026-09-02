package medtrack_backend.Repositories;

import medtrack_backend.Entities.Vente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VenteRepository extends JpaRepository<Vente, Long> {
    List<Vente> findByClient_Id(Long clientId);
}