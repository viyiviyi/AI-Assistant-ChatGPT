package com.yiyiooo.aias
import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.view.MotionEvent
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {
    private lateinit var floatingButton: ImageView
    private var xDelta: Int = 0
    private var yDelta: Int = 0
    @SuppressLint("ClickableViewAccessibility")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        setActionBar(null)
        supportActionBar?.hide()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE,Manifest.permission.READ_EXTERNAL_STORAGE), 1);
        }

        // 创建一个WebView对象
        val webView = findViewById<WebView>(R.id.web_view)

        // 允许WebView访问跨域资源
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = false
        webView.settings.allowContentAccess = true
        webView.settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

        // 设置WebView客户端，用于处理网页加载事件
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // 网页加载完成后执行的操作
            }
        }

        floatingButton = findViewById<ImageView>(R.id.floating_button)
        floatingButton.setOnTouchListener { view, event ->
            val x = event.rawX.toInt()
            val y = event.rawY.toInt()
            when (event.action and MotionEvent.ACTION_MASK) {
                MotionEvent.ACTION_DOWN -> {
                    val lParams = view.layoutParams as FrameLayout.LayoutParams
                    xDelta = x - lParams.leftMargin
                    yDelta = y - lParams.topMargin
                }
                MotionEvent.ACTION_MOVE -> {
                    val layoutParams = view.layoutParams as FrameLayout.LayoutParams
                    layoutParams.leftMargin = x - xDelta
                    layoutParams.topMargin = y - yDelta
                    view.layoutParams = layoutParams
                }
            }
            true
        }
//        floatingButton.setOnClickListener {
//            run {
//                Log.e("test","asdkvbaosjdvb")
//                webView.reload()
//            }
//        }
        // 加载网页
        webView.loadUrl("https://22733.site")

        // 将WebView添加到界面中
//        setContentView(webView)
    }
}