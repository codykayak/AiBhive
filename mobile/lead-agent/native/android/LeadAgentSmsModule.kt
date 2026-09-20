package com.aibhive.leadagent

import android.telephony.SmsManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class LeadAgentSmsModule(private val ctx: ReactApplicationContext) : ReactContextBaseJavaModule(ctx) {
  override fun getName() = "LeadAgentSms"

  @ReactMethod
  fun sendSms(phone: String, body: String, promise: Promise) {
    try {
      val mgr = SmsManager.getDefault()
      val parts = mgr.divideMessage(body)
      if (parts.size > 1) {
        mgr.sendMultipartTextMessage(phone, null, parts, null, null)
      } else {
        mgr.sendTextMessage(phone, null, body, null, null)
      }
      promise.resolve(mapOf("ok" to true))
    } catch (e: Exception) {
      promise.reject("SMS_SEND_FAILED", e.message, e)
    }
  }

  @ReactMethod
  fun getRecentInbound(promise: Promise) {
    promise.resolve(SmsReceiver.drainPending())
  }

  companion object {
    fun emitInbound(ctx: ReactApplicationContext, from: String, body: String) {
      ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("LeadAgentSmsReceived", mapOf("from" to from, "body" to body))
    }
  }
}
