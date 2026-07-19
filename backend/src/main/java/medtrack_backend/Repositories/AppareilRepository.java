package medtrack_backend.Repositories;

import medtrack_backend.Entities.Appareil;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AppareilRepository extends JpaRepository<Appareil, Long> {
    Optional<Appareil> findByNumeroSerie(String numeroSerie);
}