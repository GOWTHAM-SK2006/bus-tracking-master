package com.college.bus.bus_tracking.store;

import com.college.bus.bus_tracking.model.BusData;
import java.util.concurrent.ConcurrentHashMap;

public class BusSessionStore {

    public static final ConcurrentHashMap<String, BusData> BUS_MAP =
            new ConcurrentHashMap<>();
}
