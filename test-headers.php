<?php
// Display all headers
header('Content-Type: text/plain');
$headers = apache_response_headers();
echo "Current Headers:\n\n";
foreach ($headers as $header => $value) {
    echo "$header: $value\n";
}

// Display server information
echo "\nServer Information:\n";
echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "\n";
echo "Apache Modules: \n";
if (function_exists('apache_get_modules')) {
    print_r(apache_get_modules());
}
?> 