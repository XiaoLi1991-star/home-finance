package com.family.finance.v2;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsetsController;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeSecureStoragePlugin.class);
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        window.setStatusBarColor(Color.parseColor("#F8FAFC"));
        window.setNavigationBarColor(Color.WHITE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && window.getInsetsController() != null) {
            window.getInsetsController().setSystemBarsAppearance(
                WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                    | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                    | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
            );
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            int flags = window.getDecorView().getSystemUiVisibility()
                | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            window.getDecorView().setSystemUiVisibility(flags);
        }
    }
}
