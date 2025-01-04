<?php
header('Content-Type: application/json');

// Get the raw POST data
$json = file_get_contents('php://input');

// Decode it into an array
$data = json_decode($json, true);

// Format the log entry
$log_entry = date('Y-m-d H:i:s') . " - CSP Violation:\n";
$log_entry .= "Blocked URI: " . ($data['csp-report']['blocked-uri'] ?? 'N/A') . "\n";
$log_entry .= "Violated Directive: " . ($data['csp-report']['violated-directive'] ?? 'N/A') . "\n";
$log_entry .= "Document URI: " . ($data['csp-report']['document-uri'] ?? 'N/A') . "\n";
$log_entry .= "Original Policy: " . ($data['csp-report']['original-policy'] ?? 'N/A') . "\n";
$log_entry .= "Referrer: " . ($data['csp-report']['referrer'] ?? 'N/A') . "\n";
$log_entry .= str_repeat("-", 80) . "\n";

// Log to file
file_put_contents(
    __DIR__ . '/csp-violations.log',
    $log_entry,
    FILE_APPEND
);

// Return success response
http_response_code(204);
?> 