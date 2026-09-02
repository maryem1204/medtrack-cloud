package medtrack_backend.Repositories;

import medtrack_backend.Entities.Commande;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CommandeRepository extends JpaRepository<Commande, Long> {
    Optional<Commande> findTopByOrderByIdDesc();

}