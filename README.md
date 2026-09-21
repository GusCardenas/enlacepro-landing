# EnlacePro Landing

Sitio público de EnlacePro.

## Estructura

- `index.html`: landing principal.
- `privacidad.html` y `terminos.html`: páginas legales.
- `assets/css/`: hojas de estilo.
- `assets/js/`: JavaScript del sitio.
- `assets/php/`: endpoints PHP.
- `assets/brand/`: identidad visual.
- `assets/img/`: imágenes de contenido.

## Formulario de contacto

El formulario publica en `assets/php/send-contact.php` y envía por SMTP usando PHPMailer.

### Instalación en servidor

```bash
composer install --no-dev --optimize-autoloader
cp .env.example .env
```

Luego completa `.env` con las credenciales SMTP reales. `.env` y `vendor/` no se versionan.

Para Zoho, usa una contraseña de aplicación cuando la cuenta tenga MFA habilitado. Si la cuenta pertenece a otro data center de Zoho, ajusta `MAIL_HOST` según la configuración de esa cuenta.

### Seguridad del servidor web

El servidor debe impedir acceso HTTP a `.env`, `vendor/` y archivos internos. El único endpoint PHP público de esta landing es:

```text
/assets/php/send-contact.php
```

En producción mantén `display_errors=Off` y registra los errores en el log de PHP.
