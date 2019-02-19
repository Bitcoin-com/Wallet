/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
*/


package com.bitcoin.cordova.qrreader;



import java.util.HashMap;
import java.util.Map;

import android.Manifest;
import android.content.pm.PackageManager;
import android.util.Log;
import android.view.ViewGroup;
import com.google.android.gms.vision.barcode.Barcode;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaInterface;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.provider.Settings;

public class QRReader extends CordovaPlugin {
    public static final String TAG = "QRReader";

    public static String platform;                            // Device OS
    public static String uuid;                                // Device UUID

    private static final String ANDROID_PLATFORM = "Android";
    private static final String AMAZON_PLATFORM = "amazon-fireos";
    private static final String AMAZON_DEVICE = "Amazon";

    public static final String CAMERA = Manifest.permission.CAMERA;
    public static final int CAMERA_REQ_CODE = 774980;


    private Map<Integer, Barcode> mBarcodes = new HashMap<Integer, Barcode>();
    private CallbackContext mPermissionCallbackContext;

    public QRReader() {
    }


    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        //QRReader.uuid = getUuid();
    }


    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if ("getTestInfo".equals(action)) {

            JSONObject r = new JSONObject();
            r.put("something", this.getTestInfo());
            callbackContext.success(r);

        } else if ("startReading".equals(action)) {
            startReading(callbackContext);

        } else if ("stopReading".equals(action)) {
            callbackContext.success("stopped");
        } else {
            return false;
        }
        return true;
    }

    //--------------------------------------------------------------------------
    // LOCAL METHODS
    //--------------------------------------------------------------------------

    private void getCameraPermission(CallbackContext callbackContext) {
        mPermissionCallbackContext = callbackContext;
        cordova.requestPermission(this, CAMERA_REQ_CODE, CAMERA);
    }

    public String getTestInfo() {
        return "Hello Java World 1";
    }

    public void onRequestPermissionResult(int requestCode, String[] permissions,
                                          int[] grantResults) throws JSONException
    {
        Log.d(TAG, "onRequestPermissionResult()");

        if (requestCode == CAMERA_REQ_CODE) {
            for (int r : grantResults) {
                if (r == PackageManager.PERMISSION_DENIED) {
                    if (this.mPermissionCallbackContext != null) {
                        this.mPermissionCallbackContext.error("Camera permission denied.");
                    }
                    return;
                }
            }
            if (this.mPermissionCallbackContext != null) {
                startReadingWithPermission(mPermissionCallbackContext);
            }
        }

    }

    private void startReading(CallbackContext callbackContext) {
        Log.d(TAG, "startReading()");

        if(cordova.hasPermission(CAMERA))
        {
            startReadingWithPermission(callbackContext);
        }
        else
        {
            getCameraPermission(callbackContext);
        }
    }

    private void startReadingWithPermission(CallbackContext callbackContext) {
        Log.d(TAG, "startReadingWithPermission()");

        ViewGroup viewGroup = ((ViewGroup) webView.getView().getParent());
        if (viewGroup == null) {
            callbackContext.error("Failed to get view group.");
            return;
        }
        callbackContext.success("Got view group.");
    }

}

