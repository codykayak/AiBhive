package com.aibhive.leadagent

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.telephony.SmsMessage
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.ReactApplicationContext

class SmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != "android.provider.Telephony.SMS_RECEIVED") return
    val bundle: Bundle = intent.extras ?: return
    val pdus = bundle.get("pdus") as? Array<*> ?: return
    val format = bundle.getString("format")
    val sb = StringBuilder()
    var from = ""
    for (pdu in pdus) {
      val msg = SmsMessage.createFromPdu(pdu as ByteArray, format)
      from = msg.originatingAddress ?: from
      sb.append(msg.messageBody ?: "")
    }
    val body = sb.toString()
    pending.add(mapOf("from" to from, "body" to body, "at" to System.currentTimeMillis()))
    val app = context.applicationContext as? ReactApplication
    val reactCtx = app?.reactNativeHost?.reactInstanceManager?.currentReactContext as? ReactApplicationContext
    if (reactCtx != null) {
      LeadAgentSmsModule.emitInbound(reactCtx, from, body)
    }
  }

  companion object {
    private val pending = mutableListOf<Map<String, Any>>()
    @JvmStatic
    fun drainPending(): List<Map<String, Any>> {
      val copy = pending.toList()
      pending.clear()
      return copy
    }
  }
}
