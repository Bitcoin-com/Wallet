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
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.hardware.Camera;
import android.os.Build;
import android.util.Log;
import android.view.ViewGroup;

import com.google.android.gms.vision.MultiProcessor;
import com.google.android.gms.vision.barcode.Barcode;
import com.google.android.gms.vision.barcode.BarcodeDetector;

import org.apache.cordova.CordovaWebView;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaInterface;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.provider.Settings;
import android.widget.Toast;

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
    private CameraSource mCameraSource;
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

    /**
     * Creates and starts the camera.  Note that this uses a higher resolution in comparison
     * to other detection examples to enable the barcode detector to detect small barcodes
     * at long distances.
     *
     * Suppressing InlinedApi since there is a check that the minimum version is met before using
     * the constant.
     */
    @SuppressLint("InlinedApi")
    private Boolean createCameraSource(Context context, boolean useFlash, CallbackContext callbackContext) {

        boolean autoFocus = true;
        // A barcode detector is created to track barcodes.  An associated multi-processor instance
        // is set to receive the barcode detection results, track the barcodes, and maintain
        // graphics for each barcode on screen.  The factory is used by the multi-processor to
        // create a separate tracker instance for each barcode.
        BarcodeDetector barcodeDetector = new BarcodeDetector.Builder(context).build();
        BarcodeMapTrackerFactory barcodeFactory = new BarcodeMapTrackerFactory(mBarcodes, context);
        barcodeDetector.setProcessor(
                new MultiProcessor.Builder<Barcode>(barcodeFactory).build());

        if (!barcodeDetector.isOperational()) {
            // Note: The first time that an app using the barcode or face API is installed on a
            // device, GMS will download a native libraries to the device in order to do detection.
            // Usually this completes before the app is run for the first time.  But if that
            // download has not yet completed, then the above call will not detect any barcodes
            // and/or faces.
            //
            // isOperational() can be used to check if the required native libraries are currently
            // available.  The detectors will automatically become operational once the library
            // downloads complete on device.
            Log.w(TAG, "Detector dependencies are not yet available.");
            callbackContext.error("Detector dependencies are not yet available.");
            return false;


            /* TODO: Handle this better later?
            // Check for low storage.  If there is low storage, the native library will not be
            // downloaded, so detection will not become operational.
            IntentFilter lowstorageFilter = new IntentFilter(Intent.ACTION_DEVICE_STORAGE_LOW);
            boolean hasLowStorage = registerReceiver(null, lowstorageFilter) != null;

            if (hasLowStorage) {
                Toast.makeText(this, R.string.low_storage_error, Toast.LENGTH_LONG).show();
                Log.w(TAG, "Low storage error.");
            }
            */
        }

        // Creates and starts the camera.  Note that this uses a higher resolution in comparison
        // to other detection examples to enable the barcode detector to detect small barcodes
        // at long distances.
        CameraSource.Builder builder = new CameraSource.Builder(context, barcodeDetector)
                .setFacing(CameraSource.CAMERA_FACING_BACK)
                .setRequestedPreviewSize(1600, 1024)
                .setRequestedFps(15.0f);

        // make sure that auto focus is an available option
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.ICE_CREAM_SANDWICH) {
            builder = builder.setFocusMode(
                    autoFocus ? Camera.Parameters.FOCUS_MODE_CONTINUOUS_PICTURE : null);
        }

        mCameraSource = builder
                .setFlashMode(useFlash ? Camera.Parameters.FLASH_MODE_TORCH : null)
                .build();

        return true;
    }

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


        Context context = cordova.getActivity().getApplicationContext();
        if (mCameraSource == null) {
            if (!createCameraSource(context, false, callbackContext)) {
                return;
            } else {
                callbackContext.success("Created camera source.");
            }
        } else {
            callbackContext.success("Have existing camera source.");
        }


    }

}

