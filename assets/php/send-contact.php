<?php

declare(strict_types=1);

use Dotenv\Dotenv;
use PHPMailer\PHPMailer\Exception as MailException;
use PHPMailer\PHPMailer\PHPMailer;

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Content-Type-Options: nosniff');

function respond(int $status, bool $success, string $message): void
{
    http_response_code($status);
    echo json_encode(
        ['success' => $success, 'message' => $message],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

function field(string $name, int $maxLength): string
{
    $value = trim((string) ($_POST[$name] ?? ''));

    $length = function_exists('mb_strlen')
        ? mb_strlen($value, 'UTF-8')
        : strlen($value);

    if ($length > $maxLength) {
        respond(422, false, 'Uno de los campos supera el largo permitido.');
    }

    return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
}

function envValue(string $key, ?string $default = null): ?string
{
    $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);

    if ($value === false || $value === null || trim((string) $value) === '') {
        return $default;
    }

    return trim((string) $value);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, false, 'Método no permitido.');
}

$root = dirname(__DIR__, 2);
$autoload = $root . '/vendor/autoload.php';

if (!is_file($autoload)) {
    error_log('EnlacePro contact form: Composer dependencies are missing.');
    respond(500, false, 'El servicio de contacto no está disponible temporalmente.');
}

require $autoload;

Dotenv::createImmutable($root)->safeLoad();

if (!empty($_POST['botcheck'] ?? '')) {
    respond(200, true, 'Solicitud recibida.');
}

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateLimitSeconds = max(10, (int) (envValue('CONTACT_RATE_LIMIT_SECONDS', '60') ?? '60'));
$rateLimitFile = sys_get_temp_dir() . '/enlacepro-contact-' . hash('sha256', $ip) . '.txt';
$now = time();
$lastSubmission = is_file($rateLimitFile) ? (int) file_get_contents($rateLimitFile) : 0;

if ($lastSubmission > 0 && ($now - $lastSubmission) < $rateLimitSeconds) {
    respond(429, false, 'Espera un minuto antes de enviar otra solicitud.');
}

$name = field('name', 120);
$company = field('company', 160);
$email = field('email', 190);
$phone = field('phone', 60);
$assets = field('assets', 40);

if ($name === '' || $company === '' || $email === '' || $assets === '') {
    respond(422, false, 'Completa los campos obligatorios.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, false, 'Ingresa un correo electrónico válido.');
}

$assetLabels = [
    'operation' => 'Hasta 300 activos · Plan Operación',
    'scale' => '301–1.000 activos · Plan Escala',
    'dedicated' => 'Más de 1.000 activos · EnlacePro Dedicado',
];

if (!array_key_exists($assets, $assetLabels)) {
    respond(422, false, 'Selecciona una cantidad de activos válida.');
}

$host = envValue('MAIL_HOST');
$port = (int) (envValue('MAIL_PORT', '587') ?? '587');
$username = envValue('MAIL_USERNAME');
$password = envValue('MAIL_PASSWORD');
$fromAddress = envValue('MAIL_FROM_ADDRESS');
$fromName = envValue('MAIL_FROM_NAME', 'EnlacePro Landing') ?? 'EnlacePro Landing';
$toList = envValue('MAIL_TO');
$encryption = strtolower(envValue('MAIL_ENCRYPTION', 'tls') ?? 'tls');

if ($host === null || $username === null || $password === null || $fromAddress === null || $toList === null) {
    error_log('EnlacePro contact form: incomplete SMTP configuration.');
    respond(500, false, 'El servicio de contacto no está disponible temporalmente.');
}

if ($port < 1 || $port > 65535 || !filter_var($fromAddress, FILTER_VALIDATE_EMAIL)) {
    error_log('EnlacePro contact form: invalid SMTP configuration.');
    respond(500, false, 'El servicio de contacto no está disponible temporalmente.');
}

$recipients = array_values(array_filter(array_map('trim', explode(',', $toList))));
if ($recipients === [] || array_filter($recipients, static fn (string $recipient): bool => !filter_var($recipient, FILTER_VALIDATE_EMAIL))) {
    error_log('EnlacePro contact form: invalid MAIL_TO configuration.');
    respond(500, false, 'El servicio de contacto no está disponible temporalmente.');
}

$subject = 'Nueva solicitud de demo — EnlacePro';
$requestHost = (string) ($_SERVER['HTTP_HOST'] ?? 'enlacepro.cl');
$requestHost = preg_replace('/[^a-z0-9.-]/i', '', $requestHost) ?: 'enlacepro.cl';

$message = implode("\r\n", [
    'Nueva solicitud de demo desde EnlacePro',
    '',
    'Nombre: ' . $name,
    'Empresa: ' . $company,
    'Correo: ' . $email,
    'Teléfono: ' . ($phone !== '' ? $phone : 'No informado'),
    'Cantidad aproximada de activos: ' . $assetLabels[$assets],
    '',
    'IP: ' . $ip,
    'Origen: ' . $requestHost,
    'Fecha: ' . date('Y-m-d H:i:s T'),
]);

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = $host;
    $mail->Port = $port;
    $mail->SMTPAuth = true;
    $mail->Username = $username;
    $mail->Password = $password;
    $mail->Timeout = 15;
    $mail->CharSet = 'UTF-8';

    if ($encryption === 'tls' || $encryption === 'starttls') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    } elseif ($encryption === 'ssl' || $encryption === 'smtps') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    } elseif ($encryption !== 'none') {
        throw new RuntimeException('MAIL_ENCRYPTION no soportado.');
    }

    $mail->setFrom($fromAddress, $fromName);
    $mail->addReplyTo($email, $name);

    foreach ($recipients as $recipient) {
        $mail->addAddress($recipient);
    }

    $mail->Subject = $subject;
    $mail->Body = $message;
    $mail->isHTML(false);
    $mail->send();
} catch (MailException | RuntimeException $exception) {
    error_log('EnlacePro contact form SMTP error: ' . $exception->getMessage());
    respond(500, false, 'No pudimos enviar tu solicitud. Escríbenos a contacto@enlacepro.cl.');
}

@file_put_contents($rateLimitFile, (string) $now, LOCK_EX);

respond(200, true, 'Recibimos tu solicitud y te contactaremos a la brevedad.');
