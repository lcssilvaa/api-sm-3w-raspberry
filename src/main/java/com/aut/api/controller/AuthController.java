package com.aut.api.controller;

import com.aut.api.DTO.LoginRequestDTO;
import com.aut.api.DTO.RegisterRequestDTO;
import com.aut.api.DTO.ResponseDTO;
import com.aut.api.entity.UserEntity;
import com.aut.api.repository.UserRepository;
import com.aut.api.security.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    @PostMapping("/login")
    public ResponseEntity login(@RequestBody LoginRequestDTO body){
        UserEntity user = this.repository.findByUsuario(body.usuario()).orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        if(passwordEncoder.matches(body.password(), user.getPassword())) {
            String token = this.tokenService.generateToken(user);
            return ResponseEntity.ok(new ResponseDTO(user.getNome(), token));
        }
        return ResponseEntity.badRequest().build();
    }


    @PostMapping("/register")
    public ResponseEntity register(@RequestBody RegisterRequestDTO body){
        Optional<UserEntity> user = this.repository.findByUsuario(body.usuario());

        if(user.isEmpty()) {
            UserEntity newUser = new UserEntity();
            newUser.setPassword(passwordEncoder.encode(body.password()));
            newUser.setUsuario(body.usuario());
            newUser.setNome(body.nome());
            this.repository.save(newUser);

            String token = this.tokenService.generateToken(newUser);
            return ResponseEntity.ok(new ResponseDTO(newUser.getNome(), token));
        }
        return ResponseEntity.badRequest().build();
    }
}
