package com.aigc3d;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class Aigc3dApplication {

    public static void main(String[] args) {
        SpringApplication.run(Aigc3dApplication.class, args);
    }
}
