# 🍎 ePaws API - Swift Client

Cliente Swift para consumir la API REST de ePaws desde aplicaciones iOS/macOS.

## 📋 Requisitos

- iOS 13.0+
- Xcode 12.0+
- Swift 5.0+

---

## 🚀 Inicio Rápido

### 1. Agregar los archivos a tu proyecto Xcode

1. Arrastra `APIService.swift` a tu proyecto
2. Asegúrate de marcar "Copy items if needed"
3. Agrega a tu target

### 2. Configurar la URL Base

El archivo ya está configurado para usar tu API en Render:

```swift
static let baseURL = "https://epaws-api.onrender.com"
```

Si quieres probar en local, cámbialo a:
```swift
static let baseURL = "http://localhost:5000"
```

---

## 📝 Ejemplos de Uso

### Registrar Usuario Normal

```swift
APIService.shared.register(
    email: "juan.perez@example.com",
    password: "123456",
    name: "Juan Pérez",
    role: "user",
    phone: "12345678",
    address: "San Salvador, El Salvador"
) { result in
    switch result {
    case .success(let response):
        print("✅ Token: \(response.data.token)")
        print("✅ Usuario: \(response.data.user.name)")
        
        // Guardar token
        UserDefaults.standard.set(response.data.token, forKey: "authToken")
        
    case .failure(let error):
        print("❌ Error: \(error.localizedDescription)")
    }
}
```

### Registrar Organización

```swift
APIService.shared.registerOrganization(
    email: "rescate@proteccion.org",
    password: "123456",
    name: "María González",
    organizationName: "Protección Animal SV",
    description: "Organización dedicada al rescate de animales",
    phone: "22334455",
    capacity: 50,
    address: "San Salvador"
) { result in
    // Manejar respuesta
}
```

### Registrar Veterinaria con Ubicación

```swift
APIService.shared.registerVeterinary(
    email: "contacto@vetclinic.com",
    password: "123456",
    name: "Dr. Carlos Martínez",
    clinicName: "Clínica Veterinaria Los Ángeles",
    licenseNumber: "VET-12345",
    phone: "22445566",
    specialties: ["Cirugía", "Medicina General", "Emergencias"],
    latitude: 13.7002,
    longitude: -89.2243,
    locationAddress: "Col. Escalón, San Salvador"
) { result in
    // Manejar respuesta
}
```

---

## 🎯 Uso en UIKit

### Ejemplo Completo con ViewController

```swift
import UIKit

class RegisterViewController: UIViewController {
    
    @IBOutlet weak var emailTextField: UITextField!
    @IBOutlet weak var passwordTextField: UITextField!
    @IBOutlet weak var nameTextField: UITextField!
    @IBOutlet weak var phoneTextField: UITextField!
    @IBOutlet weak var registerButton: UIButton!
    
    @IBAction func registerButtonTapped(_ sender: UIButton) {
        guard let email = emailTextField.text,
              let password = passwordTextField.text,
              let name = nameTextField.text,
              let phone = phoneTextField.text else {
            return
        }
        
        // Mostrar loading
        registerButton.isEnabled = false
        
        APIService.shared.register(
            email: email,
            password: password,
            name: name,
            role: "user",
            phone: phone
        ) { [weak self] result in
            DispatchQueue.main.async {
                self?.registerButton.isEnabled = true
                
                switch result {
                case .success(let response):
                    // Guardar token
                    UserDefaults.standard.set(response.data.token, forKey: "authToken")
                    
                    // Mostrar alerta de éxito
                    self?.showAlert(
                        title: "¡Éxito!",
                        message: "Bienvenido \(response.data.user.name)"
                    )
                    
                case .failure(let error):
                    // Mostrar error
                    self?.showAlert(
                        title: "Error",
                        message: error.localizedDescription
                    )
                }
            }
        }
    }
    
    private func showAlert(title: String, message: String) {
        let alert = UIAlertController(
            title: title,
            message: message,
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}
```

---

## 🎨 Uso en SwiftUI

```swift
import SwiftUI

struct RegisterView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var name = ""
    @State private var phone = ""
    @State private var isLoading = false
    @State private var showAlert = false
    @State private var alertMessage = ""
    
    var body: some View {
        NavigationView {
            Form {
                TextField("Email", text: $email)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
                
                SecureField("Contraseña", text: $password)
                
                TextField("Nombre", text: $name)
                
                TextField("Teléfono", text: $phone)
                    .keyboardType(.phonePad)
                
                Button("Registrarse") {
                    register()
                }
                .disabled(isLoading)
            }
            .navigationTitle("Registro")
            .alert(isPresented: $showAlert) {
                Alert(title: Text("Registro"), message: Text(alertMessage))
            }
        }
    }
    
    func register() {
        isLoading = true
        
        APIService.shared.register(
            email: email,
            password: password,
            name: name,
            role: "user",
            phone: phone
        ) { result in
            DispatchQueue.main.async {
                isLoading = false
                
                switch result {
                case .success(let response):
                    UserDefaults.standard.set(response.data.token, forKey: "authToken")
                    alertMessage = "¡Bienvenido \(response.data.user.name)!"
                    showAlert = true
                    
                case .failure(let error):
                    alertMessage = error.localizedDescription
                    showAlert = true
                }
            }
        }
    }
}
```

---

## 🔐 Manejo de Token

### Guardar Token después del Registro

```swift
case .success(let response):
    UserDefaults.standard.set(response.data.token, forKey: "authToken")
    UserDefaults.standard.set(response.data.user.id, forKey: "userId")
```

### Usar Token en Otras Peticiones

```swift
if let token = UserDefaults.standard.string(forKey: "authToken") {
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
}
```

### Verificar si el Usuario está Logueado

```swift
extension UserDefaults {
    var isLoggedIn: Bool {
        return string(forKey: "authToken") != nil
    }
}

// Uso:
if UserDefaults.standard.isLoggedIn {
    // Usuario tiene sesión activa
}
```

---

## ⚠️ Manejo de Errores

### Errores Comunes

```swift
APIService.shared.register(...) { result in
    switch result {
    case .success(let response):
        // Todo bien
        
    case .failure(let error):
        if let apiError = error as? APIError {
            switch apiError {
            case .serverError(let message):
                if message.contains("email ya está registrado") {
                    print("⚠️ Email duplicado")
                } else if message.contains("email válido") {
                    print("⚠️ Email inválido")
                }
                
            case .invalidURL:
                print("❌ URL mal configurada")
                
            case .noData:
                print("❌ Sin respuesta del servidor")
                
            default:
                print("❌ Error: \(apiError.localizedDescription)")
            }
        }
    }
}
```

### Validaciones del Cliente

```swift
// Email
func isValidEmail(_ email: String) -> Bool {
    let regex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
    return NSPredicate(format: "SELF MATCHES %@", regex).evaluate(with: email)
}

// Contraseña
if password.count < 6 {
    print("⚠️ Contraseña muy corta")
}

// Teléfono
if phone.count < 8 || phone.count > 15 {
    print("⚠️ Teléfono inválido")
}
```

---

## 🧪 Testing

### Probar con Usuario de Prueba

```swift
func testRegister() {
    APIService.shared.register(
        email: "test\(Date().timeIntervalSince1970)@example.com",
        password: "123456",
        name: "Usuario de Prueba",
        role: "user",
        phone: "12345678"
    ) { result in
        switch result {
        case .success(let response):
            XCTAssertNotNil(response.data.token)
            XCTAssertEqual(response.data.user.role, "user")
            
        case .failure(let error):
            XCTFail("Error: \(error)")
        }
    }
}
```

---

## 📱 Configuración de Info.plist

Si vas a conectarte a un servidor HTTP (no HTTPS) en desarrollo, agrega:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

⚠️ **NO uses esto en producción**. Render ya usa HTTPS automáticamente.

---

## 🔄 Cambiar entre Local y Producción

### Opción 1: Usando Build Configurations

En `APIConfig`:

```swift
class APIConfig {
    #if DEBUG
    static let baseURL = "http://localhost:5000"
    #else
    static let baseURL = "https://epaws-api.onrender.com"
    #endif
}
```

### Opción 2: Usando Variables de Entorno

En Xcode Scheme → Run → Arguments → Environment Variables:
- `API_BASE_URL` = `https://epaws-api.onrender.com`

```swift
class APIConfig {
    static let baseURL = ProcessInfo.processInfo.environment["API_BASE_URL"] 
        ?? "https://epaws-api.onrender.com"
}
```

---

## 📊 Respuestas de la API

### Respuesta Exitosa (201)

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "juan.perez@example.com",
      "name": "Juan Pérez",
      "role": "user",
      "verified": false
    }
  },
  "message": "Usuario registrado exitosamente"
}
```

### Respuesta de Error (400)

```json
{
  "success": false,
  "message": "El email ya está registrado",
  "errors": [
    {
      "field": "email",
      "message": "El email ya está registrado"
    }
  ]
}
```

---

## 🎯 Próximos Pasos

Después del registro, querrás implementar:

1. **Login** - Autenticar usuarios existentes
2. **Obtener Perfil** - GET `/api/auth/me`
3. **Crear Reportes** - POST `/api/reports`
4. **Listar Animales** - GET `/api/animals`
5. **Aplicar para Adopción** - POST `/api/adoptions`

---

## 📚 Recursos Adicionales

- **API Documentation**: Ver `API_EXAMPLES.md` en el repositorio
- **Postman Collection**: Importar `ePaws-Postman-Collection.json`
- **API Base URL**: https://epaws-api.onrender.com
- **Testing Guide**: Ver `TESTING.md`

---

## 🐛 Troubleshooting

### Error: "URL inválida"
- Verifica que `baseURL` esté correctamente configurado
- Asegúrate de que no haya espacios en la URL

### Error: "No se recibieron datos"
- Verifica tu conexión a internet
- Comprueba que el servidor esté en línea (https://epaws-api.onrender.com/health)

### Error: "Email ya está registrado"
- Usa otro email
- O implementa la funcionalidad de login

### El servidor no responde
- Render puede tener el servicio "dormido" (free tier)
- La primera petición puede tardar 30-60 segundos en despertar el servidor
- Las siguientes peticiones serán rápidas

---

## 👨‍💻 Autor

Cliente Swift desarrollado para el proyecto ePaws API

**API Base**: https://epaws-api.onrender.com

---

¡Feliz codificación! 🐾
