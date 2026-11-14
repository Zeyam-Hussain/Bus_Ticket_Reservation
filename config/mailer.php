<?php

function configureSmtpMailer(\PHPMailer\PHPMailer\PHPMailer $mail): void
{
    $host = get_env_var('SMTP_HOST');
    $from = get_env_var('SMTP_FROM');
    if (!$host || !$from) {
        throw new RuntimeException('SMTP host and sender address must be configured.');
    }

    $mail->isSMTP();
    $mail->Host = $host;
    $mail->Port = (int) get_env_var('SMTP_PORT', '587');
    $mail->SMTPAuth = filter_var(
        get_env_var('SMTP_AUTH', 'true'),
        FILTER_VALIDATE_BOOLEAN
    );

    if ($mail->SMTPAuth) {
        $username = get_env_var('SMTP_USER');
        $password = get_env_var('SMTP_PASS');
        if (!$username || !$password) {
            throw new RuntimeException('SMTP username and password must be configured when authentication is enabled.');
        }
        $mail->Username = $username;
        $mail->Password = $password;
    }

    $mail->SMTPSecure = match (strtolower((string) get_env_var('SMTP_SECURE', 'tls'))) {
        'tls' => \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS,
        'ssl' => \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS,
        'none' => false,
        default => throw new RuntimeException('SMTP_SECURE must be tls, ssl, or none.'),
    };

    $mail->setFrom(
        $from,
        get_env_var('SMTP_FROM_NAME', 'Bus Reservation System')
    );
}
