package com.college.bus.bus_tracking.model;

import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BusData {

    private String busNumber;
    private String busName; // New field
    private String busStop;
    private double latitude;
    private double longitude;
    private String status;
    private String driverName;
    private String driverPhone;
}
