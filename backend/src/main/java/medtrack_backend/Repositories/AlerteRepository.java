package medtrack_backend.Repositories;

import medtrack_backend.Entities.Alerte;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlerteRepository extends JpaRepository<Alerte, Long> {
}