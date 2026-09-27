package com.dygon.bustracking;

import android.os.Bundle;
import android.util.Log;

import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "BusTracking-MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        // Ensure WebView fits below the native Android Status Bar and above Navigation Bar
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        getWindow().setStatusBarColor(0xFFFFFFFF);
        getWindow().setNavigationBarColor(0xFFFFFFFF);
        
        // Ensure status bar icons are dark (visible on white background)
        androidx.core.view.WindowInsetsControllerCompat windowInsetsController = new androidx.core.view.WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        windowInsetsController.setAppearanceLightStatusBars(true);
        windowInsetsController.setAppearanceLightNavigationBars(true);
    }

    // Removed onStop override that was stopping tracking when app backgrounded
    // Background tracking should continue via the BackgroundGeolocation service


    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "App onDestroy called");
    }

    /**
     * Notify JavaScript layer that the app is being closed/backgrounded
     * The JavaScript should send a STOP action to the backend
     */
    private void notifyAppStopped() {
        try {
            // Use Capacitor to call JavaScript code
            String jsCode = "if (typeof TrackingController !== 'undefined' && state.isTracking) { " +
                    "TrackingController.stop(); " +
                    "console.log('[MainActivity] Sent STOP from onStop/onDestroy'); " +
                    "}";
            
            this.executeScript(jsCode);
        } catch (Exception e) {
            Log.e(TAG, "Error notifying app stopped", e);
        }
    }

    /**
     * Execute JavaScript in the WebView
     */
    private void executeScript(String script) {
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().post(() -> {
                    getBridge().getWebView().evaluateJavascript(script, null);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error executing JavaScript", e);
        }
    }
}
