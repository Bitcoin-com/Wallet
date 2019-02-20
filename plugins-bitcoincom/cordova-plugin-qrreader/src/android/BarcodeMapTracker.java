package com.bitcoin.cordova.qrreader;


import android.content.Context;
import android.util.Log;


import com.google.android.gms.vision.Detector;
import com.google.android.gms.vision.Tracker;
import com.google.android.gms.vision.barcode.Barcode;

import java.util.HashMap;
import java.util.Map;

/**
 * Generic tracker which is used for tracking or reading a barcode (and can really be used for
 * any type of item).  This is used to receive newly detected items, add a graphical representation
 * to an overlay, update the graphics as the item changes, and remove the graphics when the item
 * goes away.
 */
public class BarcodeMapTracker extends Tracker<Barcode> {

  private Map<Integer, Barcode> mBarcodes;
  private Integer mId;
  private BarcodeUpdateListener mBarcodeUpdateListener;



  BarcodeMapTracker(Map<Integer, Barcode> barcodes, BarcodeUpdateListener listener) {
    this.mBarcodes = barcodes;
    //this.mOverlay = mOverlay;
    //this.mGraphic = mGraphic;
    this.mBarcodeUpdateListener = listener;
  }

  /**
   * Start tracking the detected item instance within the item overlay.
   */
  @Override
  public void onNewItem(int id, Barcode item) {
    //mGraphic.setId(id);
    mId = id;
    mBarcodes.put(id, item);
    Log.d("BarcodeGraphicTracker", "New barcode.");
    if (mBarcodeUpdateListener != null) {
      mBarcodeUpdateListener.onBarcodeDetected(item);
    }
  }

  /**
   * Update the position/characteristics of the item within the overlay.
   */
  @Override
  public void onUpdate(Detector.Detections<Barcode> detectionResults, Barcode item) {
    //mOverlay.add(mGraphic);
    //mGraphic.updateItem(item);
    if (mId != null) {
      mBarcodes.put(mId, item);
    }
  }

  /**
   * Hide the graphic when the corresponding object was not detected.  This can happen for
   * intermediate frames temporarily, for example if the object was momentarily blocked from
   * view.
   */
  @Override
  public void onMissing(Detector.Detections<Barcode> detectionResults) {
    //mOverlay.remove(mGraphic);
    if (mId != null) {
      mBarcodes.remove(mId);
      mId = null;
    }
  }

  /**
   * Called when the item is assumed to be gone for good. Remove the graphic annotation from
   * the overlay.
   */
  @Override
  public void onDone() {

    //mOverlay.remove(mGraphic);
    if (mId != null) {
      mBarcodes.remove(mId);
      mId = null;
    }
  }
}
