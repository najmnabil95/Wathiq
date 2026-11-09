<?php

return [
    'backup_path' => env('EDMS_BACKUP_PATH', 'D:/IT-EDMS-Backups'),
    'backup_keep' => (int) env('EDMS_BACKUP_KEEP', 14),
    'mysqldump'   => env('EDMS_MYSQLDUMP', 'C:/xampp/mysql/bin/mysqldump.exe'),
];
