package com.bitcoin.cordova.qrreader

import org.apache.cordova.CordovaWebView
import org.apache.cordova.CallbackContext
import org.apache.cordova.CordovaPlugin
import org.apache.cordova.CordovaInterface
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

import android.provider.Settings


class QRReader : CordovaPlugin() {

    //--------------------------------------------------------------------------
    // LOCAL METHODS
    //--------------------------------------------------------------------------

    val testInfo: String
        get() = "Hello Kotlin World 1"


    override fun initialize(cordova: CordovaInterface, webView: CordovaWebView) {
        super.initialize(cordova, webView)
    }


    @Throws(JSONException::class)
    override fun execute(action: String, args: JSONArray, callbackContext: CallbackContext): Boolean {
        if ("getTestInfo" == action) {

            val r = JSONObject()

            r.put("something", this.testInfo)
            callbackContext.success(r)
        } else if ("startReading" == action) {
            callbackContext.success("started Kt")
        } else if ("stopReading" == action) {
            callbackContext.success("stopped Kt")
        } else {
            return false
        }
        return true
    }

    companion object {
        val TAG = "QRReader"

        private val ANDROID_PLATFORM = "Android"
        private val AMAZON_PLATFORM = "amazon-fireos"
        private val AMAZON_DEVICE = "Amazon"
    }

}

