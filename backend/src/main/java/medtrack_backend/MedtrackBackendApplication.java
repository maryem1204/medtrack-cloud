package medtrack_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MedtrackBackendApplication {
	public static void main(String[] args) {
		SpringApplication.run(MedtrackBackendApplication.class, args);
	}
}