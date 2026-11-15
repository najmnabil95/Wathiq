<?php

return [
    'backup_path' => env('EDMS_BACKUP_PATH', 'D:/IT-EDMS-Backups'),
    'backup_keep' => (int) env('EDMS_BACKUP_KEEP', 14),
    'mysqldump'   => env('EDMS_MYSQLDUMP', 'C:/xampp/mysql/bin/mysqldump.exe'),
    'tesseract_path' => env('TESSERACT_PATH'),
    'soffice'        => env('EDMS_SOFFICE_PATH'),
    'office_timeout' => (int) env('EDMS_OFFICE_TIMEOUT', 120),
];
