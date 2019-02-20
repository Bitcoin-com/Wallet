package com.bitcoin.cordova.qrreader;

import android.content.Context;
import com.google.android.gms.vision.MultiProcessor;
import com.google.android.gms.vision.Tracker;
import com.google.android.gms.vision.barcode.Barcode;

import java.util.Map;

/**
 * Factory for creating a tracker and associated graphic to be associated with a new barcode.  The
 * multi-processor uses this factory to create barcode trackers as needed -- one for each barcode.
 */
class BarcodeMapTrackerFactory implements MultiProcessor.Factory<Barcode> {
  private Map<Integer, Barcode> mBarcodes;
  private BarcodeUpdateListener mListener;

  public BarcodeMapTrackerFactory(Map<Integer, Barcode> mBarcodes,
                                  BarcodeUpdateListener listener) {
    this.mBarcodes = mBarcodes;
    this.mListener = listener;
  }

  @Override
  public Tracker<Barcode> create(Barcode barcode) {
    return new BarcodeMapTracker(mBarcodes, mListener);
  }

}
