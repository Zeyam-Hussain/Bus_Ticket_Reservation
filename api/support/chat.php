<?php

include_once '../../config/core.php';
include_once '../../config/database.php';
include_once '../../config/validate_token.php';
include_once '../../config/pricing.php';
include_once '../../config/support.php';

set_time_limit(120);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Use POST method."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true) ?: [];
$message = trim((string) ($data['message'] ?? ''));
if ($message === '' || mb_strlen($message) > 500) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Message must be 1 to 500 characters."]);
    exit();
}

$history = [];
$raw = is_array($data['history'] ?? null) ? array_slice($data['history'], -6) : [];
foreach ($raw as $t) {
    if (!is_array($t) || !in_array($t['role'] ?? '', ['user', 'assistant'], true) || !is_string($t['content'] ?? null)) continue;
    $history[] = ['role' => $t['role'], 'content' => mb_substr($t['content'], 0, 800)];
}

try {
    $db = (new Database())->getConnection();
    $uid = (int) $decoded_user['user_id'];

    $rl = $db->prepare("SELECT COUNT(*) FROM support_chat_log WHERE user_id = :u AND created_at > NOW() - INTERVAL '1 minute'");
    $rl->execute([':u' => $uid]);
    if ((int) $rl->fetchColumn() >= 10) {
        http_response_code(429);
        echo json_encode(["status" => "error", "message" => "Too many messages. Please wait a minute."]);
        exit();
    }

    $intents = support_intents($message);
    $escalate = support_is_escalation($message);
    $facts = support_build_facts($db, $uid, $message, $intents);

    $ai = support_call_ai([
        'message' => $message,
        'history' => $history,
        'intents' => $intents,
        'facts' => (object) $facts,
        'escalate' => $escalate,
    ]);
    if (!$ai) {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "The support assistant is unavailable right now. Please try again shortly."]);
        exit();
    }

    $log = $db->prepare("INSERT INTO support_chat_log (user_id, intents, escalated) VALUES (:u, :i, :e)");
    $log->bindValue(':u', $uid, PDO::PARAM_INT);
    $log->bindValue(':i', implode(',', $intents) ?: 'policy');
    $log->bindValue(':e', $escalate, PDO::PARAM_BOOL);
    $log->execute();

    echo json_encode([
        "status" => "success",
        "answer" => $ai['answer'],
        "sources" => $ai['sources'],
        "intents" => $intents ?: ['policy'],
        "escalate" => $escalate,
    ]);
} catch (Throwable $e) {
    error_log("Support chat error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Something went wrong. Please try again."]);
}
