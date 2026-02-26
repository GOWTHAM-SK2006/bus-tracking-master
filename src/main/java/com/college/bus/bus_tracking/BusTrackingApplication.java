package com.college.bus.bus_tracking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ComponentScan("com.college.bus")
@EnableScheduling
public class BusTrackingApplication {

	public static void main(String[] args) {
		SpringApplication.run(BusTrackingApplication.class, args);
	}
}
