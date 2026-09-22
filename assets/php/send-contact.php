<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

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

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, false, 'Método no permitido.');
}

if (!empty($_POST['botcheck'] ?? '')) {
    respond(200, true, 'Solicitud recibida.');
}

$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateLimitFile = sys_get_temp_dir() . '/enlacepro-contact-' . hash('sha256', $ip) . '.txt';
$now = time();
$lastSubmission = is_file($rateLimitFile) ? (int) file_get_contents($rateLimitFile) : 0;

if ($lastSubmission > 0 && ($now - $lastSubmission) < 60) {
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

$to = 'gabriel@enlacepro.cl, gustavo@enlacepro.cl';
$subject = 'Nueva solicitud de demo — EnlacePro';

$host = (string) ($_SERVER['HTTP_HOST'] ?? 'enlacepro.cl');
$host = preg_replace('/[^a-z0-9.-]/i', '', $host) ?: 'enlacepro.cl';

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
    'Origen: ' . $host,
    'Fecha: ' . date('Y-m-d H:i:s T'),
]);

$headers = [
    'From: EnlacePro Landing <gustavo@enlacepro.cl>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];

$encodedSubject = function_exists('mb_encode_mimeheader')
    ? mb_encode_mimeheader($subject, 'UTF-8', 'B', "\r\n")
    : $subject;

$sent = mail($to, $encodedSubject, $message, implode("\r\n", $headers));

if (!$sent) {
    error_log('EnlacePro contact form: mail() returned false.');
    respond(500, false, 'No pudimos enviar tu solicitud. Escríbenos a gustavo@enlacepro.cl.');
}

$confirmationSubject = 'Recibimos tu solicitud — EnlacePro';
$confirmationMessage = implode("\r\n", [
    'Hola, ' . $name . ':',
    '',
    'Gracias por tu interés en EnlacePro.',
    '',
    'Recibimos correctamente tu solicitud y nos pondremos en contacto contigo para conocer un poco más sobre tu operación y los activos que necesitas gestionar.',
    '',
    'La idea es entender primero tu caso y luego mostrarte EnlacePro aplicado a una situación real de tu empresa.',
    '',
    'Empresa: ' . $company,
    'Activos aproximados: ' . $assetLabels[$assets],
    '',
    'Si necesitas agregar algún antecedente antes de que te contactemos, puedes responder directamente a este correo.',
    '',
    'Saludos,',
    'Equipo EnlacePro',
    'Tus activos bajo control',
    'https://enlacepro.cl',
    '',
    'Si no realizaste esta solicitud, puedes ignorar este correo.',
]);

$confirmationHeaders = [
    'From: EnlacePro <gustavo@enlacepro.cl>',
    'Reply-To: gustavo@enlacepro.cl',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];

$encodedConfirmationSubject = function_exists('mb_encode_mimeheader')
    ? mb_encode_mimeheader($confirmationSubject, 'UTF-8', 'B', "\r\n")
    : $confirmationSubject;

$confirmationSent = mail(
    $email,
    $encodedConfirmationSubject,
    $confirmationMessage,
    implode("\r\n", $confirmationHeaders)
);

if (!$confirmationSent) {
    error_log('EnlacePro contact form: customer confirmation mail() returned false.');
}

@file_put_contents($rateLimitFile, (string) $now, LOCK_EX);

respond(200, true, 'Recibimos tu solicitud y te contactaremos a la brevedad.');
