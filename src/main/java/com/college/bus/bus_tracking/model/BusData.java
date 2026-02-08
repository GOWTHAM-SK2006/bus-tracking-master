package com.college.bus.bus_tracking.model;

public class BusData {

    private String busNumber;
    private String busName;
    private String busStop;
    private double latitude;
    private double longitude;
    private String status;
    private String driverName;
    private String driverPhone;

    public BusData() {
    }

    public BusData(String busNumber, String busName, String busStop, double latitude, double longitude, String status,
            String driverName, String driverPhone) {
        this.busNumber = busNumber;
        this.busName = busName;
        this.busStop = busStop;
        this.latitude = latitude;
        this.longitude = longitude;
        this.status = status;
        this.driverName = driverName;
        this.driverPhone = driverPhone;
    }

    public String getBusNumber() {
        return busNumber;
    }

    public void setBusNumber(String busNumber) {
        this.busNumber = busNumber;
    }

    public String getBusName() {
        return busName;
    }

    public void setBusName(String busName) {
        this.busName = busName;
    }

    public String getBusStop() {
        return busStop;
    }

    public void setBusStop(String busStop) {
        this.busStop = busStop;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public String getDriverPhone() {
        return driverPhone;
    }

    public void setDriverPhone(String driverPhone) {
        this.driverPhone = driverPhone;
    }
}
