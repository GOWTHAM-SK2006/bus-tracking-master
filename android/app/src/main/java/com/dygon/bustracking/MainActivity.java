package com.dygon.bustracking;

import android.os.Bundle;
import android.util.Log;

import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "BusTracking-MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(0xFF000000);
        getWindow().setNavigationBarColor(0xFF000000);
    }

    @Override
    protected void onStop() {
        super.onStop();
        Log.d(TAG, "App onStop called - sending stop tracking notification");
        // Notify JavaScript to send STOP action when app is backgrounded
        notifyAppStopped();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "App onDestroy called - stopping tracking");
        // Send final STOP message before app is completely destroyed
        notifyAppStopped();
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
            if (this.getWebView() != null) {
                this.getWebView().post(() -> {
                    this.getWebView().evaluateJavascript(script, null);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error executing JavaScript", e);
        }
    }
}
