package com.djy.test.controller;

import com.djy.common.result.R;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * ============================================================
 * 联调测试接口
 * base path: /api/test
 * ------------------------------------------------------------
 * GET  /api/test/health     — 健康检查
 * GET  /api/test/echo       — 回声测试（带参数）
 * GET  /api/test/info       — 服务信息
 * ============================================================
 */
@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "*")
public class HealthController {

    /**
     * GET /api/test/health
     * 最简单的健康检查，用于验证网关路由是否畅通
     */
    @GetMapping("/health")
    public R<Map<String, String>> health() {
        return R.ok(Map.of(
                "service", "djy-test",
                "status", "ok",
                "time", LocalDateTime.now().toString()
        ));
    }

    /**
     * GET /api/test/echo?msg=hello
     * 回声测试，返回传入的消息
     */
    @GetMapping("/echo")
    public R<Map<String, String>> echo(@RequestParam(defaultValue = "hello") String msg) {
        return R.ok(Map.of(
                "echo", msg,
                "from", "djy-test:8090",
                "time", LocalDateTime.now().toString()
        ));
    }

    /**
     * GET /api/test/info
     * 返回服务基本信息，用于确认服务注册和路由
     */
    @GetMapping("/info")
    public R<Map<String, Object>> info() {
        return R.ok(Map.of(
                "service", "djy-test",
                "port", 8090,
                "description", "联调测试服务 — 用于验证网关路由和 Cloud 基础设施",
                "endpoints", Map.of(
                        "health", "GET /api/test/health",
                        "echo", "GET /api/test/echo?msg=xxx",
                        "info", "GET /api/test/info"
                )
        ));
    }
}
