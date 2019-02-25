
package com.bitcoin.cordova.qrreader;



import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Dialog;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.hardware.Camera;
import android.net.Uri;
import android.os.Build;
import android.support.annotation.Nullable;
import android.util.AttributeSet;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
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
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.Toast;



public class QRReader extends CordovaPlugin implements BarcodeUpdateListener {
    public static final String TAG = "QRReader";

    enum QRReaderPermissionResult {
        PERMISSION_DENIED,
        PERMISSION_GRANTED
    }

    enum QRReaderError {
        // Shared with iOS
        ERROR_PERMISSION_DENIED,
        ERROR_SCANNING_UNSUPPORTED,
        ERROR_OPEN_SETTINGS_UNAVAILABLE,

        // Android specific
        ERROR_CAMERA_FAILED_TO_START,
        ERROR_CAMERA_SECURITY_EXCEPTION,
        ERROR_CAMERA_UNAVAILABLE,
        ERROR_DETECTOR_DEPENDENCIES_UNAVAILABLE,
        ERROR_GOOGLE_PLAY_SERVICES_UNAVAILABLE,
        ERROR_READ_ALREADY_STARTED,
        ERROR_UI_SETUP_FAILED
    }

    public static final String CAMERA = Manifest.permission.CAMERA;
    public static final int CAMERA_REQ_CODE = 774980;

    // intent request code to handle updating play services if needed.
    private static final int RC_HANDLE_GMS = 9001;


    private Map<Integer, Barcode> mBarcodes = new HashMap<Integer, Barcode>();
    private CameraSource mCameraSource;
    private CameraSourcePreview mCameraSourcePreview;
    private CallbackContext mStartCallbackContext;
    private CallbackContext mPermissionCallbackContext;

    public QRReader() {
    }


    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        //QRReader.uuid = getUuid();

      cordova.getActivity().runOnUiThread(new Runnable() {
        @Override
        public void run() {
        }

      });
    }


    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        Log.d(TAG, "execute() with \"" + action + "\"");
        if ("openSettings".equals(action)) {
            openSettings(callbackContext);
        } else if ("startReading".equals(action)) {
            startReading(callbackContext);
        } else if ("stopReading".equals(action)) {
            stopReading(callbackContext);
        } else if ("checkPermission".equals(action)) {
            checkPermission(callbackContext);
        } else {
            return false;
        }
        return true;
    }

    @Override
    public void onBarcodeDetected(Barcode barcode) {
        String contents = barcode.rawValue;
        Log.d(TAG, "Detected new barcode.");
        if (mStartCallbackContext != null) {
            mStartCallbackContext.success(contents);
            mStartCallbackContext = null;
        } else {
            Log.e(TAG, "No callback context when detecting new barcode.");
        }
    }


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
        Log.d(TAG, "createCameraSource()");

        boolean autoFocus = true;
        // A barcode detector is created to track barcodes.  An associated multi-processor instance
        // is set to receive the barcode detection results, track the barcodes, and maintain
        // graphics for each barcode on screen.  The factory is used by the multi-processor to
        // create a separate tracker instance for each barcode.
        BarcodeDetector barcodeDetector = new BarcodeDetector.Builder(context).build();
        BarcodeMapTrackerFactory barcodeFactory = new BarcodeMapTrackerFactory(mBarcodes, this);
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
            callbackContext.error(QRReaderError.ERROR_DETECTOR_DEPENDENCIES_UNAVAILABLE.name());
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

    public void onRequestPermissionResult(int requestCode, String[] permissions,
                                          int[] grantResults) throws JSONException
    {
        Log.d(TAG, "onRequestPermissionResult()");

        if (requestCode == CAMERA_REQ_CODE) {
            for (int r : grantResults) {
                if (r == PackageManager.PERMISSION_DENIED) {
                    if (this.mPermissionCallbackContext != null) {
                        this.mPermissionCallbackContext.success(QRReaderPermissionResult.PERMISSION_DENIED.name());
                        this.mPermissionCallbackContext = null;
                    }
                    return;
                }
            }

            if (this.mPermissionCallbackContext != null) {
                this.mPermissionCallbackContext.success(QRReaderPermissionResult.PERMISSION_GRANTED.name());
                this.mPermissionCallbackContext = null;
            }
        }

    }

    private void initPreview(@Nullable CallbackContext callbackContext) {
      final ViewGroup viewGroup = ((ViewGroup) webView.getView().getParent());
      if (viewGroup == null) {
        Log.e(TAG, "Failed to get view group");
        if (callbackContext != null) {
          callbackContext.error(QRReaderError.ERROR_UI_SETUP_FAILED.name());
        }
        return;
      }

      final Context context = cordova.getActivity().getApplicationContext();
      mCameraSourcePreview = new CameraSourcePreview(context);

      FrameLayout.LayoutParams childCenterLayout = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER);
      viewGroup.addView(mCameraSourcePreview, childCenterLayout);
    }

    private void checkPermission(CallbackContext callbackContext) {
        if(cordova.hasPermission(CAMERA)) {
            callbackContext.success(QRReaderPermissionResult.PERMISSION_GRANTED.name());
        } else {
            mPermissionCallbackContext = callbackContext;
            cordova.requestPermission(this, CAMERA_REQ_CODE, CAMERA);
        }
    }

    private void openSettings(CallbackContext callbackContext) {
        Log.d(TAG, "openSettings()");
        try {
            Intent intent = new Intent();
            intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            Uri uri = Uri.fromParts("package", this.cordova.getActivity().getPackageName(), null);
            intent.setData(uri);
            Log.d(TAG, "Starting settings activity...");
            this.cordova.getActivity().getApplicationContext().startActivity(intent);

            callbackContext.success();
            //Log.d(TAG, "About to start reading.");
            //startReading(callbackContext);

        } catch (Exception e) {
            Log.e(TAG, "Error opening settings. " + e.getMessage());
            callbackContext.error(QRReaderError.ERROR_OPEN_SETTINGS_UNAVAILABLE.name());
        }

    }

    /**
     * Starts or restarts the camera source, if it exists.  If the camera source doesn't exist yet
     * (e.g., because onResume was called before the camera source was created), this will be called
     * again when the camera source is created.
     */
    private Boolean startCameraSource(Context context, CallbackContext callbackContext) throws SecurityException {


        // check that the device has play services available.
        int code = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context);
        if (code != ConnectionResult.SUCCESS) {
            Dialog dlg =
                    GoogleApiAvailability.getInstance().getErrorDialog(cordova.getActivity(), code, RC_HANDLE_GMS);
            dlg.show();
            callbackContext.error(QRReaderError.ERROR_GOOGLE_PLAY_SERVICES_UNAVAILABLE.name());
            return false;
        }

        // TODO: Check for valid mCameraSourcePreview
        if (mCameraSource != null) {
            try {
                mCameraSourcePreview.start(mCameraSource);
            } catch (IOException e) {
                Log.e(TAG, "Unable to start camera source.", e);
                mCameraSource.release();
                mCameraSource = null;
                callbackContext.error(QRReaderError.ERROR_CAMERA_FAILED_TO_START.name() + " " + e.getMessage());
                return false;
            }
        } else {
            Log.e(TAG, "No camera source to start.");
            callbackContext.error(QRReaderError.ERROR_CAMERA_UNAVAILABLE.name());
            return false;
        }
        return true;
    }

    private void startReading(CallbackContext callbackContext) {
        Log.d(TAG, "startReading()");
        mStartCallbackContext = callbackContext;

        if(cordova.hasPermission(CAMERA)) {
            startReadingWithPermission(callbackContext);
        } else {
            callbackContext.error(QRReaderError.ERROR_PERMISSION_DENIED.name());
        }
    }

    private void startReadingWithPermission(final CallbackContext callbackContext) {
        Log.d(TAG, "startReadingWithPermission()");

        cordova.getActivity().runOnUiThread(new Runnable() {
          @Override
          public void run() {

            if (mCameraSourcePreview == null) {
              initPreview(callbackContext);
            }

            if (mCameraSourcePreview != null) {

              final Context context = cordova.getActivity().getApplicationContext();
              if (mCameraSource == null) {
                if (!createCameraSource(context, false, callbackContext)) {
                  return;
                }
              } else {
                  Log.d(TAG, "mCamera source was not null");
                  callbackContext.error(QRReaderError.ERROR_READ_ALREADY_STARTED.name());
                  return;
              }

              webView.getView().setBackgroundColor(Color.argb(1, 0, 0, 0));

              webView.getView().bringToFront();
              //viewGroup.bringChildToFront(preview);
              //viewGroup.bringChildToFront(webView.getView());

              try {
                startCameraSource(context, callbackContext);
              } catch (SecurityException e) {
                Log.e(TAG, "Security Exception when starting camera source. " + e.getMessage());
                callbackContext.error(QRReaderError.ERROR_CAMERA_SECURITY_EXCEPTION.name() + " " + e.getMessage());
                return;
              }

            }
          }
        });


    }

  private void stopReading(CallbackContext callbackContext) {
    Log.d(TAG, "stopReading()");

    if (mCameraSource != null) {
      mCameraSource.stop();
      mCameraSource = null;
      Log.d(TAG, "Set mCameraSource to null.");
    }
    webView.getView().setBackgroundColor(Color.WHITE);

    callbackContext.success("stopped");
  }

}