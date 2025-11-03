<?php
/**
 * REST API pro finanční rozpočtář
 * Jednoduché PHP API pro CRUD operace s transakcemi
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Zpracování preflight OPTIONS requestu
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Cesta k datovému souboru
$dataFile = __DIR__ . '/data.json';

// Zajištění existence datového souboru
if (!file_exists($dataFile)) {
    file_put_contents($dataFile, json_encode([]));
}

// Načtení dat
function loadData() {
    global $dataFile;
    $content = file_get_contents($dataFile);
    return json_decode($content, true) ?: [];
}

// Uložení dat
function saveData($data) {
    global $dataFile;
    return file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));
}

// Získání akce z parametrů
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;

// Zpracování požadavku
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        if ($action === 'get') {
            $transactions = loadData();
            echo json_encode($transactions);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Neplatná akce']);
        }
        break;

    case 'POST':
        if ($action === 'add') {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Neplatná data']);
                break;
            }

            $transactions = loadData();
            
            // Generování ID pokud není zadáno
            if (!isset($input['id'])) {
                $input['id'] = 'server_' . time() . '_' . uniqid();
            }
            
            $input['synced'] = true;
            $input['createdAt'] = date('c');
            
            $transactions[] = $input;
            saveData($transactions);
            
            echo json_encode(['success' => true, 'id' => $input['id'], 'data' => $input]);
        } elseif ($action === 'sync') {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['transactions']) || !is_array($input['transactions'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Neplatná data']);
                break;
            }

            $serverTransactions = loadData();
            $clientTransactions = $input['transactions'];
            
            // Merge dat - preferujeme server verzi pokud existuje, jinak klienta
            $mergedTransactions = [];
            $serverIds = array_column($serverTransactions, 'id');
            
            // Nejdříve přidáme server transakce
            foreach ($serverTransactions as $transaction) {
                $mergedTransactions[] = $transaction;
            }
            
            // Pak přidáme klientovy transakce, které nejsou na serveru
            foreach ($clientTransactions as $transaction) {
                if (!in_array($transaction['id'], $serverIds)) {
                    $transaction['synced'] = true;
                    $mergedTransactions[] = $transaction;
                }
            }
            
            saveData($mergedTransactions);
            echo json_encode(['success' => true, 'data' => $mergedTransactions]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Neplatná akce']);
        }
        break;

    case 'PUT':
        if ($action === 'update' && $id) {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Neplatná data']);
                break;
            }

            $transactions = loadData();
            $found = false;
            
            foreach ($transactions as &$transaction) {
                if ($transaction['id'] === $id) {
                    $transaction = array_merge($transaction, $input);
                    $transaction['synced'] = true;
                    $transaction['updatedAt'] = date('c');
                    $found = true;
                    break;
                }
            }
            
            if ($found) {
                saveData($transactions);
                echo json_encode(['success' => true, 'data' => $transaction]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Transakce nenalezena']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Neplatná akce nebo ID']);
        }
        break;

    case 'DELETE':
        if ($action === 'delete' && $id) {
            $transactions = loadData();
            $found = false;
            
            foreach ($transactions as $key => $transaction) {
                if ($transaction['id'] === $id) {
                    unset($transactions[$key]);
                    $transactions = array_values($transactions); // Reindexovat
                    $found = true;
                    break;
                }
            }
            
            if ($found) {
                saveData($transactions);
                echo json_encode(['success' => true]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Transakce nenalezena']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Neplatná akce nebo ID']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Nepodporovaná metoda']);
        break;
}
?>

