# 💰 Finanční rozpočtář

Webová aplikace pro správu osobních financí - sledování příjmů a výdajů s offline režimem a automatickou synchronizací.

## 📋 Funkce

- ✅ **Záznam příjmů a výdajů** - Přidávání, úprava a mazání transakcí
- 🔍 **Filtrování a vyhledávání** - Filtrování podle typu, kategorie, data a vyhledávání v poznámkách
- 📊 **Statistiky a grafy** - Koláčový graf rozložení výdajů a čárový graf vývoje zůstatku
- 💾 **Offline režim** - Ukládání dat do localStorage při nedostupnosti serveru
- 🔄 **Automatická synchronizace** - Synchronizace dat po obnovení připojení
- 📥 **Export dat** - Export do JSON nebo CSV formátu

## 🛠️ Technologie

- **JavaScript (ES6+)** - Hlavní logika aplikace
- **jQuery 3.7.1** - AJAX požadavky a manipulace s DOM
- **Chart.js 4.4.0** - Vizualizace dat pomocí grafů
- **PHP** - REST API server pro ukládání dat
- **localStorage** - Offline úložiště
- **HTML5 + CSS3** - Struktura a styling aplikace

## 📁 Struktura projektu

```
financni-rozpocar/
├── index.html          # Hlavní HTML soubor
├── css/
│   └── style.css      # Styly aplikace
├── js/
│   ├── app.js         # Hlavní aplikační logika
│   ├── api.js         # Komunikace s REST API
│   └── storage.js     # Práce s localStorage
├── api/
│   ├── index.php      # REST API server
│   └── data.json      # Datový soubor (vytvoří se automaticky)
└── README.md          # Dokumentace
```

## 🚀 Instalace a spuštění

### Lokální vývoj

1. **Naklonujte nebo stáhněte projekt**

2. **Spusťte lokální server**

   Pro PHP server můžete použít:
   ```bash
   php -S localhost:8000
   ```
   
   Nebo použijte jakýkoliv jiný webový server (např. XAMPP, WAMP, nebo Apache/Nginx).

3. **Otevřete aplikaci v prohlížeči**
   
   ```
   http://localhost:8000
   ```

### Nasazení na server

1. Nahrát všechny soubory na webový server s podporou PHP (např. eso.vse.cz)

2. Ujistěte se, že složka `api/` má oprávnění k zápisu (pro vytvoření `data.json`)

3. Otevřít aplikaci v prohlížeči na adrese vašeho serveru

## 📖 Použití

### Přidání transakce

1. Vyplňte formulář:
   - Částka (v Kč)
   - Typ transakce (Příjem/Výdaj)
   - Kategorie (Jídlo, Doprava, Zábava, Ostatní)
   - Datum
   - Poznámka (volitelné)

2. Klikněte na "Přidat transakci"

### Filtrování transakcí

- **Typ**: Filtrovat podle příjmu/výdaje
- **Kategorie**: Filtrovat podle kategorie
- **Datum**: Filtrovat podle časového rozsahu
- **Poznámky**: Vyhledávání textu v poznámkách

### Offline režim

Aplikace automaticky detekuje nedostupnost serveru:
- Data se ukládají do localStorage
- Po obnovení připojení se automaticky synchronizují
- Indikátor stavu připojení zobrazuje online/offline stav

### Export dat

- **JSON**: Export všech transakcí do JSON formátu
- **CSV**: Export transakcí do CSV souboru pro otevření v Excelu

## 🔧 API Dokumentace

API endpointy jsou dostupné na `/api/index.php`:

### GET - Získání všech transakcí
```
GET /api/index.php?action=get
```

### POST - Přidání transakce
```
POST /api/index.php?action=add
Content-Type: application/json

{
  "amount": 1000,
  "type": "income",
  "category": "Jídlo",
  "date": "2024-11-03",
  "notes": "Poznámka"
}
```

### PUT - Aktualizace transakce
```
PUT /api/index.php?action=update&id={id}
Content-Type: application/json

{
  "amount": 1500,
  "category": "Doprava",
  ...
}
```

### DELETE - Smazání transakce
```
DELETE /api/index.php?action=delete&id={id}
```

### POST - Synchronizace
```
POST /api/index.php?action=sync
Content-Type: application/json

{
  "transactions": [...]
}
```

## 🎨 Vlastnosti

- **Responzivní design** - Funguje na desktopu i mobilních zařízeních
- **Moderní UI** - Čistý a intuitivní uživatelský interface
- **Automatická synchronizace** - Kontrola každých 30 sekund
- **Chybové zpracování** - Graceful handling offline stavu
- **History API ready** - Připraveno pro přidání history managementu

## 📝 Poznámky

- Aplikace vyžaduje moderní prohlížeč s podporou ES6+
- Pro offline funkčnost je potřeba localStorage
- API server vyžaduje PHP 7.0+

## 👨‍💻 Autor

Projekt vytvořen pro školní úlohu "Webová aplikace v JavaScriptu"

## 📄 Licence

Tento projekt je vytvořen pro vzdělávací účely.

