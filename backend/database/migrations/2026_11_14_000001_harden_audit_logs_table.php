<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // DATETIME instead of TIMESTAMP: MariaDB appends ON UPDATE CURRENT_TIMESTAMP
        // to TIMESTAMP columns, which silently rewrites the hashed timestamp.
        DB::statement('ALTER TABLE audit_logs MODIFY COLUMN created_at DATETIME NOT NULL');

        DB::statement('ALTER TABLE audit_logs DROP FOREIGN KEY audit_logs_user_id_foreign');
        DB::statement('ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('ALTER TABLE audit_logs DROP FOREIGN KEY audit_logs_user_id_foreign');
        DB::statement('ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_user_id_foreign FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL');
        DB::statement('ALTER TABLE audit_logs MODIFY COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    }
};
